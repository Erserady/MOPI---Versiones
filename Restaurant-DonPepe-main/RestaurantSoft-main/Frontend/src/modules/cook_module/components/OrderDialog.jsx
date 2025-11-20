import React, { useMemo } from "react";
import { Clock, ChefHat, User, Hash, Calendar, MessageSquare, UtensilsCrossed, ArrowRight, Check } from "lucide-react";
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
        {/* Header sticky rediseñado */}
        <div className="order-header-redesign">
          {/* Fila superior: Mesa + Tiempo */}
          <div className="header-top-row">
            <div className="mesa-info-compact">
              <UtensilsCrossed size={28} strokeWidth={2.5} />
              <div>
                <span className="mesa-label-compact">Mesa</span>
                <h1 className="mesa-number-compact">#{order.tableNumber}</h1>
              </div>
            </div>
            
            <div className={`timer-compact timer-${slaPhase}`}>
              <Clock size={20} />
              <div className="timer-text-group">
                <span className="timer-label-compact">Tiempo en cocina</span>
                <span className="timer-value-compact">{formatDuration(elapsedSeconds)}</span>
              </div>
            </div>
          </div>
          
          {/* Barra de progreso con botón de acción integrado */}
          <div className="progress-with-action">
            <div className="progress-badges-bar">
              {STATUS_STEPS.map((step, index) => {
                const isCompleted = index < currentStepIndex;
                const isCurrent = index === currentStepIndex;
                const isPending = index > currentStepIndex;
                
                // Versión corta para badges compactos
                const shortLabel = step.label === "Listo para entregar" ? "Listo" : step.label;
                
                return (
                  <div
                    key={step.id}
                    className={`progress-badge ${
                      isCompleted ? 'completed' : isCurrent ? 'current' : 'pending'
                    }`}
                    data-status={step.id}
                  >
                    <ChefHat size={16} strokeWidth={2.5} />
                    <span>{shortLabel}</span>
                    {isCompleted && <Check size={14} strokeWidth={3} />}
                  </div>
                );
              })}
            </div>
            
            {/* Botón de acción al lado de la barra de progreso */}
            {actions.length > 0 && (
              <button
                onClick={() => onChangeStatus(actions[0].target)}
                className={`action-button-progress status-${order.status}`}
              >
                {actions[0].label}
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
        
        {/* Contenido scrollable */}
        <div className="order-detail-content">

        {/* Comentarios del platillo (ahora incluye nombre y cantidad) - Movido arriba */}

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

        {/* Información adicional al final - Rediseñada */}
        <div className="order-meta-redesign">
          <div className="meta-card">
            <div className="meta-icon-compact">
              <Hash size={16} />
            </div>
            <div className="meta-text">
              <span className="meta-label-compact">Pedido</span>
              <span className="meta-value-compact">{order.orderNumber || "Sin folio"}</span>
            </div>
          </div>
          
          <div className="meta-card">
            <div className="meta-icon-compact">
              <User size={16} />
            </div>
            <div className="meta-text">
              <span className="meta-label-compact">Mesero</span>
              <span className="meta-value-compact">{order.waiterName || "Sin asignar"}</span>
            </div>
          </div>
          
          <div className="meta-card">
            <div className="meta-icon-compact">
              <Calendar size={16} />
            </div>
            <div className="meta-text">
              <span className="meta-label-compact">Hora</span>
              <span className="meta-value-compact">{formatDateTime(order.createdAt)}</span>
            </div>
          </div>
        </div>
        </div>
      </div>
    </CustomDialog>
  );
};

export default OrderDialog;
