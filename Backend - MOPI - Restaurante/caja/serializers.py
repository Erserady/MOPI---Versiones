from rest_framework import serializers
from .models import Caja, Factura, Pago, CierreCaja, Egreso, RemoveRequest
from mesero.serializers import WaiterOrderSerializer, TableSerializer
from mesero.models import WaiterOrder


class CajaSerializer(serializers.ModelSerializer):
    usuario_apertura = serializers.StringRelatedField(read_only=True)
    
    class Meta:
        model = Caja
        fields = ['id', 'numero_caja', 'estado', 'saldo_inicial', 'saldo_actual', 
                 'usuario_apertura', 'fecha_apertura', 'fecha_cierre']
        read_only_fields = ['id', 'usuario_apertura', 'fecha_apertura', 'fecha_cierre']


class FacturaSerializer(serializers.ModelSerializer):
    table = TableSerializer(read_only=True)
    orders = WaiterOrderSerializer(many=True, read_only=True)
    creado_por = serializers.StringRelatedField(read_only=True)
    mesero_asignado = serializers.SerializerMethodField()
    
    class Meta:
        model = Factura
        fields = ['id', 'numero_factura', 'table', 'orders', 'subtotal', 'impuestos', 
                 'total', 'metodo_pago', 'estado', 'creado_por', 'mesero_asignado', 'created_at', 'updated_at']
        read_only_fields = ['id', 'creado_por', 'mesero_asignado', 'created_at', 'updated_at']
    
    def get_mesero_asignado(self, obj):
        """Obtener el nombre del mesero que atendio la mesa"""
        if obj.table and obj.table.assigned_waiter:
            return obj.table.assigned_waiter.get_full_name() or obj.table.assigned_waiter.username
        orders = obj.orders.all()
        if orders.exists():
            first_order = orders.first()
            if first_order.cliente:
                return first_order.cliente
        return None


class PagoSerializer(serializers.ModelSerializer):
    creado_por = serializers.StringRelatedField(read_only=True)
    factura_detalle = FacturaSerializer(source='factura', read_only=True)
    
    class Meta:
        model = Pago
        fields = ['id', 'factura', 'factura_detalle', 'monto', 'metodo_pago', 'referencia', 'caja', 'creado_por', 'created_at']
        read_only_fields = ['id', 'creado_por', 'created_at', 'factura_detalle']
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        return representation


class CierreCajaSerializer(serializers.ModelSerializer):
    cerrado_por = serializers.StringRelatedField(read_only=True)
    caja_info = CajaSerializer(source='caja', read_only=True)
    fecha_apertura = serializers.DateTimeField(source='caja.fecha_apertura', read_only=True)
    total_ventas = serializers.SerializerMethodField()
    
    class Meta:
        model = CierreCaja
        fields = ['id', 'caja', 'caja_info', 'fecha_apertura', 'fecha_cierre', 
                 'saldo_final', 'saldo_teorico', 'diferencia', 
                 'total_efectivo', 'total_tarjeta', 'total_transferencia', 
                 'total_ventas', 'observaciones', 'cerrado_por']
        read_only_fields = ['id', 'cerrado_por', 'fecha_cierre', 'fecha_apertura']
    
    def get_total_ventas(self, obj):
        return float(obj.total_efectivo) + float(obj.total_tarjeta) + float(obj.total_transferencia)


class EgresoSerializer(serializers.ModelSerializer):
    creado_por = serializers.StringRelatedField(read_only=True)
    
    class Meta:
        model = Egreso
        fields = ['id', 'caja', 'monto', 'comentario', 'creado_por', 'created_at']
        read_only_fields = ['id', 'creado_por', 'created_at']
    
    def validate_monto(self, value):
        if value <= 0:
            raise serializers.ValidationError("El monto debe ser mayor a 0")
        return value
    
    def validate_comentario(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("El comentario es obligatorio")
        return value.strip()


class RemoveRequestSerializer(serializers.ModelSerializer):
    order_id = serializers.IntegerField(source='order.id', read_only=True)
    order_identifier = serializers.CharField(source='order.order_id', read_only=True)
    mesa = serializers.CharField(source='order.table.mesa_id', read_only=True)

    class Meta:
        model = RemoveRequest
        fields = [
            'id',
            'order',
            'order_id',
            'order_identifier',
            'mesa',
            'item_index',
            'item_nombre',
            'cantidad',
            'razon',
            'solicitado_por',
            'estado',
            'autorizado_por',
            'rechazado_por',
            'motivo_rechazo',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'order_id',
            'order_identifier',
            'mesa',
            'estado',
            'autorizado_por',
            'rechazado_por',
            'motivo_rechazo',
            'created_at',
            'updated_at',
        ]

    def validate_order(self, value: WaiterOrder):
        if not value:
            raise serializers.ValidationError("La orden es obligatoria.")
        return value
