from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    ROLE_CHOICES = [
        ("ADMIN", "Administrador"),
        ("WAITER", "Mesero"),
        ("COOK", "Cocina"),
        ("CASHIER", "Cajero"),
    ]
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default="WAITER")

    def __str__(self):
        return f"{self.username} ({self.role})"
