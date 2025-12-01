import { useImmer } from "use-immer";
import { useState, useEffect, useMemo, useCallback } from "react";
import DishTable from "./DishTable";
import { getPlatos } from "../../../services/adminMenuService";
import {
  createOrden,
  getOrdenes,
  updateOrden,
  requestRemoveItem,
  getOrderRemoveRequests,
} from "../../../services/waiterService";
import { useNotification } from "../../../hooks/useNotification";
import Notification from "../../../common/Notification";
import CommentModal from "./CommentModal";
import { RefreshCw, ChefHat, Search, Filter, X, Lock } from "lucide-react";
import { useLocation, useParams } from "react-router-dom";
import { getCurrentUserId, getCurrentUserName } from "../../../utils/auth";
import RemoveItemModal from "./RemoveItemModal";

const APPENDABLE_ORDER_STATUSES = [
  "pendiente",
  "en_preparacion",
  "listo",
  "entregado",
  "servido",
  "payment_requested",
  "prefactura_enviada",
];

const DISPLAYABLE_ORDER_STATUSES = [...APPENDABLE_ORDER_STATUSES];

const categoryEmojis = {
  "LICORES IMPORTADOS": "🍾",
  "CERVEZA NACIONAL": "🍺",
  "CERVEZA INTERNACIONAL": "🌍",
  "COCTAILS Y VINOS": "🍷",
  "RON NACIONAL": "🥃",
  "ENLATADOS Y DESECHABLES": "🧃",
  "CARNE DE RES": "🥩",
  "CARNE BLANCA": "🍗",
  "CARNE DE CERDO": "🐖",
  "CARNE DE MONTE Y ENSALADAS": "🥗",
  "MARISCOS": "🦐",
  "COCTELES": "🍤",
  "SOPAS": "🍲",
  "VARIADOS": "🍽",
  "CIGARROS": "🚬",
  "EXTRAS": "✨",
};

const categoryHierarchy = [
  {
    main: "🍹 Bebidas Alcohólicas",
    subcategories: [
      "LICORES IMPORTADOS",
      "CERVEZA NACIONAL",
      "CERVEZA INTERNACIONAL",
      "COCTAILS Y VINOS",
      "RON NACIONAL",
    ],
  },
  {
    main: "🥤 Bebidas No Alcohólicas",
    subcategories: ["ENLATADOS Y DESECHABLES"],
  },
  {
    main: "🍖 Carnes",
    subcategories: [
      "CARNE DE RES",
      "CARNE BLANCA",
      "CARNE DE CERDO",
      "CARNE DE MONTE Y ENSALADAS",
      "MARISCOS",
    ],
  },
  {
    main: "🍽 Comidas / Variados",
    subcategories: ["COCTELES", "SOPAS", "VARIADOS"],
  },
  {
    main: "🍪 Otros",
    subcategories: ["CIGARROS", "EXTRAS"],
  },
];

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
      dishCategory:
        item?.dishCategory || item?.categoria || item?.category || null,
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
    nota: item.description?.trim() || "",
    categoria: item.dishCategory || item.category || null,
  }));

// Agrupa items iguales (nombre + precio + nota) sumando cantidades/subtotales
const aggregateItems = (items = []) => {
  const map = new Map();
  items.forEach((item, idx) => {
    const name = (item.dishName || item.nombre || item.name || "Platillo").trim();
    const price = Number(item.unitPrice ?? item.precio ?? item.price ?? 0) || 0;
    const note = (item.description || item.nota || "").trim();
    const key = `${name.toLowerCase()}|${price}|${note.toLowerCase()}`;
    const qty = Number(item.dishQuantity ?? item.cantidad ?? item.quantity ?? 0) || 0;
    const subtotal = Number(item.subtotal ?? price * qty) || 0;

    if (!map.has(key)) {
      map.set(key, {
        ...item,
        dishName: name,
        unitPrice: price,
        dishQuantity: qty,
        subtotal,
        description: note,
        _rawIndexes: [idx],
      });
    } else {
      const agg = map.get(key);
      agg.dishQuantity += qty;
      agg.subtotal += subtotal;
      agg._rawIndexes.push(idx);
    }
  });

  return Array.from(map.values()).map((item) => ({
    ...item,
    _rawIndex: item._rawIndexes[0],
  }));
};

