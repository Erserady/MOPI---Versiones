import React, { useEffect, useState } from "react";
import { getOrdenes } from "../../../services/waiterService";
import { getCurrentUserId } from "../../../utils/auth";
import { cambiarEstadoOrden } from "../../../services/cookService";
import { Receipt, DollarSign, Eye, UtensilsCrossed, Wine } from "lucide-react";
import AlertModal from "../../../components/AlertModal";
import PreFacturaModal from "./PreFacturaModal";
import { useNavigate } from "react-router-dom";

const estadoColors = {
  pendiente: "#ef4444", // rojo
  en_preparacion: "#f59e0b", // amarillo
  listo: "#3b82f6", // azul
  entregado: "#22c55e", // verde
  servido: "#20B2AA",
  payment_requested: "#f59e0b",
  prefactura_enviada: "#6366f1",
  facturado: "#808080",
  pagado: "#808080",
};

const estadoLabels = {
  pendiente: "Pendiente",
  en_preparacion: "En cocina",
  listo: "Listo",
  entregado: "Entregado",
  servido: "Servido",
  payment_requested: "Cuenta solicitada",
  prefactura_enviada: "Pre-factura enviada",
  facturado: "Facturado",
  pagado: "Pagado",
};

const ActiveOrdersSection = ({ orders: externalOrders = null, embedded = false }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [preFacturas, setPreFacturas] = useState({});
  const [alert, setAlert] = useState({ isOpen: false, type: 'info', title: '', message: '' });
  const [preFacturaModal, setPreFacturaModal] = useState({ isOpen: false, data: null });
  const currentWaiterId = getCurrentUserId();
  const navigate = useNavigate();

  // Función para cerrar alert
  const closeAlert = () => setAlert({ ...alert, isOpen: false });

  // Función para mostrar alert
  const showAlert = (type, title, message) => {
    setAlert({ isOpen: true, type, title, message });
  };

  // Función para parsear pedido - DEBE estar antes del useEffect
  const parsePedido = (pedidoRaw) => {
    try {
      if (Array.isArray(pedidoRaw)) return pedidoRaw;
      return JSON.parse(pedidoRaw || "[]");
    } catch {
      return [];
    }
  };

  const normalizeText = (value) =>
    (value || "")
      .toString()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

  const isNonCookableItem = (item = {}) => {
    const COOKABLE_NAME_WHITELIST = [
      "filete de tacon alto",
      "filete de tacón alto",
      "filete minon",
      "filete miñon",
      "filete mion",
      "filete criollo",
      "puyaso a la parrilla",
      "new york asado",
      "filete de res a la pimienta",
    ];

    if (item.preparable_en_cocina === false) return true;
    if (item.preparable_en_cocina === true) return false;

    const category = normalizeText(item.categoria || item.category || item.tipo || "");
    const CATEGORY_EXCLUDE_LIST = [
      "licores importados",
      "cerveza nacional",
      "cerveza internacional",
      "coctails y vinos",
      "cocteles y vinos",
      "ron nacional",
      "enlatados y desechables",
      "cigarros",
    ];
    if (CATEGORY_EXCLUDE_LIST.some((c) => normalizeText(c) === category)) return true;

    const name = normalizeText(item.nombre || item.name || item.dishName || "");
    if (COOKABLE_NAME_WHITELIST.includes(name)) return false;

    const PRODUCT_NAME_KEYWORDS = ["hielo", "empaque", "valde", "cafe", "limon"];
    if (!name) return false;
    return PRODUCT_NAME_KEYWORDS.some((kw) => name.includes(normalizeText(kw)));
  };

  const getDeliveryStatus = (items = []) => {
    const cookable = [];
    const beverages = [];

    items.forEach((item) => {
      if (isNonCookableItem(item)) {
        beverages.push(item);
      } else {
        cookable.push(item);
      }
    });

    const allFoodReady =
      cookable.length > 0 && cookable.every((i) => i.listo_en_cocina === true);
    const drinkDelivered = (item) => {
      if (Object.prototype.hasOwnProperty.call(item, "entregado_en_caja")) {
        return item.entregado_en_caja === true;
      }
      if (Object.prototype.hasOwnProperty.call(item, "entregado_por_caja")) {
        return item.entregado_por_caja === true;
      }
      if (Object.prototype.hasOwnProperty.call(item, "entregado")) {
        return item.entregado === true;
      }
      if (Object.prototype.hasOwnProperty.call(item, "listo_en_cocina")) {
        return item.listo_en_cocina === true;
      }
      return false;
    };
    const allDrinksReady = beverages.length > 0 && beverages.every((i) => drinkDelivered(i));

    return {
      hasFood: cookable.length > 0,
      hasDrinks: beverages.length > 0,
      foodReady: cookable.length === 0 ? false : allFoodReady,
      drinksReady: beverages.length === 0 ? false : allDrinksReady,
    };
  };

  // Procesar órdenes (desde prop o fetch)
  const processOrders = (arr) => {
    // Filtrar solo las órdenes del mesero actual y no pagadas/facturadas
    const filteredOrders = arr.filter((order) => {
      if (order.estado === "pagado" || order.estado === "facturado") {
        return false;
      }
      return order.waiter_id === currentWaiterId;
    });

    // Guardar pre-factura si aplica
    filteredOrders.forEach(order => {
      if (order.estado === 'prefactura_enviada' && !preFacturas[order.id]) {
        const items = parsePedido(order.pedido).map(item => ({
          nombre: item.nombre,
          cantidad: item.cantidad || 0,
          precio: item.precio || 0,
          subtotal: (item.cantidad || 0) * (item.precio || 0)
        }));
        const total = items.reduce((sum, item) => sum + item.subtotal, 0);
        
        setPreFacturas(prev => ({
          ...prev,
          [order.id]: {
            mesa: order.mesa,
            mesero: order.waiterName,
            items,
            total
          }
        }));
      }
    });

    setOrders(filteredOrders);
  };

  useEffect(() => {
    // Si recibimos órdenes externas, usarlas y no crear intervalos
    if (externalOrders) {
      const arr = Array.isArray(externalOrders) ? externalOrders : [];
      processOrders(arr);
      setLoading(false);
      return;
    }

    const loadOrders = async () => {
      try {
        const response = await getOrdenes();
        const arr = Array.isArray(response) ? response : [];
        processOrders(arr);
      } catch (e) {
        console.error("Error cargando ordenes:", e);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
    const interval = setInterval(loadOrders, 5000);
    return () => clearInterval(interval);
  }, [currentWaiterId, externalOrders]);

  if (loading) return <p>Cargando órdenes…</p>;

  function capitalizeFirstLetter(str) {
    if (!str) return "";
    const formatted = str.replace(/_/g, " ");
    return formatted[0].toUpperCase() + formatted.slice(1);
  }

  const containerStyle = embedded
    ? {
        padding: "12px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        maxHeight: "520px",
        overflowY: "auto",
      }
    : {
        padding: "20px",
        display: "flex",
        flexWrap: "wrap",
        gap: "20px",
        justifyContent: "space-evenly",
      };

  return (
    <div style={containerStyle}>
      {orders.length === 0 ? (
        <p>No tienes órdenes activas.</p>
      ) : (
        orders.map((order) => {
            const items = parsePedido(order.pedido);
            const { hasFood, hasDrinks, foodReady, drinksReady } = getDeliveryStatus(items);

            const baseEstado = order.estado || "pendiente";
            const billingStates = ["payment_requested", "prefactura_enviada", "facturado", "pagado"];
            const onlyDrinks = hasDrinks && !hasFood;
            const onlyFood = hasFood && !hasDrinks;
            const bothTypes = hasFood && hasDrinks;

            let visualBorderState = baseEstado;
            if (!billingStates.includes(baseEstado)) {
              if (onlyDrinks) {
                // Bebidas pasan de pendiente (rojo) a listo (azul) al entregarse
                visualBorderState = drinksReady ? "listo" : "pendiente";
              } else if (onlyFood) {
                // Cocina solo: cuando todo está listo/entregado, mostrar azul
                if (foodReady) {
                  visualBorderState = "listo";
                } else {
                  visualBorderState = baseEstado;
                }
              } else if (bothTypes) {
                const allDelivered = foodReady && drinksReady;
                if (allDelivered) {
                  // Todo entregado: azul
                  visualBorderState = "listo";
                } else {
                  // Mientras falte bebida no subir a azul/verde
                  if (baseEstado === "listo" || baseEstado === "entregado") {
                    visualBorderState = "en_preparacion";
                  } else {
                    visualBorderState = baseEstado;
                  }
                }
              }
            }

            const bebidasLabel = !hasDrinks
              ? "Bebidas: No aplica"
              : drinksReady
              ? "Bebidas: Entregado"
              : "Bebidas: Pendiente";
            const bebidasColor = !hasDrinks
              ? "#94a3b8"
              : drinksReady
              ? "#16a34a"
              : "#dc2626";

            const estadoColor = estadoColors[visualBorderState] || "#cccccc"; // fallback
            const estadoLabel = estadoLabels[baseEstado] || capitalizeFirstLetter(baseEstado);
            const estadoTextColor = estadoColors[baseEstado] || "#cccccc";
            {
              /**Quitar linea de filtro si se desea ver facturados */
            }
            return (
              <article
                key={order.id || order.order_id}
                style={{
                  width: embedded ? "100%" : "280px",
                  background: "#ffffff",
                  borderRadius: "16px",
                  boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  border: `3px solid ${estadoColor}`,
                  cursor: "pointer",
                  position: "relative",
                }}
                onClick={() => {
                  const mesaId =
                    order.mesa_id ||
                    order.table ||
                    order.mesa ||
                    order.tableNumber ||
                    order.mesa_label ||
                    order.id;
                  navigate(`/waiter-dashboard/${mesaId}/orders-handler`, {
                    state: {
                      mesaId,
                      tableNumber: order.mesa || order.tableNumber || mesaId,
                      currentOrder: order,
                    },
                  });
                }}
              >
                <div>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "18px",
                      fontWeight: "700",
                    }}
                  >
                    Mesa {order.mesa ?? order.tableNumber ?? order.mesa_id ?? order.order_id}
                  </h3>

                  {hasFood && (
                    <p style={{ margin: "4px 0", color: estadoTextColor, fontSize: "14px" }}>
                      <span style={{ fontWeight: "700" }}>Estado:</span>{" "}
                      <span style={{ fontWeight: "500" }}>{estadoLabel}</span>
                    </p>
                  )}

                  {hasDrinks && (
                    <p style={{ margin: "4px 0", color: bebidasColor, fontSize: "14px" }}>
                      <span style={{ fontWeight: "700" }}>Bebidas:</span>{" "}
                      <span style={{ fontWeight: "500" }}>
                        {bebidasLabel.replace("Bebidas: ", "")}
                      </span>
                    </p>
                  )}

                  <p style={{ margin: "0", color: "#6b6b6b" }}>
                    Mesero: {order.waiterName ?? "—"}
                  </p>

                  <p style={{ margin: "0", color: "#333", fontWeight: "600" }}>
                    {order.nota}
                  </p>
                </div>

                <div style={{ position: "absolute", top: "12px", right: "12px", display: "flex", gap: "6px" }}>
                  <div
                    title={hasFood ? (foodReady ? "Platillos listos/entregados" : "Platillos pendientes") : "Sin platillos de cocina"}
                    style={{
                      position: "relative",
                      width: "32px",
                      height: "32px",
                      borderRadius: "10px",
                      background: !hasFood
                        ? "rgba(239,68,68,0.12)"
                        : foodReady
                        ? "rgba(16,185,129,0.12)"
                        : "rgba(148,163,184,0.22)",
                      color: !hasFood
                        ? "#dc2626"
                        : foodReady
                        ? "#16a34a"
                        : "#94a3b8",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "1px solid rgba(15,23,42,0.08)",
                    }}
                  >
                    <UtensilsCrossed size={16} />
                    {!hasFood && (
                      <span
                        style={{
                          position: "absolute",
                          width: "38px",
                          height: "2px",
                          background: "rgba(220,38,38,0.8)",
                          transform: "rotate(-20deg)",
                        }}
                      ></span>
                    )}
                  </div>
                  <div
                    title={hasDrinks ? (drinksReady ? "Bebidas/bar entregadas" : "Bebidas/bar pendientes") : "Sin bebidas de bar"}
                    style={{
                      position: "relative",
                      width: "32px",
                      height: "32px",
                      borderRadius: "10px",
                      background: !hasDrinks
                        ? "rgba(239,68,68,0.12)"
                        : drinksReady
                        ? "rgba(16,185,129,0.12)"
                        : "rgba(148,163,184,0.22)",
                      color: !hasDrinks
                        ? "#dc2626"
                        : drinksReady
                        ? "#16a34a"
                        : "#94a3b8",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "1px solid rgba(15,23,42,0.08)",
                    }}
                  >
                    <Wine size={16} />
                    {!hasDrinks && (
                      <span
                        style={{
                          position: "absolute",
                          width: "38px",
                          height: "2px",
                          background: "rgba(220,38,38,0.8)",
                          transform: "rotate(-20deg)",
                        }}
                      ></span>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    padding: "10px",
                    maxHeight: "180px",
                    overflowY: "auto",
                  }}
                >
                  {items.length === 0 ? (
                    <p style={{ color: "#777" }}>Sin platillos</p>
                  ) : (
                    items.map((p, i) => (
                      <div
                        key={i}
                        style={{
                          borderBottom:
                            i !== items.length - 1 ? "1px solid #eee" : "none",
                          paddingBottom: "8px",
                          marginBottom: "8px",
                        }}
                      >
                        <p style={{ margin: 0, fontWeight: "600" }}>
                          {p.nombre}
                        </p>
                        <p style={{ margin: 0, color: "#555" }}>
                          Cantidad: {p.cantidad}
                        </p>

                        {p.nota && (
                          <p
                            style={{
                              margin: 0,
                              color: "#999",
                              fontSize: "13px",
                            }}
                          >
                            Nota: {p.nota}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Botones de acción */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  {/* Botón Solicitar Cuenta - Aparece si NO está en payment_requested, prefactura_enviada, pagado o facturado */}
                  {!['payment_requested', 'prefactura_enviada', 'pagado', 'facturado'].includes(order.estado) && (
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          // Guardar datos de la orden antes de cambiar estado
                          const items = parsePedido(order.pedido).map(item => ({
                            nombre: item.nombre,
                            cantidad: item.cantidad || 0,
                            precio: item.precio || 0,
                            subtotal: (item.cantidad || 0) * (item.precio || 0)
                          }));
                          const total = items.reduce((sum, item) => sum + item.subtotal, 0);
                          
                          // Guardar pre-factura
                          setPreFacturas(prev => ({
                            ...prev,
                            [order.id]: {
                              mesa: order.mesa,
                              mesero: order.waiterName,
                              items,
                              total
                            }
                          }));
                          
                          await cambiarEstadoOrden(order.id, 'payment_requested');
                          
                          // Recargar órdenes
                          const response = await getOrdenes();
                          const arr = Array.isArray(response) ? response : [];
                          const filteredOrders = arr.filter((o) => {
                            if (o.estado === "pagado" || o.estado === "facturado") return false;
                            return o.waiter_id === currentWaiterId;
                          });
                          setOrders(filteredOrders);
                          
                          showAlert('success', '¡Cuenta Solicitada!', 'La cuenta ha sido solicitada a caja correctamente. Espera a que el cajero envíe la pre-factura.');
                        } catch (e) {
                          console.error('Error solicitando cuenta:', e);
                          showAlert('error', 'Error', 'No se pudo solicitar la cuenta. Por favor, inténtalo de nuevo.');
                        }
                      }}
                      style={{
                        flex: 1,
                        padding: '10px',
                        background: '#f59e0b',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        fontSize: '14px',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.background = '#d97706'}
                      onMouseLeave={(e) => e.target.style.background = '#f59e0b'}
                    >
                      <DollarSign size={16} />
                      Solicitar Cuenta
                    </button>
                  )}

                  {/* Botón Ver Pre-factura */}
                  {order.estado === 'prefactura_enviada' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (preFacturas[order.id]) {
                          setPreFacturaModal({ isOpen: true, data: preFacturas[order.id] });
                        } else {
                          showAlert('warning', 'Pre-factura no disponible', 'Aún no se ha recibido la pre-factura de caja. Por favor, espera unos momentos.');
                        }
                      }}
                      style={{
                        flex: 1,
                        padding: '10px',
                        background: '#6366f1',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        fontSize: '14px',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.background = '#4f46e5'}
                      onMouseLeave={(e) => e.target.style.background = '#6366f1'}
                    >
                      <Eye size={16} />
                      Ver Pre-factura
                    </button>
                  )}
                </div>
              </article>
            );
          })
      )}
      
      {/* Modales */}
      <AlertModal
        isOpen={alert.isOpen}
        onClose={closeAlert}
        type={alert.type}
        title={alert.title}
        message={alert.message}
      />
      
      <PreFacturaModal
        isOpen={preFacturaModal.isOpen}
        onClose={() => setPreFacturaModal({ isOpen: false, data: null })}
        preFactura={preFacturaModal.data}
      />
    </div>
  );
};

export default ActiveOrdersSection;
