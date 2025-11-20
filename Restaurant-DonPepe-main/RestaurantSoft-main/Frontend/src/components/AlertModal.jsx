import React from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import '../styles/alert_modal.css';

const AlertModal = ({ isOpen, onClose, type = 'info', title, message, confirmText = 'Aceptar' }) => {
  if (!isOpen) return null;

  const iconMap = {
    success: { Icon: CheckCircle, color: '#10b981' },
    error: { Icon: AlertCircle, color: '#ef4444' },
    warning: { Icon: AlertTriangle, color: '#f59e0b' },
    info: { Icon: Info, color: '#3b82f6' }
  };

  const { Icon, color } = iconMap[type] || iconMap.info;

  return (
    <div className="alert-modal-overlay" onClick={onClose}>
      <div className="alert-modal" onClick={(e) => e.stopPropagation()}>
        <button className="alert-modal__close" onClick={onClose}>
          <X size={20} />
        </button>
        
        <div className="alert-modal__icon" style={{ background: `${color}15` }}>
          <Icon size={48} style={{ color }} />
        </div>
        
        {title && <h2 className="alert-modal__title">{title}</h2>}
        
        <p className="alert-modal__message">{message}</p>
        
        <button 
          className="alert-modal__button" 
          onClick={onClose}
          style={{ background: color }}
        >
          {confirmText}
        </button>
      </div>
    </div>
  );
};

export default AlertModal;
