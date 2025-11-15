import { useImmer } from "use-immer";
import { useState, useEffect, useMemo, useCallback } from "react";
import DishTable from "./DishTable";
import { getPlatos, getCategorias } from "../../../services/adminMenuService";
import { createOrden, getOrdenes, updateOrden } from "../../../services/waiterService";
import { useNotification } from "../../../hooks/useNotification";
import Notification from "../../../common/Notification";
import { RefreshCw } from "lucide-react";
import { useLocation, useParams } from "react-router-dom";

const ACTIVE_ORDER_STATUSES = ["pendiente", "en_preparacion", "listo"];

const buildIdentifierList = (values = []) =>
  Array.from(
    new Set(
      values
        .filter((value) => value !== undefined && value !== null)
        .map((value) => value.toString())
    )
  );

const mapPedidoItemsToCartShape = (rawItems = []) => {
  if (!rawItems) return [];
  let base = rawItems;

  if (typeof rawItems === "string") {
    try {
      base = JSON.parse(rawItems);
    } catch (error) {
      console.warn("No se pudo parsear el pedido existente:", error);
      return [];
    }
  }

  if (!Array.isArray(base)) return [];

  return base.map((item, index) => {
    const rawQty = item?.dishQuantity ?? item?.cantidad ?? item?.quantity ?? 1;
    const quantity = Number.isFinite(Number(rawQty)) ? Number(rawQty) : 0;
    const rawPrice = item?.unitPrice ?? item?.precio ?? item?.price ?? 0;
    const unitPrice = Number.isFinite(Number(rawPrice)) ? Number(rawPrice) : 0;

    return {
      dishId: item?.dishId || item?.id || `existing-${index}`,
      dishName: item?.dishName || item?.nombre || item?.name || "Platillo",
      dishCategory: item?.dishCategory || item?.categoria || item?.category || null,
      dishQuantity: quantity,
      unitPrice,
      subtotal: unitPrice * quantity,
      description: item?.description || item?.nota || "",
    };
  });
};

const serializeCartItems = (items = []) =>
  items.map((item) => ({
    nombre: item.dishName,
    cantidad: item.dishQuantity,
    precio: item.unitPrice,
    nota: item.description,
    categoria: item.dishCategory || item.category || null,
  }));

const sumSubtotals = (items = []) =>
  items.reduce((acc, item) => {
    const fallback =
      (Number(item.unitPrice) || 0) * (Number(item.dishQuantity) || 0);
    return acc + (Number(item.subtotal) || fallback);
  }, 0);

const sumSerializedQuantities = (items = []) =>
  items.reduce((acc, item) => acc + (Number(item.cantidad) || 0), 0);

const sumSerializedTotals = (items = []) =>
  items.reduce((acc, item) => {
    const price = Number(item.precio) || 0;
    const qty = Number(item.cantidad) || 0;
    return acc + price * qty;
  }, 0);

const normalizeStatus = (value) => {
  if (typeof value === "string") {
    return value.toLowerCase();
  }
  return value ?? "";
};

