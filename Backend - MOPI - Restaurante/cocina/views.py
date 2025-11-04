from rest_framework import viewsets, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import render
from .models import Order
from .serializers import OrderSerializer

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all().order_by('-created_at')
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    @action(detail=False, methods=['get'], url_path='kitchen', permission_classes=[permissions.AllowAny])
    def kitchen(self, request):
        qs = self.get_queryset().filter(estado__in=['pendiente', 'en_preparacion'])
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def kitchen_api(request):
    qs = Order.objects.filter(estado__in=['pendiente', 'en_preparacion']).order_by('-created_at')
    serializer = OrderSerializer(qs, many=True, context={'request': request})
    return Response(serializer.data)

def pedidos_view(request):
    return render(request, 'cocina/pedidos.html', {})
