from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TableViewSet, WaiterOrderViewSet, mesero_pedido_view

router = DefaultRouter()
router.register(r'tables', TableViewSet, basename='table')
router.register(r'mesero-orders', WaiterOrderViewSet, basename='mesero-order')

urlpatterns = [
    # router URLs -> will be mounted depending on how the app is included in project urls.py
    path('', include(router.urls)),            # e.g. /api/mesero/ -> tables/ and mesero-orders/
    # specific view for waiter orders (HTML or functional endpoint)
    path('pedido/', mesero_pedido_view, name='mesero-pedido'),
]
