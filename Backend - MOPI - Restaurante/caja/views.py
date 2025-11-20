from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import render
from django.db import transaction
from django.utils import timezone
from decimal import Decimal
from .models import Caja, Factura, Pago, CierreCaja, Egreso
from .serializers import CajaSerializer, FacturaSerializer, PagoSerializer, CierreCajaSerializer, EgresoSerializer
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
        
        # Validar que no haya pedidos pendientes DE ESTA SESIÓN (después de la apertura)
        # Solo contar pedidos que:
        # 1. Estado = 'pendiente'
        # 2. Creados después de la apertura de esta sesión
        # 3. NO tienen factura asociada (los que tienen factura ya están en proceso)
        pedidos_pendientes = WaiterOrder.objects.filter(
            estado='pendiente',
            created_at__gte=caja.fecha_apertura,  # Solo de esta sesión
            facturas__isnull=True  # Solo pedidos sin facturar
        ).count()
        if pedidos_pendientes > 0:
            return Response({
                'error': 'No se puede cerrar la caja',
                'mensaje': f'Hay {pedidos_pendientes} pedido(s) pendiente(s) de esta sesión sin facturar. Todos los pedidos deben ser pagados o cancelados antes de cerrar la caja.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validar que no haya facturas pendientes DE ESTA SESIÓN (después de la apertura)
        facturas_pendientes = Factura.objects.filter(
            caja=caja, 
            estado='pendiente',
            created_at__gte=caja.fecha_apertura  # Solo facturas de esta sesión
        ).count()
        if facturas_pendientes > 0:
            return Response({
                'error': 'No se puede cerrar la caja',
                'mensaje': f'Hay {facturas_pendientes} factura(s) pendiente(s) de esta sesión. Todas las facturas deben ser pagadas antes de cerrar la caja.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        saldo_final = Decimal(request.data.get('saldo_final', 0))
        observaciones = request.data.get('observaciones', '')
        
        with transaction.atomic():
            # Calcular saldo teórico solo con pagos de esta sesión (después de la apertura)
            pagos_sesion = caja.pagos.filter(
                created_at__gte=caja.fecha_apertura,
                metodo_pago='efectivo'
            )
            saldo_teorico = caja.saldo_inicial + sum(pago.monto for pago in pagos_sesion)
            
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
            
            # Recargar la caja desde la BD para asegurar que los cambios se guardaron
            caja.refresh_from_db()
        
        serializer = self.get_serializer(caja)
        return Response({
            'message': 'Caja cerrada exitosamente',
            'cierre_id': cierre.id,
            'caja': serializer.data
        })

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
            
            # Calcular total parseando el JSON del pedido con los precios reales
            import json
            total = Decimal('0.00')
            for order in orders:
                try:
                    # Parsear el JSON del pedido
                    pedido_items = json.loads(order.pedido)
                    # Sumar el precio de cada item
                    for item in pedido_items:
                        cantidad = item.get('cantidad', 1)
                        precio = Decimal(str(item.get('precio', 0)))
                        total += cantidad * precio
                except (json.JSONDecodeError, ValueError, KeyError) as e:
                    # Si hay error parseando, usar 0
                    pass
            
            # Crear factura (sin impuestos adicionales)
            factura = Factura.objects.create(
                table=table,
                numero_factura=f"FACT-{Factura.objects.count() + 1:06d}",
                subtotal=total,  # Subtotal = Total (sin desglose)
                impuestos=Decimal('0.00'),  # Sin impuestos adicionales
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
                
                # Actualizar las órdenes asociadas a estado 'pagado'
                # Esto permite que desaparezcan del panel de mesero
                factura.orders.update(estado='pagado')
            
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
    """
    Endpoint para obtener mesas con órdenes que aún deben cobrarse.
    Incluye todos los estados desde pendiente hasta prefactura_enviada.
    Las órdenes con cuenta solicitada (payment_requested) deben ser visibles
    para que el cajero pueda enviar la pre-factura al mesero.
    """
    estados_cobrables = [
        'pendiente', 
        'en_preparacion', 
        'listo', 
        'entregado', 
        'servido',
        'payment_requested',      # Cuenta solicitada por el mesero
        'prefactura_enviada',     # Pre-factura enviada al mesero
    ]
    mesas = Table.objects.filter(orders__estado__in=estados_cobrables).distinct()

    data = []
    for mesa in mesas:
        ordenes_pendientes = (
            mesa.orders
                .filter(estado__in=estados_cobrables)
                .order_by('created_at')
        )
        if not ordenes_pendientes.exists():
            continue
        data.append({
            'mesa_id': mesa.id,
            'mesa_nombre': str(mesa),
            'ordenes_pendientes': [
                {
                    'id': orden.id,
                    'order_id': orden.order_id,
                    'pedido': orden.pedido,
                    'cliente': orden.cliente,
                    'cantidad': orden.cantidad,
                    'estado': orden.estado,
                    'waiter_name': getattr(orden, 'waiter_name', None) or getattr(orden, 'mesero', None) or 'Sin asignar'
                } for orden in ordenes_pendientes
            ]
        })
    return Response(data)

class EgresoViewSet(viewsets.ModelViewSet):
    queryset = Egreso.objects.all().order_by('-created_at')
    serializer_class = EgresoSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        """Guardar el usuario que crea el egreso"""
        serializer.save(creado_por=self.request.user)
