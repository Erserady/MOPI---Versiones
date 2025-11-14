import { useEffect, useMemo, useState } from "react";
import { Clock } from "lucide-react";
import OrderDialog from "./OrderDialog";
import { formatDuration, getSlaPhase } from "../utils/orderUtils";

const OrderCard = ({ order, onChangeStatus }) => {
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

  // Determinar si está siendo atendida
  const isBeingAttended = order.status === "en_preparacion";

  const handleOpen = () => setDialogOpen(true);
  const handleStatusRequest = (nextStatus) => {
    onChangeStatus(order.recordId, nextStatus);
  };

  const ariaLabel = `Mesa ${order.tableNumber}, ${isBeingAttended ? "Atendiendo" : "Pendiente"}`;

  return (
    <>
      <button
        type="button"
        className={`order-card-compact sla-${slaPhase}`}
        onClick={handleOpen}
        aria-label={ariaLabel}
      >
        <div className="order-card-compact__header">
          <span className="order-card-compact__table">Mesa {order.tableNumber}</span>
          <div className={`order-card-compact__status ${isBeingAttended ? "attending" : "waiting"}`}>
            <span className="status-dot"></span>
            <span className="status-text">{isBeingAttended ? "Atendiendo" : "Pendiente"}</span>
          </div>
        </div>
        <div className="order-card-compact__timer">
          <Clock size={18} />
          <span className="timer-value">{formatDuration(effectiveElapsedSeconds)}</span>
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

export default OrderCard;