const HandleOrder = ({
  mesaId: mesaIdProp,
  displayNumber: displayNumberProp,
  initialOrder = null,
}) => {
  const { tableNumber: routeTableParam } = useParams();
  const location = useLocation();
  const mesaId = mesaIdProp || location.state?.mesaId || routeTableParam;
  const displayNumber =
    displayNumberProp ||
    location.state?.tableNumber ||
    routeTableParam ||
    mesaId ||
    "?";

  const [menu, setMenu] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useImmer([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingOrder, setExistingOrder] = useState(initialOrder || null);
  const [existingItems, setExistingItems] = useState(() =>
    initialOrder
      ? mapPedidoItemsToCartShape(initialOrder.pedido || initialOrder.items)
      : []
  );
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState(null);
  const { showNotification, notification } = useNotification();

  const mesaIdentifierList = useMemo(
    () =>
      buildIdentifierList([
        mesaId,
        displayNumber,
        mesaIdProp,
        displayNumberProp,
        routeTableParam,
        location.state?.mesaId,
        location.state?.tableNumber,
      ]),
    [
      mesaId,
      displayNumber,
      mesaIdProp,
      displayNumberProp,
      routeTableParam,
      location.state?.mesaId,
      location.state?.tableNumber,
    ]
  );

  useEffect(() => {
    if (initialOrder) {
      setExistingOrder(initialOrder);
      setExistingItems(
        mapPedidoItemsToCartShape(initialOrder.pedido || initialOrder.items)
      );
    }
  }, [initialOrder]);

  const fetchExistingOrder = useCallback(async () => {
    if (mesaIdentifierList.length === 0) return;
    try {
      setOrderLoading(true);
      const orders = await getOrdenes();
      const ordersArray = Array.isArray(orders) ? orders : [];

      const match = ordersArray.find((orden) => {
        const status = normalizeStatus(orden?.estado);
        if (!ACTIVE_ORDER_STATUSES.includes(status)) {
          return false;
        }
        const identifiers = buildIdentifierList([
          orden?.table,
          orden?.mesa_id,
          orden?.mesa,
          orden?.mesa_label,
          orden?.tableNumber,
        ]);
        return identifiers.some((id) => mesaIdentifierList.includes(id));
      });

      if (match) {
        setExistingOrder(match);
        setExistingItems(
          mapPedidoItemsToCartShape(match.pedido || match.items)
        );
        setOrderError(null);
      } else {
        setExistingOrder(null);
        setExistingItems([]);
      }
    } catch (error) {
      console.error("Error cargando pedido existente:", error);
      setOrderError(error.message || "No se pudo cargar el pedido actual.");
    } finally {
      setOrderLoading(false);
    }
  }, [mesaIdentifierList]);

  useEffect(() => {
    fetchExistingOrder();
  }, [fetchExistingOrder]);

  useEffect(() => {
    const loadMenuData = async () => {
      try {
        setLoading(true);
        const [catData, platosData] = await Promise.all([
          getCategorias(),
          getPlatos(),
        ]);

        setCategories(catData.map((c) => c.nombre));
        setActiveCategory(catData[0]?.nombre || null);

        const menuFormateado = platosData.map((plato) => ({
          id: plato.id,
          name: plato.nombre,
          category: plato.categoria_nombre || plato.categoria,
          price: parseFloat(plato.precio || 0),
          available: plato.disponible !== false,
          description: plato.descripcion || "",
        }));

        setMenu(menuFormateado);
      } catch (error) {
        console.error("Error cargando menu:", error);
      } finally {
        setLoading(false);
      }
    };

    loadMenuData();
  }, []);

  const filteredMenu = menu.filter((dish) => dish.category === activeCategory);

  const handleAddToCart = (dish) => {
    setCartItems((draft) => {
      const existing = draft.find((item) => item.dishId === dish.id);
      if (existing) {
        existing.dishQuantity += 1;
        existing.subtotal = existing.dishQuantity * existing.unitPrice;
      } else {
        draft.push({
          dishId: dish.id,
          dishName: dish.name,
          dishCategory: dish.category,
          dishStatus: "Pendiente",
          dishQuantity: 1,
          unitPrice: dish.price,
          subtotal: dish.price,
          cost: dish.price * 0.7,
          description: dish.description || "",
          createTime: new Date().toISOString(),
        });
      }
    });
  };

  const handleRemoveFromCart = (dish) => {
    setCartItems((draft) => {
      const index = draft.findIndex((item) => item.dishId === dish.dishId);
      if (index !== -1) draft.splice(index, 1);
    });
  };

  const handleComment = (dish) => {
    const comment = prompt(`Agrega un comentario para "${dish.dishName}":`);
    if (comment !== null) {
      setCartItems((draft) => {
        const item = draft.find((i) => i.dishId === dish.dishId);
        if (item) item.description = comment;
      });
    }
  };

  const handleQuantityChange = (index, delta) => {
    setCartItems((draft) => {
      const item = draft[index];
      if (!item) return;
      const newQty = item.dishQuantity + delta;
      if (newQty < 1) return;
      item.dishQuantity = newQty;
      item.subtotal = item.dishQuantity * item.unitPrice;
    });
  };

  const existingTotal = sumSubtotals(existingItems);
  const newItemsTotal = sumSubtotals(cartItems);
  const projectedTotal = existingTotal + newItemsTotal;

  const handleConfirmOrder = async () => {
    if (cartItems.length === 0) {
      showNotification({
        type: "warning",
        title: existingOrder ? "Sin nuevos platillos" : "Carrito vacio",
        message: existingOrder
          ? "Agrega al menos un platillo nuevo antes de actualizar el pedido."
          : "Agrega al menos un platillo antes de confirmar la orden.",
        duration: 3000,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const newItemsPayload = serializeCartItems(cartItems);

      if (existingOrder) {
        const baseItemsPayload = serializeCartItems(existingItems);
        const mergedItems = [...baseItemsPayload, ...newItemsPayload];
        const mergedQuantity = sumSerializedQuantities(mergedItems);
        const mergedTotal = sumSerializedTotals(mergedItems);
        const recordId = existingOrder.id || existingOrder.order_id;

        if (!recordId) {
          throw new Error("No se encontro el identificador de la orden actual.");
        }

        const updatePayload = {
          order_id: existingOrder.order_id || existingOrder.id,
          mesa_id: existingOrder.mesa_id || mesaId,
          pedido: JSON.stringify(mergedItems),
          cantidad: mergedQuantity,
          nota: `Total: C$${mergedTotal.toFixed(2)}`,
          estado: existingOrder.estado || "pendiente",
        };

        await updateOrden(recordId, updatePayload);

        showNotification({
          type: "success",
          title: "Pedido actualizado",
          message: `Se agregaron ${newItemsPayload.length} platillos para la mesa ${displayNumber}. Total proyectado: C$${mergedTotal.toFixed(2)}`,
          duration: 5000,
        });
      } else {
        const safeMesaId = mesaId || routeTableParam || "MESA-UNKNOWN";
        const totalQuantity = sumSerializedQuantities(newItemsPayload);
        const newOrderTotal = sumSerializedTotals(newItemsPayload);
        const orderData = {
          order_id: `ORD-${Date.now()}`,
          mesa_id: safeMesaId,
          pedido: JSON.stringify(newItemsPayload),
          cantidad: totalQuantity,
          nota: `Total: C$${newOrderTotal.toFixed(2)}`,
          estado: "pendiente",
        };

        const response = await createOrden(orderData);

        showNotification({
          type: "success",
          title: "Orden confirmada",
          message: `Orden #${response.order_id} creada para Mesa ${displayNumber}. Total: C$${newOrderTotal.toFixed(2)}`,
          duration: 5000,
        });
      }

      setCartItems([]);
      await fetchExistingOrder();
    } catch (error) {
      console.error("Error al confirmar orden:", error);
      showNotification({
        type: "error",
        title: existingOrder ? "Error al actualizar orden" : "Error al crear orden",
        message: error.message || "No se pudo procesar la orden. Intenta nuevamente.",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "3rem" }}>
        <RefreshCw className="spin" size={40} />
        <p style={{ marginTop: "1rem", color: "#6b7280" }}>Cargando menu...</p>
      </div>
    );
  }

  const confirmButtonLabel = existingOrder
    ? "Actualizar pedido"
    : "Confirmar orden";

  return (
    <>
      <h3>
        Mesa {displayNumber || "?"} | Pedido actual: C$
        {existingTotal.toFixed(2)}
      </h3>
      <p style={{ color: "#6b7280", marginBottom: "1rem" }}>
        Nuevos platillos: C${newItemsTotal.toFixed(2)} · Total proyectado: C$
        {projectedTotal.toFixed(2)}
      </p>

      <section className="category-dishes">
        <h3>Pedido actual</h3>
        <div className="table-container">
          {orderLoading ? (
            <div style={{ textAlign: "center", padding: "1.5rem" }}>
              <RefreshCw className="spin" size={28} />
              <p style={{ marginTop: "0.5rem", color: "#6b7280" }}>
                Consultando pedido...
              </p>
            </div>
          ) : existingItems.length > 0 ? (
            <DishTable
              utility="summary"
              data={existingItems}
              headers={["Platillo", "Cantidad", "Notas", "Subtotal"]}
            />
          ) : (
            <p className="no-dishes">
              Esta mesa aun no tiene platillos registrados.
            </p>
          )}
          {orderError && (
            <p style={{ color: "#b91c1c", marginTop: "0.5rem" }}>{orderError}</p>
          )}
        </div>
      </section>

      <div className="custom-order-container">
        <h3>Selecciona la categoria</h3>
        <div className="categories-menu">
          {categories.map((category) => (
            <button
              key={category}
              className={`category-btn ${
                activeCategory === category ? "active" : ""
              }`}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
        <p className="category-tip">Tip: Desliza para cambiar de categoria.</p>
      </div>

      <section className="category-dishes">
        <h3 className="category-title">Categoria: {activeCategory}</h3>
        <div className="table-container">
          {filteredMenu.length > 0 ? (
            <DishTable
              utility="addorder"
              data={filteredMenu}
              onAdd={handleAddToCart}
              headers={["Nombre", "Precio", "Agregar"]}
            />
          ) : (
            <p className="no-dishes">No hay platos en esta categoria.</p>
          )}
        </div>
      </section>

      <section className="category-dishes">
        <h3>Platillos por agregar</h3>
        <div className="table-container">
          {cartItems.length > 0 ? (
            <DishTable
              utility="buycar"
              data={cartItems}
              onQuantityChange={handleQuantityChange}
              onRemove={handleRemoveFromCart}
              onComment={handleComment}
              headers={["Nombre", "Cantidad", "Subtotal", "Acciones"]}
            />
          ) : (
            <p className="no-dishes">Aun no hay platillos agregados.</p>
          )}
        </div>
      </section>

      {cartItems.length > 0 && (
        <button
          className="confirm-btn"
          onClick={handleConfirmOrder}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Procesando..." : confirmButtonLabel}
        </button>
      )}

      {notification && (
        <Notification
          type={notification.type}
          title={notification.title}
          message={notification.message}
          onClose={notification.onClose}
        />
      )}
    </>
  );
};

export default HandleOrder;
