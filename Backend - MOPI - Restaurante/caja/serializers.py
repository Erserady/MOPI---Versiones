from rest_framework import serializers
from .models import Caja, Factura, Pago, CierreCaja
from mesero.serializers import WaiterOrderSerializer, TableSerializer

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
    
    class Meta:
        model = Factura
        fields = ['id', 'numero_factura', 'table', 'orders', 'subtotal', 'impuestos', 
                 'total', 'metodo_pago', 'estado', 'creado_por', 'created_at', 'updated_at']
        read_only_fields = ['id', 'creado_por', 'created_at', 'updated_at']

class PagoSerializer(serializers.ModelSerializer):
    creado_por = serializers.StringRelatedField(read_only=True)
    
    class Meta:
        model = Pago
        fields = ['id', 'factura', 'monto', 'metodo_pago', 'referencia', 'caja', 'creado_por', 'created_at']
        read_only_fields = ['id', 'creado_por', 'created_at']

class CierreCajaSerializer(serializers.ModelSerializer):
    cerrado_por = serializers.StringRelatedField(read_only=True)
    caja_info = CajaSerializer(source='caja', read_only=True)
    
    class Meta:
        model = CierreCaja
        fields = ['id', 'caja', 'caja_info', 'fecha_cierre', 'saldo_final', 'saldo_teorico', 
                 'diferencia', 'total_efectivo', 'total_tarjeta', 'total_transferencia', 
                 'observaciones', 'cerrado_por']
        read_only_fields = ['id', 'cerrado_por', 'fecha_cierre']