import PayCard from "./PayCard";
import "../styles/pay_section.css";
import { useDataSync } from "../../../hooks/useDataSync";
import {
  getMesasConOrdenesPendientes,
  getPendingRemoveRequests,
  approveRemoveRequest,
  rejectRemoveRequest,
} from "../../../services/cashierService";
import { RefreshCw, AlertTriangle, CheckCircle, XCircle, X } from "lucide-react";
import { useState } from "react";
import { getCurrentUserName } from "../../../utils/auth";
import "../styles/reject_remove_modal.css";

const KITCHEN_BLOCK_STATES = ["pendiente", "en_preparacion"];

const PaySection = () => {
  const [processing, setProcessing] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectModalReq, setRejectModalReq] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState("");
  // Sincronizar mesas desde el backend (actualiza cada 3 segundos)
  const { data: mesasData, loading, error, refetch } = useDataSync(
    getMesasConOrdenesPendientes,
    3000
  );
  // Sincronizar solicitudes de eliminación (cada 4 segundos)
  const {
    data: pendingRemovals,
    loading: removalsLoading,
    refetch: refetchRemovals,
  } = useDataSync(getPendingRemoveRequests, 4000);

  if (loading && !mesasData) {
    return (
      <div>
        <h1>Pedidos Listos para Pagar</h1>
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <RefreshCw className="spin" size={32} />
          <p>Cargando pedidos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1>Pedidos Listos para Pagar</h1>
        <div style={{ textAlign: "center", padding: "2rem", color: "red" }}>
          <p>Error al cargar pedidos: {error}</p>
        </div>
      </div>
    );
  }

  // Transformar datos del backend al formato esperado por PayCard
  const ordersFormatted =
    mesasData?.map((mesa) => {
      const mesaOrders = Array.isArray(mesa.ordenes_pendientes)
        ? mesa.ordenes_pendientes
        : [];

      const hasKitchenHold = mesaOrders.some((orden) =>
        KITCHEN_BLOCK_STATES.includes((orden.estado || "").toLowerCase())
      );

      let allItems = [];
      let totalMesa = 0;

      mesaOrders.forEach((orden) => {
        try {
          const pedidoItems = JSON.parse(orden.pedido);

          pedidoItems.forEach((item) => {
            const cantidad = Number(item.cantidad) || 0;
            const precio = Number(item.precio) || 0;
            const subtotal = cantidad * precio;

            allItems.push({
              type: item.categoria || item.category || "Principal",
              ready: true,
              name: item.nombre,
              quantity: cantidad,
              unitPrice: precio,
              subtotal,
              nota: item.nota || "",
              category: item.categoria || item.category || "Principal",
            });
            totalMesa += subtotal;
          });
        } catch (parseError) {
          console.error("Error parseando pedido:", orden.pedido, parseError);
          allItems.push({
            type: "Principal",
            ready: true,
            name: orden.pedido,
            quantity: orden.cantidad,
            unitPrice: 0,
            subtotal: 0,
          });
        }
      });

      // Determinar el estado general - priorizar payment_requested
      const orderStatus = mesaOrders.find(o => o.estado === 'payment_requested')?.estado || 
                         mesaOrders.find(o => o.estado === 'prefactura_enviada')?.estado ||
                         mesaOrders[0]?.estado || 
                         'completed';

      return {
        id: `MESA-${mesa.mesa_id}`,
        mesaId: mesa.mesa_id,
        tableId: mesa.mesa_id,
        orderIds: mesaOrders.map((orden) => orden.id),
        orderId: mesaOrders[0]?.id, // ID de la primera orden para enviar pre-factura
        tableNumber: mesa.mesa_nombre,
        waiter: mesaOrders[0]?.waiter_name || 
                mesaOrders[0]?.mesero || 
                mesaOrders[0]?.cliente || 
                "Sin asignar",
        kitchenHold: hasKitchenHold,
        kitchenStatuses: mesaOrders.map((orden) => ({
          id: orden.id,
          orderId: orden.order_id,
          estado: orden.estado,
        })),
        createdAt: new Date().toISOString(),
        status: orderStatus, // Estado real de la orden
        accounts: [
          {
            accountId: `ACC-${mesa.mesa_id}`,
            isPaid: false,
            label: "Cuenta principal",
            items: allItems,
            subtotal: totalMesa,
          },
        ],
        total: totalMesa,
      };
    }) || [];

  return (
    <div>
      <h1>
        Pedidos Listos para Pagar: <span>{ordersFormatted.length}</span>
      </h1>

      <section className="pay-card-section">
        {ordersFormatted.map((order) => (
          <PayCard key={order.id} order={order} onOrderUpdate={refetch} />
        ))}
      </section>

      {ordersFormatted.length === 0 && (
        <p style={{ textAlign: "center", padding: "2rem" }}>
          No hay pedidos pendientes de pago en este momento
        </p>
      )}

      <section className="removal-requests removal-requests--bottom">
        <div className="removal-requests__header">
          <div className="removal-requests__title">
            <AlertTriangle size={18} />
            <h2>Solicitudes de eliminación</h2>
            <span className="removal-requests__badge">
              {pendingRemovals?.length || 0}
            </span>
          </div>
          <small>Autorización de cajero requerida</small>
        </div>

        {removalsLoading && (
          <div className="removal-requests__loading">
            <RefreshCw className="spin" size={22} />
            <span>Actualizando solicitudes...</span>
          </div>
        )}

        {!removalsLoading && (!pendingRemovals || pendingRemovals.length === 0) && (
          <p className="removal-requests__empty">
            No hay solicitudes pendientes en este momento.
          </p>
        )}

        <div className="removal-requests__list">
          {(pendingRemovals || []).map((req) => (
            <article key={req.id} className="removal-card">
              <div className="removal-card__info">
                <div className="removal-card__title">
                  <span className="pill pill--danger">x{req.cantidad || 1}</span>
                  <div className="removal-card__name">{req.item_nombre || "Platillo"}</div>
                </div>
                <div className="removal-card__meta-grid">
                  <div>
                    <span className="meta-label">Mesa</span>
                    <strong>{req.mesa || "N/D"}</strong>
                  </div>
                  <div>
                    <span className="meta-label">Orden</span>
                    <strong>{req.order_identifier || req.order_id || "N/D"}</strong>
                  </div>
                  <div>
                    <span className="meta-label">Solicitado por</span>
                    <strong>{req.solicitado_por || "mesero"}</strong>
                  </div>
                  <div>
                    <span className="meta-label">Hora</span>
                    <strong>
                      {req.created_at
                        ? new Date(req.created_at).toLocaleTimeString("es-ES", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "--:--"}
                    </strong>
                  </div>
                </div>
                <div className="removal-card__reason">
                  <span>Razón</span>
                  <p>{req.razon || "Sin razón"}</p>
                </div>
              </div>
              <div className="removal-card__actions">
                <button
                  className="removal-btn removal-btn--approve"
                  disabled={processing}
                  onClick={async () => {
                    try {
                      setProcessing(true);
                      await approveRemoveRequest(req.id, getCurrentUserName() || "cajero");
                      refetchRemovals();
                    } finally {
                      setProcessing(false);
                    }
                  }}
                >
                  <CheckCircle size={16} />
                  Aprobar
                </button>
                <button
                  className="removal-btn removal-btn--reject"
                  disabled={processing}
                  onClick={() => {
                    setRejectModalReq(req);
                    setRejectReason("");
                    setRejectError("");
                    setRejectModalOpen(true);
                  }}
                >
                  <XCircle size={16} />
                  Rechazar
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {rejectModalOpen && rejectModalReq && (
        <div className="reject-modal__overlay" onClick={() => setRejectModalOpen(false)}>
          <div className="reject-modal" onClick={(e) => e.stopPropagation()}>
            <div className="reject-modal__header">
              <h3>Rechazar solicitud</h3>
              <button className="reject-modal__close" onClick={() => setRejectModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="reject-modal__body">
              <p className="reject-modal__item">
                Item: <strong>{rejectModalReq.item_nombre || "Platillo"}</strong>
              </p>
              <label className="reject-modal__label">
                Motivo de rechazo (requerido)
                <textarea
                  className="reject-modal__textarea"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={4}
                  maxLength={300}
                  placeholder="Ej: Error en la solicitud, platillo ya servido, etc."
                />
              </label>
              {rejectError && <p className="reject-modal__error">{rejectError}</p>}
            </div>
            <div className="reject-modal__actions">
              <button
                className="reject-modal__btn cancel"
                onClick={() => setRejectModalOpen(false)}
              >
                Cancelar
              </button>
              <button
                className="reject-modal__btn confirm"
                disabled={processing}
                onClick={async () => {
                  const motivo = rejectReason.trim();
                  if (!motivo) {
                    setRejectError("El motivo es obligatorio.");
                    return;
                  }
                  setRejectError("");
                  try {
                    setProcessing(true);
                    await rejectRemoveRequest(
                      rejectModalReq.id,
                      getCurrentUserName() || "cajero",
                      motivo
                    );
                    setRejectModalOpen(false);
                    refetchRemovals();
                  } finally {
                    setProcessing(false);
                  }
                }}
              >
                Rechazar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaySection;
