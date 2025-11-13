import React, { useMemo } from "react";
import { Clock3, ChefHat } from "lucide-react";
import CustomDialog from "../../../common/CustomDialog";
import {
  STATUS_LABELS,
  STATUS_STEPS,
  formatDuration,
  formatDateTime,
} from "../utils/orderUtils";

const OrderDialog = ({
  order,
  isOpen,
  onClose,
  onChangeStatus,
  elapsedSeconds,
}) => {
  if (!order) return null;
  const currentStepIndex = STATUS_STEPS.findIndex(
    (step) => step.id === order.status
  );

  const actions = [];

  if (order.status === "pendiente") {
    actions.push({
      id: "send",
      label: "Preparando",
      target: "en_preparacion",
    });
  }

  if (order.status === "en_preparacion") {
    actions.push({
      id: "ready",
      label: "Listo",
      target: "listo",
    });
  }

  if (order.status === "listo") {
    actions.push({
      id: "deliver",
      label: "Entregado",
      target: "entregado",
    });
  }

  const dishNotes = useMemo(() => {
    if (!Array.isArray(order.items)) return [];
    return order.items
      .map((item, index) => {
        const rawNote =
          (typeof item.nota === "string" && item.nota) ||
          (typeof item.description === "string" && item.description) ||
          (typeof item.note === "string" && item.note) ||
          (typeof item.notas === "string" && item.notas);
        if (!rawNote) return null;
        const cleaned = rawNote.trim();
        if (!cleaned || /^total\s*:/i.test(cleaned)) return null;
        return {
          key: `${item.nombre || "platillo"}-${index}`,
          name: item.nombre || "Platillo",
          note: cleaned,
        };
      })
      .filter(Boolean);
  }, [order.items]);

  return (
    <CustomDialog isOpen={isOpen} onClose={onClose}>
      <div className="kitchen-dialog">
        <header className="kitchen-dialog__header">
          <div>
            <p className="label">Mesa</p>
            <h2>#{order.tableNumber}</h2>
          </div>
          <div className="status-chip large">
            <ChefHat size={18} />
            <span>{STATUS_LABELS[order.status] || order.status}</span>
          </div>
        </header>

        <section className="kitchen-dialog__summary">
          <div>
            <p className="label">Pedido</p>
            <p className="body-strong">{order.orderNumber || "Sin folio"}</p>
          </div>
          <div>
            <p className="label">Tiempo en cocina</p>
            <p className="body-strong">
              <Clock3 size={16} /> {formatDuration(elapsedSeconds)}
            </p>
          </div>
        </section>

        <section className="kitchen-dialog__details">
          <div>
            <h4>Mesero</h4>
            <p>{order.waiterName || "Sin asignar"}</p>
          </div>
          <div>
            <h4>Notas</h4>
            {dishNotes.length > 0 ? (
              <ul className="kitchen-dialog__notes">
                {dishNotes.map((entry) => (
                  <li key={entry.key}>
                    <strong>{entry.name}:</strong>
                    <span>{entry.note}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Sin instrucciones especiales.</p>
            )}
          </div>
        </section>

        <section className="kitchen-dialog__items">
          <h4>Detalle de platillos</h4>
          {Array.isArray(order.items) && order.items.length > 0 ? (
            <ul>
              {order.items.map((item, index) => (
                <li key={`${item.nombre}-${index}`}>
                  <span>{item.nombre || "Platillo"}</span>
                  <span>x{item.cantidad || 1}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="body-muted">Sin platillos registrados.</p>
          )}
        </section>

        <section className="kitchen-dialog__times">
          <div>
            <span className="label">Creado</span>
            <strong>{formatDateTime(order.createdAt)}</strong>
          </div>
          <div>
            <span className="label">En cocina desde</span>
            <strong>
              {order.kitchenSince ? formatDateTime(order.kitchenSince) : "--"}
            </strong>
          </div>
        </section>

        <section className="kitchen-dialog__timeline">
          {STATUS_STEPS.map((step, index) => (
            <div
              key={step.id}
              className={`timeline-step ${index <= currentStepIndex ? "active" : ""}`}
            >
              <span className="timeline-dot" />
              <span className="timeline-label">{step.label}</span>
            </div>
          ))}
        </section>

        <section className="kitchen-dialog__actions">
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={() => onChangeStatus(action.target)}
              className="ghost-button"
            >
              {action.label}
            </button>
          ))}
        </section>
      </div>
    </CustomDialog>
  );
};

export default OrderDialog;
