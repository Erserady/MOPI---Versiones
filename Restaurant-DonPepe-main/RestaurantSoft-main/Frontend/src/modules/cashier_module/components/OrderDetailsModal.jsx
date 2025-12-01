import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Receipt,
  UtensilsCrossed,
  MessageSquare,
  Send,
  Trash2,
  AlertTriangle,
  RefreshCw,
  Clock,
} from "lucide-react";
import "../styles/transaction_detail_modal.css";
import {
  cambiarEstadoOrden,
  deleteOrdenCocina,
  updateOrdenCocina,
} from "../../../services/cookService";
import { getOrderRemoveRequests } from "../../../services/waiterService";
import AlertModal from "../../../components/AlertModal";
import ConfirmModal from "../../../components/ConfirmModal";

// Categorías/keywords que NO pasan por cocina (bebidas/bar)
const CATEGORY_EXCLUDE_LIST = [
  "bebidas",
  "bebidas alcoholicas",
  "bebidas alcohólicas",
  "bebidas no alcoholicas",
  "bebidas no alcohólicas",
  "cocteles",
  "cocteles y vinos",
  "coctails y vinos",
  "enlatados y desechables",
  "licores importados",
  "cerveza nacional",
  "cerveza internacional",
  "ron nacional",
  "cigarros",
  "bar",
  "refrescos",
  "jugos",
];

const PRODUCT_NAME_KEYWORDS = [
  "cerveza",
  "beer",
  "whisky",
  "vodka",
  "ron",
  "gin",
  "tequila",
  "trago",
  "cocktail",
  "coctel",
  "vino",
  "refresco",
  "soda",
  "coca",
  "pepsi",
  "sprite",
  "agua",
  "jugo",
  "limonada",
  "naranjada",
  "bottle",
  "botella",
  "lata",
  "can",
];

const normalizeText = (value) =>
  (value || "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const isNonCookableItem = (item = {}) => {
  const category = normalizeText(item.category);
  if (CATEGORY_EXCLUDE_LIST.some((c) => normalizeText(c) === category)) return true;
  const name = normalizeText(item.name);
  if (!name) return false;
  return PRODUCT_NAME_KEYWORDS.some((kw) => name.includes(normalizeText(kw)));
};

