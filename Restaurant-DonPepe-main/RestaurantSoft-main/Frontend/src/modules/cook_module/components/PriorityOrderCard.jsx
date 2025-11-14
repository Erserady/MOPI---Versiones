import React, { useState, useEffect, useMemo } from "react";
import { Clock, Medal } from "lucide-react";
import OrderDialog from "./OrderDialog";
import { formatDuration, getSlaPhase, STATUS_LABELS } from "../utils/orderUtils";

/**
 * Tarjeta de orden con indicador de prioridad numérica
 */
const PriorityOrderCard = ({ order, priority, onChangeStatus }) => {
  const [now, setNow] = useState(Date.now());
  const [isDialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const effectiveElapsedSeconds = useMemo(() => {
    const startTimestamp = order.createdAt || order.kitchenSince;
    if (!startTimestamp) return null;
    const startMs = new Date(startTimestamp).getTime();
    return Math.max(0, Math.floor((now - startMs) / 1000));
  }, [order.createdAt, order.kitchenSince, now]);

  const slaPhase = getSlaPhase(effectiveElapsedSeconds);

  const handleOpen = () => setDialogOpen(true);
  const handleStatusRequest = (nextStatus) => {
    onChangeStatus(order.recordId, nextStatus);
  };

  // Calcular total de platillos sumando cantidades
  const totalDishes = useMemo(() => {
    if (!Array.isArray(order.items)) return 0;
    return order.items.reduce((sum, item) => sum + (item.cantidad || 1), 0);
  }, [order.items]);

  const ariaLabel = `Prioridad ${priority}, Mesa ${order.tableNumber}, ${
    STATUS_LABELS[order.status] || order.status
  }`;

  return (
    <>
      <button
        type="button"
        className={`priority-order-card status-${order.status} sla-${slaPhase}`}
        onClick={handleOpen}
        aria-label={ariaLabel}
      >
        {/* Badge de prioridad */}
        <div className="priority-badge">
          <Medal size={14} />
          <span className="priority-number">#{priority}</span>
        </div>

        {/* Header: Mesa y Estado */}
        <div className="priority-card-header">
          <div className="priority-card-mesa">
            <span className="mesa-label">MESA</span>
            <span className="mesa-number">{order.tableNumber}</span>
          </div>
        </div>

        {/* Status badge */}
        <div className="priority-card-status">
          <span className="status-label">
            {STATUS_LABELS[order.status] || order.status}
          </span>
        </div>

        {/* Footer: Timer e items */}
        <div className="priority-card-footer">
          <div className="priority-card-timer">
            <Clock size={14} />
            <span className="timer-text">{formatDuration(effectiveElapsedSeconds)}</span>
          </div>
          <div className="priority-card-items">
            <span>{totalDishes} {totalDishes === 1 ? 'platillo' : 'platillos'}</span>
          </div>
        </div>
      </button>

      <OrderDialog
        order={order}
        isOpen={isDialogOpen}
        onClose={() => setDialogOpen(false)}
        onChangeStatus={handleStatusRequest}
        elapsedSeconds={effectiveElapsedSeconds}
      />
    </>
  );
};

export default PriorityOrderCard;
