from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DashboardViewSet, CategoriaMenuViewSet, PlatoViewSet, 
    InventarioViewSet, MovimientoInventarioViewSet, 
    ConfiguracionSistemaViewSet, GestionPersonalViewSet,
    GestionFacturasViewSet, menu_completo
)

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
]