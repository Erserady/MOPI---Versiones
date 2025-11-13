from django.db import models
from django.conf import settings

class Table(models.Model):
    # mesa_id: identificador visible (p.ex. "MESA-1" o número) - LEGACY
    mesa_id = models.CharField(max_length=50, unique=True)
    mesa = models.CharField(max_length=50, blank=True, null=True, help_text="Nombre/numero legible de la mesa - LEGACY")
    ubicacion = models.CharField(max_length=100, blank=True, null=True)
    
    # Nuevos campos para compatibilidad con panel de administrador
    number = models.CharField(max_length=50, blank=True, null=True, help_text="Número de mesa visible")
    capacity = models.IntegerField(default=4, help_text="Capacidad de personas")
    status = models.CharField(
        max_length=20, 
        default='available',
        choices=[
            ('available', 'Disponible'),
            ('occupied', 'Ocupada'),
            ('reserved', 'Reservada'),
        ],
        help_text="Estado de la mesa"
    )
    
    # Mesero asignado
    assigned_waiter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_tables',
        help_text='Mesero asignado a esta mesa'
    )

    def __str__(self):
        return f"{self.number or self.mesa or self.mesa_id}"

class WaiterOrder(models.Model):
    # order_id único (puede mapear a cocina.order o a sistema externo)
    order_id = models.CharField(max_length=100, unique=True)
    # relación con mesa - CASCADE permite eliminar mesa aunque tenga órdenes
    table = models.ForeignKey(Table, on_delete=models.CASCADE, related_name='orders')
    pedido = models.TextField(help_text="Detalle (items) del pedido")
    cliente = models.CharField(max_length=200, blank=True, null=True)
    cantidad = models.PositiveIntegerField(default=1)
    nota = models.TextField(blank=True, null=True)
    preparacion_enlazada = models.CharField(max_length=100, blank=True, null=True, help_text="opcional: id de orden en cocina")
    estado = models.CharField(max_length=50, default='pendiente', help_text="pendiente, servido, pagado")
    en_cocina_since = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Momento exacto en que la orden entró a cocina"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.order_id} - {self.table} ({self.estado})"
