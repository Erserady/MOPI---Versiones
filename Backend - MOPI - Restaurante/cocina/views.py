import json
from rest_framework import permissions, viewsets, mixins, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import render
from mesero.models import WaiterOrder
from mesero.utils import normalize_order_items, sync_cocina_timestamp
from .serializers import KitchenWaiterOrderSerializer

ACTIVE_KITCHEN_STATES = ['pendiente', 'en_preparacion', 'listo']


class OrderViewSet(mixins.ListModelMixin,
                   mixins.RetrieveModelMixin,
                   mixins.UpdateModelMixin,
                   mixins.DestroyModelMixin,
                   viewsets.GenericViewSet):
    queryset = (
        WaiterOrder.objects
        .select_related('table', 'table__assigned_waiter')
        .all()
        .order_by('created_at')
    )
    serializer_class = KitchenWaiterOrderSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_update(self, serializer):
        previous_state = serializer.instance.estado
        table = serializer.instance.table
        original_waiter_id = table.assigned_waiter_id if table else None

        instance = serializer.save()

        if table and table.assigned_waiter_id != original_waiter_id:
            table.assigned_waiter_id = original_waiter_id
            table.save(update_fields=['assigned_waiter'])

        sync_cocina_timestamp(instance, previous_state=previous_state)
    
    def perform_destroy(self, instance):
        """
        Al eliminar una orden, liberar la mesa asociada
        """
        table = instance.table
        if table:
            # Verificar si la mesa tiene otras órdenes activas
            other_orders = WaiterOrder.objects.filter(
                table=table
            ).exclude(id=instance.id).exclude(
                estado__in=['pagado', 'facturado', 'cancelado']
            ).exists()
            
            # Si no hay otras órdenes activas, liberar la mesa
            if not other_orders:
                table.status = 'libre'
                table.assigned_waiter = None
                table.save(update_fields=['status', 'assigned_waiter'])
        
        # Eliminar la orden
        instance.delete()

    @action(
        detail=False,
        methods=['get'],
        url_path='kitchen',
        permission_classes=[permissions.AllowAny],
    )
    def kitchen(self, request):
        qs = self.get_queryset().filter(estado__in=ACTIVE_KITCHEN_STATES)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(
        detail=True,
        methods=['patch'],
        url_path=r'items/(?P<item_uid>[^/.]+)',
        permission_classes=[permissions.IsAuthenticatedOrReadOnly],
    )
    def update_item_status(self, request, pk=None, item_uid=None):
        """
        Marca un platillo como listo/no listo dentro de una orden de cocina.
        """
        order = self.get_object()
        items = normalize_order_items(order.pedido, stable=True, stable_seed=order.id)

        ready_raw = request.data.get('listo_en_cocina')
        if ready_raw is None:
            ready_raw = request.data.get('ready')
        if ready_raw is None:
            return Response(
                {'error': "Falta el campo 'listo_en_cocina'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if isinstance(ready_raw, str):
            ready_val = ready_raw.strip().lower() in ['true', '1', 'yes', 'y', 'si']
        else:
            ready_val = bool(ready_raw)

        updated = False
        for item in items:
            if str(item.get('item_uid')) == str(item_uid):
                item['listo_en_cocina'] = ready_val
                updated = True
                break

        if not updated:
            return Response(
                {'error': f"No se encontró el platillo con id {item_uid}."},
                status=status.HTTP_404_NOT_FOUND,
            )

        order.pedido = json.dumps(items)
        order.save(update_fields=['pedido', 'updated_at'])

        serializer = self.get_serializer(order)
        return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def kitchen_api(request):
    qs = (
        WaiterOrder.objects
        .filter(estado__in=ACTIVE_KITCHEN_STATES)
        .select_related('table', 'table__assigned_waiter')
        .order_by('created_at')
    )
    serializer = KitchenWaiterOrderSerializer(qs, many=True, context={'request': request})
    return Response(serializer.data)


def pedidos_view(request):
    return render(request, 'cocina/pedidos.html', {})