const OrderDetailsModal = ({
  isOpen,
  onClose,
  order,
  onOrderCancelled,
  overrideKitchen = false,
  onOverrideChange = () => { },
}) => {
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [alert, setAlert] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
  });
  const [editedItems, setEditedItems] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: "cancel",
    itemToRemove: null,
  });
  const [removals, setRemovals] = useState([]);
  const [removalsLoading, setRemovalsLoading] = useState(false);
  const [removalsError, setRemovalsError] = useState(null);
  const [removalsLoaded, setRemovalsLoaded] = useState(false);
  const [removalsKey, setRemovalsKey] = useState(null);
  const [deliveredFlags, setDeliveredFlags] = useState({});

  const formatCurrency = (value) => `C$ ${parseFloat(value || 0).toFixed(2)}`;

  const closeAlert = () => {
    setAlert({ ...alert, isOpen: false });
    if (alert.type === "success" && alert.shouldClose) {
      if (onOrderCancelled) onOrderCancelled();
      onClose();
    }
  };

  const showAlert = (type, title, message, shouldClose = true) => {
    setAlert({ isOpen: true, type, title, message, shouldClose });
  };

  const handleCancelOrder = () => {
    setConfirmModal({
      isOpen: true,
      type: "cancel",
      itemToRemove: null,
    });
  };

  const confirmCancelOrder = async () => {
    try {
      setDeleting(true);
      await deleteOrdenCocina(order.orderId);
      showAlert(
        "success",
        "¡Pedido Cancelado!",
        `El pedido de la Mesa ${order.tableNumber} ha sido cancelado exitosamente. La mesa ahora está libre.`,
        true
      );
    } catch (error) {
      console.error("Error cancelando pedido:", error);
      showAlert(
        "error",
        "Error",
        "No se pudo cancelar el pedido. Por favor, inténtalo de nuevo.",
        false
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleRemoveItem = (itemToRemove) => {
    const currentItems = editedItems || items;
    const newItems = currentItems.filter((item) => item.name !== itemToRemove.name);

    if (newItems.length === 0) {
      showAlert(
        "warning",
        "Atención",
        'No puedes eliminar todos los productos. Si deseas cancelar el pedido completo, usa el botón "Cancelar Pedido".',
        false
      );
      return;
    }

    setConfirmModal({
      isOpen: true,
      type: "removeItem",
      itemToRemove,
    });
  };

  const confirmRemoveItem = () => {
    const itemToRemove = confirmModal.itemToRemove;
    if (!itemToRemove) return;

    const currentItems = editedItems || items;
    const newItems = currentItems.filter((item) => item.name !== itemToRemove.name);

    setEditedItems(newItems);
    showAlert(
      "success",
      "Producto Eliminado",
      `"${itemToRemove.name}" ha sido eliminado. Recuerda guardar los cambios.`,
      false
    );
  };

  const handleSaveChanges = async () => {
    if (!editedItems) {
      showAlert("info", "Sin Cambios", "No hay cambios para guardar.", false);
      return;
    }

    try {
      setSending(true);
      const newPedido = editedItems.map((item) => ({
        nombre: item.name,
        precio: item.unitPrice,
        cantidad: item.quantity,
      }));

      await updateOrdenCocina(order.orderId, {
        pedido: JSON.stringify(newPedido),
      });

      showAlert(
        "success",
        "¡Cambios Guardados!",
        "Los productos del pedido han sido actualizados exitosamente.",
        true
      );
      setEditedItems(null);
    } catch (error) {
      console.error("Error guardando cambios:", error);
      showAlert(
        "error",
        "Error",
        "No se pudieron guardar los cambios. Por favor, inténtalo de nuevo.",
        false
      );
    } finally {
      setSending(false);
    }
  };

  const handleSendPreFactura = async () => {
    try {
      setSending(true);
      await cambiarEstadoOrden(order.orderId, "prefactura_enviada");
      showAlert(
        "success",
        "¡Pre-factura Enviada!",
        "La pre-factura ha sido enviada al mesero correctamente. El mesero podrá visualizarla en su panel de pedidos activos."
      );
    } catch (error) {
      console.error("Error enviando pre-factura:", error);
      showAlert("error", "Error", "No se pudo enviar la pre-factura. Por favor, inténtalo de nuevo.");
    } finally {
      setSending(false);
    }
  };

  // Historial de eliminaciones
  useEffect(() => {
    const loadRemovals = async () => {
      const ids =
        Array.isArray(order?.orderIds) && order.orderIds.length > 0
          ? order.orderIds
          : order?.orderId
            ? [order.orderId]
            : [];

      if (ids.length === 0) {
        setRemovals([]);
        setRemovalsLoaded(false);
        setRemovalsKey(null);
        return;
      }

      const key = ids.slice().sort().join("|");
      const shouldFetch = !removalsLoaded || removalsKey !== key;
      if (!shouldFetch) return;

      try {
        setRemovalsLoading(true);
        setRemovalsError(null);

        const results = await Promise.all(
          ids.map(async (oid) => {
            try {
              const data = await getOrderRemoveRequests(oid);
              return Array.isArray(data) ? data : [];
            } catch (e) {
              console.error("Error cargando eliminaciones para orden", oid, e);
              return [];
            }
          })
        );

        const combined = results.flat();
        combined.sort((a, b) => {
          const da = a?.created_at ? new Date(a.created_at).getTime() : 0;
          const db = b?.created_at ? new Date(b.created_at).getTime() : 0;
          return db - da;
        });

        setRemovals(combined);
        setRemovalsLoaded(true);
        setRemovalsKey(key);
      } catch (err) {
        console.error("Error cargando eliminaciones:", err);
        setRemovalsError("No se pudo cargar el historial de eliminaciones.");
      } finally {
        setRemovalsLoading(false);
      }
    };
    if (isOpen) {
      loadRemovals();
    }
  }, [isOpen, order?.orderId, order?.orderIds, removalsLoaded, removalsKey]);

  // Agrupar items (seguro si no hay order/accounts)
  const groupedItems = () => {
    const itemsMap = new Map();
    if (!order?.accounts) return [];

    order.accounts.forEach((account) => {
      (account.items || []).forEach((item) => {
        const key = item.name;
        if (itemsMap.has(key)) {
          const existing = itemsMap.get(key);
          existing.quantity += item.quantity || 0;
          existing.total += item.subtotal || 0;
        } else {
          itemsMap.set(key, {
            name: item.name,
            quantity: item.quantity || 0,
            unitPrice: item.unitPrice || 0,
            total: item.subtotal || 0,
            nota: item.nota || "",
            category: item.category || "otros",
          });
        }
      });
    });

    return Array.from(itemsMap.values());
  };

  const items = groupedItems();
  const displayItems = editedItems || items;

  // Flags de entregado para ítems de bar/bebidas
  const deliveredFlagsInitialized = useRef(false);

  useEffect(() => {
    if (isOpen && !deliveredFlagsInitialized.current) {
      const initial = {};
      displayItems.forEach((item, idx) => {
        if (isNonCookableItem(item)) {
          initial[idx] = overrideKitchen;
        }
      });
      setDeliveredFlags(initial);
      deliveredFlagsInitialized.current = true;
    }

    // Reset flag when modal closes
    if (!isOpen) {
      deliveredFlagsInitialized.current = false;
    }
  }, [isOpen, overrideKitchen]);

  useEffect(() => {
    const nonCookableIndexes = displayItems
      .map((item, idx) => (isNonCookableItem(item) ? idx : null))
      .filter((v) => v !== null);

    if (nonCookableIndexes.length === 0) {
      onOverrideChange(false);
      return;
    }

    const allChecked = nonCookableIndexes.every((idx) => deliveredFlags[idx]);
    onOverrideChange(allChecked);
  }, [deliveredFlags, displayItems, onOverrideChange]);

  if (!isOpen || !order) return null;

  return (
    <div className="transaction-modal-overlay" onClick={onClose}>
      <div className="transaction-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="transaction-modal-header">
          <div className="transaction-modal-title-group">
            <Receipt size={28} />
            <h2>Detalle del Pedido - Mesa {order.tableNumber}</h2>
          </div>
          <button className="transaction-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="transaction-modal-body">
          {/* Información General */}
          <div className="transaction-section">
            <h3 className="transaction-section-title">Información</h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "1rem",
                padding: "1rem",
                background: "#f9fafb",
                borderRadius: "8px",
              }}
            >
              <div>
                <p style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "0.25rem" }}>Mesa</p>
                <p style={{ fontSize: "1.125rem", fontWeight: "bold", color: "#111827" }}>Mesa {order.tableNumber}</p>
              </div>
              <div>
                <p style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "0.25rem" }}>Mesero</p>
                <p style={{ fontSize: "1.125rem", fontWeight: "bold", color: "#111827" }}>{order.waiter}</p>
              </div>
              <div>
                <p style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "0.25rem" }}>Total</p>
                <p style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#059669" }}>{formatCurrency(order.total)}</p>
              </div>
            </div>
          </div>

          {/* Productos Consumidos */}
          <div className="transaction-section">
            <h3 className="transaction-section-title">
              <UtensilsCrossed size={20} />
              Productos Consumidos
            </h3>

            <div className="transaction-products-list">
              {displayItems.map((item, index) => {
                const nonCookable = isNonCookableItem(item);
                const checked = !!deliveredFlags[index];
                return (
                  <div key={index}>
                    <div className="transaction-product-item" style={{ position: "relative" }}>
                      <div className="transaction-product-info">
                        <span className="transaction-product-name">{item.name}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span className="transaction-product-quantity">x{item.quantity}</span>
                          <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                            @ {formatCurrency(item.unitPrice)}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        {nonCookable && (
                          <div className="dish-ready-toggle small">
                            <label>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) =>
                                  setDeliveredFlags((prev) => ({
                                    ...prev,
                                    [index]: e.target.checked,
                                  }))
                                }
                              />
                              <span></span>
                            </label>
                          </div>
                        )}
                        <span className="transaction-product-price">{formatCurrency(item.total)}</span>
                        <button
                          onClick={() => handleRemoveItem(item)}
                          style={{
                            background: "#fee2e2",
                            color: "#dc2626",
                            border: "1px solid #fecaca",
                            borderRadius: "6px",
                            padding: "0.375rem",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = "#fecaca";
                            e.target.style.transform = "scale(1.05)";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = "#fee2e2";
                            e.target.style.transform = "scale(1)";
                          }}
                          title="Eliminar producto"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    {item.nota && (
                      <div
                        style={{
                          marginLeft: "1rem",
                          marginTop: "-0.5rem",
                          marginBottom: "0.75rem",
                          padding: "0.5rem 0.75rem",
                          background: "#fffbeb",
                          borderLeft: "3px solid #fbbf24",
                          borderRadius: "4px",
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "0.5rem",
                        }}
                      >
                        <MessageSquare size={14} style={{ marginTop: "0.15rem", color: "#f59e0b", flexShrink: 0 }} />
                        <span style={{ fontSize: "0.875rem", color: "#92400e" }}>{item.nota}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Historial de eliminaciones - no se imprime */}
            <div className="removal-history no-print">
              <div className="removal-history__header">
                <AlertTriangle size={18} />
                <h4>Historial de eliminaciones</h4>
              </div>

              {removalsLoading && (
                <div className="removal-history__loading">
                  <RefreshCw className="spin" size={18} />
                  <span>Cargando historial...</span>
                </div>
              )}

              {removalsError && <p className="removal-history__error">{removalsError}</p>}

              {!removalsLoading && !removalsError && (
                <>
                  {removals.length === 0 ? (
                    <p className="removal-history__empty">No hay eliminaciones registradas.</p>
                  ) : (
                    <div className="removal-history__list">
                      {removals.map((req) => (
                        <article key={req.id} className="removal-history__card">
                          <div className="removal-history__top">
                            <div className="pill pill--danger">x{req.cantidad ?? req.quantity ?? 1}</div>
                            <div className="removal-history__name">{req.item_nombre || req.dish_name || "Platillo"}</div>
                            <span
                              className={`removal-history__status removal-history__status--${(
                                req.estado || req.status || "pendiente"
                              ).toLowerCase()}`}
                            >
                              {(req.estado || req.status || "pendiente").toString().toUpperCase()}
                            </span>
                          </div>
                          <p className="removal-history__reason">{req.razon || req.reason || "Sin razón"}</p>
                          <div className="removal-history__meta">
                            <span>Solicitó: {req.solicitado_por || "mesero"}</span>
                            {req.autorizado_por && <span>Aprobó: {req.autorizado_por}</span>}
                            {req.rechazado_por && <span>Rechazó: {req.rechazado_por}</span>}
                            {req.created_at && (
                              <span className="removal-history__time">
                                <Clock size={14} />
                                {new Date(req.created_at).toLocaleString("es-ES", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  day: "2-digit",
                                  month: "2-digit",
                                })}
                              </span>
                            )}
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Totales */}
            <div className="transaction-totals">
              <div className="transaction-total-item" style={{ padding: "0.75rem 0", borderTop: "2px dashed #e5e7eb" }}>
                <span style={{ color: "#6b7280" }}>Subtotal:</span>
                <span style={{ color: "#6b7280" }}>{formatCurrency(order.total)}</span>
              </div>
              <div className="transaction-total-item transaction-total-final">
                <span>Total a Pagar:</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="transaction-modal-footer" style={{ flexWrap: "wrap", gap: "0.75rem" }}>
          {editedItems && (
            <button
              className="transaction-modal-btn-primary"
              onClick={handleSaveChanges}
              disabled={sending}
              style={{
                background: "#10b981",
                color: "white",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <Receipt size={18} />
              {sending ? "Guardando..." : "Guardar Cambios"}
            </button>
          )}

          {order.status === "payment_requested" && !editedItems && (
            <button
              className="transaction-modal-btn-primary"
              onClick={handleSendPreFactura}
              disabled={sending}
              style={{
                background: "#6366f1",
                color: "white",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <Send size={18} />
              {sending ? "Enviando..." : "Enviar Pre-factura al Mesero"}
            </button>
          )}

          <button
            onClick={handleCancelOrder}
            disabled={deleting || sending}
            style={{
              background: deleting ? "#9ca3af" : "#ef4444",
              color: "white",
              padding: "0.75rem 1rem",
              borderRadius: "8px",
              border: "none",
              fontSize: "0.875rem",
              fontWeight: "600",
              cursor: deleting ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              if (!deleting && !sending) e.target.style.background = "#dc2626";
            }}
            onMouseLeave={(e) => {
              if (!deleting && !sending) e.target.style.background = "#ef4444";
            }}
          >
            {deleting ? <RefreshCw size={18} className="spin" /> : <Trash2 size={18} />}
            {deleting ? "Cancelando..." : "Cancelar Pedido"}
          </button>

          <button className="transaction-modal-btn-close" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>

      <AlertModal
        isOpen={alert.isOpen}
        onClose={closeAlert}
        type={alert.type}
        title={alert.title}
        message={alert.message}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.type === "cancel" ? confirmCancelOrder : confirmRemoveItem}
        title={confirmModal.type === "cancel" ? "¿Cancelar Pedido?" : "¿Eliminar Producto?"}
        message={
          confirmModal.type === "cancel" ? (
            <>
              <p>¿Estás seguro de que deseas <strong>CANCELAR</strong> este pedido?</p>
              <ul>
                <li>Se eliminará el pedido de cocina</li>
                <li>Se liberará la mesa</li>
                <li>Esta acción NO se puede deshacer</li>
              </ul>
            </>
          ) : (
            <p>
              ¿Estás seguro de que deseas eliminar <strong>"{confirmModal.itemToRemove?.name}"</strong> del pedido?
            </p>
          )
        }
        confirmText={confirmModal.type === "cancel" ? "Sí, Cancelar Pedido" : "Sí, Eliminar"}
        cancelText="No, Volver"
        type="danger"
      />
    </div>
  );
};

export default OrderDetailsModal;
