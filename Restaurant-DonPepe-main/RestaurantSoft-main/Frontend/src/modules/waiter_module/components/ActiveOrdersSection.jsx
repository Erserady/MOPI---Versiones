import React, { useEffect, useState } from "react";
import { getOrdenes } from "../../../services/waiterService";
import { getCurrentUserId } from "../../../utils/auth";
import { cambiarEstadoOrden } from "../../../services/cookService";
import { Receipt, DollarSign, Eye } from "lucide-react";
import AlertModal from "../../../components/AlertModal";
import PreFacturaModal from "./PreFacturaModal";

const estadoColors = {
  pendiente: "#CD5C5C",
  entregado: "#FFA500",
  listo: "#57c84dff",
  en_preparacion: "#FF6B35",
  servido: "#20B2AA",
  payment_requested: "#f59e0b",
  prefactura_enviada: "#6366f1",
  facturado: "#808080",
  pagado: "#808080",
};

const estadoLabels = {
  pendiente: "Pendiente",
  entregado: "Entregado",
  listo: "Listo",
  en_preparacion: "🔥 Preparando",
  servido: "Servido",
  payment_requested: "💰 Cuenta Solicitada",
  prefactura_enviada: "📋 Pre-factura Enviada",
  facturado: "Facturado",
  pagado: "Pagado",
};

const ActiveOrdersSection = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [preFacturas, setPreFacturas] = useState({});
  const [alert, setAlert] = useState({ isOpen: false, type: 'info', title: '', message: '' });
  const [preFacturaModal, setPreFacturaModal] = useState({ isOpen: false, data: null });
  const currentWaiterId = getCurrentUserId();

  // Función para cerrar alert
  const closeAlert = () => setAlert({ ...alert, isOpen: false });

  // Función para mostrar alert
  const showAlert = (type, title, message) => {
    setAlert({ isOpen: true, type, title, message });
  };

  // Función para parsear pedido - DEBE estar antes del useEffect
  const parsePedido = (pedidoRaw) => {
    try {
      if (Array.isArray(pedidoRaw)) return pedidoRaw;
      return JSON.parse(pedidoRaw || "[]");
    } catch {
      return [];
    }
  };

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const response = await getOrdenes();
        const arr = Array.isArray(response) ? response : [];
        
        // Filtrar solo las órdenes del mesero actual
        const filteredOrders = arr.filter((order) => {
          // Excluir órdenes cerradas en caja (pagadas o facturadas)
          if (order.estado === "pagado" || order.estado === "facturado") {
            return false;
          }
          // Mostrar solo las órdenes del mesero actual
          return order.waiter_id === currentWaiterId;
        });
        
        // Cuando una orden cambia a prefactura_enviada, guardar los datos
        filteredOrders.forEach(order => {
          if (order.estado === 'prefactura_enviada' && !preFacturas[order.id]) {
            const items = parsePedido(order.pedido).map(item => ({
              nombre: item.nombre,
              cantidad: item.cantidad || 0,
              precio: item.precio || 0,
              subtotal: (item.cantidad || 0) * (item.precio || 0)
            }));
            const total = items.reduce((sum, item) => sum + item.subtotal, 0);
            
            setPreFacturas(prev => ({
              ...prev,
              [order.id]: {
                mesa: order.mesa,
                mesero: order.waiterName,
                items,
                total
              }
            }));
          }
        });
        
        setOrders(filteredOrders);
      } catch (e) {
        console.error("Error cargando ordenes:", e);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
    
    // Actualizar cada 5 segundos para reflejar cambios en tiempo real
    const interval = setInterval(loadOrders, 5000);
    return () => clearInterval(interval);
  }, [currentWaiterId]);

  if (loading) return <p>Cargando órdenes…</p>;

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
        <p>No tienes órdenes activas.</p>
      ) : (
        orders.map((order) => {
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

                  <p style={{ margin: "4px 0", color: estadoColor, fontWeight: "700", fontSize: "14px" }}>
                    Estado: <b>{estadoLabels[order.estado] || capitalizeFirstLetter(order.estado)}</b>
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

                {/* Botones de acción */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  {/* Botón Solicitar Cuenta - Aparece si NO está en payment_requested, prefactura_enviada, pagado o facturado */}
                  {!['payment_requested', 'prefactura_enviada', 'pagado', 'facturado'].includes(order.estado) && (
                    <button
                      onClick={async () => {
                        try {
                          // Guardar datos de la orden antes de cambiar estado
                          const items = parsePedido(order.pedido).map(item => ({
                            nombre: item.nombre,
                            cantidad: item.cantidad || 0,
                            precio: item.precio || 0,
                            subtotal: (item.cantidad || 0) * (item.precio || 0)
                          }));
                          const total = items.reduce((sum, item) => sum + item.subtotal, 0);
                          
                          // Guardar pre-factura
                          setPreFacturas(prev => ({
                            ...prev,
                            [order.id]: {
                              mesa: order.mesa,
                              mesero: order.waiterName,
                              items,
                              total
                            }
                          }));
                          
                          await cambiarEstadoOrden(order.id, 'payment_requested');
                          
                          // Recargar órdenes
                          const response = await getOrdenes();
                          const arr = Array.isArray(response) ? response : [];
                          const filteredOrders = arr.filter((o) => {
                            if (o.estado === "pagado" || o.estado === "facturado") return false;
                            return o.waiter_id === currentWaiterId;
                          });
                          setOrders(filteredOrders);
                          
                          showAlert('success', '¡Cuenta Solicitada!', 'La cuenta ha sido solicitada a caja correctamente. Espera a que el cajero envíe la pre-factura.');
                        } catch (e) {
                          console.error('Error solicitando cuenta:', e);
                          showAlert('error', 'Error', 'No se pudo solicitar la cuenta. Por favor, inténtalo de nuevo.');
                        }
                      }}
                      style={{
                        flex: 1,
                        padding: '10px',
                        background: '#f59e0b',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        fontSize: '14px',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.background = '#d97706'}
                      onMouseLeave={(e) => e.target.style.background = '#f59e0b'}
                    >
                      <DollarSign size={16} />
                      Solicitar Cuenta
                    </button>
                  )}

                  {/* Botón Ver Pre-factura */}
                  {order.estado === 'prefactura_enviada' && (
                    <button
                      onClick={() => {
                        if (preFacturas[order.id]) {
                          setPreFacturaModal({ isOpen: true, data: preFacturas[order.id] });
                        } else {
                          showAlert('warning', 'Pre-factura no disponible', 'Aún no se ha recibido la pre-factura de caja. Por favor, espera unos momentos.');
                        }
                      }}
                      style={{
                        flex: 1,
                        padding: '10px',
                        background: '#6366f1',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        fontSize: '14px',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.background = '#4f46e5'}
                      onMouseLeave={(e) => e.target.style.background = '#6366f1'}
                    >
                      <Eye size={16} />
                      Ver Pre-factura
                    </button>
                  )}
                </div>
              </article>
            );
          })
      )}
      
      {/* Modales */}
      <AlertModal
        isOpen={alert.isOpen}
        onClose={closeAlert}
        type={alert.type}
        title={alert.title}
        message={alert.message}
      />
      
      <PreFacturaModal
        isOpen={preFacturaModal.isOpen}
        onClose={() => setPreFacturaModal({ isOpen: false, data: null })}
        preFactura={preFacturaModal.data}
      />
    </div>
  );
};

export default ActiveOrdersSection;
