import React, { useEffect, useState } from "react";
import { getOrdenes } from "../../../services/waiterService";

const estadoColors = {
  pendiente: "#CD5C5C",
  entregado: "#FFA500",
  listo: "#57c84dff",
  en_preparacion: "#4556b8ff",
  servido: "#20B2AA",
  facturado: "#808080",
};

const ActiveOrdersSection = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const response = await getOrdenes();
        const arr = Array.isArray(response) ? response : [];
        setOrders(arr);
      } catch (e) {
        console.error("Error cargando ordenes:", e);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  if (loading) return <p>Cargando órdenes…</p>;

  const parsePedido = (pedidoRaw) => {
    try {
      if (Array.isArray(pedidoRaw)) return pedidoRaw;
      return JSON.parse(pedidoRaw || "[]");
    } catch {
      return [];
    }
  };

  function capitalizeFirstLetter(str) {
    if (!str) return "";
    const formatted = str.replace(/_/g, " ");
    return formatted[0].toUpperCase() + formatted.slice(1);
  }

  return (
    <div
      style={{
        padding: "20px",
        display: "flex",
        flexWrap: "wrap",
        gap: "20px",
        justifyContent: "space-evenly",
      }}
    >
      {orders.length === 0 ? (
        <p>No hay órdenes activas.</p>
      ) : (
        orders

          .filter((order) => order.estado !== "facturado")
          .map((order) => {
            const items = parsePedido(order.pedido);
            const estadoColor = estadoColors[order.estado] || "#cccccc"; // fallback
            {
              /**Quitar linea de filtro si se desea ver facturados */
            }
            return (
              <article
                key={order.id || order.order_id}
                style={{
                  width: "280px",
                  background: "#ffffff",
                  borderRadius: "16px",
                  boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  border: `3px solid ${estadoColor}`,
                }}
              >
                <div>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "18px",
                      fontWeight: "700",
                    }}
                  >
                    {order.mesa ?? "Mesa"}
                  </h3>

                  <p style={{ margin: "4px 0", color: estadoColor }}>
                    Estado: <b>{capitalizeFirstLetter(order.estado)}</b>
                  </p>

                  <p style={{ margin: "0", color: "#6b6b6b" }}>
                    Mesero: {order.waiterName ?? "—"}
                  </p>

                  <p style={{ margin: "0", color: "#333", fontWeight: "600" }}>
                    {order.nota}
                  </p>
                </div>

                <div
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    padding: "10px",
                    maxHeight: "180px",
                    overflowY: "auto",
                  }}
                >
                  {items.length === 0 ? (
                    <p style={{ color: "#777" }}>Sin platillos</p>
                  ) : (
                    items.map((p, i) => (
                      <div
                        key={i}
                        style={{
                          borderBottom:
                            i !== items.length - 1 ? "1px solid #eee" : "none",
                          paddingBottom: "8px",
                          marginBottom: "8px",
                        }}
                      >
                        <p style={{ margin: 0, fontWeight: "600" }}>
                          {p.nombre}
                        </p>
                        <p style={{ margin: 0, color: "#555" }}>
                          Cantidad: {p.cantidad}
                        </p>

                        {p.nota && (
                          <p
                            style={{
                              margin: 0,
                              color: "#999",
                              fontSize: "13px",
                            }}
                          >
                            Nota: {p.nota}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </article>
            );
          })
      )}
    </div>
  );
};

export default ActiveOrdersSection;
