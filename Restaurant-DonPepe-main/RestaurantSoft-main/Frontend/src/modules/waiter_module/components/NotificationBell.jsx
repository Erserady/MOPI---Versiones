import React, { useEffect, useRef } from "react";
import { Toaster, toast } from "react-hot-toast";
import { ChefHat, Flame, X } from "lucide-react";

const NotificationBell = ({
  notifications = [],
  onMarkAsRead,
  onDismiss,
}) => {
  const shownRef = useRef(new Set());

  useEffect(() => {
    notifications.forEach((notification) => {
      if (!notification?.id) return;
      if (shownRef.current.has(notification.id)) return;
      shownRef.current.add(notification.id);

      const isPreparing = notification.type === "en_preparacion";
      const Icon = isPreparing ? Flame : ChefHat;
      const accent = isPreparing ? "#f97316" : "#16a34a";

      // Marcar como leída al mostrarla para evitar repetir conteo
      onMarkAsRead?.(notification.id);

      toast.custom(
        (t) => (
          <div
            style={{
              maxWidth: "420px",
              width: "100%",
              background: "#ffffff",
              borderRadius: "12px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
              border: "1px solid rgba(0,0,0,0.06)",
              display: "flex",
              gap: "12px",
              padding: "12px",
              opacity: t.visible ? 1 : 0,
              transform: `translateY(${t.visible ? "0" : "-6px"})`,
              transition: "all 180ms ease",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                background: `${accent}20`,
                color: accent,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon size={18} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontWeight: 700, color: "#0f172a" }}>
                Mesa {notification.mesa} · Orden {notification.order}
              </p>
              <p style={{ margin: "4px 0 0", color: "#334155", fontSize: "14px" }}>
                {notification.message}
              </p>
              <small style={{ color: "#94a3b8" }}>{formatRelativeTime(notification.timestamp)}</small>
            </div>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                onDismiss?.(notification.id);
              }}
              style={{
                border: "none",
                background: "transparent",
                color: "#94a3b8",
                cursor: "pointer",
                padding: "4px",
              }}
              aria-label="Cerrar notificación"
            >
              <X size={16} />
            </button>
          </div>
        ),
        { duration: 5000 }
      );
    });
  }, [notifications, onDismiss, onMarkAsRead]);

  return <Toaster position="top-right" reverseOrder={false} />;
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
