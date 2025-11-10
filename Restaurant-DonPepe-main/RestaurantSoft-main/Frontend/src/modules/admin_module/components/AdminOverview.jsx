import React, { useMemo } from "react";
import { Utensils, Wallet, TrendingUp, AlertTriangle, Users, Clock, Activity } from "lucide-react";
import "../styles/admin_overview.css";
import AdminCards from "./AdminCards";
import { useMetadata } from "../../../hooks/useMetadata";

const FALLBACK_CATEGORIES = [
  "CARNE ROJA",
  "CARNE BLANCA",
  "CARNE DE CERDO",
  "MARISCOS",
  "VARIADOS",
  "CERVEZAS",
  "ENLATADOS",
];

const AdminOverview = () => {
  const { data: adminMeta } = useMetadata("admin");
  const currencySymbol = adminMeta?.currency?.symbol || "C$";
  const categories = adminMeta?.menu?.categories || FALLBACK_CATEGORIES;

  const kpiCards = [
    {
      label: "Pedidos atendidos hoy",
      value: 128,
      trend: "+12%",
      description: "vs. ayer",
      icon: <Utensils size={20} />,
    },
    {
      label: "Platos vendidos",
      value: 386,
      trend: "+8%",
      description: "turno matutino",
      icon: <TrendingUp size={20} />,
    },
    {
      label: "Ingresos del día",
      value: `${currencySymbol} 2,465`,
      trend: "+5%",
      description: "flujo confirmado",
      icon: <Wallet size={20} />,
    },
    {
      label: "Ticket promedio",
      value: `${currencySymbol} 19.80`,
      trend: "-2%",
      description: "últimas 4 hrs",
      icon: <Activity size={20} />,
    },
  ];

  const salesByCategory = useMemo(() => {
    const dishesPattern = [132, 118, 92, 76, 64, 48, 39];
    const revenuePattern = [960, 880, 640, 520, 420, 310, 260];
    return categories.map((category, idx) => ({
      category,
      dishes: dishesPattern[idx % dishesPattern.length],
      revenue: revenuePattern[idx % revenuePattern.length],
    }));
  }, [categories]);

  const maxDishValue = Math.max(...salesByCategory.map((item) => item.dishes));

  const cashFlowData = useMemo(
    () => [
      { label: "Lun", income: 850, expense: 420 },
      { label: "Mar", income: 940, expense: 510 },
      { label: "Mié", income: 1020, expense: 580 },
      { label: "Jue", income: 980, expense: 560 },
      { label: "Vie", income: 1180, expense: 640 },
      { label: "Sáb", income: 1640, expense: 820 },
      { label: "Dom", income: 1390, expense: 760 },
    ],
    []
  );

  const lowStockItems = [
    { name: "Pechuga de pollo", stock: 6, unit: "kg", status: "Crítico" },
    { name: "Camarón jumbo", stock: 12, unit: "kg", status: "Bajo" },
    { name: "Queso mozzarella", stock: 5, unit: "kg", status: "Crítico" },
    { name: "Cerveza nacional", stock: 28, unit: "cajas", status: "Bajo" },
    { name: "Gaseosa 355ml", stock: 16, unit: "pack", status: "Bajo" },
  ];

  const serviceInsights = [
    { label: "Meseros en turno", value: 8, detail: "capacidad al 90%", icon: <Users size={18} /> },
    { label: "Tiempo promedio de atención", value: "08:12 min", detail: "objetivo 7 min", icon: <Clock size={18} /> },
    { label: "Órdenes en cocina", value: 14, detail: "4 requieren prioridad", icon: <Utensils size={18} /> },
  ];

  return (
    <section className="admin-overview">
      <header className="overview-header">
        <div>
          <p className="eyebrow">Visibilidad completa de la operación</p>
          <h1>Resumen Operativo</h1>
          <p className="support">
            Monitorea ventas, desempeño de caja e inventario crítico para tomar decisiones en tiempo real.
          </p>
        </div>
        <div className="status-pill">
          <span className="dot online" />
          Operación estable
        </div>
      </header>

      <div className="kpi-grid">
        {kpiCards.map((card) => (
          <AdminCards key={card.label} customClass="kpi-card">
            <div className="icon-badge">{card.icon}</div>
            <p className="label">{card.label}</p>
            <strong className="value">{card.value}</strong>
            <div className="trend">
              <span>{card.trend}</span>
              <small>{card.description}</small>
            </div>
          </AdminCards>
        ))}
      </div>

      <div className="overview-grid">
        <AdminCards customClass="chart-card">
          <div className="card-header">
            <div>
              <p className="eyebrow">Ventas por categoría</p>
              <h2>{currencySymbol} {salesByCategory.reduce((acc, item) => acc + item.revenue, 0).toLocaleString()}</h2>
            </div>
            <span className="chip">Últimas 24 hrs</span>
          </div>
          <div className="category-bars">
            {salesByCategory.map((item) => (
              <div key={item.category} className="bar-row">
                <div className="bar-label">
                  <span>{item.category}</span>
                  <small>{item.dishes} platos</small>
                </div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${(item.dishes / maxDishValue) * 100}%` }} />
                </div>
                <span className="bar-value">
                  {currencySymbol} {item.revenue.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </AdminCards>

        <AdminCards customClass="chart-card">
          <div className="card-header">
            <div>
              <p className="eyebrow">Flujo de caja semanal</p>
              <h2>{currencySymbol} 7,800</h2>
            </div>
            <span className="chip success">Caja equilibrada</span>
          </div>
          <div className="cashflow-grid">
            {cashFlowData.map((item) => (
              <div key={item.label} className="cashflow-column">
                <span className="cashflow-label">{item.label}</span>
                <div className="cashflow-bar income" style={{ height: `${item.income / 20}%` }} title={`Ingresos ${currencySymbol}${item.income}`} />
                <div className="cashflow-bar expense" style={{ height: `${item.expense / 20}%` }} title={`Egresos ${currencySymbol}${item.expense}`} />
              </div>
            ))}
          </div>
          <div className="cashflow-legend">
            <span><span className="dot income" />Ingresos confirmados</span>
            <span><span className="dot expense" />Egresos programados</span>
          </div>
        </AdminCards>

        <AdminCards customClass="inventory-card">
          <div className="card-header">
            <div>
              <p className="eyebrow">Inventario en riesgo</p>
              <h2>Reposiciones urgentes</h2>
            </div>
            <AlertTriangle size={20} className="text-warning" />
          </div>
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Stock</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {lowStockItems.map((item) => (
                <tr key={item.name}>
                  <td>{item.name}</td>
                  <td>
                    <strong>{item.stock}</strong> {item.unit}
                  </td>
                  <td>
                    <span className={`badge ${item.status === "Crítico" ? "danger" : "warning"}`}>{item.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </AdminCards>

        <AdminCards customClass="operations-card">
          <div className="card-header">
            <div>
              <p className="eyebrow">Operación en piso</p>
              <h2>Indicadores en vivo</h2>
            </div>
            <span className="chip neutral">Actualización cada 60s</span>
          </div>
          <ul className="operations-list">
            {serviceInsights.map((item) => (
              <li key={item.label}>
                <div className="icon-badge subtle">{item.icon}</div>
                <div className="operation-info">
                  <p>{item.label}</p>
                  <small>{item.detail}</small>
                </div>
                <strong>{item.value}</strong>
              </li>
            ))}
          </ul>
        </AdminCards>
      </div>
    </section>
  );
};

export default AdminOverview;
