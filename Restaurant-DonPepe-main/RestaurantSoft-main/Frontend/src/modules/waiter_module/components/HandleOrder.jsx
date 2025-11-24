import { useImmer } from "use-immer";
import { useState, useEffect, useMemo, useCallback } from "react";
import DishTable from "./DishTable";
import { getPlatos } from "../../../services/adminMenuService";
import {
  createOrden,
  getOrdenes,
  updateOrden,
} from "../../../services/waiterService";
import { useNotification } from "../../../hooks/useNotification";
import Notification from "../../../common/Notification";
import CommentModal from "./CommentModal";
import { RefreshCw, ChefHat, Search, Filter, X } from "lucide-react";
import { useLocation, useParams } from "react-router-dom";
import { getCurrentUser, getCurrentUserId, getCurrentUserName } from "../../../utils/auth";

// Estados en los que SÍ se puede adjuntar a la misma orden; fuera de esto se genera una nueva
const APPENDABLE_ORDER_STATUSES = ["pendiente", "en_preparacion", "listo"];

// 🎯 NUEVO: emojis para subcategorías
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

// 🎯 NUEVO: estructura jerárquica
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
    nota: item.description?.trim() || "", // Solo envía comentario si existe
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

  // 🎯 NUEVO: estados de categoría principal y subcategoría
  const [activeMainCategory, setActiveMainCategory] = useState(null);
  const [activeSubcategory, setActiveSubcategory] = useState(null);

  // 🔍 Estados para búsqueda y filtros
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
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState(null);
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [commentModalDish, setCommentModalDish] = useState(null);
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
        // Solo reusar órdenes que sigan activas en cocina; si ya fue entregada/servida se crea nueva
        if (!APPENDABLE_ORDER_STATUSES.includes(status)) {
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
        // Verificar que el mesero actual tenga permiso para editar esta orden
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
        } else {
          console.log(`✅ Acceso PERMITIDO`);
          setAccessDenied(false);
          setExistingOrder(match);
          setExistingItems(
            mapPedidoItemsToCartShape(match.pedido || match.items)
          );
          setOrderError(null);
        }
      } else {
        setAccessDenied(false);
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

  // 🎯 NUEVO: cargar platos SIN categorías del backend
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
          // No incluir description del plato - solo usaremos comentarios explícitos del mesero
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
    // Filtro por categoría
    const matchesCategory = dish.category === activeSubcategory;

    // Filtro por búsqueda (nombre del platillo)
    const matchesSearch = searchTerm.trim() === "" ||
      dish.name.toLowerCase().includes(searchTerm.toLowerCase());

    // Filtro por disponibilidad
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
        draft.push({
          dishId: dish.id,
          dishName: dish.name,
          dishCategory: dish.category,
          dishStatus: "Pendiente",
          dishQuantity: 1,
          unitPrice: dish.price,
          subtotal: dish.price,
          cost: dish.price * 0.7,
          description: "", // No usar descripción por defecto, solo comentarios del mesero
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
          item.description = comment; // Solo guarda el comentario si hay texto, vacío si no hay
        }
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
    // Verificar acceso denegado
    if (accessDenied) {
      showNotification({
        type: "error",
        title: "Acceso denegado",
        message: orderError || "No tienes permiso para modificar esta mesa.",
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
      const newItemsPayload = serializeCartItems(cartItems);

      if (existingOrder) {
        const baseItemsPayload = serializeCartItems(existingItems);
        const mergedItems = [...baseItemsPayload, ...newItemsPayload];
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
          // Let backend handle estado reset automatically when items are added
          waiter_id: existingOrder.waiter_id || getCurrentUserId(), // Mantener mesero original
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
        const totalQuantity = sumSerializedQuantities(newItemsPayload);
        const newOrderTotal = sumSerializedTotals(newItemsPayload);
        const waiterId = getCurrentUserId();
        const waiterName = getCurrentUserName();
        const orderData = {
          order_id: `ORD - ${Date.now()} `,
          mesa_id: safeMesaId,
          pedido: JSON.stringify(newItemsPayload),
          cantidad: totalQuantity,
          nota: `Total: C$${newOrderTotal.toFixed(2)} `,
          estado: "pendiente",
          waiter_id: waiterId, // Asignar mesero actual
          waiter_name: waiterName, // Nombre completo del mesero
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
    ? "Actualizar pedido"
    : "Confirmar orden";

  // Mostrar mensaje de acceso denegado si corresponde
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
              // Verificar si el platillo está en el carrito y obtener la cantidad
              const cartItem = cartItems.find(item => item.dishId === dish.id);
              const quantity = cartItem ? cartItem.dishQuantity : 0;
              const isInCart = quantity > 0;

              return (
                <article
                  key={dish.id}
                        className={`dish-card-order ${isInCart ? 'in-cart' : ''}`}
                >
                  {/* Badge de cantidad en la esquina superior derecha */}
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
    </section>
  );
};

export default HandleOrder;
