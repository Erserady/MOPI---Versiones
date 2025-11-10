# mesero/views.py
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import render
from .models import Table, WaiterOrder
from .serializers import TableSerializer, WaiterOrderSerializer
from administrador.models import CategoriaMenu
from administrador.serializers import CategoriaMenuSerializer, PlatoSerializer

class TableViewSet(viewsets.ModelViewSet):
    queryset = Table.objects.all().order_by('mesa_id')
    serializer_class = TableSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

class WaiterOrderViewSet(viewsets.ModelViewSet):
    queryset = WaiterOrder.objects.all().order_by('-created_at')
    serializer_class = WaiterOrderSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    @action(detail=False, methods=['get'], url_path='open', permission_classes=[permissions.AllowAny])
    def open_orders(self, request):
        qs = self.get_queryset().filter(estado__in=['pendiente'])
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

# endpoint público alternativo (opcional)
@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def mesero_open_api(request):
    qs = WaiterOrder.objects.filter(estado__in=['pendiente']).order_by('-created_at')
    serializer = WaiterOrderSerializer(qs, many=True, context={'request': request})
    return Response(serializer.data)

# Vista HTML simple para mesero: /mesero/pedido/
def mesero_pedido_view(request):
    return render(request, 'mesero/pedido.html', {})

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def menu_publico(request):
    categorias = CategoriaMenu.objects.filter(activa=True).prefetch_related('platos')
    data = []
    for categoria in categorias:
        platos = categoria.platos.filter(disponible=True)
        data.append({
            'categoria': CategoriaMenuSerializer(categoria).data,
            'platos': PlatoSerializer(platos, many=True).data,
        })
    return Response(data)
