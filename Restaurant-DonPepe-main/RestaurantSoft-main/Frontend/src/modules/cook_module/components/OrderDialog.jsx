import React, { useMemo } from "react";
import { Clock, ChefHat, User, Hash, Calendar, MessageSquare, UtensilsCrossed, ArrowRight } from "lucide-react";
import CustomDialog from "../../../common/CustomDialog";
import {
  STATUS_LABELS,
  STATUS_STEPS,
  formatDuration,
  formatDateTime,
  getSlaPhase,
  filterCookableItems,
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

  const slaPhase = getSlaPhase(elapsedSeconds);

  // Filtrar items que no deben mostrarse en cocina (bebidas, licores, cigarros, etc.)
  const cookableItems = useMemo(() => {
    return filterCookableItems(order.items || []);
  }, [order.items]);

  return (
    <CustomDialog isOpen={isOpen} onClose={onClose}>
      <div className="order-detail-dialog">
        {/* Header con información principal */}
        <div className="order-detail-header">
          <div className="order-detail-header__main">
            <div className="order-detail-hero">
              <div className="hero-icon">
                <UtensilsCrossed size={32} strokeWidth={2.5} />
              </div>
              <div className="hero-info">
                <span className="hero-label">Mesa</span>
                <h1 className="hero-table">#{order.tableNumber}</h1>
              </div>
            </div>
            <div className={`order-detail-timer timer-${slaPhase}`}>
              <Clock size={24} strokeWidth={2.5} />
              <div className="timer-content">
                <span className="timer-label">Tiempo en cocina</span>
                <span className="timer-value">{formatDuration(elapsedSeconds)}</span>
              </div>
            </div>
          </div>
          <div className={`order-detail-status status-${order.status}`}>
            <ChefHat size={18} />
            <span>{STATUS_LABELS[order.status] || order.status}</span>
          </div>
        </div>

        {/* Grid de información clave */}
        <div className="order-detail-meta">
          <div className="meta-item">
            <div className="meta-icon">
              <Hash size={18} />
            </div>
            <div className="meta-content">
              <span className="meta-label">Pedido</span>
              <span className="meta-value">{order.orderNumber || "Sin folio"}</span>
            </div>
          </div>
          <div className="meta-item">
            <div className="meta-icon">
              <User size={18} />
            </div>
            <div className="meta-content">
              <span className="meta-label">Mesero</span>
              <span className="meta-value">{order.waiterName || "Sin asignar"}</span>
            </div>
          </div>
          <div className="meta-item">
            <div className="meta-icon">
              <Calendar size={18} />
            </div>
            <div className="meta-content">
              <span className="meta-label">Hora de entrada</span>
              <span className="meta-value">{formatDateTime(order.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Platillos */}
        <div className="order-detail-section">
          <div className="section-header">
            <UtensilsCrossed size={20} />
            <h3>Platillos del pedido</h3>
          </div>
          {cookableItems.length > 0 ? (
            <div className="dishes-grid">
              {cookableItems.map((item, index) => (
                <div key={`${item.nombre}-${index}`} className="dish-card">
                  <div className="dish-info">
                    <span className="dish-name">{item.nombre || "Platillo"}</span>
                    <span className="dish-quantity">x{item.cantidad || 1}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">No hay platillos para cocinar en este pedido</p>
          )}
        </div>

        {/* Comentarios del platillo - Solo se muestra si hay comentarios */}
        {(() => {
          // Filtrar platillos que tienen comentarios (solo items cocinables)
          const itemsWithComments = cookableItems
                .map((item, index) => {
                  // Obtener la nota del platillo
                  let noteText = '';
                  if (item.nota && typeof item.nota === 'string') {
                    noteText = item.nota.trim();
                  } else if (item.note && typeof item.note === 'string') {
                    noteText = item.note.trim();
                  } else if (item.notas && typeof item.notas === 'string') {
                    noteText = item.notas.trim();
                  } else if (item.description && typeof item.description === 'string') {
                    noteText = item.description.trim();
                  } else if (item.comentarios && typeof item.comentarios === 'string') {
                    noteText = item.comentarios.trim();
                  } else if (item.observaciones && typeof item.observaciones === 'string') {
                    noteText = item.observaciones.trim();
                  }

                  // Filtrar notas vacías o que sean solo "total:"
                  const hasNote = noteText && noteText.length > 0 && !/^total\s*:/i.test(noteText);
                  
                  return hasNote ? { ...item, noteText, index } : null;
                })
                .filter(Boolean);

          // Solo renderizar la sección si hay comentarios
          return itemsWithComments.length > 0 ? (
            <div className="order-detail-section notes-section">
              <div className="section-header">
                <MessageSquare size={20} />
                <h3>Comentarios del platillo</h3>
              </div>
              <div className="special-notes">
                {itemsWithComments.map((item) => (
                  <div key={`comment-${item.nombre}-${item.index}`} className="special-note">
                    <div className="note-dish">
                      <span className="note-dish-name">{item.nombre}</span>
                      <span className="note-dish-qty">x{item.cantidad || 1}</span>
                    </div>
                    <div className="note-text">
                      <MessageSquare size={14} />
                      <span>{item.noteText}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null;
        })()}

        {/* Timeline de progreso */}
        <div className="order-detail-section">
          <div className="section-header">
            <ChefHat size={20} />
            <h3>Progreso del pedido</h3>
          </div>
          <div className="progress-timeline">
            {STATUS_STEPS.map((step, index) => {
              const isActive = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;
              return (
                <div
                  key={step.id}
                  className={`progress-step ${
                    isActive ? "active" : ""
                  } ${isCurrent ? "current" : ""}`}
                >
                  <div className="step-marker">
                    {isActive && <div className="step-marker-inner"></div>}
                  </div>
                  <div className="step-content">
                    <span className="step-label">{step.label}</span>
                    {index < STATUS_STEPS.length - 1 && (
                      <ArrowRight className="step-arrow" size={16} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Acciones */}
        {actions.length > 0 && (
          <div className="order-detail-actions">
            {actions.map((action) => (
              <button
                key={action.id}
                onClick={() => onChangeStatus(action.target)}
                className="action-button"
              >
                {action.label}
                <ArrowRight size={18} />
              </button>
            ))}
          </div>
        )}
      </div>
    </CustomDialog>
  );
};

export default OrderDialog;
