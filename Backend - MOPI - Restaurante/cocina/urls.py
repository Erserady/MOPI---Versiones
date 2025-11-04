from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OrderViewSet, pedidos_view, kitchen_api

router = DefaultRouter()
router.register(r'orders', OrderViewSet, basename='order')

urlpatterns = [
    path('', include(router.urls)),
    path('kitchen/', kitchen_api, name='api-kitchen'),
    path('pedidos/', pedidos_view, name='cocina-pedidos'),
]
