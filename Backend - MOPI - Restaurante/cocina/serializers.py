from rest_framework import serializers
from .models import Order

class OrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ['id','pedido_id','orden','plato','estado','preparacion','tiempo_estimado','created_at','updated_at']
        read_only_fields = ['id','created_at','updated_at']
