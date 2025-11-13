import { useEffect, useMemo, useState } from "react";
import { Clock3 } from "lucide-react";
import OrderDialog from "./OrderDialog";
import { STATUS_LABELS, formatDuration, getSlaPhase } from "../utils/orderUtils";

const OrderCard = ({ order, onChangeStatus }) => {
  const [now, setNow] = useState(Date.now());
  const [isDialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const effectiveElapsedSeconds = useMemo(() => {
    const startTimestamp = order.kitchenSince || order.createdAt;
    if (!startTimestamp) return null;
    const startMs = new Date(startTimestamp).getTime();
    return Math.max(0, Math.floor((now - startMs) / 1000));
  }, [order.kitchenSince, order.createdAt, now]);

  const slaPhase = getSlaPhase(effectiveElapsedSeconds);

  const handleOpen = () => setDialogOpen(true);
  const handleStatusRequest = (nextStatus) => {
    onChangeStatus(order.recordId, nextStatus);
  };

  const ariaLabel = `Mesa ${order.tableNumber}, ${
    STATUS_LABELS[order.status] || order.status
  }`;

  return (
    <>
      <button
        type="button"
        className={`kitchen-order-bubble status-${order.status} sla-${slaPhase}`}
        onClick={handleOpen}
        aria-label={ariaLabel}
      >
        <span className="bubble__status">
          {STATUS_LABELS[order.status] || order.status}
        </span>
        <div className="bubble__table">
          <small>Mesa</small>
          <strong>{order.tableNumber}</strong>
        </div>
        <div className="bubble__order">
          <span>{order.orderNumber || "Sin folio"}</span>
        </div>
        <div className="bubble__timer">
          <Clock3 size={16} />
          <span>{formatDuration(effectiveElapsedSeconds)}</span>
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
