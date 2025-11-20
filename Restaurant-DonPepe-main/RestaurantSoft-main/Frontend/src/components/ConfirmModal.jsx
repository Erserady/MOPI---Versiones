import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import '../styles/confirm_modal.css';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirmar', cancelText = 'Cancelar', type = 'warning' }) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const iconMap = {
    warning: <AlertTriangle size={48} />,
    danger: <AlertTriangle size={48} />,
    info: <AlertTriangle size={48} />
  };

  const colorMap = {
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6'
  };

  return (
    <div className="confirm-modal-overlay" onClick={onClose}>
      <div className="confirm-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="confirm-modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="confirm-modal-icon" style={{ color: colorMap[type] }}>
          {iconMap[type]}
        </div>

        <h2 className="confirm-modal-title">{title}</h2>
        
        <div className="confirm-modal-message">
          {typeof message === 'string' ? (
            <p>{message}</p>
          ) : (
            message
          )}
        </div>

        <div className="confirm-modal-actions">
          <button 
            className="confirm-modal-btn confirm-modal-btn-cancel"
            onClick={onClose}
          >
            {cancelText}
          </button>
          <button 
            className="confirm-modal-btn confirm-modal-btn-confirm"
            onClick={handleConfirm}
            style={{ background: colorMap[type] }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
