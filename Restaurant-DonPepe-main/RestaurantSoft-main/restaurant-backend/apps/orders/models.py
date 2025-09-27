from django.db import models
from django.conf import settings
from apps.menu.models import Dish
from apps.tables.models import Table

class Order(models.Model):
    STATUS_CHOICES = [
        ("PENDING","Pendiente"),
        ("PREPARING","En preparación"),
        ("SERVED","Servido"),
        ("CANCELLED","Cancelado"),
        ("PAID","Pagado"),
    ]
    table = models.ForeignKey(Table, on_delete=models.PROTECT, related_name="orders")
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="PENDING")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    notes = models.TextField(blank=True)

    def total(self):
        return sum(item.subtotal() for item in self.items.all())

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    dish = models.ForeignKey(Dish, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField(default=1)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    notes = models.CharField(max_length=200, blank=True)

    def subtotal(self):
        return self.price * self.quantity
