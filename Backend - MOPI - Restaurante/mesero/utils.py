from django.utils import timezone


def sync_cocina_timestamp(order, previous_state=None):
    """
    Actualiza el timestamp en el que una orden entró a cocina.
    - Se establece cuando la orden pasa a 'en_preparacion' por primera vez.
    - Se reinicia únicamente si la orden vuelve al estado 'pendiente'.
    """
    if order.estado == 'en_preparacion':
        if order.en_cocina_since is None:
            order.en_cocina_since = timezone.now()
            order.save(update_fields=['en_cocina_since'])
    elif order.estado == 'pendiente':
        if order.en_cocina_since is not None and previous_state == 'en_preparacion':
            order.en_cocina_since = None
            order.save(update_fields=['en_cocina_since'])
