import React from "react";
import { X, Lock, UserCircle } from "lucide-react";
import "../styles/blocked_table_modal.css";

const BlockedTableModal = ({ isOpen, onClose, tableNumber, waiterName }) => {
  if (!isOpen) return null;

  return (
    <div className="blocked-modal-overlay" onClick={onClose}>
      <div className="blocked-modal" onClick={(e) => e.stopPropagation()}>
        <button className="blocked-modal__close" onClick={onClose}>
          <X size={20} />
        </button>
        
        <div className="blocked-modal__icon">
          <Lock size={48} />
        </div>
        
        <h2 className="blocked-modal__title">Mesa Ocupada</h2>
        
        <div className="blocked-modal__content">
          <p className="blocked-modal__message">
            La <strong>Mesa {tableNumber}</strong> está siendo atendida actualmente
          </p>
          
          <div className="blocked-modal__waiter">
            <UserCircle size={20} />
            <div>
              <span className="blocked-modal__waiter-label">Mesero asignado</span>
              <span className="blocked-modal__waiter-name">{waiterName}</span>
            </div>
          </div>
        </div>
        
        <button className="blocked-modal__button" onClick={onClose}>
          Entendido
        </button>
      </div>
    </div>
  );
};

export default BlockedTableModal;
