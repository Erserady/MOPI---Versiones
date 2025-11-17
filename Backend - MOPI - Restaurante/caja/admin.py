from django.contrib import admin
from .models import Caja, Factura, Pago, CierreCaja, Egreso

@admin.register(Egreso)
class EgresoAdmin(admin.ModelAdmin):
    list_display = ['id', 'caja', 'monto', 'comentario', 'creado_por', 'created_at']
    list_filter = ['caja', 'created_at']
    search_fields = ['comentario']
    readonly_fields = ['creado_por', 'created_at']
