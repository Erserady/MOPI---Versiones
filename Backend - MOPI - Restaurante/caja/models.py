from django.db import models
from mesero.models import Table, WaiterOrder
from users.models import User

class Caja(models.Model):
    ESTADOS_CAJA = [
        ('abierta', 'Abierta'),
        ('cerrada', 'Cerrada'),
    ]
    
    numero_caja = models.CharField(max_length=50, unique=True)
    estado = models.CharField(max_length=20, choices=ESTADOS_CAJA, default='cerrada')
    saldo_inicial = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    saldo_actual = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    usuario_apertura = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='cajas_apertura'
    )
    fecha_apertura = models.DateTimeField(auto_now_add=True)
    fecha_cierre = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"Caja {self.numero_caja} - {self.estado}"

class Factura(models.Model):
    ESTADOS_FACTURA = [
        ('pendiente', 'Pendiente'),
        ('pagada', 'Pagada'),
        ('anulada', 'Anulada'),
    ]
    
    METODOS_PAGO = [
        ('efectivo', 'Efectivo'),
        ('tarjeta', 'Tarjeta'),
        ('transferencia', 'Transferencia'),
    ]
    
    # Relación con la mesa y órdenes
    table = models.ForeignKey(Table, on_delete=models.SET_NULL, null=True, blank=True, related_name='facturas')
    orders = models.ManyToManyField(WaiterOrder, related_name='facturas')
    caja = models.ForeignKey(Caja, on_delete=models.PROTECT, related_name='facturas')
    
    # Información de la factura
    numero_factura = models.CharField(max_length=100, unique=True)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    impuestos = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    metodo_pago = models.CharField(max_length=20, choices=METODOS_PAGO, blank=True, null=True)
    estado = models.CharField(max_length=20, choices=ESTADOS_FACTURA, default='pendiente')
    
    # Auditoría
    creado_por = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        mesa_info = self.table.mesa_id if self.table else 'Sin mesa'
        return f"Factura {self.numero_factura} - Mesa {mesa_info} - ${self.total}"

class Pago(models.Model):
    factura = models.ForeignKey(Factura, on_delete=models.CASCADE, related_name='pagos')
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    metodo_pago = models.CharField(max_length=20, choices=Factura.METODOS_PAGO)
    referencia = models.CharField(max_length=100, blank=True, null=True)
    caja = models.ForeignKey(Caja, on_delete=models.PROTECT, related_name='pagos')
    creado_por = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Pago ${self.monto} - {self.metodo_pago} - Factura {self.factura.numero_factura}"

class CierreCaja(models.Model):
    caja = models.ForeignKey(Caja, on_delete=models.PROTECT, related_name='cierres')
    fecha_cierre = models.DateTimeField(auto_now_add=True)
    saldo_final = models.DecimalField(max_digits=10, decimal_places=2)
    saldo_teorico = models.DecimalField(max_digits=10, decimal_places=2)
    diferencia = models.DecimalField(max_digits=10, decimal_places=2)
    total_efectivo = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_tarjeta = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_transferencia = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    observaciones = models.TextField(blank=True, null=True)
    cerrado_por = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    
    def __str__(self):
        return f"Cierre {self.caja.numero_caja} - {self.fecha_cierre.date()}"

    def calcular_totales(self):
        # Calcular totales por método de pago solo de esta sesión de caja
        # Filtra pagos desde la apertura hasta el cierre
        from django.db.models import Sum
        
        # Obtener fecha de apertura de la caja
        fecha_apertura = self.caja.fecha_apertura
        
        # Filtrar pagos entre apertura y cierre de esta sesión
        pagos = self.caja.pagos.filter(
            created_at__gte=fecha_apertura,
            created_at__lte=self.fecha_cierre
        )
        
        # Calcular totales por método de pago
        self.total_efectivo = pagos.filter(metodo_pago='efectivo').aggregate(
            total=Sum('monto')
        )['total'] or 0
        
        self.total_tarjeta = pagos.filter(metodo_pago='tarjeta').aggregate(
            total=Sum('monto')
        )['total'] or 0
        
        self.total_transferencia = pagos.filter(metodo_pago='transferencia').aggregate(
            total=Sum('monto')
        )['total'] or 0
        
        self.save()

class Egreso(models.Model):
    """Modelo para registrar egresos de efectivo de la caja"""
    caja = models.ForeignKey(Caja, on_delete=models.PROTECT, related_name='egresos')
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    comentario = models.TextField()
    creado_por = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Egreso C${self.monto} - {self.caja.numero_caja} - {self.created_at.date()}"