// Agrupa items ya serializados (nombre/cantidad/precio/nota)
const mergeSerializedItems = (items = []) => {
  const map = new Map();
  items.forEach((item) => {
    const name = (item.nombre || item.name || "").trim();
    const price = Number(item.precio ?? item.price ?? 0) || 0;
    const note = (item.nota || item.note || "").trim();
    const key = `${name.toLowerCase()}|${price}|${note.toLowerCase()}`;
    const qty = Number(item.cantidad ?? item.quantity ?? 0) || 0;

    if (!map.has(key)) {
      map.set(key, {
        ...item,
        nombre: name,
        precio: price,
        cantidad: qty,
        nota: note,
      });
    } else {
      const agg = map.get(key);
      agg.cantidad += qty;
    }
  });
  return Array.from(map.values());
};

const toNumber = (value) => {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const sanitized = value.replace(/[^\d,.-]/g, "").replace(",", ".");
    const parsed = parseFloat(sanitized);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const sumSubtotals = (items = []) =>
  items.reduce((acc, item) => {
    const qty = toNumber(item.dishQuantity);
    const unit = toNumber(item.unitPrice ?? item.price);
    const subtotal = toNumber(item.subtotal);
    const effective = subtotal || unit * qty;
    return acc + effective;
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
  const currentWaiterId = getCurrentUserId();
  const mesaId = mesaIdProp || location.state?.mesaId || routeTableParam;
  const displayNumber =
    displayNumberProp ||
    location.state?.tableNumber ||
    routeTableParam ||
    mesaId ||
    "?";

  const [menu, setMenu] = useState([]);
  const [accessDenied, setAccessDenied] = useState(false);
  const [activeMainCategory, setActiveMainCategory] = useState(null);
  const [activeSubcategory, setActiveSubcategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useImmer([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingOrder, setExistingOrder] = useState(initialOrder || null);
  const [existingItems, setExistingItems] = useState(() =>
    initialOrder
      ? mapPedidoItemsToCartShape(initialOrder.pedido || initialOrder.items)
      : []
  );
  const [isExistingOrderReadOnly, setIsExistingOrderReadOnly] = useState(() =>
    initialOrder
      ? !APPENDABLE_ORDER_STATUSES.includes(
          normalizeStatus(initialOrder.estado)
        )
      : false
  );
  const [removeRequests, setRemoveRequests] = useState([]);
  const [removeHistoryLoading, setRemoveHistoryLoading] = useState(false);
  const [removeHistoryLoaded, setRemoveHistoryLoaded] = useState(false);
  const [removeHistoryOrderId, setRemoveHistoryOrderId] = useState(null);
  const [notifiedRejectedIds, setNotifiedRejectedIds] = useState(() => {
    try {
      const stored = sessionStorage.getItem("notifiedRejectedIds");
      const arr = stored ? JSON.parse(stored) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  });
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState(null);
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [commentModalDish, setCommentModalDish] = useState(null);
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [removeModalItem, setRemoveModalItem] = useState(null);
  const [removeModalIndex, setRemoveModalIndex] = useState(null);
  const { showNotification, hideNotification, notification } =
    useNotification();

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

  const loadRemoveRequests = useCallback(
    async (orderId) => {
      if (!orderId) {
        setRemoveRequests([]);
        setRemoveHistoryOrderId(null);
        setRemoveHistoryLoaded(false);
        return;
      }
      const shouldShowLoading =
        !removeHistoryLoaded || removeHistoryOrderId !== orderId;

      try {
        if (shouldShowLoading) {
          setRemoveHistoryLoading(true);
        }
        const response = await getOrderRemoveRequests(orderId);
        const list = Array.isArray(response) ? response : [];
        const rejected = list.filter(
          (req) => (req.estado || req.status || "").toLowerCase() === "rechazada"
        );
        // Notificar rechazos nuevos (única vez por request id)
        if (rejected.length > 0) {
          const newOnes = rejected.filter((r) => !notifiedRejectedIds.includes(r.id));
          if (newOnes.length > 0) {
            newOnes.forEach((r) => {
              showNotification({
                type: "error",
                title: "Solicitud rechazada",
                message: r.motivo_rechazo
                  ? `Motivo: ${r.motivo_rechazo}`
                  : "Tu solicitud de eliminación fue rechazada.",
                duration: 6000,
              });
            });
            const updated = [...notifiedRejectedIds, ...newOnes.map((r) => r.id)];
            setNotifiedRejectedIds(updated);
            try {
              sessionStorage.setItem("notifiedRejectedIds", JSON.stringify(updated));
            } catch (e) {
              // ignore storage errors
            }
          }
        }
        const visible = list.filter(
          (req) => (req.estado || req.status || "").toLowerCase() !== "rechazada"
        );
        setRemoveRequests(visible);
        setRemoveHistoryOrderId(orderId);
        setRemoveHistoryLoaded(true);
      } catch (err) {
        console.error("Error cargando historial de eliminaciones:", err);
      } finally {
        if (shouldShowLoading) {
          setRemoveHistoryLoading(false);
        }
      }
    },
    [removeHistoryLoaded, removeHistoryOrderId]
  );

  useEffect(() => {
    if (initialOrder) {
      setExistingOrder(initialOrder);
      setExistingItems(
        mapPedidoItemsToCartShape(initialOrder.pedido || initialOrder.items)
      );
      setIsExistingOrderReadOnly(
        !APPENDABLE_ORDER_STATUSES.includes(
          normalizeStatus(initialOrder.estado)
        )
      );
      const initOrderId = initialOrder.id || initialOrder.order_id;
      if (initOrderId) {
        loadRemoveRequests(initOrderId);
      }
    }
  }, [initialOrder, loadRemoveRequests]);

  // Reset notificaciones al cambiar de orden
  useEffect(() => {
    const currentOrderId = existingOrder?.id || existingOrder?.order_id;
    if (!currentOrderId) return;
    setNotifiedRejectedIds((prev) => {
      // filtrar solo ids ya notificados para esta sesión; no limpiamos storage global
      return prev;
    });
  }, [existingOrder?.id, existingOrder?.order_id]);

  const fetchExistingOrder = useCallback(async () => {
    if (mesaIdentifierList.length === 0) return;
    try {
      setOrderLoading(true);
      const orders = await getOrdenes();
      const ordersArray = Array.isArray(orders) ? orders : [];

      const matchesCurrentTable = (orden) => {
        const identifiers = buildIdentifierList([
          orden?.table,
          orden?.mesa_id,
          orden?.mesa,
          orden?.mesa_label,
          orden?.tableNumber,
        ]);
        return identifiers.some((id) => mesaIdentifierList.includes(id));
      };

      const appendableMatch = ordersArray.find((orden) => {
        const status = normalizeStatus(orden?.estado);
        return (
          APPENDABLE_ORDER_STATUSES.includes(status) &&
          matchesCurrentTable(orden)
        );
      });

      const displayableMatch = ordersArray.find((orden) => {
        const status = normalizeStatus(orden?.estado);
        return (
          DISPLAYABLE_ORDER_STATUSES.includes(status) &&
          matchesCurrentTable(orden)
        );
      });

      const match = appendableMatch || displayableMatch;

      if (match) {
        const matchWaiterIdStr = match.waiter_id ? String(match.waiter_id) : null;
        const currentWaiterIdStr = currentWaiterId ? String(currentWaiterId) : null;

        console.log(`🔍 Validando acceso - Orden waiter_id: ${matchWaiterIdStr}, Usuario actual: ${currentWaiterIdStr}`);

        if (match.waiter_id && matchWaiterIdStr !== currentWaiterIdStr) {
          console.log(`❌ Acceso DENEGADO - Mesa de ${match.waiter_name}`);
          setAccessDenied(true);
          setOrderError(
            `Esta mesa está siendo atendida por ${match.waiter_name || 'otro mesero'}. No puedes modificar esta orden.`
          );
          setExistingOrder(null);
          setExistingItems([]);
          setIsExistingOrderReadOnly(false);
          setRemoveRequests([]);
        } else {
          console.log(`✅ Acceso PERMITIDO`);
          setAccessDenied(false);
          setExistingOrder(match);
          setExistingItems(
            mapPedidoItemsToCartShape(match.pedido || match.items)
          );
          setOrderError(null);
          setIsExistingOrderReadOnly(
            !APPENDABLE_ORDER_STATUSES.includes(
              normalizeStatus(match.estado)
            )
          );
          const orderIdForHistory = match.id || match.order_id;
          loadRemoveRequests(orderIdForHistory);
        }
      } else {
        setAccessDenied(false);
        setExistingOrder(null);
        setExistingItems([]);
        setIsExistingOrderReadOnly(false);
        setOrderError(null);
        setRemoveRequests([]);
      }
    } catch (error) {
      console.error("Error cargando pedido existente:", error);
      setOrderError(error.message || "No se pudo cargar el pedido actual.");
    } finally {
      setOrderLoading(false);
    }
  }, [mesaIdentifierList, loadRemoveRequests]);

  useEffect(() => {
    fetchExistingOrder();
  }, [fetchExistingOrder]);

  // Poll para refrescar historial de eliminaciones sin recargar manual
  useEffect(() => {
    const id = existingOrder?.id || existingOrder?.order_id;
    if (!id) return;
    // carga inmediata sin spinner extra (ya controlado en loadRemoveRequests)
    loadRemoveRequests(id);
    const interval = setInterval(() => {
      loadRemoveRequests(id);
    }, 6000);
    return () => clearInterval(interval);
  }, [existingOrder?.id, existingOrder?.order_id, loadRemoveRequests]);

  useEffect(() => {
    const loadMenuData = async () => {
      try {
        setLoading(true);
        const platosData = await getPlatos();

        const menuFormateado = platosData.map((plato) => ({
          id: plato.id,
          name: plato.nombre,
          category: plato.categoria_nombre || plato.categoria,
          price: parseFloat(plato.precio || 0),
          available: plato.disponible !== false,
        }));

        setMenu(menuFormateado);

        const firstCategory = menuFormateado[0]?.category;
        if (firstCategory) {
          const main = categoryHierarchy.find((x) =>
            x.subcategories.includes(firstCategory)
          );
          setActiveMainCategory(main?.main || categoryHierarchy[0].main);
          setActiveSubcategory(firstCategory);
        }
      } catch (error) {
        console.error("Error cargando menu:", error);
      } finally {
        setLoading(false);
      }
    };

    loadMenuData();
  }, []);

  const availableSubcategories =
    menu?.map((item) => item.category).filter(Boolean) || [];

  const activeMainCategoryData = categoryHierarchy.find(
    (x) => x.main === activeMainCategory
  );

  const availableSubcategoriesForMain = activeMainCategoryData
    ? activeMainCategoryData.subcategories.filter((sub) =>
      availableSubcategories.includes(sub)
    )
    : [];

  const filteredMenu = menu.filter((dish) => {
    const hasSearch = searchTerm.trim() !== "";
    const matchesCategory = hasSearch ? true : dish.category === activeSubcategory;
    const matchesSearch =
      !hasSearch || dish.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAvailability = !showOnlyAvailable || dish.available;
    return matchesCategory && matchesSearch && matchesAvailability;
  });

  const handleAddToCart = (dish) => {
    setCartItems((draft) => {
      const existing = draft.find((item) => item.dishId === dish.id);
      if (existing) {
        existing.dishQuantity += 1;
        existing.subtotal = existing.dishQuantity * existing.unitPrice;
      } else {
        const unitPrice = toNumber(dish.price);
        draft.push({
          dishId: dish.id,
          dishName: dish.name,
          dishCategory: dish.category,
          dishStatus: "Pendiente",
          dishQuantity: 1,
          unitPrice,
          subtotal: unitPrice,
          cost: unitPrice * 0.7,
          description: "",
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
    setCommentModalDish(dish);
    setCommentModalOpen(true);
  };

  const handleSaveComment = (comment) => {
    if (commentModalDish) {
      setCartItems((draft) => {
        const item = draft.find((i) => i.dishId === commentModalDish.dishId);
        if (item) {
          item.description = comment;
        }
      });
    }
  };

  const handleRequestRemoveExisting = async (dish, index) => {
    if (!existingOrder) {
      showNotification({
        type: "error",
        title: "Sin pedido activo",
        message: "No hay un pedido actual para esta mesa.",
        duration: 4000,
      });
      return;
    }

    setRemoveModalItem(dish);
    setRemoveModalIndex(index);
    setRemoveModalOpen(true);
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

  const aggregatedExistingItems = useMemo(
    () => aggregateItems(existingItems),
    [existingItems]
  );
  const aggregatedCartItems = useMemo(
    () => aggregateItems(cartItems),
    [cartItems]
  );

  const existingTotal = sumSubtotals(aggregatedExistingItems);
  const newItemsTotal = sumSubtotals(aggregatedCartItems);
  const projectedTotal = existingOrder
    ? isExistingOrderReadOnly
      ? existingTotal
      : existingTotal + newItemsTotal
    : newItemsTotal;

  const handleConfirmOrder = async () => {
    if (accessDenied) {
      showNotification({
        type: "error",
        title: "Acceso denegado",
        message: orderError || "No tienes permiso para modificar esta mesa.",
        duration: 5000,
      });
      return;
    }

    const canUpdateExistingOrder =
      existingOrder && !isExistingOrderReadOnly;

    if (existingOrder && isExistingOrderReadOnly) {
      showNotification({
        type: "warning",
        title: "Pedido bloqueado",
        message:
          `El pedido actual está en estado "${existingOrder.estado ?? "desconocido"}". ` +
          "No se pueden agregar platillos hasta que se reabra la orden.",
        duration: 5000,
      });
      return;
    }

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
      const newItemsPayload = serializeCartItems(aggregateItems(cartItems));

      if (canUpdateExistingOrder) {
        const baseItemsPayload = serializeCartItems(aggregateItems(existingItems));
        const mergedItems = mergeSerializedItems([...baseItemsPayload, ...newItemsPayload]);
        const mergedQuantity = sumSerializedQuantities(mergedItems);
        const mergedTotal = sumSerializedTotals(mergedItems);
        const recordId = existingOrder.id || existingOrder.order_id;

        if (!recordId) {
          throw new Error(
            "No se encontro el identificador de la orden actual."
          );
        }

        const updatePayload = {
          order_id: existingOrder.order_id || existingOrder.id,
          mesa_id: existingOrder.mesa_id || mesaId,
          pedido: JSON.stringify(mergedItems),
          cantidad: mergedQuantity,
          nota: `Total: C$${mergedTotal.toFixed(2)}`,
          waiter_id: existingOrder.waiter_id || getCurrentUserId(),
        };

        await updateOrden(recordId, updatePayload);

        showNotification({
          type: "success",
          title: "Pedido actualizado",
          message: `Se agregaron ${newItemsPayload.length
            } platillos para la mesa ${displayNumber}. Total proyectado: C$${mergedTotal.toFixed(
              2
            )
            } `,
          duration: 5000,
        });
      } else {
        const safeMesaId = mesaId || routeTableParam || "MESA-UNKNOWN";
        const mergedNewItems = mergeSerializedItems(newItemsPayload);
        const totalQuantity = sumSerializedQuantities(mergedNewItems);
        const newOrderTotal = sumSerializedTotals(mergedNewItems);
        const waiterId = getCurrentUserId();
        const waiterName = getCurrentUserName();
        const orderData = {
          order_id: `ORD - ${Date.now()} `,
          mesa_id: safeMesaId,
          pedido: JSON.stringify(mergedNewItems),
          cantidad: totalQuantity,
          nota: `Total: C$${newOrderTotal.toFixed(2)} `,
          estado: "pendiente",
          waiter_id: waiterId,
          waiter_name: waiterName,
        };

        console.log(`📝 Creando nueva orden: `, {
          mesa_id: safeMesaId,
          waiter_id: waiterId,
          waiter_name: orderData.waiter_name,
          cantidad: totalQuantity,
          total: newOrderTotal
        });

        const response = await createOrden(orderData);

        console.log(`✅ Orden creada exitosamente: `, response);

        showNotification({
          type: "success",
          title: "Orden confirmada",
          message: `Orden #${response.order_id
            } creada para Mesa ${displayNumber}.Total: C$${newOrderTotal.toFixed(
              2
            )
            } `,
          duration: 5000,
        });
      }

      setCartItems([]);
      await fetchExistingOrder();
    } catch (error) {
      console.error("Error al confirmar orden:", error);
      showNotification({
        type: "error",
        title: existingOrder
          ? "Error al actualizar orden"
          : "Error al crear orden",
        message:
          error.message || "No se pudo procesar la orden. Intenta nuevamente.",
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
    ? isExistingOrderReadOnly
      ? "Confirmar orden"
      : "Actualizar pedido"
    : "Confirmar orden";

  if (accessDenied) {
    return (
      <section style={{ padding: "2rem", textAlign: "center" }}>
        <div style={{
          background: "#fee2e2",
          border: "2px solid #ef4444",
          borderRadius: "12px",
          padding: "2rem",
          maxWidth: "600px",
          margin: "0 auto"
        }}>
          <Lock size={48} style={{ color: "#ef4444", marginBottom: "1rem" }} />
          <h2 style={{ color: "#991b1b", marginBottom: "1rem" }}>Acceso Denegado</h2>
          <p style={{ color: "#7f1d1d", fontSize: "1.1rem", marginBottom: "1rem" }}>
            {orderError}
          </p>
          <button
            onClick={() => window.history.back()}
            style={{
              background: "#ef4444",
              color: "white",
              border: "none",
              borderRadius: "8px",
              padding: "0.75rem 1.5rem",
              fontSize: "1rem",
              cursor: "pointer",
              marginTop: "1rem"
            }}
          >
            Volver a Mesas
          </button>
        </div>
      </section>
    );
  }

  return (
    <section style={{ padding: "1rem" }}>
      <h3>
        Mesa {displayNumber || "?"} | Pedido actual: C$
        {existingTotal.toFixed(2)}
      </h3>
        {existingOrder && (
        <p style={{ margin: "0.35rem 0 0.35rem", color: "#374151" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              padding: "0.35rem 0.65rem",
              borderRadius: "999px",
              background: "#eef2ff",
              color: "#4338ca",
              fontWeight: 700,
              fontSize: "0.9rem",
              boxShadow: "0 8px 18px rgba(99,102,241,0.15)",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
            }}
          >
            Estado actual: {existingOrder.estado || "desconocido"}
          </span>
        </p>
      )}
      <p style={{ color: "#6b7280", marginBottom: "1rem" }}>
        Nuevos platillos: C${newItemsTotal.toFixed(2)} · Total proyectado: C$
        {projectedTotal.toFixed(2)}
      </p>
      {isExistingOrderReadOnly && existingOrder && (
        <p style={{ color: "#b45309", marginTop: "-0.25rem", marginBottom: "1rem" }}>
          Pedido en estado "{existingOrder.estado}". Solo lectura para agregar platillos.
        </p>
      )}

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
          ) : aggregatedExistingItems.length > 0 ? (
            <DishTable
              utility="summary-removable"
              data={aggregatedExistingItems}
              headers={["Platillo", "Cantidad", "Notas", "Subtotal", "Acciones"]}
              onRemoveExisting={(dish) =>
                handleRequestRemoveExisting(dish, dish._rawIndex)
              }
            />
          ) : (
            <p className="no-dishes">
              Esta mesa aun no tiene platillos registrados.
            </p>
          )}
          {orderError && (
            <p style={{ color: "#b91c1c", marginTop: "0.5rem" }}>
              {orderError}
            </p>
          )}
        </div>
      </section>
      <div className="custom-order-container">
        <h3>Selecciona la categoria</h3>

        {/* 🎯 BOTONES DE CATEGORÍAS PRINCIPALES */}
        <h3>Categorías Principales</h3>
        <div className="categories-menu">
            {categoryHierarchy.map((cat) => (
              <button
                key={cat.main}
                className={`category-btn ${activeMainCategory === cat.main ? "active" : ""}`}
                onClick={() => {
                  setActiveMainCategory(cat.main);
                  const first = cat.subcategories.find((sub) =>
                    availableSubcategories.includes(sub)
                  );
                  if (first) setActiveSubcategory(first);
                }}
              >
                {cat.main}
              </button>
            ))}
        </div>

        {/* 🎯 BOTONES DE SUBCATEGORÍAS */}
        <h3>Subcategorías</h3>
        <div className="categories-menu">
          {availableSubcategoriesForMain.map((sub) => (
            <button
              key={sub}
              className={`category-btn ${activeSubcategory === sub ? "active" : ""}`}
              onClick={() => setActiveSubcategory(sub)}
            >
              {categoryEmojis[sub] || "🍽"} {sub}
            </button>
          ))}
        </div>

        <p className="category-tip">Tip: Desliza para cambiar de categoria.</p>
      </div>

      {/* 🔍 Barra de búsqueda y filtros */}
      <div className="search-filter-container">
        <div className="search-bar">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Buscar platillo por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="clear-search-btn"
              aria-label="Limpiar búsqueda"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <div className="filters-bar">
          <button
            className={`filter-chip ${showOnlyAvailable ? 'active' : ''}`}
            onClick={() => setShowOnlyAvailable(!showOnlyAvailable)}
          >
            <Filter size={16} />
            {showOnlyAvailable ? 'Solo disponibles' : 'Todos'}
          </button>

          {(searchTerm || showOnlyAvailable) && (
            <span className="results-count">
              {filteredMenu.length} {filteredMenu.length === 1 ? 'resultado' : 'resultados'}
            </span>
          )}
        </div>
      </div>

      <section className="category-dishes">
        <h2 className="category-title" style={{ textAlign: 'center', color: '#6366f1', margin: '1.5rem 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <span>Categoria:</span>
          <ChefHat size={28} style={{ color: '#6366f1' }} />
          <span style={{ borderBottom: '3px solid #6366f1', paddingBottom: '2px' }}>{activeSubcategory}</span>
        </h2>
        <div className="dishes-grid">
          {filteredMenu.length > 0 ? (
            filteredMenu.map((dish) => {
              const cartItem = cartItems.find(item => item.dishId === dish.id);
              const quantity = cartItem ? cartItem.dishQuantity : 0;
              const isInCart = quantity > 0;

              return (
                <article
                  key={dish.id}
                  className={`dish-card-order ${isInCart ? 'in-cart' : ''}`}
                >
                  {isInCart && (
                    <div className="dish-quantity-badge">
                      x{quantity}
                    </div>
                  )}

                  <div className="dish-card-content">
                    <h3 className="dish-card-name">{dish.name}</h3>
                    <p className="dish-card-price">C${dish.price.toFixed(2)}</p>
                  </div>
                  <button
                    className="dish-card-btn"
                    onClick={() => handleAddToCart(dish)}
                    disabled={!dish.available}
                  >
                    {isInCart ? 'Agregar más' : 'Agregar'}
                  </button>
                </article>
              );
            })
          ) : (
            <p className="no-dishes" style={{ gridColumn: '1 / -1' }}>No hay platos en esta categoria.</p>
          )}
        </div>
      </section>

      <section className="category-dishes">
        <h3>Platillos por agregar</h3>
        <div className="table-container">

          {aggregatedCartItems.length > 0 ? (
            <DishTable
              utility="buycar"
              data={aggregatedCartItems}
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


      <section className="category-dishes">
        <h4>Historial de eliminaciones</h4>
        <div className="table-container">
          {removeHistoryLoading ? (
            <div style={{ textAlign: "center", padding: "1rem" }}>
              <RefreshCw className="spin" size={20} />
              <p style={{ color: "#6b7280" }}>Cargando historial...</p>
            </div>
          ) : removeRequests.length > 0 ? (
            <table className="dish-table shadow">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Cantidad</th>
                  <th>Razón</th>
                  <th>Estado</th>
                  <th>Autorizado por</th>
                </tr>
              </thead>
              <tbody className="tbody-class">
                {removeRequests.map((req, idx) => (
                  <tr key={req.id || idx}>
                    <td>{req.item_nombre || req.dish_name || "Platillo"}</td>
                    <td>{req.cantidad ?? req.quantity ?? "-"}</td>
                    <td>{req.razon || req.reason || "Sin razón"}</td>
                    <td style={{ textTransform: "capitalize" }}>
                      {req.estado || req.status || "pendiente"}
                    </td>
                    <td>{req.autorizado_por || req.approved_by || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="no-dishes">Sin solicitudes de eliminación.</p>
          )}
        </div>
      </section>

      {notification && (
        <Notification
          type={notification.type}
          title={notification.title}
          message={notification.message}
          onClose={hideNotification}
        />
      )}

      <CommentModal
        isOpen={commentModalOpen}
        onClose={() => setCommentModalOpen(false)}
        onSave={handleSaveComment}
        dishName={commentModalDish?.dishName || ""}
        initialComment={commentModalDish?.description || ""}
      />

      <RemoveItemModal
        isOpen={removeModalOpen}
        item={removeModalItem}
        onClose={() => {
          setRemoveModalOpen(false);
          setRemoveModalItem(null);
          setRemoveModalIndex(null);
        }}
        onConfirm={async (reasonText, qtyToRemove = 1) => {
          if (!existingOrder) {
            throw new Error("No hay un pedido actual para esta mesa.");
          }
          const orderId = existingOrder.id || existingOrder.order_id;
          if (!orderId) {
            throw new Error("No se encontró el identificador de la orden.");
          }
          await requestRemoveItem(
            orderId,
            removeModalIndex,
            reasonText.trim(),
            getCurrentUserName() || "mesero",
            qtyToRemove
          );
          showNotification({
            type: "success",
            title: "Solicitud enviada",
            message:
              "Se envió la solicitud de eliminación a caja. Cocina será notificada si corresponde.",
            duration: 4000,
          });
          loadRemoveRequests(orderId);
        }}
      />
    </section>
  );
};

export default HandleOrder;
