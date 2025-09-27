from django.db import models

class Dish(models.Model):
    CATEGORY_CHOICES = [
        ("PLATILLOS","Platillos"),
        ("BEBIDAS","Bebidas"),
        ("EXTRAS","Extras"),
    ]
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    available = models.BooleanField(default=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name
