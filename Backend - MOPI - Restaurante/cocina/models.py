from django.db import models

class Order(models.Model):
    ESTADOS = [
        ('pendiente', 'Pendiente'),
        ('en_preparacion', 'En preparación'),
        ('listo', 'Listo'),
        ('entregado', 'Entregado'),
    ]

    pedido_id = models.CharField(max_length=100, unique=True)
    orden = models.TextField(help_text="Detalle de la orden (ingredientes, notas)")
    plato = models.CharField(max_length=200)
    estado = models.CharField(max_length=50, choices=ESTADOS, default='pendiente', help_text="Estado del pedido")
    preparacion = models.TextField(blank=True, null=True, help_text="Detalles de preparación")
    tiempo_estimado = models.IntegerField(default=0, help_text="Tiempo estimado en minutos")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.pedido_id} - {self.plato} ({self.estado})"
