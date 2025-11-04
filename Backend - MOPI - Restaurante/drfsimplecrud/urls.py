# drfsimplecrud/urls.py (reemplazo seguro)
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),

    # Rutas principales por app, con prefijos claros — evita includes colisionantes
    path('', include('projects.urls')),          # si projects.urls tiene root pages
    path('api/users/', include('users.urls')),   # -> /api/users/...
    path('api/cocina/', include('cocina.urls')), # -> /api/cocina/orders/ and /api/cocina/kitchen/
    path('api/mesero/', include('mesero.urls')), # -> /api/mesero/... and avoids collision

    # vistas HTML
    path('cocina/', include('cocina.urls')),     # -> /cocina/pedidos/ (si quieres frontend directo)
    path('mesero/', include('mesero.urls')),     # -> /mesero/pedido/

    path('api/caja/', include('caja.urls')),
    path('caja/', include('caja.urls')),
    path('api/administrador/', include('administrador.urls')),
]

# servir estáticos en dev
urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
