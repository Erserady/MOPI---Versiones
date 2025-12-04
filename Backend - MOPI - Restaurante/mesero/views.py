# mesero/views.py
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import render
from django.db import transaction

from .models import Table, WaiterOrder
from .serializers import TableSerializer, WaiterOrderSerializer
from .utils import (
    serialize_normalized_items,
    sync_cocina_timestamp,
    parse_items,
    merge_items_preserving_ready,
)
from caja.models import RemoveRequest, Caja
from caja.serializers import RemoveRequestSerializer
from django.db import transaction
from decimal import Decimal, InvalidOperation


class TableViewSet(viewsets.ModelViewSet):
    queryset = Table.objects.all().order_by('mesa_id')
    serializer_class = TableSerializer
    permission_classes = [permissions.IsAuthenticated]  # Requiere autenticacion para todas las operaciones
    
    def perform_update(self, serializer):
        original_waiter_id = serializer.instance.assigned_waiter_id
        updating_assigned = 'assigned_waiter' in serializer.validated_data
        new_status = serializer.validated_data.get('status', serializer.instance.status)
        instance = serializer.save()

        if new_status == 'available' and not updating_assigned:
            if instance.assigned_waiter_id is not None:
                instance.assigned_waiter = None
                instance.save(update_fields=['assigned_waiter'])
            return

        if not updating_assigned and instance.assigned_waiter_id != original_waiter_id:
            instance.assigned_waiter_id = original_waiter_id
            instance.save(update_fields=['assigned_waiter'])
    
    def destroy(self, request, *args, **kwargs):
        """Override destroy para agregar logs y mejor manejo de errores"""
        try:
            instance = self.get_object()
            self.perform_destroy(instance)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )


