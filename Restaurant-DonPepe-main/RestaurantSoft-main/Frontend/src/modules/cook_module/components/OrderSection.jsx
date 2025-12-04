import React, { useMemo, useState, useEffect } from "react";
import { RefreshCw, Activity, Flame, CheckCircle2, ListChecks, ChefHat, Layers } from "lucide-react";
import PriorityOrderCard from "./PriorityOrderCard";
import DishGroupCard from "./DishGroupCard";
import "../styles/order_section.css";
import { useDataSync } from "../../../hooks/useDataSync";
import { getOrdenesActivas, getOrdenesCocina, cambiarEstadoOrden } from "../../../services/cookService";
import {
  STATUS_LABELS,
  extractTableLabel,
  parseOrderItems,
  filterCookableItems,
  formatDateTime,
} from "../utils/orderUtils";
import { CustomAlertContainer, AlertService } from "./CustomAlert";

const STATUS_FILTERS = [
  { id: "all", label: "Todos" },
  { id: "pendiente", label: STATUS_LABELS.pendiente },
  { id: "en_preparacion", label: STATUS_LABELS.en_preparacion },
  { id: "listo", label: STATUS_LABELS.listo },
];

const SLA_LEGEND = [
  { id: "ok", label: "<10 min", tone: "ok" },
  { id: "warning", label: "10 - 20 min", tone: "warning" },
  { id: "late", label: ">20 min", tone: "late" },
  { id: "critical", label: ">30 min", tone: "critical" },
];

const SUMMARY_LAYOUT = [
  {
    id: "pendiente",
    title: "En fila",
    description: "Esperando pase a cocina",
    accent: "queue",
    Icon: Activity,
  },
  {
    id: "en_preparacion",
    title: "En cocina",
    description: "Siendo preparados en este momento",
    accent: "cooking",
    Icon: Flame,
  },
  {
    id: "listo",
    title: "Listos",
    description: "Pendientes de entrega",
    accent: "ready",
    Icon: CheckCircle2,
  },
  {
    id: "all",
    title: "Pedidos activos",
    description: "Totales en monitoreo",
    accent: "total",
    Icon: ListChecks,
  },
];

