import json
from rest_framework import serializers
from django.utils import timezone
from mesero.models import WaiterOrder


class KitchenWaiterOrderSerializer(serializers.ModelSerializer):
    mesa_label = serializers.SerializerMethodField()
    mesa_id = serializers.SerializerMethodField()
    waiter_name = serializers.SerializerMethodField()
    items = serializers.SerializerMethodField()
    elapsed_seconds = serializers.SerializerMethodField()

    class Meta:
        model = WaiterOrder
        fields = [
            'id',
            'order_id',
            'table',
            'mesa_label',
            'mesa_id',
            'estado',
            'pedido',
            'items',
            'nota',
            'created_at',
            'updated_at',
            'en_cocina_since',
            'elapsed_seconds',
            'waiter_name',
        ]
        read_only_fields = [
            'id',
            'table',
            'mesa_label',
            'mesa_id',
            'pedido',
            'items',
            'created_at',
            'updated_at',
            'en_cocina_since',
            'elapsed_seconds',
            'waiter_name',
        ]

    def get_mesa_label(self, obj):
        if obj.table:
            return str(obj.table)
        return "Mesa desconocida"

    def get_mesa_id(self, obj):
        if obj.table:
            return obj.table.mesa_id or obj.table.number or obj.table.id
        return None

    def get_waiter_name(self, obj):
        return obj.cliente or None

    def get_items(self, obj):
        raw = obj.pedido
        if not raw:
            return []
        if isinstance(raw, list):
            return raw
        try:
            data = json.loads(raw)
            if isinstance(data, list):
                return data
        except (TypeError, ValueError):
            pass
        return []

    def get_elapsed_seconds(self, obj):
        if obj.en_cocina_since:
            delta = timezone.now() - obj.en_cocina_since
            return max(int(delta.total_seconds()), 0)
        return None
