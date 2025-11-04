from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import render
from django.db import transaction
from django.utils import timezone
from decimal import Decimal
from .models import Caja, Factura, Pago, CierreCaja
from .serializers import CajaSerializer, FacturaSerializer, PagoSerializer, CierreCajaSerializer
from mesero.models import WaiterOrder, Table

class CajaViewSet(viewsets.ModelViewSet):
    queryset = Caja.objects.all().order_by('-fecha_apertura')
    serializer_class = CajaSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=True, methods=['post'], url_path='abrir')
    def abrir_caja(self, request, pk=None):
        caja = self.get_object()
        if caja.estado == 'abierta':
            return Response({'error': 'La caja ya está abierta'}, status=status.HTTP_400_BAD_REQUEST)
        
        saldo_inicial = request.data.get('saldo_inicial', 0)
        caja.estado = 'abierta'
        caja.saldo_inicial = Decimal(saldo_inicial)
        caja.saldo_actual = Decimal(saldo_inicial)
        caja.usuario_apertura = request.user
        caja.fecha_apertura = timezone.now()
        caja.fecha_cierre = None
        caja.save()
        
        serializer = self.get_serializer(caja)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='cerrar')
    def cerrar_caja(self, request, pk=None):
        caja = self.get_object()
        if caja.estado == 'cerrada':
            return Response({'error': 'La caja ya está cerrada'}, status=status.HTTP_400_BAD_REQUEST)
        
        saldo_final = Decimal(request.data.get('saldo_final', 0))
        observaciones = request.data.get('observaciones', '')
        
        with transaction.atomic():
            # Calcular saldo teórico
            saldo_teorico = caja.saldo_inicial + sum(
                pago.monto for pago in caja.pagos.all() 
                if pago.metodo_pago == 'efectivo'
            )
            
            diferencia = saldo_final - saldo_teorico
            
            # Crear cierre
            cierre = CierreCaja.objects.create(
                caja=caja,
                saldo_final=saldo_final,
                saldo_teorico=saldo_teorico,
                diferencia=diferencia,
                observaciones=observaciones,
                cerrado_por=request.user
            )
            cierre.calcular_totales()
            
            # Cerrar caja
            caja.estado = 'cerrada'
            caja.fecha_cierre = timezone.now()
            caja.save()
        
        return Response({'message': 'Caja cerrada exitosamente', 'cierre_id': cierre.id})

class FacturaViewSet(viewsets.ModelViewSet):
    queryset = Factura.objects.all().order_by('-created_at')
    serializer_class = FacturaSerializer
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        # Crear factura a partir de órdenes de una mesa
        table_id = request.data.get('table_id')
        order_ids = request.data.get('order_ids', [])
        caja_id = request.data.get('caja_id')
        
        if not table_id or not order_ids or not caja_id:
            return Response(
                {'error': 'table_id, order_ids y caja_id son requeridos'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            table = Table.objects.get(id=table_id)
            caja = Caja.objects.get(id=caja_id)
            orders = WaiterOrder.objects.filter(id__in=order_ids, table=table)
            
            if not orders.exists():
                return Response(
                    {'error': 'No se encontraron órdenes para la mesa especificada'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Calcular total (aquí necesitarías lógica de precios)
            # Por ahora, usaremos un cálculo simple basado en cantidad
            subtotal = sum(order.cantidad * 10 for order in orders)  # $10 por item
            impuestos = subtotal * Decimal('0.18')  # 18% de impuestos
            total = subtotal + impuestos
            
            # Crear factura
            factura = Factura.objects.create(
                table=table,
                numero_factura=f"FACT-{Factura.objects.count() + 1:06d}",
                subtotal=subtotal,
                impuestos=impuestos,
                total=total,
                caja=caja,
                creado_por=request.user
            )
            factura.orders.set(orders)
            
            # Marcar órdenes como facturadas
            orders.update(estado='facturado')
            
            serializer = self.get_serializer(factura)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except (Table.DoesNotExist, Caja.DoesNotExist) as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class PagoViewSet(viewsets.ModelViewSet):
    queryset = Pago.objects.all().order_by('-created_at')
    serializer_class = PagoSerializer
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            # Validar que la caja esté abierta
            caja = serializer.validated_data['caja']
            if caja.estado != 'abierta':
                return Response(
                    {'error': 'La caja debe estar abierta para registrar pagos'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            pago = serializer.save(creado_por=request.user)
            
            # Actualizar estado de la factura si está completamente pagada
            factura = pago.factura
            total_pagado = sum(pago.monto for pago in factura.pagos.all())
            if total_pagado >= factura.total:
                factura.estado = 'pagada'
                factura.metodo_pago = pago.metodo_pago
                factura.save()
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CierreCajaViewSet(viewsets.ModelViewSet):
    queryset = CierreCaja.objects.all().order_by('-fecha_cierre')
    serializer_class = CierreCajaSerializer
    permission_classes = [permissions.IsAuthenticated]

# Vistas HTML
def caja_view(request):
    return render(request, 'caja/caja.html', {})

def facturas_view(request):
    return render(request, 'caja/facturas.html', {})

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def mesas_con_ordenes_pendientes(request):
    """Endpoint para obtener mesas con órdenes pendientes de facturar"""
    mesas = Table.objects.filter(orders__estado='pendiente').distinct()
    data = []
    for mesa in mesas:
        ordenes_pendientes = mesa.orders.filter(estado='pendiente')
        data.append({
            'mesa_id': mesa.id,
            'mesa_nombre': str(mesa),
            'ordenes_pendientes': [
                {
                    'id': orden.id,
                    'order_id': orden.order_id,
                    'pedido': orden.pedido,
                    'cliente': orden.cliente,
                    'cantidad': orden.cantidad
                } for orden in ordenes_pendientes
            ]
        })
    return Response(data)