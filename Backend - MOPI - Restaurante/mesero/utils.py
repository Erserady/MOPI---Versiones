import hashlib
import json
import unicodedata
import uuid

from django.utils import timezone

# Categorías y palabras clave que NO pasan por cocina (bebidas, cigarros, etc.)
CATEGORY_EXCLUDE_LIST = [
    "enlatados y desechables",
    "licores importados",
    "cerveza nacional",
    "cerveza internacional",
    "cigarros",
    "ron nacional",
]

PRODUCT_NAME_KEYWORDS = [
    "cerveza",
    "beer",
    "corona",
    "modelo",
    "heineken",
    "budweiser",
    "miller",
    "stella",
    "victoria",
    "whisky",
    "whiskey",
    "vodka",
    "tequila",
    "ron",
    "rum",
    "gin",
    "brandy",
    "cognac",
    "walker",
    "jack daniels",
    "johnnie",
    "buchanans",
    "chivas",
    "baileys",
    "centenario",
    "herradura",
    "don julio",
    "patron",
    "jose cuervo",
    "absolut",
    "smirnoff",
    "bacardi",
    "havana",
    "zacapa",
    "belmont",
    "refresco",
    "soda",
    "coca",
    "pepsi",
    "sprite",
    "fanta",
    "squirt",
    "agua",
    "water",
    "jugo",
    "juice",
    "limonada",
    "naranjada",
    "botella",
    "bottle",
    "lata",
    "can",
    "oz",
    "litro",
    "lt",
    "ml",
    "cigarro",
    "cigar",
    "tabaco",
    "marlboro",
    "camel",
    "desechable",
    "enlatado",
    "hi-c",
    "del valle",
]


def _normalize_text(value):
    if not value:
        return ""
    return (
        unicodedata.normalize("NFD", str(value))
        .encode("ascii", "ignore")
        .decode("ascii")
        .strip()
        .lower()
    )


def _matches_any_category(value):
    normalized = _normalize_text(value)
    return normalized in CATEGORY_EXCLUDE_LIST


def _contains_any_keyword(name):
    normalized = _normalize_text(name)
    return any(keyword in normalized for keyword in PRODUCT_NAME_KEYWORDS)


def is_cookable_item(item):
    """
    Determina si un item debe pasar por cocina.
    Basado en categoría o keywords del nombre.
    """
    if not isinstance(item, dict):
        return True

    category_candidates = [
        item.get("categoria"),
        item.get("category"),
        item.get("dishCategory"),
        item.get("tipo"),
        item.get("type"),
    ]
    if any(_matches_any_category(cat) for cat in category_candidates if cat):
        return False

    name = item.get("nombre") or item.get("name") or item.get("dishName") or ""
    if _contains_any_keyword(name):
        return False

    return True


def parse_items(raw):
    """
    Convierte el campo pedido (string JSON o lista) en lista de items.
    """
    if not raw:
        return []
    if isinstance(raw, list):
        return raw
    if isinstance(raw, str):
        try:
            data = json.loads(raw)
            return data if isinstance(data, list) else []
        except (TypeError, ValueError):
            return []
    return []


def normalize_order_items(raw_items, reset_ready=False, stable=False, stable_seed=None):
    """
    Asegura que cada item tenga:
    - item_uid único
    - banderas preparable_en_cocina (True/False) y listo_en_cocina (solo se obliga en cocinables)
    Si reset_ready=True, reinicia listo_en_cocina=False para los cocinables.
    """
    items = parse_items(raw_items)
    normalized = []
    for idx, item in enumerate(items):
        base = item if isinstance(item, dict) else {}
        item_uid = (
            base.get("item_uid")
            or base.get("uid")
            or base.get("id")
        )
        if not item_uid:
            if stable:
                fingerprint = f"{base.get('nombre') or base.get('name')}-{base.get('nota') or base.get('description') or ''}-{base.get('categoria') or base.get('category') or ''}-{idx}-{stable_seed or ''}"
                digest = hashlib.sha1(fingerprint.encode("utf-8")).hexdigest()[:16]
                item_uid = f"itm-{digest}"
            else:
                item_uid = f"itm-{uuid.uuid4().hex}"

        cookable = base.get("preparable_en_cocina")
        if cookable is None:
            cookable = is_cookable_item(base)

        ready_flag = base.get("listo_en_cocina")
        if cookable:
            ready = False if reset_ready else bool(ready_flag)
        else:
            # Bebidas/otros no cocinables se consideran listos para no bloquear
            ready = True if ready_flag is None else bool(ready_flag)

        normalized_item = {
            **base,
            "item_uid": str(item_uid),
            "preparable_en_cocina": bool(cookable),
            "listo_en_cocina": bool(ready),
        }
        normalized.append(normalized_item)
    return normalized


def serialize_normalized_items(raw_items, reset_ready=False):
    """
    Normaliza y devuelve el JSON listo para almacenarse en WaiterOrder.pedido
    """
    normalized = normalize_order_items(raw_items, reset_ready=reset_ready)
    return json.dumps(normalized)


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
