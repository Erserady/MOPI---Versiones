# mesero/views.py
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import render
from .models import Table, WaiterOrder
from .serializers import TableSerializer, WaiterOrderSerializer
from caja.models import Caja

class TableViewSet(viewsets.ModelViewSet):
    queryset = Table.objects.all().order_by('mesa_id')
    serializer_class = TableSerializer
    permission_classes = [permissions.IsAuthenticated]  # Requiere autenticación para todas las operaciones
    
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
    queryset = WaiterOrder.objects.all().order_by('-created_at')
    serializer_class = WaiterOrderSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def create(self, request, *args, **kwargs):
        """Validar que la caja esté abierta antes de crear un pedido"""
        # Verificar si hay una caja abierta
        caja_abierta = Caja.objects.filter(estado='abierta').first()
        
        if not caja_abierta:
            return Response({
                'error': 'No se pueden crear pedidos',
                'mensaje': 'La caja debe estar abierta para poder tomar pedidos. Por favor, contacte al administrador para abrir la caja.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Si la caja está abierta, proceder con la creación normal
        response = super().create(request, *args, **kwargs)
        
        # Si la orden se creó exitosamente, actualizar el estado de la mesa
        if response.status_code == status.HTTP_201_CREATED:
            try:
                order = WaiterOrder.objects.get(id=response.data['id'])
                table = order.table
                
                # Actualizar estado de la mesa a "occupied" y asignar mesero
                table.status = 'occupied'
                table.assigned_waiter = request.user
                table.save()
                
            except WaiterOrder.DoesNotExist:
                pass
        
        return response

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
