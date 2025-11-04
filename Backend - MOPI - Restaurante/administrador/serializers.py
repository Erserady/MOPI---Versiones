from rest_framework import serializers
from .models import CategoriaMenu, Plato, Inventario, MovimientoInventario, ConfiguracionSistema
from mesero.models import Table, WaiterOrder
from caja.models import Factura, Pago, Caja
from users.models import User

class CategoriaMenuSerializer(serializers.ModelSerializer):
    cantidad_platos = serializers.SerializerMethodField()
    
    class Meta:
        model = CategoriaMenu
        fields = ['id', 'nombre', 'descripcion', 'orden', 'activa', 'cantidad_platos']
    
    def get_cantidad_platos(self, obj):
        return obj.platos.count()

class PlatoSerializer(serializers.ModelSerializer):
    categoria_nombre = serializers.CharField(source='categoria.nombre', read_only=True)
    
    class Meta:
        model = Plato
        fields = ['id', 'nombre', 'descripcion', 'categoria', 'categoria_nombre', 
                 'precio', 'precio_con_impuesto', 'disponible', 'ingredientes', 
                 'tiempo_preparacion', 'imagen', 'orden']

class InventarioSerializer(serializers.ModelSerializer):
    esta_bajo = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Inventario
        fields = ['id', 'nombre', 'categoria', 'cantidad_actual', 'unidad', 
                 'cantidad_minima', 'costo_unitario', 'proveedor', 'ubicacion', 
                 'activo', 'esta_bajo']

class MovimientoInventarioSerializer(serializers.ModelSerializer):
    inventario_nombre = serializers.CharField(source='inventario.nombre', read_only=True)
    usuario_nombre = serializers.CharField(source='usuario.get_full_name', read_only=True)
    
    class Meta:
        model = MovimientoInventario
        fields = ['id', 'inventario', 'inventario_nombre', 'tipo', 'cantidad', 
                 'cantidad_anterior', 'cantidad_nueva', 'motivo', 'usuario', 
                 'usuario_nombre', 'created_at']

class ConfiguracionSistemaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConfiguracionSistema
        fields = '__all__'

# Serializers para el dashboard
class MesaDashboardSerializer(serializers.ModelSerializer):
    estado = serializers.SerializerMethodField()
    ordenes_pendientes = serializers.SerializerMethodField()
    
    class Meta:
        model = Table
        fields = ['id', 'mesa_id', 'mesa', 'ubicacion', 'estado', 'ordenes_pendientes']
    
    def get_estado(self, obj):
        tiene_ordenes_pendientes = obj.orders.filter(estado='pendiente').exists()
        return 'ocupada' if tiene_ordenes_pendientes else 'disponible'
    
    def get_ordenes_pendientes(self, obj):
        return obj.orders.filter(estado='pendiente').count()

class FacturaDashboardSerializer(serializers.ModelSerializer):
    mesa_nombre = serializers.CharField(source='table.mesa_id', read_only=True)
    
    class Meta:
        model = Factura
        fields = ['id', 'numero_factura', 'mesa_nombre', 'subtotal', 'impuestos', 
                 'total', 'metodo_pago', 'estado', 'created_at']