class WaiterOrderViewSet(viewsets.ModelViewSet):
    queryset = (
        WaiterOrder.objects
        .select_related('table', 'table__assigned_waiter')
        .all()
        .order_by('-created_at')
    )
    serializer_class = WaiterOrderSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def create(self, request, *args, **kwargs):
        """Validar que la caja este abierta antes de crear un pedido"""
        caja_abierta = Caja.objects.filter(estado='abierta').first()
        if not caja_abierta:
            return Response({
                'error': 'No se pueden crear pedidos',
                'mensaje': 'La caja debe estar abierta para poder tomar pedidos. Por favor, contacte al administrador para abrir la caja.'
            }, status=status.HTTP_400_BAD_REQUEST)
        response = super().create(request, *args, **kwargs)

        if response.status_code == status.HTTP_201_CREATED:
            try:
                order = WaiterOrder.objects.get(id=response.data['id'])
                table = order.table
                table.status = 'occupied'
                table.assigned_waiter = request.user
                table.save()
                sync_cocina_timestamp(order)
            except WaiterOrder.DoesNotExist:
                pass
        return response

    def perform_update(self, serializer):
        previous_state = serializer.instance.estado
        previous_pedido = serializer.instance.pedido
        new_pedido = serializer.validated_data.get('pedido')
        pedido_changed = new_pedido is not None and new_pedido != previous_pedido

        if pedido_changed and previous_state in ['en_preparacion', 'listo', 'servido', 'entregado']:
            serializer.validated_data['estado'] = 'pendiente'
            serializer.validated_data['en_cocina_since'] = None

        if pedido_changed:
            serializer.validated_data['pedido'] = merge_items_preserving_ready(
                new_pedido,
                previous_pedido,
                stable_seed=serializer.instance.id,
                previous_state=previous_state,
            )
        instance = serializer.save()
        sync_cocina_timestamp(instance, previous_state=previous_state)

    @action(detail=False, methods=['get'], url_path='open', permission_classes=[permissions.AllowAny])
    def open_orders(self, request):
        qs = self.get_queryset().filter(estado__in=['pendiente'])
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    def _create_remove_request(self, request, order):
        """Crea una solicitud de eliminacion para un item de la orden."""
        item_index_raw = request.data.get('item_index')
        try:
            item_index = int(item_index_raw)
        except (TypeError, ValueError):
            return Response({'error': 'item_index debe ser un entero'}, status=status.HTTP_400_BAD_REQUEST)

        items = parse_items(order.pedido)
        if item_index < 0 or item_index >= len(items):
            return Response({'error': 'Indice de item fuera de rango'}, status=status.HTTP_400_BAD_REQUEST)

        qty_remove_raw = request.data.get('cantidad_eliminar') or request.data.get('cantidad') or 1
        try:
            qty_remove = int(qty_remove_raw)
        except (TypeError, ValueError):
            qty_remove = 1

        if RemoveRequest.objects.filter(order=order, item_index=item_index, estado='pendiente').exists():
            return Response({'error': 'Ya existe una solicitud pendiente para este item'}, status=status.HTTP_400_BAD_REQUEST)

        item_data = items[item_index]
        item_nombre = (
            item_data.get('nombre')
            or item_data.get('dishName')
            or item_data.get('name')
            or 'Platillo'
        )
        cantidad_actual = item_data.get('cantidad', 1) or 1
        if qty_remove < 1:
            qty_remove = 1
        if qty_remove > cantidad_actual:
            qty_remove = cantidad_actual
        razon = request.data.get('razon') or ''
        if not razon.strip():
            return Response({'error': 'La razon es obligatoria'}, status=status.HTTP_400_BAD_REQUEST)

        solicitado_por = request.data.get('solicitado_por') or request.user.get_full_name() or request.user.username

        remove_req = RemoveRequest.objects.create(
            order=order,
            item_index=item_index,
            item_nombre=str(item_nombre),
            cantidad=qty_remove,
            razon=razon.strip(),
            solicitado_por=solicitado_por,
            estado='pendiente',
        )

        serializer = RemoveRequestSerializer(remove_req, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='request-remove-item')
    def request_remove_item(self, request, pk=None):
        order = self.get_object()
        return self._create_remove_request(request, order)

    @action(detail=True, methods=['post'], url_path='request_remove_item')
    def request_remove_item_alt(self, request, pk=None):
        order = self.get_object()
        return self._create_remove_request(request, order)

    @action(detail=True, methods=['get'], url_path='remove-requests')
    def remove_requests(self, request, pk=None):
        order = self.get_object()
        qs = RemoveRequest.objects.filter(order=order).order_by('-created_at')
        serializer = RemoveRequestSerializer(qs, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='remove_requests')
    def remove_requests_alt(self, request, pk=None):
        return self.remove_requests(request, pk)

    @action(detail=True, methods=['post'], url_path='override-prices')
    @action(detail=True, methods=['post'], url_path='override_prices')
    def override_prices(self, request, pk=None):
        """
        Permite al cajero ajustar el precio unitario de uno o varios items
        justo antes de facturar. No afecta el precio de otros pedidos.
        """
        order = self.get_object()
        overrides = request.data.get('overrides') or request.data.get('items') or []
        if not isinstance(overrides, list) or len(overrides) == 0:
            return Response({'error': 'La lista de overrides es requerida'}, status=status.HTTP_400_BAD_REQUEST)

        items = parse_items(order.pedido)
        if not items:
            return Response({'error': 'La orden no tiene items para actualizar'}, status=status.HTTP_400_BAD_REQUEST)

        updated_count = 0
        for ov in overrides:
            if not isinstance(ov, dict):
                continue
            item_uid = str(ov.get('item_uid') or ov.get('uid') or ov.get('id') or '').strip()
            item_index_raw = ov.get('item_index') if ov.get('item_index') is not None else ov.get('index')
            new_price_raw = ov.get('nuevo_precio', ov.get('price', ov.get('precio')))
            if new_price_raw is None:
                continue
            try:
                new_price = Decimal(str(new_price_raw))
            except (InvalidOperation, ValueError):
                return Response({'error': 'Precio invalido, use numeros'}, status=status.HTTP_400_BAD_REQUEST)
            if new_price < 0:
                return Response({'error': 'El precio no puede ser negativo'}, status=status.HTTP_400_BAD_REQUEST)

            target_idx = None
            if item_uid:
                for idx, itm in enumerate(items):
                    uid_val = str(itm.get('item_uid') or itm.get('uid') or itm.get('id') or '')
                    if uid_val == item_uid:
                        target_idx = idx
                        break

            if target_idx is None and item_index_raw is not None:
                try:
                    candidate_idx = int(item_index_raw)
                    if 0 <= candidate_idx < len(items):
                        target_idx = candidate_idx
                except (TypeError, ValueError):
                    pass

            if target_idx is None:
                continue

            item = items[target_idx]
            qty_raw = item.get('cantidad', 1) or 1
            try:
                qty_val = Decimal(str(qty_raw))
            except (InvalidOperation, ValueError):
                qty_val = Decimal('1')

            item['precio'] = float(new_price)
            item['price'] = float(new_price)
            item['subtotal'] = float(new_price * qty_val)
            updated_count += 1

        if updated_count == 0:
            return Response({'error': 'No se pudo actualizar ningun item'}, status=status.HTTP_400_BAD_REQUEST)

        order.pedido = serialize_normalized_items(items, reset_ready=False)
        try:
            total_qty = 0
            for itm in items:
                try:
                    total_qty += int(itm.get('cantidad', 0))
                except Exception:
                    continue
            if total_qty > 0:
                order.cantidad = total_qty
        except Exception:
            pass

        order.save(update_fields=['pedido', 'cantidad', 'updated_at'])
        serializer = self.get_serializer(order)
        return Response({'order': serializer.data}, status=status.HTTP_200_OK)


# endpoint publico alternativo (opcional)
@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def mesero_open_api(request):
    qs = (
        WaiterOrder.objects
        .filter(estado__in=['pendiente'])
        .select_related('table', 'table__assigned_waiter')
        .order_by('-created_at')
    )
    serializer = WaiterOrderSerializer(qs, many=True, context={'request': request})
    return Response(serializer.data)


# Vista HTML simple para mesero: /mesero/pedido/
def mesero_pedido_view(request):
    return render(request, 'mesero/pedido.html', {})
