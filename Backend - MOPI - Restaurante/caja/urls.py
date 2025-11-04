from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CajaViewSet, FacturaViewSet, PagoViewSet, CierreCajaViewSet, caja_view, facturas_view, mesas_con_ordenes_pendientes

router = DefaultRouter()
router.register(r'cajas', CajaViewSet, basename='caja')
router.register(r'facturas', FacturaViewSet, basename='factura')
router.register(r'pagos', PagoViewSet, basename='pago')
router.register(r'cierres', CierreCajaViewSet, basename='cierre')

urlpatterns = [
    path('', include(router.urls)),
    path('caja/', caja_view, name='caja-interfaz'),
    path('facturas/', facturas_view, name='facturas-interfaz'),
    path('mesas-pendientes/', mesas_con_ordenes_pendientes, name='mesas-pendientes'),
]