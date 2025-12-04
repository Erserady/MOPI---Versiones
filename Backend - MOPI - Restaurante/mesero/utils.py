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


def _safe_price(value):
    try:
        return f"{float(value):.2f}"
    except (TypeError, ValueError):
        return ""


def _extract_qty(item):
    for key in ("cantidad", "quantity", "dishQuantity", "qty"):
        if key in item:
            try:
                return int(item.get(key) or 0)
            except (TypeError, ValueError):
                continue
    return 0


def _item_content_key(item):
    """
    Llave deterministica basada en contenido (nombre/precio/nota/categoria),
    sirve para empatar items aunque el payload no traiga item_uid.
    """
    if not isinstance(item, dict):
        return None

    name = _normalize_text(
        item.get("nombre") or item.get("name") or item.get("dishName")
    )
    note = _normalize_text(
        item.get("nota") or item.get("note") or item.get("description")
    )
    category = _normalize_text(
        item.get("categoria") or item.get("category") or item.get("dishCategory")
    )
    price = _safe_price(item.get("precio") or item.get("price") or item.get("unitPrice"))

    return f"{name}|{price}|{note}|{category}"


def _item_keys(item):
    """
    Devuelve posibles llaves para el item: uid si existe y llave de contenido.
    """
    keys = []
    if not isinstance(item, dict):
        return keys

    uid = item.get("item_uid") or item.get("uid") or item.get("id")
    if uid:
        keys.append(f"uid:{uid}")

    content_key = _item_content_key(item)
    if content_key:
        keys.append(f"content:{content_key}")

    return keys


def merge_items_preserving_ready(new_items_raw, previous_items_raw, stable_seed=None, previous_state=None):
    """
    Combina los items nuevos con los existentes conservando item_uid y listo_en_cocina
    cuando el platillo ya estaba listo y la cantidad no incrementa.
    - Si la orden estaba marcada como lista/entregada y se agregan platillos nuevos,
      los platillos antiguos se marcan para omitirse en cocina (no deben re-aparecer).
    """
    new_items = parse_items(new_items_raw)
    if not new_items:
        return serialize_normalized_items(new_items_raw, reset_ready=True)

    previous_items = normalize_order_items(previous_items_raw, stable=True, stable_seed=stable_seed)
    previous_map = {}
    for prev in previous_items:
        for key in _item_keys(prev):
            if key:
                previous_map[key] = prev

    omit_previous_ready = previous_state in ("listo", "entregado", "servido")

    merged_items = []
    for item in new_items:
        base = item if isinstance(item, dict) else {}
        merged = {**base}

        prev = None
        for key in _item_keys(base):
            if key in previous_map:
                prev = previous_map[key]
                break

        if prev:
            prev_qty = _extract_qty(prev)
            new_qty = _extract_qty(base)
            uid_val = prev.get("item_uid") or prev.get("uid") or prev.get("id")
            if uid_val:
                merged.setdefault("item_uid", str(uid_val))

            if prev.get("listo_en_cocina"):
                # Si la cantidad no aumenta, mantener listo_en_cocina
                if prev_qty <= 0 or prev_qty >= new_qty:
                    merged["listo_en_cocina"] = True

            # Si reabrimos una orden previamente lista/entregada, ocultar platillos ya listos en cocina
            if omit_previous_ready and prev.get("listo_en_cocina"):
                merged["omit_in_kitchen"] = True

        merged_items.append(merged)

    normalized = normalize_order_items(
        merged_items,
        reset_ready=False,
        stable=True,
        stable_seed=stable_seed,
    )
    return json.dumps(normalized)


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