const OrderSection = () => {
  const { data: ordenesData, loading, error, refetch } = useDataSync(getOrdenesActivas, 3000);
  const { data: ordenesHistoricas } = useDataSync(getOrdenesCocina, 10000);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [lastSyncTs, setLastSyncTs] = useState(null);
  const [nowTick, setNowTick] = useState(Date.now());
  const [showDishGroups, setShowDishGroups] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const ticker = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(ticker);
  }, []);

  useEffect(() => {
    if (ordenesData) {
      setLastSyncTs(Date.now());
    }
  }, [ordenesData]);

  // Solicitar permisos de notificación al cargar el componente
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          console.log("Listo. Permisos de notificación concedidos");
        }
      });
    }
  }, []);

  // Formatear y asignar prioridades
  const ordersFormatted = useMemo(() => {
    if (!Array.isArray(ordenesData)) return [];

    const formatted = ordenesData
      .map((orden) => {
        const items = filterCookableItems(parseOrderItems(orden.items ?? orden.pedido));
        const fallbackTable =
          orden.mesa_label ||
          orden.mesa_id ||
          extractTableLabel(orden.pedido, "N/A");
        return {
          recordId: orden.id,
          orderNumber: orden.order_id || orden.pedido_id || orden.numero,
          tableNumber: fallbackTable,
          mesaId: orden.mesa_id,
          status: orden.estado,
          statusLabel: STATUS_LABELS[orden.estado] || orden.estado,
          items,
          notes: orden.nota,
          createdAt: orden.created_at,
          kitchenSince: orden.en_cocina_since,
          elapsedSeconds: orden.elapsed_seconds ?? null,
          waiterName: orden.waiter_name,
        };
      })
      // Omitir órdenes sin platillos cocinables (ej. solo bebidas/bar)
      .filter((order) => Array.isArray(order.items) && order.items.length > 0)
      .sort((a, b) => {
        // Ordenar por fecha de creación (orden cronológico)
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateA - dateB;
      });

    // Asignar prioridad numérica (1, 2, 3...)
    return formatted.map((order, index) => ({
      ...order,
      priority: index + 1,
    }));
  }, [ordenesData]);

  const historyToday = useMemo(() => {
    if (!Array.isArray(ordenesHistoricas)) return [];
    const today = new Date();
    const sameDay = (value) => {
      const d = new Date(value);
      return (
        d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate()
      );
    };

    return ordenesHistoricas
      .filter((orden) => sameDay(orden.created_at || orden.updated_at))
      .map((orden) => {
        const items = filterCookableItems(parseOrderItems(orden.items ?? orden.pedido));
        return {
          id: orden.id,
          orderNumber: orden.order_id || orden.pedido_id || orden.numero,
          tableNumber: orden.mesa_label || orden.mesa_id || extractTableLabel(orden.pedido, "N/A"),
          status: orden.estado,
          itemsCount: items.reduce((acc, item) => acc + (item.cantidad || 1), 0),
          readyCount: items.filter((item) => item.listo_en_cocina).length,
          createdAt: orden.created_at,
          waiterName: orden.waiter_name,
        };
      })
      .sort((a, b) => {
        const da = new Date(a.createdAt).getTime();
        const db = new Date(b.createdAt).getTime();
        return db - da;
      });
  }, [ordenesHistoricas]);

  // Agrupar platillos de todas las órdenes
  const dishGroups = useMemo(() => {
    const groups = {};
    
    ordersFormatted.forEach((order) => {
      if (!Array.isArray(order.items)) return;
      
      order.items.forEach((item) => {
        // Omitir platillos ya marcados como listos en cocina
        if (item.listo_en_cocina) return;

        const dishName = item.nombre || "Platillo sin nombre";
        
        if (!groups[dishName]) {
          groups[dishName] = [];
        }

        groups[dishName].push({
          recordId: order.recordId,
          tableNumber: order.tableNumber,
          priority: order.priority,
          quantity: item.cantidad || 1,
          status: order.status,
          order: order, // Referencia completa para abrir el diálogo
        });
      });
    });

    // Convertir a array y ordenar por cantidad de mesas (más popular primero)
    return Object.entries(groups)
      .map(([dishName, tables]) => ({
        dishName,
        tables,
        totalCount: tables.reduce((sum, t) => sum + t.quantity, 0),
      }))
      .sort((a, b) => b.tables.length - a.tables.length);
  }, [ordersFormatted]);

  const statusCounters = useMemo(() => {
    return ordersFormatted.reduce(
      (acc, order) => {
        acc.all += 1;
        if (acc[order.status] !== undefined) {
          acc[order.status] += 1;
        }
        return acc;
      },
      { all: 0, pendiente: 0, en_preparacion: 0, listo: 0 }
    );
  }, [ordersFormatted]);

  const filteredOrders =
    selectedFilter === "all"
      ? ordersFormatted
      : ordersFormatted.filter((order) => order.status === selectedFilter);

  const filteredDishGroups =
    selectedFilter === "all"
      ? dishGroups
      : dishGroups.map((group) => ({
        ...group,
        tables: group.tables.filter((t) => t.status === selectedFilter),
      })).filter((group) => group.tables.length > 0);

  const handleStatusChange = async (orderRecordId, newStatus) => {
    try {
      await cambiarEstadoOrden(orderRecordId, newStatus);

      // Si el estado cambió a "listo", notificar al mesero
      if (newStatus === "listo") {
        const order = ordersFormatted.find(o => o.recordId === orderRecordId);
        if (order) {
          notifyWaiter(order);
          AlertService.success(
            "Orden lista",
            `Mesa ${order.tableNumber} lista para entregar`
          );
        }
      }

      await refetch();
    } catch (err) {
      console.error("Error actualizando estado:", err);
      AlertService.error(
        "Error al actualizar",
        "No se pudo actualizar el estado de la orden."
      );
    }
  };

  // Función para notificar al mesero
  const notifyWaiter = (order) => {
    // Notificación del navegador
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("🍽️ Orden Lista para Entregar", {
        body: `Mesa ${order.tableNumber} - ${order.waiterName || 'Mesero'}`,
        icon: "/logo.png",
        badge: "/logo.png",
        tag: `order-${order.recordId}`,
        requireInteraction: true,
      });
    }

    // Sonido de notificación (opcional)
    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(e => console.log('No se pudo reproducir sonido:', e));
    } catch (e) {
      console.log('Audio no disponible');
    }

    console.log(`🔔 Notificación enviada al mesero: ${order.waiterName} - Mesa ${order.tableNumber}`);
  };

  const lastSyncLabel = useMemo(() => {
    if (!lastSyncTs) return "Sincronizando...";
    const diffSeconds = Math.max(0, Math.floor((nowTick - lastSyncTs) / 1000));
    if (diffSeconds < 5) return "Actualizado hace instantes";
    if (diffSeconds < 60) return `Actualizado hace ${diffSeconds}s`;
    const minutes = Math.floor(diffSeconds / 60);
    return `Actualizado hace ${minutes} min`;
  }, [lastSyncTs, nowTick]);

  const summaryCards = SUMMARY_LAYOUT.map(({ id, title, description, accent, Icon }) => ({
    id,
    title,
    description,
    accent,
    Icon,
    value: statusCounters[id] ?? 0,
  }));

  const isInitialLoading = loading && !ordenesData;

  const [selectedTable, setSelectedTable] = useState(null);

  const handleTableClick = (tableInfo) => {
    // Buscar la orden completa
    const order = ordersFormatted.find((o) => o.recordId === tableInfo.recordId);
    if (order) {
      setSelectedTable(order);
    }
  };

  let boardContent = null;
  if (isInitialLoading) {
    boardContent = (
      <div className="kitchen-board__feedback">
        <RefreshCw className="spin" size={32} />
        <p>Cargando pedidos...</p>
      </div>
    );
  } else if (error) {
    boardContent = (
      <div className="kitchen-board__feedback error">
        <p>Ocurrio un error obteniendo los pedidos: {error}</p>
      </div>
    );
  } else {
    boardContent = (
      <>
        {/* Sección de todas las mesas en orden - SIEMPRE PRIMERO */}
        <section className="kitchen-section">
          <div className="section-header">
            <div className="section-header-content">
              <Layers size={24} />
              <div>
                <h2>Órdenes en Espera</h2>
                <p>Orden cronológico de llegada</p>
              </div>
            </div>
            <span className="section-badge">{filteredOrders.length} mesas</span>
          </div>
          <div className="priority-orders-grid">
            {filteredOrders.map((order) => (
              <PriorityOrderCard
                key={order.recordId}
                order={order}
                priority={order.priority}
                onChangeStatus={handleStatusChange}
              />
            ))}
          </div>
        </section>

        {/* Sección de platillos agrupados - OPCIONAL */}
        {showDishGroups && filteredDishGroups.length > 0 && (
          <section className="kitchen-section dish-groups-section">
            <div className="section-header">
              <div className="section-header-content">
                <ChefHat size={24} />
                <div>
                  <h2>Platillos Agrupados</h2>
                  <p>Optimiza preparando platillos similares juntos</p>
                </div>
              </div>
              <span className="section-badge">{filteredDishGroups.length} tipos</span>
            </div>
            <div className="dish-groups-grid">
              {filteredDishGroups.map((group) => (
                <DishGroupCard
                  key={group.dishName}
                  dishName={group.dishName}
                  totalCount={group.totalCount}
                  tables={group.tables}
                  onTableClick={handleTableClick}
                />
              ))}
            </div>
          </section>
        )}

        {filteredOrders.length === 0 && (
          <div className="kitchen-board__empty">
            <p>No hay pedidos en este estado.</p>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <CustomAlertContainer />
      <div className="kitchen-board">
        <div className="kitchen-board__hero">
          <div className="hero-left">
            <p className="eyebrow hero-eyebrow">🔥 Panel de Cocina</p>
            <h1>{showHistory ? "Historial" : "Monitoreo de pedidos"}</h1>
            <p className="kitchen-board__subtitle">
              {showHistory
                ? "Consulta el historial diario, se limpia al abrir nueva caja."
                : "Monitorea pedidos activos y el progreso en cocina."}
            </p>
          </div>
          <div className="kitchen-view-tabs">
            <button
              className={`kitchen-tab ${!showHistory ? "active" : ""}`}
              onClick={() => setShowHistory(false)}
            >
              <Flame size={18} />
              <span>Monitoreo de pedidos</span>
            </button>
            <button
              className={`kitchen-tab ${showHistory ? "active" : ""}`}
              onClick={() => setShowHistory(true)}
            >
              <ListChecks size={18} />
              <span>Historial</span>
            </button>
          </div>
        </div>

        {!showHistory && (
          <>
            <div className="kitchen-stats">
              {summaryCards.map(({ id, title, description, value, Icon, accent }) => (
                <article key={id} className={`kitchen-stat-card kitchen-stat-card--${accent}`}>
                  <div className="kitchen-stat-card__icon">
                    <Icon size={20} />
                  </div>
                  <div>
                    <p className="kitchen-stat-card__title">{title}</p>
                    <p className="kitchen-stat-card__value">{value}</p>
                    <p className="kitchen-stat-card__description">{description}</p>
                  </div>
                </article>
              ))}
            </div>

            <div className="kitchen-board__controls">
              <div className="kitchen-board__filters">
                {STATUS_FILTERS.map((filter) => (
                  <button
                    key={filter.id}
                    className={`kitchen-filter-pill ${selectedFilter === filter.id ? "active" : ""}`}
                    onClick={() => setSelectedFilter(filter.id)}
                  >
                    <span>{filter.label}</span>
                    <small>{statusCounters[filter.id] ?? 0}</small>
                  </button>
                ))}
              </div>
              <div className="kitchen-board__controls-right">
                <div className="kitchen-sla-legend">
                  {SLA_LEGEND.map((item) => (
                    <div key={item.id} className={`kitchen-legend-pill ${item.tone}`}>
                      <span className="legend-dot" />
                      <span className="legend-label">{item.label}</span>
                    </div>
                  ))}
                </div>

                <button
                  className={`toggle-groups-button ${showDishGroups ? 'active' : ''}`}
                  onClick={() => setShowDishGroups(!showDishGroups)}
                  title={showDishGroups ? "Ocultar platillos agrupados" : "Mostrar platillos agrupados"}
                >
                  <ChefHat size={18} />
                  <span>{showDishGroups ? 'Ocultar' : 'Agrupar'} Platillos</span>
                </button>
              </div>
            </div>

            <div className="view-anim in">
              {boardContent}
            </div>
          </>
        )}

        {showHistory && (
          <section className="kitchen-section history-section view-anim in">
            <div className="section-header">
              <div className="section-header-content">
                <ListChecks size={24} />
                <div>
                  <h2>Historial</h2>
                  <p>Pedidos del día (reinicia con nueva caja)</p>
                </div>
              </div>
              <span className="section-badge">{historyToday.length} pedidos</span>
            </div>

            {historyToday.length === 0 ? (
              <div className="kitchen-board__empty">
                <p>No hay pedidos registrados hoy.</p>
              </div>
            ) : (
              <div className="history-table-wrapper">
                <table className="dish-table shadow">
                  <thead>
                    <tr>
                      <th>Hora</th>
                      <th>Mesa</th>
                      <th>Orden</th>
                      <th>Estado</th>
                      <th>Platillos</th>
                      <th>Mesero</th>
                    </tr>
                  </thead>
                  <tbody className="tbody-class">
                    {historyToday.map((orden) => (
                      <tr key={orden.id}>
                        <td>{formatDateTime(orden.createdAt)}</td>
                        <td>{orden.tableNumber || "Sin mesa"}</td>
                        <td>{orden.orderNumber || "—"}</td>
                        <td style={{ textTransform: "capitalize" }}>
                          {STATUS_LABELS[orden.status] || orden.status}
                        </td>
                        <td>
                          {orden.readyCount}/{orden.itemsCount} listos
                        </td>
                        <td>{orden.waiterName || "N/D"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </div>
    </>
  );
};

export default OrderSection;
