import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, UserCircle, Edit3, Plus, CheckCircle, Lock, DollarSign } from "lucide-react";
import { getCurrentUserId } from "../../../utils/auth";
import BlockedTableModal from "./BlockedTableModal";

const TableCard = ({ tables }) => {
  const navigate = useNavigate();
  const currentWaiterId = getCurrentUserId();
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const hasActiveOrder = Boolean(tables.currentOrderId || tables.currentOrder);
  const buttonLabel = hasActiveOrder ? "Editar orden" : "Anadir orden";
  
  // Verificar si esta mesa puede ser atendida por el mesero actual
  // Solo bloquear si:
  // 1. Hay orden activa
  // 2. Y la mesa tiene waiter_id asignado
  // 3. Y ese waiter_id NO es del usuario actual
  const waiterIdStr = tables.waiterId ? String(tables.waiterId) : null;
  const currentWaiterIdStr = currentWaiterId ? String(currentWaiterId) : null;
  
  const hasWaiterAssigned = waiterIdStr !== null;
  const isOtherWaiter = hasWaiterAssigned && waiterIdStr !== currentWaiterIdStr;
  const isBlocked = hasActiveOrder && isOtherWaiter;
  
  console.log(`🎴 Mesa ${tables.tableNumber} - Estado:`, {
    hasActiveOrder,
    waiterIdStr,
    currentWaiterIdStr,
    hasWaiterAssigned,
    isOtherWaiter,
    isBlocked,
    tableStatus: tables.tableStatus
  });

  const handleNavigate = () => {
    console.log(`🎯 Click en mesa ${tables.tableNumber}:`, {
      isBlocked,
      hasActiveOrder,
      isOtherWaiter,
      waiterId: tables.waiterId,
      currentWaiterId
    });
    
    // Prevenir navegación si la mesa está bloqueada
    if (isBlocked) {
      console.log(`🚫 Navegación bloqueada - Mesa atendida por ${tables.assignedWaiter}`);
      setShowBlockedModal(true);
      return;
    }
    
    console.log(`✅ Navegando a mesa ${tables.tableNumber}`);
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
      icon: <CheckCircle size={12} />
    },
    ocupada: {
      color: "#ef4444",
      bg: "#fee2e2",
      label: "OCUPADA",
      icon: <Users size={12} />
    },
    reservada: {
      color: "#f59e0b",
      bg: "#fef3c7",
      label: "RESERVADA",
      icon: <UserCircle size={12} />
    }
  };

  const status = statusConfig[tables.tableStatus.toLowerCase()] || statusConfig.libre;

  return (
    <>
      <article 
        className={`table-card-modern ${tables.tableStatus.toLowerCase()} ${isBlocked ? 'blocked' : ''} ${tables.orderStatus === 'payment_requested' ? 'payment-requested' : ''}`}
        onClick={handleNavigate}
        title={isBlocked ? `Mesa atendida por ${tables.assignedWaiter}` : `Mesa ${tables.tableNumber} - ${tables.tableStatus}`}
      >
        {/* Badge de estado minimalista (punto) */}
        <div className="table-status-badge"></div>

        {/* Icono de cuenta solicitada */}
        {tables.orderStatus === 'payment_requested' && (
          <div style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            background: '#f59e0b',
            borderRadius: '50%',
            padding: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            zIndex: 10
          }}>
            <DollarSign size={16} color="white" />
          </div>
        )}

        {/* Número de Mesa */}
        <div className="table-number-display">
          <span className="table-number">{tables.tableNumber}</span>
        </div>

        {/* Info del Mesero - Solo si está asignado */}
        {tables.assignedWaiter && (
          <div className="table-info-grid">
            <div className="info-item">
              <UserCircle size={12} className="info-icon" />
              <div>
                <span className="info-value" title={tables.assignedWaiter}>
                  {tables.assignedWaiter.split(' ')[0]}
                </span>
              </div>
            </div>
          </div>
        )}
      </article>

      <BlockedTableModal
        isOpen={showBlockedModal}
        onClose={() => setShowBlockedModal(false)}
        tableNumber={tables.tableNumber}
        waiterName={tables.assignedWaiter || 'otro mesero'}
      />
    </>
  );
};

export default TableCard;
