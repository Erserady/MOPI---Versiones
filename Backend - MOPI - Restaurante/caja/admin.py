from django.contrib import admin
from import_export.admin import ImportExportModelAdmin
from import_export import resources
from .models import Caja, Factura, Pago, CierreCaja, Egreso

# Recursos para exportación
class PagoResource(resources.ModelResource):
    class Meta:
        model = Pago
        fields = ('id', 'caja__id', 'factura__id', 'monto', 'metodo_pago', 'estado', 'fecha_pago')
        export_order = fields

class FacturaResource(resources.ModelResource):
    class Meta:
        model = Factura
        fields = ('id', 'mesa', 'estado', 'metodo_pago', 'total', 'created_at')
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
    list_display = ['id', 'caja', 'factura', 'monto', 'metodo_pago', 'estado', 'fecha_pago']
    list_filter = ['metodo_pago', 'estado', 'fecha_pago']
    search_fields = ['factura__id']
    
@admin.register(Factura)
class FacturaAdmin(ImportExportModelAdmin):
    resource_class = FacturaResource
    list_display = ['id', 'mesa', 'estado', 'metodo_pago', 'total', 'created_at']
    list_filter = ['estado', 'metodo_pago', 'created_at']
    search_fields = ['mesa']

@admin.register(Egreso)
class EgresoAdmin(ImportExportModelAdmin):
    resource_class = EgresoResource
    list_display = ['id', 'caja', 'monto', 'comentario', 'creado_por', 'created_at']
    list_filter = ['caja', 'created_at']
    search_fields = ['comentario']
    readonly_fields = ['creado_por', 'created_at']
