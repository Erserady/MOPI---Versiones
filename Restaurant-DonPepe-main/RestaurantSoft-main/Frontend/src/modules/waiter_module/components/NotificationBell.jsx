import React, { useEffect, useRef, useState } from "react";
import { Bell, ChefHat, X, Flame } from "lucide-react";
import "../styles/notification_center.css";

const NotificationBell = ({
  notifications = [],
  unreadCount = 0,
  onMarkAsRead,
  onMarkAllAsRead,
  onDismiss,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (notifications.length === 0) {
      setIsOpen(false);
    }
  }, [notifications.length]);

  const togglePanel = () => {
    setIsOpen((prev) => !prev);
  };

  const handleMarkAll = () => {
    onMarkAllAsRead?.();
  };

  const badgeLabel = unreadCount > 9 ? "9+" : unreadCount;

  return (
    <div className="waiter-notification" ref={wrapperRef}>
      <button
        type="button"
        className={`notification-bell ${isOpen ? "active" : ""}`}
        onClick={togglePanel}
        aria-label="Ver notificaciones de pedidos listos"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notification-badge">{badgeLabel}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-panel shadow">
          <header className="notification-panel__header">
            <div>
              <p>Notificaciones de Cocina</p>
            </div>
            <button
              type="button"
              className="notification-panel__mark"
              onClick={handleMarkAll}
              disabled={notifications.length === 0}
            >
              Marcar como leidas
            </button>
          </header>

          <div className="notification-panel__body">
            {notifications.length === 0 ? (
              <p className="notification-empty">Aun no hay notificaciones de cocina.</p>
            ) : (
              <ul className="notification-list">
                {notifications.map((notification) => {
                  const isPreparingNotification = notification.type === "en_preparacion";
                  const NotificationIcon = isPreparingNotification ? Flame : ChefHat;
                  const iconColor = isPreparingNotification ? "#FF6B35" : "#57c84dff";
                  
                  return (
                    <li
                      key={notification.id}
                      className={`notification-item ${
                        notification.read ? "read" : "unread"
                      }`}
                      onClick={() => onMarkAsRead?.(notification.id)}
                    >
                      <div className="notification-item__icon" style={{ color: iconColor }}>
                        <NotificationIcon size={18} />
                      </div>
                    <div className="notification-item__content">
                      <p className="notification-item__title">
                        Mesa {notification.mesa} - Orden {notification.order}
                      </p>
                      <p className="notification-item__message">
                        {notification.message}
                      </p>
                      <small>{formatRelativeTime(notification.timestamp)}</small>
                    </div>
                    <button
                      type="button"
                      className="notification-item__dismiss"
                      onClick={(event) => {
                        event.stopPropagation();
                        onDismiss?.(notification.id);
                      }}
                      aria-label="Descartar notificacion"
                    >
                      <X size={14} />
                    </button>
                  </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const formatRelativeTime = (timestamp) => {
  if (!timestamp) return "";
  const now = Date.now();
  const diffMs = Math.max(0, now - timestamp);
  const diffSeconds = Math.floor(diffMs / 1000);

  if (diffSeconds < 10) {
    return "Hace instantes";
  }
  if (diffSeconds < 60) {
    return `Hace ${diffSeconds}s`;
  }
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `Hace ${diffMinutes} min`;
  }

  const eventDate = new Date(timestamp);
  return eventDate.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default NotificationBell;
