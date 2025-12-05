import React, { useMemo, useRef, useState } from "react";
import {
  Activity,
  BarChart3,
  Flame,
  Loader2,
  Martini,
  TrendingUp,
} from "lucide-react";
import "../styles/admin_dashboard.css";
import { useDataSync } from "../../../hooks/useDataSync";
import { getDashboardData } from "../../../services/adminMenuService";
import { getFacturas } from "../../../services/cashierService";
import { getMesas, getOrdenes } from "../../../services/waiterService";
import { useMetadata } from "../../../hooks/useMetadata";

const normalizeText = (value = "") =>
  value
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const CATEGORY_EXCLUDE_LIST = [
  "enlatados y desechables",
  "licores importados",
  "cerveza nacional",
  "cerveza internacional",
  "cigarros",
  "ron nacional",
  "coctails y vinos",
  "cocteles y vinos",
];

const PRODUCT_NAME_KEYWORDS = [
  "cerveza",
  "beer",
  "corona",
  "modelo",
  "heineken",
  "budweiser",
  "miller",
  "stella",
  "victoria",
  "whisky",
  "whiskey",
  "vodka",
  "tequila",
  "ron",
  "rum",
  "gin",
  "brandy",
  "cognac",
  "walker",
  "jack daniels",
  "johnnie",
  "buchanans",
  "chivas",
  "baileys",
  "centenario",
  "herradura",
  "don julio",
  "patron",
  "jose cuervo",
  "absolut",
  "smirnoff",
  "bacardi",
  "havana",
  "zacapa",
  "belmont",
  "refresco",
  "soda",
  "coca",
  "pepsi",
  "sprite",
  "fanta",
  "squirt",
  "agua",
  "water",
  "jugo",
  "juice",
  "limonada",
  "naranjada",
  "botella",
  "bottle",
  "lata",
  "can",
  "oz",
  "litro",
  "lt",
  "ml",
  "cigarro",
  "cigar",
  "tabaco",
  "marlboro",
  "camel",
  "desechable",
  "enlatado",
  "hi-c",
  "del valle",
];

const COOKABLE_NAME_WHITELIST = [
  "filete de tacon alto",
  "filete de tacin alto",
  "filete minon",
  "filete mion",
  "filete criollo",
  "puyaso a la parrilla",
  "new york asado",
  "filete de res a la pimienta",
];

