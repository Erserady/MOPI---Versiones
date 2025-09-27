from rest_framework import serializers
from .models import Order, OrderItem
from apps.menu.models import Dish

class OrderItemSerializer(serializers.ModelSerializer):
    dish_name = serializers.CharField(source='dish.name', read_only=True)
    subtotal = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = ['id','dish','dish_name','quantity','price','notes','subtotal']

    def get_subtotal(self,obj):
        return obj.subtotal()

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)
    table_number = serializers.IntegerField(source='table.number', read_only=True)
    total = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = ['id','table','table_number','created_by','status','created_at','items','notes','total']
        read_only_fields = ['created_by','created_at','total']

    def get_total(self,obj):
        return obj.total()

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        order = Order.objects.create(**validated_data)
        for item in items_data:
            dish = Dish.objects.get(pk=item['dish'])
            OrderItem.objects.create(
                order=order,
                dish=dish,
                quantity=item.get('quantity',1),
                price=item.get('price', dish.price),
                notes=item.get('notes','')
            )
        return order
