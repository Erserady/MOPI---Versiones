from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = [
        ('cook', 'Cocina'),
        ('waiter', 'Mesero'),
        ('cashier', 'Caja'),
        ('admin', 'Administrador'),
    ]
    
    usuario = models.CharField(max_length=100, unique=True)   # alias o nombre de usuario
    remember_me = models.BooleanField(default=False)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='waiter')
    pin = models.CharField(max_length=6, blank=True, null=True)
    color = models.CharField(max_length=7, default='#3498db')  # Color en formato hex
    
    class Meta:
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'
        ordering = ['role', 'first_name', 'last_name']
    
    def __str__(self):
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name} ({self.get_role_display()})"
        return self.username