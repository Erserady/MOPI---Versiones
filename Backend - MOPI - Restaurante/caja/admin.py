from django.contrib import admin
from import_export.admin import ImportExportModelAdmin
from import_export import resources
from .models import Caja, Factura, Pago, CierreCaja, Egreso

# Recursos para exportación
class PagoResource(resources.ModelResource):
    class Meta:
        model = Pago
        fields = ('id', 'caja__numero_caja', 'factura__numero_factura', 'monto', 'metodo_pago', 'created_at')
        export_order = fields

class FacturaResource(resources.ModelResource):
    class Meta:
        model = Factura
        fields = ('id', 'numero_factura', 'table__mesa_id', 'estado', 'metodo_pago', 'total', 'created_at')
        export_order = fields

class EgresoResource(resources.ModelResource):
    class Meta:
        model = Egreso
        fields = ('id', 'caja__id', 'monto', 'comentario', 'creado_por__username', 'created_at')
        export_order = fields

# Admin con exportación
@admin.register(Pago)
class PagoAdmin(ImportExportModelAdmin):
    resource_class = PagoResource
    list_display = ['id', 'caja', 'factura', 'monto', 'metodo_pago', 'created_at']
    list_filter = ['metodo_pago', 'created_at']
    search_fields = ['factura__numero_factura', 'referencia']
    
@admin.register(Factura)
class FacturaAdmin(ImportExportModelAdmin):
    resource_class = FacturaResource
    list_display = ['id', 'numero_factura', 'table', 'estado', 'metodo_pago', 'total', 'created_at']
    list_filter = ['estado', 'metodo_pago', 'created_at']
    search_fields = ['numero_factura', 'table__mesa_id']

@admin.register(Egreso)
class EgresoAdmin(ImportExportModelAdmin):
    resource_class = EgresoResource
    list_display = ['id', 'caja', 'monto', 'comentario', 'creado_por', 'created_at']
    list_filter = ['caja', 'created_at']
    search_fields = ['comentario']
    readonly_fields = ['creado_por', 'created_at']

# Registrar otros modelos sin exportación
@admin.register(Caja)
class CajaAdmin(admin.ModelAdmin):
    list_display = ['id', 'numero_caja', 'estado', 'saldo_actual', 'usuario_apertura', 'fecha_apertura']
    list_filter = ['estado', 'fecha_apertura']
    search_fields = ['numero_caja']

@admin.register(CierreCaja)
class CierreCajaAdmin(admin.ModelAdmin):
    list_display = ['id', 'caja', 'fecha_cierre', 'saldo_final', 'diferencia', 'cerrado_por']
    list_filter = ['fecha_cierre', 'caja']
    search_fields = ['observaciones']
