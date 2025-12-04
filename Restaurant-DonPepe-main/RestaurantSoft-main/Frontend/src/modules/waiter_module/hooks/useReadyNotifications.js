import { useEffect, useMemo, useRef, useState } from "react";

const READY_STATUS = "listo";
const PREPARING_STATUS = "en_preparacion";
const MAX_NOTIFICATIONS = 15;

const normalizeStatus = (value) => {
  if (typeof value === "string") {
    return value.toLowerCase();
  }
  return value ?? "";
};

const resolveOrderKey = (order) =>
  order?.id ?? order?.order_id ?? order?.numero ?? order?.pedido_id ?? null;

const resolveMesaLabel = (order) =>
  order?.mesa_label ||
  order?.mesa ||
  order?.table_label ||
  order?.table ||
  order?.tableNumber ||
  order?.mesa_id ||
  "Sin mesa";

const resolveOrderLabel = (order) =>
  order?.order_id || order?.numero || order?.pedido_id || order?.id || "Sin folio";

const buildNotification = (order, cacheKey, notificationType) => {
  const mesaLabel = resolveMesaLabel(order);
  const orderLabel = resolveOrderLabel(order);
  const timestamp = Date.now();

  const messages = {
    listo: `La cocina marcó la orden ${orderLabel} de la mesa ${mesaLabel} como lista.`,
    en_preparacion: `La cocina comenzo a preparar la orden ${orderLabel} de la mesa ${mesaLabel}.`,
  };

  return {
    id: `${cacheKey}-${timestamp}`,
    orderKey: cacheKey,
    mesa: mesaLabel,
    order: orderLabel,
    timestamp,
    read: false,
    type: notificationType,
    message: messages[notificationType] || `Actualizacion de la orden ${orderLabel}.`,
  };
};

export function useReadyNotifications(orders) {
  const [notifications, setNotifications] = useState([]);
  const statusCacheRef = useRef(new Map());

  useEffect(() => {
    if (!Array.isArray(orders)) return;

    const previousStatuses = statusCacheRef.current;
    const nextStatuses = new Map();
    const newlyReadyNotifications = [];

    orders.forEach((order) => {
      if (!order) return;

      const orderKey = resolveOrderKey(order);
      if (!orderKey) return;

      const status = normalizeStatus(order.estado);
      nextStatuses.set(orderKey, status);

      const prevStatus = previousStatuses.get(orderKey);
      
      // Notificar cuando el pedido pasa a "entregado"
      const becameReady = status === READY_STATUS && prevStatus !== READY_STATUS;
      if (becameReady) {
        newlyReadyNotifications.push(buildNotification(order, orderKey, READY_STATUS));
      }

      // Notificar cuando el pedido pasa a "en_preparacion" (Cocinando)
      const becamePreparing = status === PREPARING_STATUS && prevStatus !== PREPARING_STATUS && prevStatus !== READY_STATUS && prevStatus !== "entregado";
      if (becamePreparing) {
        newlyReadyNotifications.push(buildNotification(order, orderKey, PREPARING_STATUS));
      }
    });

    statusCacheRef.current = nextStatuses;

    if (newlyReadyNotifications.length > 0) {
      setNotifications((prev) => {
        const combined = [...newlyReadyNotifications, ...prev];
        return combined.slice(0, MAX_NOTIFICATIONS);
      });
    }
  }, [orders]);

  const unreadCount = useMemo(
    () => notifications.reduce((acc, notif) => acc + (notif.read ? 0 : 1), 0),
    [notifications]
  );

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notif) => (notif.read ? notif : { ...notif, read: true }))
    );
  };

  const dismissNotification = (id) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    dismissNotification,
  };
}
