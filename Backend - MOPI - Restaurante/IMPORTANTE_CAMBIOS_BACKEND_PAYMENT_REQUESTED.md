# 🚨 CAMBIOS URGENTES NECESARIOS EN BACKEND

## Problema Identificado

Cuando el mesero solicita la cuenta (estado `payment_requested`), las órdenes **desaparecen del panel de caja** porque el backend no las incluye en la respuesta del endpoint `/api/caja/mesas-pendientes/`.

## ¿Por qué es crítico?

1. El mesero solicita la cuenta
2. El estado cambia a `payment_requested`
3. ❌ La orden desaparece de caja
4. ❌ El cajero NO puede ver que se solicitó la cuenta
5. ❌ No puede enviar la pre-factura al mesero
6. ❌ El flujo se rompe

## Solución Requerida

El endpoint `/api/caja/mesas-pendientes/` debe incluir órdenes con los siguientes estados:

```python
# ESTADOS QUE CAJA DEBE VER:
ESTADOS_VISIBLES_CAJA = [
    'listo',                  # Listo de cocina
    'entregado',             # Entregado a la mesa
    'servido',               # Servido al cliente
    'payment_requested',     # ← NUEVO: Cliente solicitó cuenta
    'prefactura_enviada',    # ← NUEVO: Pre-factura enviada al mesero
]

# ESTADOS QUE CAJA NO DEBE VER:
ESTADOS_OCULTOS_CAJA = [
    'pendiente',             # Aún no confirmado
    'en_preparacion',        # Cocinando
    'pagado',                # Ya pagado y cerrado
    'facturado',             # Ya facturado
]
```

## Ubicación del Archivo a Modificar

**Archivo:** `mesero/views.py` o `caja/views.py` (donde esté el endpoint `mesas-pendientes`)

## Código Actual (Probablemente)

```python
@api_view(['GET'])
def mesas_con_ordenes_pendientes(request):
    # Actualmente probablemente excluye payment_requested
    ordenes = WaiterOrder.objects.filter(
        estado__in=['listo', 'entregado', 'servido']  # ← Falta payment_requested
    ).exclude(
        estado='pagado'
    )
    # ...
```

## Código Corregido (USAR ESTO)

```python
@api_view(['GET'])
def mesas_con_ordenes_pendientes(request):
    """
    Endpoint para obtener mesas con órdenes pendientes de pago.
    Incluye órdenes con cuenta solicitada (payment_requested) para que
    el cajero pueda enviar la pre-factura al mesero.
    """
    # Estados que caja debe ver
    ESTADOS_VISIBLES = [
        'listo',
        'entregado',
        'servido',
        'payment_requested',      # ← AGREGADO
        'prefactura_enviada',     # ← AGREGADO
    ]
    
    ordenes = WaiterOrder.objects.filter(
        estado__in=ESTADOS_VISIBLES
    ).exclude(
        estado__in=['pagado', 'facturado', 'cancelado']
    ).select_related('mesa').prefetch_related('items')
    
    # Agrupar por mesa
    mesas_dict = {}
    for orden in ordenes:
        mesa_id = orden.mesa_id
        if mesa_id not in mesas_dict:
            mesas_dict[mesa_id] = {
                'mesa_id': mesa_id,
                'mesa_nombre': f'Mesa {orden.mesa.number if orden.mesa else mesa_id}',
                'ordenes_pendientes': []
            }
        
        mesas_dict[mesa_id]['ordenes_pendientes'].append({
            'id': orden.id,
            'order_id': orden.order_id,
            'pedido': orden.pedido,
            'estado': orden.estado,  # ← Importante: incluir el estado
            'waiter_name': orden.waiter_name or 'Sin asignar',
            'created_at': orden.created_at,
        })
    
    return Response(list(mesas_dict.values()))
```

## Verificación

Después de hacer estos cambios, verifica:

1. ✅ Crear una orden y ponerla en estado `servido`
2. ✅ Mesero solicita cuenta (estado → `payment_requested`)
3. ✅ **La orden sigue visible en el panel de caja**
4. ✅ Cajero puede ver el detalle
5. ✅ Cajero puede hacer click en "Enviar Pre-factura al Mesero"
6. ✅ Estado cambia a `prefactura_enviada`
7. ✅ **La orden sigue visible en caja hasta que se pague**

## Estados Agregados al Modelo (si no existen)

Asegurate de que el modelo `WaiterOrder` tenga estos estados en sus choices:

```python
# En mesero/models.py

ESTADO_CHOICES = [
    ('pendiente', 'Pendiente'),
    ('en_preparacion', 'En Preparación'),
    ('listo', 'Listo'),
    ('entregado', 'Entregado'),
    ('servido', 'Servido'),
    ('payment_requested', 'Cuenta Solicitada'),      # ← AGREGAR
    ('prefactura_enviada', 'Pre-factura Enviada'),   # ← AGREGAR
    ('pagado', 'Pagado'),
    ('facturado', 'Facturado'),
]

class WaiterOrder(models.Model):
    estado = models.CharField(
        max_length=30,
        choices=ESTADO_CHOICES,
        default='pendiente'
    )
    # ... resto de campos
```

## Migración Necesaria

Si agregaste los nuevos estados, crea y aplica la migración:

```bash
cd "Backend - MOPI - Restaurante"
python manage.py makemigrations
python manage.py migrate
```

## Prueba Completa del Flujo

1. **Mesero:**
   - Crea orden → servido
   - Click "Solicitar Cuenta"
   - Estado → `payment_requested`

2. **Caja:**
   - ✅ Ve la orden en "Pedidos Listos para Pagar"
   - Click en la orden
   - ✅ Ve botón "Enviar Pre-factura al Mesero"
   - Click en el botón
   - Estado → `prefactura_enviada`

3. **Mesero:**
   - Ve orden con estado "📋 Pre-factura Enviada"
   - Click en "Ver Pre-factura"
   - ✅ Ve el detalle de la cuenta

4. **Caja:**
   - ✅ La orden sigue visible
   - Procesa el pago normalmente
   - Estado → `pagado`

## Contacto

Si tienes dudas sobre estos cambios, pregunta. Es **crítico** que las órdenes con `payment_requested` sean visibles en caja.
