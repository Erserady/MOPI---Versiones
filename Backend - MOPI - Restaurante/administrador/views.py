from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal

from .models import CategoriaMenu, Plato, Inventario, MovimientoInventario, ConfiguracionSistema
from .serializers import (
    CategoriaMenuSerializer, PlatoSerializer, InventarioSerializer, 
    MovimientoInventarioSerializer, ConfiguracionSistemaSerializer,
    MesaDashboardSerializer, FacturaDashboardSerializer
)
from mesero.models import Table, WaiterOrder
from caja.models import Factura, Pago, Caja
from users.models import User

class DashboardViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAdminUser]
    
    def list(self, request):
        hoy = timezone.now().date()
        
        # Métricas principales
        ventas_hoy = Factura.objects.filter(
            created_at__date=hoy, 
            estado='pagada'
        ).aggregate(total=Sum('total'))['total'] or Decimal('0')
        
        total_mesas = Table.objects.count()
        mesas_ocupadas = Table.objects.filter(
            orders__estado='pendiente'
        ).distinct().count()
        
        pedidos_pendientes = WaiterOrder.objects.filter(estado='pendiente').count()
        inventario_bajo = Inventario.objects.filter(esta_bajo=True).count()
        
        # Ventas últimos 7 días
        fecha_inicio = hoy - timedelta(days=7)
        ventas_7_dias = Factura.objects.filter(
            created_at__date__gte=fecha_inicio,
            estado='pagada'
        ).values('created_at__date').annotate(
            total=Sum('total')
        ).order_by('created_at__date')
        
        # Mesas con estado
        mesas = Table.objects.all()
        mesa_serializer = MesaDashboardSerializer(mesas, many=True)
        
        # Facturas recientes
        facturas_recientes = Factura.objects.all().order_by('-created_at')[:10]
        factura_serializer = FacturaDashboardSerializer(facturas_recientes, many=True)
        
        return Response({
            'metricas_principales': {
                'ventas_hoy': float(ventas_hoy),
                'total_mesas': total_mesas,
                'mesas_ocupadas': mesas_ocupadas,
                'mesas_disponibles': total_mesas - mesas_ocupadas,
                'pedidos_pendientes': pedidos_pendientes,
                'inventario_bajo': inventario_bajo,
            },
            'ventas_7_dias': list(ventas_7_dias),
            'mesas': mesa_serializer.data,
            'facturas_recientes': factura_serializer.data,
        })

class CategoriaMenuViewSet(viewsets.ModelViewSet):
    queryset = CategoriaMenu.objects.all()
    serializer_class = CategoriaMenuSerializer
    permission_classes = [permissions.IsAdminUser]

class PlatoViewSet(viewsets.ModelViewSet):
    queryset = Plato.objects.all()
    serializer_class = PlatoSerializer
    permission_classes = [permissions.IsAdminUser]
    
    def get_queryset(self):
        queryset = Plato.objects.all()
        categoria_id = self.request.query_params.get('categoria_id')
        if categoria_id:
            queryset = queryset.filter(categoria_id=categoria_id)
        return queryset

class InventarioViewSet(viewsets.ModelViewSet):
    queryset = Inventario.objects.all()
    serializer_class = InventarioSerializer
    permission_classes = [permissions.IsAdminUser]
    
    @action(detail=False, methods=['get'])
    def bajos(self, request):
        inventarios_bajos = Inventario.objects.filter(esta_bajo=True)
        serializer = self.get_serializer(inventarios_bajos, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def ajustar_stock(self, request, pk=None):
        inventario = self.get_object()
        cantidad = Decimal(request.data.get('cantidad', 0))
        motivo = request.data.get('motivo', 'Ajuste manual')
        tipo = request.data.get('tipo', 'ajuste')
        
        movimiento = MovimientoInventario.objects.create(
            inventario=inventario,
            tipo=tipo,
            cantidad=cantidad,
            motivo=motivo,
            usuario=request.user
        )
        
        return Response({
            'message': 'Stock ajustado exitosamente',
            'nueva_cantidad': float(inventario.cantidad_actual)
        })

class MovimientoInventarioViewSet(viewsets.ModelViewSet):
    queryset = MovimientoInventario.objects.all()
    serializer_class = MovimientoInventarioSerializer
    permission_classes = [permissions.IsAdminUser]

class ConfiguracionSistemaViewSet(viewsets.ModelViewSet):
    queryset = ConfiguracionSistema.objects.all()
    serializer_class = ConfiguracionSistemaSerializer
    permission_classes = [permissions.IsAdminUser]
    
    def list(self, request):
        # Siempre retornar o crear la configuración única
        config = ConfiguracionSistema.objects.first()
        if not config:
            config = ConfiguracionSistema.objects.create()
        serializer = self.get_serializer(config)
        return Response(serializer.data)

class GestionPersonalViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    permission_classes = [permissions.IsAdminUser]
    
    def get_serializer_class(self):
        # Podrías crear un UserSerializer específico
        from users.serializers import UserSerializer
        return UserSerializer
    
    @action(detail=False, methods=['get'])
    def meseros(self, request):
        # Filtrar por rol de mesero (necesitarías agregar campo rol al modelo User)
        meseros = User.objects.all()  # Aquí filtrarías por rol cuando lo implementes
        serializer = self.get_serializer(meseros, many=True)
        return Response(serializer.data)

class GestionFacturasViewSet(viewsets.ModelViewSet):
    queryset = Factura.objects.all()
    permission_classes = [permissions.IsAdminUser]
    serializer_class = FacturaDashboardSerializer
    
    @action(detail=True, methods=['post'])
    def anular(self, request, pk=None):
        factura = self.get_object()
        motivo = request.data.get('motivo', '')
        
        if factura.estado == 'anulada':
            return Response(
                {'error': 'La factura ya está anulada'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        factura.estado = 'anulada'
        factura.save()
        
        # Aquí podrías revertir el stock si es necesario
        # y registrar la anulación
        
        return Response({'message': 'Factura anulada exitosamente'})
    
    @action(detail=True, methods=['post'])
    def modificar_total(self, request, pk=None):
        factura = self.get_object()
        nuevo_total = Decimal(request.data.get('nuevo_total', 0))
        motivo = request.data.get('motivo', '')
        
        if factura.estado == 'pagada':
            return Response(
                {'error': 'No se puede modificar una factura ya pagada'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Calcular nuevos valores basados en el nuevo total
        factura.total = nuevo_total
        factura.subtotal = nuevo_total / Decimal('1.18')  # Asumiendo 18% de impuesto
        factura.impuestos = nuevo_total - factura.subtotal
        factura.save()
        
        return Response({'message': 'Total modificado exitosamente'})

# Vista para el menú completo
@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def menu_completo(request):
    categorias = CategoriaMenu.objects.filter(activa=True).prefetch_related('platos')
    data = []
    
    for categoria in categorias:
        platos_disponibles = categoria.platos.filter(disponible=True)
        data.append({
            'categoria': CategoriaMenuSerializer(categoria).data,
            'platos': PlatoSerializer(platos_disponibles, many=True).data
        })
    
    return Response(data)