from rest_framework import serializers
from .models import Table, WaiterOrder
from django.db import transaction

class TableSerializer(serializers.ModelSerializer):
    class Meta:
        model = Table
        fields = ['id', 'mesa_id', 'mesa', 'ubicacion']
        read_only_fields = ['id']


class WaiterOrderSerializer(serializers.ModelSerializer):
    # aceptar aliases en la entrada (write-only aliases)
    mesa = serializers.CharField(write_only=True, required=False)         # e.g. "Mesa 5" o mesa_id
    mesa_id = serializers.CharField(write_only=True, required=False)
    tableNumber = serializers.CharField(write_only=True, required=False)  # alias inglés
    items = serializers.CharField(write_only=True, required=False)        # alias para pedido
    waiterName = serializers.CharField(write_only=True, required=False)   # opcional info extra

    class Meta:
        model = WaiterOrder
        # incluir todos los campos explícitos y los aliases write-only
        fields = [
            'id', 'order_id', 'table', 'mesa', 'mesa_id', 'tableNumber',
            'pedido', 'items', 'cliente', 'cantidad', 'nota', 'preparacion_enlazada',
            'estado', 'waiterName', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'table', 'created_at', 'updated_at']

    def to_representation(self, instance):
        """Normalizar salida: mostrar mesa por su nombre/mesa_id y mapear campos"""
        rep = super().to_representation(instance)
        # mostrar la mesa legible (str de la FK Table)
        rep['mesa'] = str(instance.table)
        # mapear waiterName desde cliente si existe
        if instance.cliente and not rep.get('waiterName'):
            rep['waiterName'] = instance.cliente
        return rep

    def to_internal_value(self, data):
        """
        Preprocesar aliases de entrada:
        - aceptar 'mesa', 'mesa_id', o 'tableNumber' como el identificador de mesa
        - aceptar 'items' como alias para 'pedido'
        - aceptar 'waiterName' como alias para 'cliente'
        """
        data = dict(data)  # copia mutable
        # normalizar mesa
        mesa_val = data.get('mesa') or data.get('mesa_id') or data.get('tableNumber')
        if mesa_val:
            data['_mesa_id_normalized'] = str(mesa_val)
        # normalize items -> pedido
        if 'items' in data and 'pedido' not in data:
            data['pedido'] = data.get('items')
        # normalize waiterName -> cliente
        if 'waiterName' in data and ('cliente' not in data or not data.get('cliente')):
            data['cliente'] = data.get('waiterName')
        return super().to_internal_value(data)

    @transaction.atomic
    def create(self, validated_data):
        # extraemos mesa antes de crear modelo
        mesa_id = validated_data.pop('_mesa_id_normalized', None)
        if mesa_id is None:
            # fallback: intentar otros aliases
            mesa_id = validated_data.pop('mesa_id', None) or validated_data.pop('mesa', None) or validated_data.pop('tableNumber', None)
        # Buscar o crear la mesa
        if mesa_id:
            table_obj, created = Table.objects.get_or_create(mesa_id=mesa_id, defaults={'mesa': mesa_id})
        else:
            # si no hubo identificador, crear una mesa por defecto (o lanzar error si preferís)
            table_obj = Table.objects.create(mesa_id='MESA-UNKNOWN', mesa='Unknown')
        # eliminar campos alias si quedaron
        validated_data.pop('mesa', None)
        validated_data.pop('mesa_id', None)
        validated_data.pop('tableNumber', None)
        validated_data.pop('items', None)
        validated_data.pop('waiterName', None)
        # crear WaiterOrder con FK a table
        order = WaiterOrder.objects.create(table=table_obj, **validated_data)
        return order
