from rest_framework import serializers
from django.utils import timezone
from mesero.models import WaiterOrder
from mesero.utils import normalize_order_items


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
        table = getattr(obj, 'table', None)
        if table and table.assigned_waiter:
            full_name = table.assigned_waiter.get_full_name()
            return full_name or table.assigned_waiter.username
        return obj.cliente or None

    def get_items(self, obj):
        items = normalize_order_items(obj.pedido, stable=True, stable_seed=obj.id)
        # Si un platillo viene marcado para omitirse en cocina, no lo regresamos en el feed
        # (caso de reabrir una orden ya entregada).
        return [item for item in items if not item.get("omit_in_kitchen")]

    def get_elapsed_seconds(self, obj):
        if obj.en_cocina_since:
            delta = timezone.now() - obj.en_cocina_since
            return max(int(delta.total_seconds()), 0)
        return None

    def validate(self, attrs):
        """
        Evita marcar la orden como lista si hay platillos de cocina sin checklist.
        """
        new_status = attrs.get("estado")
        instance = getattr(self, "instance", None)

        if instance and new_status == "listo":
            items = normalize_order_items(instance.pedido)
            cookable_items = [item for item in items if item.get("preparable_en_cocina", True)]
            if cookable_items and not all(item.get("listo_en_cocina") for item in cookable_items):
                raise serializers.ValidationError(
                    "No se puede marcar la orden como lista hasta que todos los platillos estén marcados como listos en cocina."
                )

        return super().validate(attrs)
