import React, { useEffect, useMemo, useState } from "react";
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
import { actualizarEstadoPlatillo } from "../../../services/cookService";
import { AlertService } from "./CustomAlert";

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

  const [itemsState, setItemsState] = useState(cookableItems);

  useEffect(() => {
    setItemsState(cookableItems);
  }, [cookableItems]);

  const readiness = useMemo(() => {
    const total = itemsState.length;
    const ready = itemsState.filter((item) => item.listo_en_cocina).length;
    return {
      total,
      ready,
      allReady: total === 0 || ready === total,
    };
  }, [itemsState]);

  const actionDisabled =
    actions.length > 0 &&
    actions[0].target === "listo" &&
    !readiness.allReady;

  const handleToggleReady = async (item, checked) => {
    if (item.listo_en_cocina && checked === false) {
      return; // No permitir desmarcar una vez marcado como listo
    }
    const snapshot = itemsState.map((i) => ({ ...i }));
    const recordId = order.recordId;
    const itemId = item.item_uid || item.uid || item.id;
    if (!recordId || !itemId) {
      AlertService.error(
        "Error de identificación",
        "No se pudo identificar la orden o el platillo."
      );
      return;
    }
    setItemsState((prev) =>
      prev.map((i) =>
        (i.item_uid || i.uid || i.id) === itemId
          ? { ...i, listo_en_cocina: checked }
          : i
      )
    );
    try {
      await actualizarEstadoPlatillo(recordId, itemId, checked);
      AlertService.success(
        "Platillo actualizado",
        `${item.nombre} marcado como ${checked ? 'listo' : 'pendiente'}`
      );
    } catch (error) {
      console.error("No se pudo actualizar el platillo:", error);
      AlertService.error(
        "Error al actualizar",
        error.message || "No se pudo actualizar el platillo en cocina."
      );
      setItemsState(snapshot);
    }
  };

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
                    className={`progress-badge ${isCompleted ? 'completed' : isCurrent ? 'current' : 'pending'
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
                disabled={actionDisabled}
                title={
                  actionDisabled
                    ? "Marca todos los platillos como listos para pasar el pedido a 'Listo'"
                    : undefined
                }
              >
                {actions[0].label}
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Contenido scrollable */}
        <div className="order-detail-content">

          {/* Platillos del pedido con comentarios integrados */}
          <div className="order-detail-section dishes-section">
            <div className="section-header">
              <UtensilsCrossed size={20} />
              <h3>Platillos a preparar</h3>
              <span style={{ marginLeft: "auto", fontSize: "0.9rem", color: "#4b5563" }}>
                {readiness.ready}/{readiness.total} listos
              </span>
            </div>
            <div className="dishes-list">
              {itemsState.map((item, index) => {
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

                // Verificar si tiene nota válida (no vacía ni solo "total:")
                const hasNote = noteText && noteText.length > 0 && !/^total\s*:/i.test(noteText);

                const itemKey = item.item_uid || item.uid || item.id || `${item.nombre}-${index}`;

                return (
                  <div key={itemKey} className="dish-item-wrapper">
                    <div className="dish-item">
                      <div className="dish-quantity">
                        <span>{item.cantidad || 1}x</span>
                      </div>
                    <div className="dish-details">
                      <span className="dish-name">{item.nombre}</span>
                      {item.categoria && <span className="dish-category">{item.categoria}</span>}
                    </div>
                    <label className="dish-ready-toggle">
                      <input
                        type="checkbox"
                        checked={!!item.listo_en_cocina}
                        onChange={(e) => handleToggleReady(item, e.target.checked)}
                        disabled={!!item.listo_en_cocina}
                        aria-label={`Marcar ${item.nombre} como listo`}
                      />
                      <span aria-hidden="true"></span>
                    </label>
                  </div>

                    {/* Comentario del platillo - Solo si tiene */}
                    {hasNote && (
                      <div className="dish-note">
                        <MessageSquare size={14} />
                        <span>{noteText}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

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
