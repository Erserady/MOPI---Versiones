import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAdminDashboard } from "../../../redux/dashboardSlice";
import { fetchInventory } from "../../../redux/inventorySlice";
import "../../../styles/admin_summary.css";

const MetricCard = ({ label, value, helper }) => (
  <article className="summary-card shadow">
    <p className="summary-label">{label}</p>
    <h3 className="summary-value">{value}</h3>
    {helper && <small className="summary-helper">{helper}</small>}
  </article>
);

const InventoryBar = ({ item }) => {
  const percentage =
    item.cantidad_minima && Number(item.cantidad_minima) > 0
      ? Math.min(
          100,
          Math.round(
            (Number(item.cantidad_actual) / Number(item.cantidad_minima)) * 100
          )
        )
      : 100;
  return (
    <div className="inventory-row">
      <span>{item.nombre}</span>
      <div className="bar">
        <div
          className={`fill ${item.esta_bajo ? "danger" : ""}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="unit">
        {item.cantidad_actual} / {item.cantidad_minima} {item.unidad}
      </span>
    </div>
  );
};

const TrendLine = ({ points }) => {
  if (!points?.length) return <p>No hay datos disponibles.</p>;
  const max = Math.max(...points.map((p) => Number(p.total) || 0), 1);
  return (
    <div className="trend-chart">
      {points.map((point) => {
        const value = Number(point.total) || 0;
        const height = (value / max) * 100;
        return (
          <div key={point.created_at__date} className="trend-column">
            <div className="trend-bar" style={{ height: `${height}%` }} />
            <span>{new Date(point.created_at__date).toLocaleDateString()}</span>
          </div>
        );
      })}
    </div>
  );
};

const AdminSummary = () => {
  const dispatch = useDispatch();
  const { metrics, status, error } = useSelector((state) => state.dashboard);
  const inventory = useSelector((state) => state.inventory.items);
  const inventoryStatus = useSelector((state) => state.inventory.status);

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchAdminDashboard());
    }
    if (inventoryStatus === "idle") {
      dispatch(fetchInventory());
    }
  }, [dispatch, status, inventoryStatus]);

  if (status === "loading" || !metrics) {
    return <p>Cargando resumen...</p>;
  }

  if (error) {
    return <p className="error-text">{error}</p>;
  }

  const { metricas_principales, ventas_7_dias, facturas_recientes } = metrics;

  return (
    <section className="admin-summary">
      <div className="summary-grid">
        <MetricCard
          label="Ventas hoy"
          value={`C$ ${metricas_principales.ventas_hoy?.toFixed(2)}`}
          helper="Ingresos confirmados"
        />
        <MetricCard
          label="Mesas ocupadas"
          value={`${metricas_principales.mesas_ocupadas}/${metricas_principales.total_mesas}`}
          helper={`${metricas_principales.mesas_disponibles} libres`}
        />
        <MetricCard
          label="Pedidos pendientes"
          value={metricas_principales.pedidos_pendientes}
          helper="En cocina"
        />
        <MetricCard
          label="Alertas de inventario"
          value={metricas_principales.inventario_bajo}
          helper="Productos en riesgo"
        />
      </div>

      <section className="summary-panel shadow">
        <header>
          <h3>Tendencia de ventas (7 d��as)</h3>
        </header>
        <TrendLine points={ventas_7_dias} />
      </section>

      <section className="summary-panel shadow">
        <header>
          <h3>Inventario - Disponibilidad</h3>
        </header>
        {inventory.length === 0 ? (
          <p>Sin registros de inventario.</p>
        ) : (
          inventory.slice(0, 6).map((item) => (
            <InventoryBar key={item.id} item={item} />
          ))
        )}
      </section>

      <section className="summary-panel shadow">
        <header>
          <h3>Facturas recientes</h3>
        </header>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Mesa</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {facturas_recientes.map((factura) => (
              <tr key={factura.id}>
                <td>{factura.numero_factura}</td>
                <td>{factura.mesa_nombre || "N/D"}</td>
                <td>C$ {Number(factura.total).toFixed(2)}</td>
                <td>{factura.estado}</td>
                <td>
                  {new Date(factura.created_at).toLocaleString(undefined, {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </section>
  );
};

export default AdminSummary;
