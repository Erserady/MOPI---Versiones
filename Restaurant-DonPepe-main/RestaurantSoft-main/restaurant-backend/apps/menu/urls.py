from django.urls import path, include
from rest_framework import routers
from .views import DishViewSet

router = routers.DefaultRouter()
router.register(r'dishes', DishViewSet, basename='dish')

urlpatterns = [
    path('', include(router.urls)),
]
