import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

// Crear el contexto de alertas
let alertQueue = [];
let alertListeners = [];

const AlertService = {
    show: (type, title, message, duration = 5000) => {
        const id = Date.now() + Math.random();
        const alert = { id, type, title, message, duration };
        alertQueue.push(alert);
        alertListeners.forEach(listener => listener([...alertQueue]));

        if (duration > 0) {
            setTimeout(() => {
                AlertService.dismiss(id);
            }, duration);
        }
    },

    dismiss: (id) => {
        alertQueue = alertQueue.filter(alert => alert.id !== id);
        alertListeners.forEach(listener => listener([...alertQueue]));
    },

    success: (title, message, duration) => {
        AlertService.show('success', title, message, duration);
    },

    error: (title, message, duration) => {
        AlertService.show('error', title, message, duration);
    },

    warning: (title, message, duration) => {
        AlertService.show('warning', title, message, duration);
    },

    info: (title, message, duration) => {
        AlertService.show('info', title, message, duration);
    },

    subscribe: (listener) => {
        alertListeners.push(listener);
        return () => {
            alertListeners = alertListeners.filter(l => l !== listener);
        };
    }
};

// Componente de alerta individual
const CustomAlert = ({ alert, onDismiss }) => {
    const [isExiting, setIsExiting] = useState(false);

    const getIcon = () => {
        switch (alert.type) {
            case 'success':
                return <CheckCircle size={20} />;
            case 'error':
                return <XCircle size={20} />;
            case 'warning':
                return <AlertTriangle size={20} />;
            case 'info':
                return <Info size={20} />;
            default:
                return <Info size={20} />;
        }
    };

    const handleDismiss = () => {
        setIsExiting(true);
        setTimeout(() => {
            onDismiss(alert.id);
        }, 300);
    };

    return (
        <div className={`custom-alert alert-${alert.type} ${isExiting ? 'alert-exit' : ''}`}>
            <div className="custom-alert__icon">
                {getIcon()}
            </div>
            <div className="custom-alert__content">
                {alert.title && <h4 className="custom-alert__title">{alert.title}</h4>}
                {alert.message && <p className="custom-alert__message">{alert.message}</p>}
            </div>
            <button
                className="custom-alert__close"
                onClick={handleDismiss}
                aria-label="Cerrar alerta"
            >
                <X size={16} />
            </button>
            {alert.duration > 0 && (
                <div className="custom-alert__progress">
                    <div
                        className="custom-alert__progress-bar"
                        style={{ animationDuration: `${alert.duration}ms` }}
                    />
                </div>
            )}
        </div>
    );
};

// Componente contenedor de alertas
const CustomAlertContainer = () => {
    const [alerts, setAlerts] = useState([]);

    useEffect(() => {
        const unsubscribe = AlertService.subscribe(setAlerts);
        return unsubscribe;
    }, []);

    if (alerts.length === 0) return null;

    return (
        <div className="custom-alert-container">
            {alerts.map(alert => (
                <CustomAlert
                    key={alert.id}
                    alert={alert}
                    onDismiss={AlertService.dismiss}
                />
            ))}
        </div>
    );
};

export { CustomAlertContainer, AlertService };
export default CustomAlertContainer;
