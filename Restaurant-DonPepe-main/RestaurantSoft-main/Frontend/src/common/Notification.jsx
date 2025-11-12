import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import './notification.css';

const Notification = ({ type = 'success', title, message, onClose, duration = 4000 }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle size={24} />,
    error: <XCircle size={24} />,
    warning: <AlertCircle size={24} />,
    info: <Info size={24} />
  };

  const typeClasses = {
    success: 'notification-success',
    error: 'notification-error',
    warning: 'notification-warning',
    info: 'notification-info'
  };

  return (
    <div className={`notification ${typeClasses[type]}`}>
      <div className="notification-icon">
        {icons[type]}
      </div>
      <div className="notification-content">
        <h4 className="notification-title">{title}</h4>
        {message && <p className="notification-message">{message}</p>}
      </div>
      <button className="notification-close" onClick={onClose}>
        <X size={18} />
      </button>
    </div>
  );
};

export default Notification;
