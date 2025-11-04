from django.contrib import admin
from .models import Table, WaiterOrder

@admin.register(Table)
class TableAdmin(admin.ModelAdmin):
    list_display = ('mesa_id','mesa','ubicacion')

@admin.register(WaiterOrder)
class WaiterOrderAdmin(admin.ModelAdmin):
    list_display = ('order_id','table','cliente','cantidad','estado','created_at')
    search_fields = ('order_id','cliente','pedido')
    list_filter = ('estado',)
