import React, { useState, useEffect } from "react";
import {
  X,
  Receipt,
  UtensilsCrossed,
  MessageSquare,
  Send,
  Trash2,
  Pencil,
  AlertTriangle,
  RefreshCw,
  Clock,
} from "lucide-react";
import "../styles/transaction_detail_modal.css";
import {
  cambiarEstadoOrden,
  deleteOrdenCocina,
} from "../../../services/cookService";
import { updateOrden } from "../../../services/waiterService";
import { getOrderRemoveRequests } from "../../../services/waiterService";
import AlertModal from "../../../components/AlertModal";
import ConfirmModal from "../../../components/ConfirmModal";

const OrderDetailsModal = ({
  isOpen,
  onClose,
  order,
  onOrderCancelled,
  onOrderUpdated = () => {},
  hasDeliveredBarItems = false,
}) => {
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [alert, setAlert] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
  });
  const [editPriceModalOpen, setEditPriceModalOpen] = useState(false);
  const [editedItems, setEditedItems] = useState(null);
  const [baseItems, setBaseItems] = useState([]);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: "cancel",
    itemToRemove: null,
    itemIndex: null,
    indexesToRemove: [],
  });
  const [removals, setRemovals] = useState([]);
  const [removalsLoading, setRemovalsLoading] = useState(false);
  const [removalsError, setRemovalsError] = useState(null);
  const [removalsLoaded, setRemovalsLoaded] = useState(false);
  const [removalsKey, setRemovalsKey] = useState(null);

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
    if (preventAccountDeletion) {
      showAlert(
        "warning",
        "No permitido",
        "No se puede cancelar la cuenta porque ya fue marcada o entregada."
      );
      return;
    }
    setConfirmModal({
      isOpen: true,
      type: "cancel",
      itemToRemove: null,
    });
  };

  const confirmCancelOrder = async () => {
    if (preventAccountDeletion) {
      return;
    }
    try {
      setDeleting(true);
      await deleteOrdenCocina(order.orderId);
      showAlert(
        "success",
        "Pedido Cancelado",
        `El pedido de la Mesa ${order.tableNumber} ha sido cancelado exitosamente. La mesa ahora esta libre.`,
        true
      );
    } catch (error) {
      console.error("Error cancelando pedido:", error);
      showAlert(
        "error",
        "Error",
        "No se pudo cancelar el pedido. Por favor, intentalo de nuevo.",
        false
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleRemoveItem = (itemToRemove, itemIndex, indexesToRemove = []) => {
    if (preventAccountDeletion) {
      showAlert(
        "warning",
        "No permitido",
        "No se pueden eliminar productos porque la cuenta esta entregada o marcada en caja."
      );
      return;
    }
    const indexes = indexesToRemove.length > 0 ? indexesToRemove : [itemIndex];

    setConfirmModal({
      isOpen: true,
      type: "removeItem",
      itemToRemove,
      itemIndex,
      indexesToRemove: indexes,
    });
  };

  const confirmRemoveItem = () => {
    const itemToRemove = confirmModal.itemToRemove;
    const indexes = Array.isArray(confirmModal.indexesToRemove)
      ? confirmModal.indexesToRemove
      : [];
    if (!itemToRemove || indexes.length === 0) return;
    const currentItems = editedItems || baseItems;
    const newItems = currentItems.filter((_, idx) => !indexes.includes(idx));

    setEditedItems(newItems);
    showAlert(
      "success",
      "Producto Eliminado",
      `"${itemToRemove.name}" ha sido eliminado. Recuerda guardar los cambios.`,
      false
    );
  };

  const handlePriceChange = (itemIndex, value) => {
    if (preventAccountDeletion) {
      showAlert(
        "warning",
        "No permitido",
        "No puedes editar precios porque la cuenta ya fue marcada o entregada."
      );
      return;
    }
    const parsed = value === "" ? 0 : parseFloat(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      showAlert("warning", "Precio invalido", "Ingresa un numero mayor o igual a 0.", false);
      return;
    }

    const source = editedItems ? [...editedItems] : [...baseItems];
    const target = { ...source[itemIndex] };
    target.unitPrice = parsed;
    target.total = parsed * (target.quantity || 1);
    source[itemIndex] = target;
    setEditedItems(source);
  };

  const handleOpenEditPriceModal = () => {
    if (preventAccountDeletion) {
      showAlert(
        "warning",
        "No permitido",
        "No puedes editar precios porque la cuenta ya fue marcada o entregada."
      );
      return;
    }
    setEditPriceModalOpen(true);
  };

  const handleCloseEditPriceModal = () => {
    setEditPriceModalOpen(false);
  };

  const handleSaveChanges = async () => {
    if (!editedItems) {
      showAlert("info", "Sin Cambios", "No hay cambios para guardar.", false);
      return;
    }

    try {
      setSending(true);
      const sourceItems = editedItems || baseItems;
      const newPedido = buildPedidoPayload(sourceItems);
      const cantidadTotal = newPedido.reduce(
        (acc, it) => acc + Number(it.cantidad || 0),
        0
      );
      const mesaId = order?.mesaId || order?.tableId || order?.mesa_id;
      const waiterId = order?.waiter_id || order?.waiterId;
      const targetOrderIds =
        (Array.isArray(order?.orderIds) && order.orderIds.length > 0
          ? order.orderIds
          : order?.orderId
            ? [order.orderId]
            : order?.id
              ? [order.id]
              : []).filter(Boolean);

      if (targetOrderIds.length === 0) {
        throw new Error("No se encontro el identificador de la orden.");
      }

      const payload = {
        pedido: JSON.stringify(newPedido),
        cantidad: cantidadTotal,
        nota: `Total: C$${currentTotal.toFixed(2)}`,
      };
      if (mesaId) payload.mesa_id = mesaId;
      if (waiterId) payload.waiter_id = waiterId;

      await Promise.all(targetOrderIds.map((oid) => updateOrden(oid, { ...payload, order_id: oid })));

      showAlert(
        "success",
        "Cambios Guardados",
        "Los productos del pedido han sido actualizados exitosamente.",
        false
      );
      setBaseItems(sourceItems);
      setEditedItems(null);
      onOrderUpdated();
    } catch (error) {
      console.error("Error guardando cambios:", error);
      showAlert(
        "error",
        "Error",
        "No se pudieron guardar los cambios. Por favor, intentalo de nuevo.",
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
        "Pre-factura Enviada",
        "La pre-factura ha sido enviada al mesero correctamente. El mesero podra visualizarla en su panel de pedidos activos."
      );
    } catch (error) {
      console.error("Error enviando pre-factura:", error);
      showAlert("error", "Error", "No se pudo enviar la pre-factura. Por favor, intentalo de nuevo.");
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

  // Expandir items por unidad para editar/eliminar de forma individual
  const buildItems = () => {
    if (!order?.accounts) return [];
    const rows = [];
    order.accounts.forEach((account) => {
      (account.items || []).forEach((item) => {
        const qty = Number(item.quantity || item.cantidad || 0);
        const price = Number(item.unitPrice || item.precio || 0);
        const count = Math.max(1, qty || 1);
        for (let i = 0; i < count; i += 1) {
          rows.push({
            name: item.name,
            quantity: 1,
            unitPrice: price,
            total: price,
            nota: item.nota || "",
            category: item.category || "otros",
          });
        }
      });
    });
    return rows;
  };

  const aggregateItems = (list = []) => {
    const map = new Map();
    list.forEach((item, idx) => {
      const key = `${item.name || "item"}__${item.unitPrice || 0}__${item.nota || ""}`;
      if (!map.has(key)) {
        map.set(key, {
          name: item.name,
          unitPrice: item.unitPrice,
          nota: item.nota || "",
          category: item.category,
          indexes: [],
          quantity: 0,
          total: 0,
        });
      }
      const entry = map.get(key);
      entry.indexes.push(idx);
      entry.quantity += 1;
      entry.total += Number(item.total || item.unitPrice || 0);
    });
    return Array.from(map.values());
  };

  const buildPedidoPayload = (list = []) => {
    const map = new Map();
    list.forEach((item) => {
      const name = (item.name || "item").trim();
      const note = (item.nota || "").trim();
      const price = Number(item.unitPrice || 0);
      const key = `${name.toLowerCase()}|${price}|${note.toLowerCase()}`;
      const entry = map.get(key) || {
        nombre: name,
        precio: price,
        cantidad: 0,
        nota: note,
        categoria: item.category || item.categoria || null,
      };
      entry.precio = price;
      entry.cantidad += item.quantity || 1;
      entry.nota = note;
      map.set(key, entry);
    });
    return Array.from(map.values());
  };

  useEffect(() => {
    if (!order?.orderId) return;
    setBaseItems(buildItems());
    setEditedItems(null);
  }, [order?.orderId]);

  const workingItems = editedItems || baseItems;
  const aggregatedItems = aggregateItems(workingItems);
  const currentTotal = workingItems.reduce(
    (acc, it) => acc + Number(it.total || it.unitPrice || 0),
    0
  );

  const isDeliveredByKitchen =
    (order?.status || "").toLowerCase() === "entregado" ||
    (order?.kitchenStatuses || []).some(
      (k) => (k.estado || "").toLowerCase() === "entregado"
    );
  const preventAccountDeletion = isDeliveredByKitchen || hasDeliveredBarItems;

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
          {/* Informacion General */}
          <div className="transaction-section">
            <h3 className="transaction-section-title">Informacion</h3>

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
                <p style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#059669" }}>{formatCurrency(currentTotal)}</p>
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
              {aggregatedItems.map((item, index) => (
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
                      <span className="transaction-product-price">{formatCurrency(item.total)}</span>
                      <button
                        onClick={() => handleRemoveItem(item, index, item.indexes)}
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
              ))}
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
                          <p className="removal-history__reason">{req.razon || req.reason || "Sin razon"}</p>
                          <div className="removal-history__meta">
                            <span>Solicito: {req.solicitado_por || "mesero"}</span>
                            {req.autorizado_por && <span>Aprobo: {req.autorizado_por}</span>}
                            {req.rechazado_por && <span>Rechazo: {req.rechazado_por}</span>}
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
                <span style={{ color: "#6b7280" }}>{formatCurrency(currentTotal)}</span>
              </div>
              <div className="transaction-total-item transaction-total-final">
                <span>Total a Pagar:</span>
                <span>{formatCurrency(currentTotal)}</span>
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
            className="transaction-modal-btn-primary"
            onClick={handleOpenEditPriceModal}
            disabled={sending || deleting || preventAccountDeletion}
            style={{
              background: "#0ea5e9",
              color: "white",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
            title="Editar precios por producto"
          >
            <Pencil size={18} />
            Editar precio
          </button>

          <button
            onClick={handleCancelOrder}
            disabled={deleting || sending || preventAccountDeletion}
            style={{
              background:
                deleting || preventAccountDeletion ? "#9ca3af" : "#ef4444",
              color: "white",
              padding: "0.75rem 1rem",
              borderRadius: "8px",
              border: "none",
              fontSize: "0.875rem",
              fontWeight: "600",
              cursor: deleting || preventAccountDeletion ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              if (!deleting && !sending && !preventAccountDeletion)
                e.target.style.background = "#dc2626";
            }}
            onMouseLeave={(e) => {
              if (!deleting && !sending && !preventAccountDeletion)
                e.target.style.background = "#ef4444";
            }}
            title={
              preventAccountDeletion
                ? "No se puede cancelar: pedido entregado o marcado en caja."
                : deleting
                ? "Procesando..."
                : undefined
            }
          >
            {deleting ? <RefreshCw size={18} className="spin" /> : <Trash2 size={18} />}
            {deleting ? "Cancelando..." : "Cancelar Pedido"}
          </button>

          <button className="transaction-modal-btn-close" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>

      {editPriceModalOpen && (
        <div className="transaction-modal-overlay" onClick={handleCloseEditPriceModal}>
          <div
            className="transaction-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "720px", width: "100%" }}
          >
            <div className="transaction-modal-header">
              <div className="transaction-modal-title-group">
                <Pencil size={24} />
                <h3>Editar precios de productos</h3>
              </div>
              <button className="transaction-modal-close" onClick={handleCloseEditPriceModal}>
                <X size={20} />
              </button>
            </div>
            <div className="transaction-modal-body" style={{ maxHeight: "60vh", overflowY: "auto" }}>
              <p style={{ marginBottom: "0.75rem", color: "#6b7280" }}>
                Ajusta el precio de cada unidad. Los cambios se reflejan en la cuenta; recuerda guardarlos con
                <strong> "Guardar Cambios"</strong>. Esto solo afecta esta factura; el precio base del producto no se modifica.
              </p>
              <div className="transaction-products-list">
                {workingItems.map((item, idx) => (
                  <div key={`${item.name}-${idx}`} className="transaction-product-item" style={{ alignItems: "center" }}>
                    <div className="transaction-product-info">
                      <span className="transaction-product-name">
                        {item.name} <span style={{ color: "#6b7280", fontWeight: 500 }}>(#{idx + 1})</span>
                      </span>
                      {item.nota && (
                        <span style={{ color: "#6b7280", fontSize: "0.875rem" }}>Nota: {item.nota}</span>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                      <span style={{ color: "#6b7280", fontSize: "0.875rem" }}>Precio:</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          item.unitPrice === undefined || item.unitPrice === null
                            ? ""
                            : Number(item.unitPrice)
                        }
                        onChange={(e) => handlePriceChange(idx, e.target.value)}
                        style={{
                          width: "120px",
                          padding: "0.45rem",
                          borderRadius: "6px",
                          border: "1px solid #d1d5db",
                          fontWeight: 600,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="transaction-modal-footer" style={{ justifyContent: "flex-end", gap: "0.5rem" }}>
              <button className="transaction-modal-btn-close" onClick={handleCloseEditPriceModal}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

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
        title={confirmModal.type === "cancel" ? "Cancelar Pedido?" : "Eliminar Producto?"}
        message={
          confirmModal.type === "cancel" ? (
            <>
              <p>Estas seguro de que deseas <strong>CANCELAR</strong> este pedido?</p>
              <ul>
                <li>Se eliminara el pedido de cocina</li>
                <li>Se liberara la mesa</li>
                <li>Esta accion NO se puede deshacer</li>
              </ul>
            </>
          ) : (
            <p>
              Estas seguro de que deseas eliminar <strong>"{confirmModal.itemToRemove?.name}"</strong> del pedido?
            </p>
          )
        }
        confirmText={confirmModal.type === "cancel" ? "Si, Cancelar Pedido" : "Si, Eliminar"}
        cancelText="No, Volver"
        type="danger"
      />
    </div>
  );
};

export default OrderDetailsModal;