const parseItems = (raw) => {
  if (Array.isArray(raw)) return raw;
  if (!raw) return [];
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const isNonCookableItem = (item = {}) => {
  if (item.preparable_en_cocina === false) return true;
  if (item.preparable_en_cocina === true) return false;

  const name = normalizeText(
    item.nombre || item.name || item.dishName || item.item || ""
  );
  if (COOKABLE_NAME_WHITELIST.includes(name)) return false;

  const category = normalizeText(
    item.categoria ||
      item.category ||
      item.dishCategory ||
      item.tipo ||
      item.type ||
      ""
  );
  if (category && CATEGORY_EXCLUDE_LIST.some((cat) => normalizeText(cat) === category)) {
    return true;
  }

  return PRODUCT_NAME_KEYWORDS.some((keyword) => name.includes(keyword));
};

const extractOrderItems = (order = {}) => {
  if (Array.isArray(order?.products)) return order.products;
  return parseItems(order?.pedido);
};

const getItemQuantity = (item = {}) => {
  const candidates = [
    item.cantidad,
    item.quantity,
    item.dishQuantity,
    item.qty,
    item.cant,
  ];
  for (const candidate of candidates) {
    const qty = parseFloat(candidate);
    if (!Number.isNaN(qty) && qty > 0) return qty;
  }
  return 0;
};

const getItemPrice = (item = {}) => {
  const price =
    item.precio ||
    item.price ||
    item.unitPrice ||
    item.precio_unitario ||
    item.valor ||
    0;
  const parsed = parseFloat(price);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const getItemName = (item = {}) => {
  const raw = item.nombre || item.name || item.dishName || item.item || "";
  return raw.toString().trim();
};

const computeBestSellers = (facturas) => {
  const empty = {
    bestKitchen: null,
    bestNoKitchen: null,
    kitchenTop: [],
    nonKitchenTop: [],
    kitchenTotal: 0,
    nonKitchenTotal: 0,
  };
  const facturaList = Array.isArray(facturas)
    ? facturas
    : Array.isArray(facturas?.results)
      ? facturas.results
      : [];
  if (!facturaList.length) return empty;

  const buckets = {
    kitchen: new Map(),
    nonKitchen: new Map(),
  };

  facturaList.forEach((factura) => {
    if (factura?.estado && factura.estado !== "pagada") return;
    const orders = Array.isArray(factura?.orders) ? factura.orders : [];
    orders.forEach((order) => {
      const items = extractOrderItems(order);
      items.forEach((item) => {
        const qty = getItemQuantity(item);
        const name = getItemName(item);
        if (!qty || !name) return;
        const revenue = qty * getItemPrice(item);
        const bucketKey = isNonCookableItem(item) ? "nonKitchen" : "kitchen";
        const map = buckets[bucketKey];
        const key = normalizeText(name) || name.toLowerCase();
        const current = map.get(key) || { name, qty: 0, revenue: 0 };
        map.set(key, {
          name: current.name || name,
          qty: current.qty + qty,
          revenue: current.revenue + revenue,
        });
      });
    });
  });

  const sortDesc = (a, b) => b.qty - a.qty || b.revenue - a.revenue;
  const kitchenTop = Array.from(buckets.kitchen.values()).sort(sortDesc);
  const nonKitchenTop = Array.from(buckets.nonKitchen.values()).sort(sortDesc);

  return {
    bestKitchen: kitchenTop[0] || null,
    bestNoKitchen: nonKitchenTop[0] || null,
    kitchenTop: kitchenTop.slice(0, 4),
    nonKitchenTop: nonKitchenTop.slice(0, 4),
    kitchenTotal: kitchenTop.reduce((sum, item) => sum + item.qty, 0),
    nonKitchenTotal: nonKitchenTop.reduce((sum, item) => sum + item.qty, 0),
  };
};

const formatCurrency = (value, symbol) => {
  const num = Number(value) || 0;
  return `${symbol}${num.toFixed(2)}`;
};

const formatVentasSeries = (ventas = []) => {
  if (!Array.isArray(ventas)) return [];
  return ventas
    .map((entry, idx) => {
      const rawDate =
        entry.created_at__date || entry.date || entry.fecha || entry.label;
      const total = Number(entry.total || 0);
      const dateObj = rawDate ? new Date(rawDate) : null;
      const label = dateObj
        ? dateObj.toLocaleDateString("es-ES", { weekday: "short" })
        : `D${idx + 1}`;
      const fullLabel = dateObj
        ? dateObj.toLocaleDateString("es-ES", { month: "short", day: "numeric" })
        : label;
      const dateTimeLabel = dateObj
        ? dateObj.toLocaleString("es-ES", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })
        : fullLabel;
      return {
        value: Number.isNaN(total) ? 0 : total,
        label,
        fullLabel,
        dateTimeLabel,
        rawDate: rawDate || null,
        dayMonth: dateObj
          ? dateObj.toLocaleDateString("es-ES", {
              day: "numeric",
              month: "short",
            })
          : "",
        sortValue: dateObj ? dateObj.getTime() : idx,
      };
    })
    .sort((a, b) => a.sortValue - b.sortValue);
};

const toNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const ACTIVE_ORDER_STATES = [
  "pendiente",
  "en_preparacion",
  "listo",
  "entregado",
  "servido",
  "payment_requested",
  "prefactura_enviada",
];

const buildSalesFromFacturas = (facturas = []) => {
  const list = Array.isArray(facturas)
    ? facturas
    : Array.isArray(facturas?.results)
      ? facturas.results
      : [];
  if (!list.length) return [];

  const byDate = new Map();
  list.forEach((f) => {
    if (f?.estado && f.estado !== "pagada") return;
    const created = f.created_at ? new Date(f.created_at) : null;
    if (!created || Number.isNaN(created.getTime())) return;
    const key = created.toISOString().slice(0, 10); // YYYY-MM-DD
    const current = byDate.get(key) || 0;
    byDate.set(key, current + (toNumber(f.total) || 0));
  });

  return Array.from(byDate.entries()).map(([date, total]) => ({
    date,
    total,
  }));
};

const normalizeStatus = (status) => (typeof status === "string" ? status.toLowerCase() : status || "");

const collectTableIds = (table) =>
  [
    table?.id,
    table?.mesa_id,
    table?.mesa,
    table?.number,
    table?.tableNumber,
  ]
    .filter((v) => v !== undefined && v !== null)
    .map((v) => v.toString());

const collectOrderTableId = (order) =>
  [
    order?.table,
    order?.mesa_id,
    order?.mesa,
    order?.tableNumber,
    order?.mesa_label,
  ]
    .filter((v) => v !== undefined && v !== null)[0];

const AdminDashboardCharts = () => {
  const { data: adminMeta } = useMetadata("admin");
  const currencySymbol = adminMeta?.currency?.symbol || "C$";
  const chartRef = useRef(null);
  const [hoverPoint, setHoverPoint] = useState(null);

  const {
    data: dashboardData,
    loading: dashboardLoading,
    error: dashboardError,
  } = useDataSync(getDashboardData, 15000);

  const {
    data: facturas,
    loading: facturasLoading,
    error: facturasError,
  } = useDataSync(getFacturas, 20000);

  const {
    data: mesasData,
    loading: mesasLoading,
    error: mesasError,
  } = useDataSync(getMesas, 12000);

  const {
    data: ordenesData,
    loading: ordenesLoading,
    error: ordenesError,
  } = useDataSync(getOrdenes, 12000);

  const derivedOrders = Array.isArray(ordenesData) ? ordenesData.filter((o) => !["pagado", "facturado"].includes(normalizeStatus(o.estado))) : [];
  const derivedPendingCount = derivedOrders.filter((o) => ACTIVE_ORDER_STATES.includes(normalizeStatus(o.estado))).length;

  const occupiedTables = useMemo(() => {
    const tables = Array.isArray(mesasData) ? mesasData : [];
    const occupiedByStatus = new Set();
    tables.forEach((mesa) => {
      const status = normalizeStatus(mesa.status);
      if (status === "occupied" || status === "ocupada") {
        collectTableIds(mesa).forEach((id) => occupiedByStatus.add(id));
      }
    });

    const occupiedByOrders = new Set();
    derivedOrders.forEach((orden) => {
      const id = collectOrderTableId(orden);
      if (id) occupiedByOrders.add(id.toString());
    });

    return new Set([...occupiedByStatus, ...occupiedByOrders]);
  }, [mesasData, derivedOrders]);

  const ventasSeries = useMemo(
    () => {
      const primary = formatVentasSeries(dashboardData?.ventas_7_dias);
      if (primary.length) return primary;
      const fromFacturas = buildSalesFromFacturas(facturas);
      return formatVentasSeries(fromFacturas);
    },
    [dashboardData, facturas]
  );

  const bestSellers = useMemo(
    () => computeBestSellers(facturas),
    [facturas]
  );

  const metricsRaw = dashboardData?.metricas_principales || {};
  const mesasTotalDerived = Array.isArray(mesasData) ? mesasData.length : 0;
  const mesasOcupadasDerived = occupiedTables.size || 0;
  const mesasDisponiblesDerived = Math.max(mesasTotalDerived - mesasOcupadasDerived, 0);

  const preferPositive = (val, fallback) => {
    const num = toNumber(val);
    if (num > 0) return num;
    if (num === 0 && fallback > 0) return fallback;
    return num || fallback || 0;
  };

  const metrics = {
    ventas_hoy: toNumber(metricsRaw.ventas_hoy),
    total_mesas: preferPositive(metricsRaw.total_mesas, mesasTotalDerived),
    mesas_ocupadas: preferPositive(metricsRaw.mesas_ocupadas, mesasOcupadasDerived),
    mesas_disponibles: preferPositive(
      metricsRaw.mesas_disponibles,
      mesasDisponiblesDerived > 0
        ? mesasDisponiblesDerived
        : toNumber(metricsRaw.total_mesas) - toNumber(metricsRaw.mesas_ocupadas)
    ),
    pedidos_pendientes: preferPositive(metricsRaw.pedidos_pendientes, derivedPendingCount),
    inventario_bajo: toNumber(metricsRaw.inventario_bajo),
  };
  const mesasOcupadas = metrics.mesas_ocupadas;
  const totalMesas = metrics.total_mesas;
  const pedidosPendientes = metrics.pedidos_pendientes;
  const ocupacion =
    totalMesas > 0
      ? Math.round((mesasOcupadas / totalMesas) * 100)
      : 0;
  const ventas7dTotal = ventasSeries.reduce((sum, item) => sum + item.value, 0);
  const ventasMax = ventasSeries.reduce(
    (max, item) => (item.value > max ? item.value : max),
    0
  );

  const kitchenPercent =
    bestSellers.kitchenTotal > 0 && bestSellers.bestKitchen
      ? Math.round((bestSellers.bestKitchen.qty / bestSellers.kitchenTotal) * 100)
      : 0;
  const nonKitchenPercent =
    bestSellers.nonKitchenTotal > 0 && bestSellers.bestNoKitchen
      ? Math.round(
          (bestSellers.bestNoKitchen.qty / bestSellers.nonKitchenTotal) * 100
        )
      : 0;

  const loading =
    dashboardLoading || facturasLoading || mesasLoading || ordenesLoading;
  const hasSalesData =
    bestSellers.kitchenTop.length > 0 || bestSellers.nonKitchenTop.length > 0;
  const syncError =
    !!dashboardError ||
    !!facturasError ||
    !!mesasError ||
    !!ordenesError;

  // Calcular puntos para el grafico de linea
  const linePoints = useMemo(() => {
    if (!ventasSeries.length) return "";
    const maxValue = ventasMax > 0 ? ventasMax : 1;
    const len = ventasSeries.length;
    return ventasSeries
      .map((entry, idx) => {
        const x = len === 1 ? 50 : (idx / (len - 1)) * 100;
        const y = 100 - (entry.value / maxValue) * 100;
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(" ");
  }, [ventasSeries, ventasMax]);

  const areaPoints = useMemo(() => {
    if (!linePoints) return "";
    return `0,100 ${linePoints} 100,100`;
  }, [linePoints]);

  const handleMouseMove = (event) => {
    if (!chartRef.current || !ventasSeries.length) return;
    const rect = chartRef.current.getBoundingClientRect();
    const relX = Math.min(Math.max(event.clientX - rect.left, 0), rect.width);
    const pctX = rect.width ? relX / rect.width : 0;
    const len = ventasSeries.length;
    const idx = Math.min(
      len - 1,
      Math.max(0, Math.round(pctX * (len - 1)))
    );
    const entry = ventasSeries[idx];
    const svgX = len === 1 ? 50 : (idx / (len - 1)) * 100;
    const svgY =
      100 -
      ((entry?.value || 0) / (ventasMax > 0 ? ventasMax : 1)) * 100;
    setHoverPoint({
      left: relX,
      top: (svgY / 100) * rect.height,
      entry,
    });
  };

  const clearHover = () => setHoverPoint(null);

  return (
    <section className="admin-dashboard-viz">
      <div className="dash-hero">
        <div className="dash-hero-text">
          <p className="eyebrow muted">Dashboard</p>
          <h1>Estadisticas</h1>
          <p className="muted">
            Seguimiento del funcionamiento del restaurante
          </p>
          {(dashboardError || facturasError) && (
            <div className="dash-alert">
              <Activity size={16} />
              <span>
                {dashboardError || facturasError}
              </span>
            </div>
          )}
        </div>
        <div className="sync-chip">
          <TrendingUp size={16} />
          <span>
            {loading
              ? "Actualizando datos..."
              : syncError
              ? "Sincronizacion con errores"
              : "Datos en vivo"}
          </span>
        </div>
      </div>

      <div className="dash-stat-grid">
        <div className="stat-card">
            <div className="stat-icon success">
              <TrendingUp size={18} />
            </div>
            <div>
              <p className="muted">Ventas semana (7d)</p>
              <h3>{formatCurrency(ventas7dTotal, currencySymbol)}</h3>
              <small className="stat-sub">
                {syncError ? "Esperando datos reales" : "Suma de facturas pagadas"}
              </small>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon warning">
              <Flame size={18} />
          </div>
          <div>
            <p className="muted">Mesas activas</p>
            <h3>
              {mesasOcupadas} / {totalMesas}
            </h3>
            <small className="stat-sub">Ocupacion {ocupacion}%</small>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon info">
            <BarChart3 size={18} />
          </div>
          <div>
            <p className="muted">Pedidos pendientes</p>
            <h3>{pedidosPendientes}</h3>
            <small className="stat-sub">En cocina o por servir</small>
          </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon danger">
              <Activity size={18} />
            </div>
            <div>
              <p className="muted">Mesas disponibles</p>
              <h3>{Math.max(metrics.mesas_disponibles, 0)}</h3>
              <small className="stat-sub">
                {syncError ? "Revisa conexion con mesero/caja" : "Capacidad libre ahora"}
              </small>
            </div>
          </div>
        </div>

      <div className="viz-grid">
        <div className="viz-card best-sellers-card">
          <div className="card-head">
            <div>
              <p className="eyebrow muted">Primer grafico</p>
              <h2>Producto mas vendido</h2>
              <p className="muted tiny">
                Separado por platillos de cocina y productos que no pasan por cocina.
              </p>
            </div>
            <span className="glass-pill">Ventas cerradas</span>
          </div>
          {loading ? (
            <div className="loading-state">
              <Loader2 className="spin" size={18} />
              <span>Cargando ventas...</span>
            </div>
          ) : !hasSalesData ? (
            <div className="empty-card">
              Aun no hay datos de ventas para graficar.
            </div>
          ) : (
            <>
              <div className="gauge-grid">
                <div className="gauge-block">
                  <div
                    className="gauge-ring"
                    style={{
                      "--fill": `${kitchenPercent}%`,
                      "--accent": "#22c55e",
                    }}
                  >
                    <div className="gauge-center">
                      <span className="gauge-value">
                        {bestSellers.bestKitchen?.qty || 0}
                      </span>
                      <small>ventas</small>
                    </div>
                  </div>
                  <div className="gauge-meta">
                    <div className="pill-inline success">
                      <Flame size={14} />
                      <span>Cocina</span>
                    </div>
                    <h3>{bestSellers.bestKitchen?.name || "Sin datos"}</h3>
                    <p className="muted tiny">
                      {kitchenPercent}% de los platillos de cocina vendidos
                    </p>
                  </div>
                </div>
                <div className="gauge-block">
                  <div
                    className="gauge-ring alt"
                    style={{
                      "--fill": `${nonKitchenPercent}%`,
                      "--accent": "#38bdf8",
                    }}
                  >
                    <div className="gauge-center">
                      <span className="gauge-value">
                        {bestSellers.bestNoKitchen?.qty || 0}
                      </span>
                      <small>ventas</small>
                    </div>
                  </div>
                  <div className="gauge-meta">
                    <div className="pill-inline info">
                      <Martini size={14} />
                      <span>Excluidos de cocina</span>
                    </div>
                    <h3>{bestSellers.bestNoKitchen?.name || "Sin datos"}</h3>
                    <p className="muted tiny">
                      {nonKitchenPercent}% de los productos que no van a cocina
                    </p>
                  </div>
                </div>
              </div>
              <div className="mini-list dual">
                <div className="mini-column">
                  <p className="mini-title">Ranking de cocina</p>
                  {bestSellers.kitchenTop.map((item) => {
                    const percent =
                      bestSellers.kitchenTotal > 0
                        ? Math.round((item.qty / bestSellers.kitchenTotal) * 100)
                        : 0;
                    return (
                      <div className="mini-row" key={item.name}>
                        <div className="mini-meta">
                          <span className="mini-name">{item.name}</span>
                          <span className="mini-qty">{item.qty} ventas</span>
                        </div>
                        <div className="mini-bar">
                          <span
                            style={{
                              width: `${Math.max(percent, 4)}%`,
                              background:
                                "linear-gradient(90deg, #22c55e, #166534)",
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mini-column">
                  <p className="mini-title">Ranking sin cocina</p>
                  {bestSellers.nonKitchenTop.map((item) => {
                    const percent =
                      bestSellers.nonKitchenTotal > 0
                        ? Math.round(
                            (item.qty / bestSellers.nonKitchenTotal) * 100
                          )
                        : 0;
                    return (
                      <div className="mini-row" key={item.name}>
                        <div className="mini-meta">
                          <span className="mini-name">{item.name}</span>
                          <span className="mini-qty">{item.qty} ventas</span>
                        </div>
                        <div className="mini-bar alt">
                          <span
                            style={{
                              width: `${Math.max(percent, 4)}%`,
                              background:
                                "linear-gradient(90deg, #38bdf8, #0ea5e9)",
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="viz-card trend-card">
          <div className="card-head">
            <div>
              <p className="eyebrow muted">Ventas</p>
              <h2>Ultimos 7 dias</h2>
            </div>
            <span className="glass-pill muted">
              Total {formatCurrency(ventas7dTotal, currencySymbol)}
            </span>
          </div>
          {dashboardLoading ? (
            <div className="loading-state">
              <Loader2 className="spin" size={18} />
              <span>Calculando serie...</span>
            </div>
          ) : ventasSeries.length === 0 ? (
            <div className="empty-card">Sin pagos registrados en la semana.</div>
          ) : (
            <div className="line-card">
              <div className="line-card-head">
                <div>
                  <p className="eyebrow muted">Ventas</p>
                  <h2>Ultimos 7 dias</h2>
                </div>
                <div className="line-total">
                  Total {formatCurrency(ventas7dTotal, currencySymbol)}
                </div>
              </div>
              <div
                className="line-surface"
                ref={chartRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={clearHover}
              >
                <svg viewBox="0 0 100 100" preserveAspectRatio="none">
                  {areaPoints && (
                    <polygon
                      points={areaPoints}
                      fill="rgba(56, 189, 248, 0.16)"
                      stroke="none"
                    />
                  )}
                  {linePoints && (
                    <polyline
                      points={linePoints}
                      fill="none"
                      stroke="#0ea5e9"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="line-path"
                    />
                  )}
                  {ventasSeries.map((entry, idx) => {
                    const x =
                      ventasSeries.length === 1
                        ? 50
                        : (idx / (ventasSeries.length - 1)) * 100;
                    const y =
                      100 -
                      ((entry.value || 0) / (ventasMax > 0 ? ventasMax : 1)) *
                        100;
                    const isActive = hoverPoint?.entry === entry;
                    return (
                      <circle
                        key={`${entry.fullLabel}-${entry.value}-${idx}`}
                        cx={x}
                        cy={y}
                        r={isActive ? 2.4 : 1.4}
                        fill="#0ea5e9"
                        opacity={isActive ? 1 : 0.75}
                        className="line-point"
                      />
                    );
                  })}
                </svg>
                {hoverPoint && hoverPoint.entry && (
                  <div
                    className="line-tooltip"
                    style={{
                      left: hoverPoint.left,
                      top: hoverPoint.top,
                    }}
                  >
                    <div className="line-tooltip-title">
                      {hoverPoint.entry.dateTimeLabel || hoverPoint.entry.fullLabel}
                    </div>
                    <div className="line-tooltip-row">
                      <span className="dot" />
                      <span>Venta</span>
                      <span className="value">
                        {formatCurrency(hoverPoint.entry.value, currencySymbol)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <div className="line-days">
                {ventasSeries.map((entry, idx) => (
                  <div className="line-day" key={`${entry.fullLabel}-${idx}`}>
                    <span className="line-day-label">{entry.label?.toUpperCase()}</span>
                    <span className="line-day-sub">{entry.dayMonth}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default AdminDashboardCharts;
