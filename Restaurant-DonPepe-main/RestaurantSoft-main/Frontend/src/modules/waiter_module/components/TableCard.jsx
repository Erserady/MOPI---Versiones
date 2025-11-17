import React from "react";
import { useNavigate } from "react-router-dom";
import { Users, UserCircle, Edit3, Plus, CheckCircle } from "lucide-react";

const TableCard = ({ tables }) => {
  const navigate = useNavigate();
  const hasActiveOrder = Boolean(tables.currentOrderId || tables.currentOrder);
  const buttonLabel = hasActiveOrder ? "Editar orden" : "Anadir orden";

  const handleNavigate = () => {
    const mesaId = tables.mesa_id || tables.tableNumber;
    navigate(`/waiter-dashboard/${mesaId}/orders-handler`, {
      state: {
        mesaId,
        tableNumber: tables.tableNumber,
        currentOrder: tables.currentOrder || null,
      },
    });
  };

  const statusConfig = {
    libre: {
      color: "#10b981",
      bg: "#d1fae5",
      label: "LIBRE",
      icon: <CheckCircle size={16} />
    },
    ocupada: {
      color: "#ef4444",
      bg: "#fee2e2",
      label: "OCUPADA",
      icon: <Users size={16} />
    },
    reservada: {
      color: "#f59e0b",
      bg: "#fef3c7",
      label: "RESERVADA",
      icon: <UserCircle size={16} />
    }
  };

  const status = statusConfig[tables.tableStatus.toLowerCase()] || statusConfig.libre;

  return (
    <article className={`table-card-modern shadow ${tables.tableStatus.toLowerCase()}`}>
      {/* Estado Badge */}
      <div className="table-status-badge" style={{ background: status.bg, color: status.color }}>
        {status.icon}
        <span>{status.label}</span>
      </div>

      {/* Número de Mesa */}
      <div className="table-number-display">
        <span className="table-number">{tables.tableNumber}</span>
        <span className="table-label">Mesa</span>
      </div>

      {/* Información */}
      <div className="table-info-grid">
        <div className="info-item">
          <Users size={18} className="info-icon" />
          <div>
            <span className="info-label">Capacidad</span>
            <span className="info-value">{tables.guestCount} personas</span>
          </div>
        </div>

        <div className="info-item">
          <UserCircle size={18} className="info-icon" />
          <div>
            <span className="info-label">Mesero</span>
            <span className="info-value">{tables.assignedWaiter || "Sin asignar"}</span>
          </div>
        </div>
      </div>

      {/* Botón de Acción */}
      <button 
        className={`table-action-btn ${hasActiveOrder ? "edit" : "add"}`}
        onClick={handleNavigate}
      >
        {hasActiveOrder ? (
          <>
            <Edit3 size={18} />
            <span>Editar Orden</span>
          </>
        ) : (
          <>
            <Plus size={18} />
            <span>Tomar Orden</span>
          </>
        )}
      </button>
    </article>
  );
};

export default TableCard;
