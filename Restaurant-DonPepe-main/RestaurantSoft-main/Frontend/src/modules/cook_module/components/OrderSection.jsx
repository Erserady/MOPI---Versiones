import React, { useMemo, useState, useEffect } from "react";
import { RefreshCw, Activity, Flame, CheckCircle2, ListChecks } from "lucide-react";
import OrderCard from "./OrderCard";
import "../styles/order_section.css";
import { useDataSync } from "../../../hooks/useDataSync";
import { getOrdenesActivas, cambiarEstadoOrden } from "../../../services/cookService";
import {
  STATUS_LABELS,
  extractTableLabel,
  parseOrderItems,
} from "../utils/orderUtils";

const STATUS_FILTERS = [
  { id: "all", label: "Todos" },
  { id: "pendiente", label: STATUS_LABELS.pendiente },
  { id: "en_preparacion", label: STATUS_LABELS.en_preparacion },
  { id: "listo", label: STATUS_LABELS.listo },
];

const SLA_LEGEND = [
  { id: "ok", label: "<10 min", description: "En tiempo", tone: "ok" },
  { id: "warning", label: "10 - 20 min", description: "Atencion", tone: "warning" },
  { id: "late", label: ">20 min", description: "Fuera de SLA", tone: "late" },
  { id: "critical", label: ">30 min", description: "Prioridad absoluta", tone: "critical" },
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
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [lastSyncTs, setLastSyncTs] = useState(null);
  const [nowTick, setNowTick] = useState(Date.now());

  useEffect(() => {
    const ticker = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(ticker);
  }, []);

  useEffect(() => {
    if (ordenesData) {
      setLastSyncTs(Date.now());
    }
  }, [ordenesData]);

  const ordersFormatted = useMemo(() => {
    if (!Array.isArray(ordenesData)) return [];
    return ordenesData.map((orden, index) => {
      const items = parseOrderItems(orden.items ?? orden.pedido);
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
    });
  }, [ordenesData]);

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

  const handleStatusChange = async (orderRecordId, newStatus) => {
    try {
      await cambiarEstadoOrden(orderRecordId, newStatus);
      await refetch();
    } catch (err) {
      console.error("Error actualizando estado:", err);
      alert("No se pudo actualizar el estado de la orden.");
    }
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
        <section className="kitchen-bubble-grid">
          {filteredOrders.map((order) => (
            <OrderCard
              key={order.recordId}
              order={order}
              onChangeStatus={handleStatusChange}
            />
          ))}
        </section>
        {filteredOrders.length === 0 && (
          <div className="kitchen-board__empty">
            <p>No hay pedidos en este estado.</p>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="kitchen-board">
      <div className="kitchen-board__hero">
        <div>
          <p className="eyebrow hero-eyebrow">Cocina en vivo</p>
          <h1>Encomiendas de mesas</h1>
        </div>
        <div className="kitchen-board__sync">
          <span>{lastSyncLabel}</span>
          <button className="primary-button" onClick={refetch}>
            <RefreshCw size={16} />
            Sincronizar
          </button>
        </div>
      </div>

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
        <div className="kitchen-sla-legend">
          {SLA_LEGEND.map((item) => (
            <div key={item.id} className={`kitchen-legend-pill ${item.tone}`}>
              <span className="legend-dot" />
              <div>
                <strong>{item.label}</strong>
                <small>{item.description}</small>
              </div>
            </div>
          ))}
        </div>
      </div>

      {boardContent}
    </div>
  );
};

export default OrderSection;
