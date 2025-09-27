from rest_framework import viewsets
from .models import Dish
from .serializers import DishSerializer
from rest_framework.permissions import IsAuthenticatedOrReadOnly

class DishViewSet(viewsets.ModelViewSet):
    queryset = Dish.objects.all()
    serializer_class = DishSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
