from django.db import models

class Table(models.Model):
    # mesa_id: identificador visible (p.ex. "MESA-1" o número)
    mesa_id = models.CharField(max_length=50, unique=True)
    mesa = models.CharField(max_length=50, blank=True, null=True, help_text="Nombre/numero legible de la mesa")
    ubicacion = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return f"{self.mesa or self.mesa_id}"

class WaiterOrder(models.Model):
    # order_id único (puede mapear a cocina.order o a sistema externo)
    order_id = models.CharField(max_length=100, unique=True)
    # relación con mesa
    table = models.ForeignKey(Table, on_delete=models.PROTECT, related_name='orders')
    pedido = models.TextField(help_text="Detalle (items) del pedido")
    cliente = models.CharField(max_length=200, blank=True, null=True)
    cantidad = models.PositiveIntegerField(default=1)
    nota = models.TextField(blank=True, null=True)
    preparacion_enlazada = models.CharField(max_length=100, blank=True, null=True, help_text="opcional: id de orden en cocina")
    estado = models.CharField(max_length=50, default='pendiente', help_text="pendiente, servido, pagado")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.order_id} - {self.table} ({self.estado})"
