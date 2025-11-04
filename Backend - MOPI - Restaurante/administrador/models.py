from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from mesero.models import Table, WaiterOrder
from caja.models import Factura, Pago, Caja
from users.models import User as CustomUser

class CategoriaMenu(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(blank=True, null=True)
    orden = models.IntegerField(default=0, help_text="Orden de aparición en el menú")
    activa = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['orden', 'nombre']
        verbose_name_plural = "Categorías del Menú"
    
    def __str__(self):
        return self.nombre

class Plato(models.Model):
    categoria = models.ForeignKey(CategoriaMenu, on_delete=models.CASCADE, related_name='platos')
    nombre = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True, null=True)
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    precio_con_impuesto = models.DecimalField(max_digits=10, decimal_places=2, editable=False)
    disponible = models.BooleanField(default=True)
    ingredientes = models.TextField(help_text="Lista de ingredientes principales")
    tiempo_preparacion = models.IntegerField(default=15, help_text="Tiempo en minutos")
    imagen = models.ImageField(upload_to='platos/', blank=True, null=True)
    orden = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['categoria__orden', 'orden', 'nombre']
        unique_together = ['categoria', 'nombre']
    
    def save(self, *args, **kwargs):
        # Calcular precio con impuesto (18%)
        self.precio_con_impuesto = self.precio * 1.18
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.nombre} - ${self.precio}"

class Inventario(models.Model):
    UNIDADES = [
        ('unidad', 'Unidad'),
        ('kg', 'Kilogramo'),
        ('gr', 'Gramo'),
        ('lt', 'Litro'),
        ('ml', 'Mililitro'),
        ('paquete', 'Paquete'),
    ]
    
    nombre = models.CharField(max_length=200)
    categoria = models.CharField(max_length=100, blank=True, null=True)
    cantidad_actual = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    unidad = models.CharField(max_length=20, choices=UNIDADES)
    cantidad_minima = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    costo_unitario = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    proveedor = models.CharField(max_length=200, blank=True, null=True)
    ubicacion = models.CharField(max_length=100, blank=True, null=True)
    activo = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['categoria', 'nombre']
        verbose_name_plural = "Inventarios"
    
    @property
    def esta_bajo(self):
        return self.cantidad_actual <= self.cantidad_minima
    
    def __str__(self):
        return f"{self.nombre} - {self.cantidad_actual} {self.unidad}"

class MovimientoInventario(models.Model):
    TIPO_MOVIMIENTO = [
        ('entrada', 'Entrada'),
        ('salida', 'Salida'),
        ('ajuste', 'Ajuste'),
    ]
    
    inventario = models.ForeignKey(Inventario, on_delete=models.CASCADE, related_name='movimientos')
    tipo = models.CharField(max_length=20, choices=TIPO_MOVIMIENTO)
    cantidad = models.DecimalField(max_digits=10, decimal_places=2)
    cantidad_anterior = models.DecimalField(max_digits=10, decimal_places=2)
    cantidad_nueva = models.DecimalField(max_digits=10, decimal_places=2)
    motivo = models.CharField(max_length=200)
    usuario = models.ForeignKey(CustomUser, on_delete=models.PROTECT)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def save(self, *args, **kwargs):
        self.cantidad_anterior = self.inventario.cantidad_actual
        
        if self.tipo == 'entrada':
            self.cantidad_nueva = self.cantidad_anterior + self.cantidad
        elif self.tipo == 'salida':
            self.cantidad_nueva = self.cantidad_anterior - self.cantidad
        else:  # ajuste
            self.cantidad_nueva = self.cantidad
        
        # Actualizar el inventario
        self.inventario.cantidad_actual = self.cantidad_nueva
        self.inventario.save()
        
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.tipo} - {self.inventario.nombre} - {self.cantidad}"

class ConfiguracionSistema(models.Model):
    nombre_restaurante = models.CharField(max_length=200, default="Mi Restaurante")
    impuesto = models.DecimalField(max_digits=5, decimal_places=2, default=0.18, help_text="Impuesto en decimal (0.18 = 18%)")
    porcentaje_propina = models.DecimalField(max_digits=5, decimal_places=2, default=0.10)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    direccion = models.TextField(blank=True, null=True)
    horario_apertura = models.TimeField(default='08:00:00')
    horario_cierre = models.TimeField(default='22:00:00')
    
    class Meta:
        verbose_name_plural = "Configuración del Sistema"
    
    def save(self, *args, **kwargs):
        # Solo debe haber una configuración
        if not self.pk and ConfiguracionSistema.objects.exists():
            raise ValidationError("Solo puede existir una configuración del sistema")
        super().save(*args, **kwargs)
    
    def __str__(self):
        return "Configuración del Sistema"