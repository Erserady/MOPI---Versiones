from django.contrib import admin
from .models import Order

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('pedido_id','plato','estado','tiempo_estimado','created_at')
    search_fields = ('pedido_id','plato')
    list_filter = ('estado',)
