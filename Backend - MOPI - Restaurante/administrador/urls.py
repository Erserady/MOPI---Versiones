from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import permissions
from .views import (
    DashboardViewSet, CategoriaMenuViewSet, PlatoViewSet, 
    InventarioViewSet, MovimientoInventarioViewSet, 
    ConfiguracionSistemaViewSet, GestionPersonalViewSet,
    GestionFacturasViewSet, menu_completo
)
from .models import CategoriaMenu, Plato

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def menu_health_check(request):
    """Health check para verificar estado del menú"""
    categorias_count = CategoriaMenu.objects.filter(activa=True).count()
    platos_count = Plato.objects.filter(disponible=True).count()
    
    return Response({
        'status': 'ok' if categorias_count > 0 else 'empty',
        'categorias': categorias_count,
        'platos': platos_count,
        'message': 'Base de datos lista' if categorias_count > 0 else 'Ejecuta populate_all_data'
    })

router = DefaultRouter()
router.register(r'dashboard', DashboardViewSet, basename='dashboard')
router.register(r'categorias-menu', CategoriaMenuViewSet)
router.register(r'platos', PlatoViewSet)
router.register(r'inventario', InventarioViewSet)
router.register(r'movimientos-inventario', MovimientoInventarioViewSet)
router.register(r'configuracion', ConfiguracionSistemaViewSet, basename='configuracion')
router.register(r'personal', GestionPersonalViewSet, basename='personal')
router.register(r'facturas', GestionFacturasViewSet, basename='facturas')

urlpatterns = [
    path('', include(router.urls)),
    path('menu-completo/', menu_completo, name='menu-completo'),
    path('menu-simple/', menu_completo, name='menu-simple'),  # Alias para testing
    path('menu-health/', menu_health_check, name='menu-health'),  # Health check
]