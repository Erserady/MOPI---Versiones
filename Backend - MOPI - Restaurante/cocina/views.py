from rest_framework import permissions, viewsets, mixins
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import render
from mesero.models import WaiterOrder
from mesero.utils import sync_cocina_timestamp
from .serializers import KitchenWaiterOrderSerializer

ACTIVE_KITCHEN_STATES = ['pendiente', 'en_preparacion', 'listo']


class OrderViewSet(mixins.ListModelMixin,
                   mixins.RetrieveModelMixin,
                   mixins.UpdateModelMixin,
                   viewsets.GenericViewSet):
    queryset = WaiterOrder.objects.select_related('table').all().order_by('created_at')
    serializer_class = KitchenWaiterOrderSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_update(self, serializer):
        previous_state = serializer.instance.estado
        instance = serializer.save()
        sync_cocina_timestamp(instance, previous_state=previous_state)

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


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def kitchen_api(request):
    qs = WaiterOrder.objects.filter(estado__in=ACTIVE_KITCHEN_STATES).order_by('created_at')
    serializer = KitchenWaiterOrderSerializer(qs, many=True, context={'request': request})
    return Response(serializer.data)


def pedidos_view(request):
    return render(request, 'cocina/pedidos.html', {})
