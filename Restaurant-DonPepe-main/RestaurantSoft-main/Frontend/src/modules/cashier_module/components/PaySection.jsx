import PayCard from "./PayCard";
import "../styles/pay_section.css";
import { useDataSync } from "../../../hooks/useDataSync";
import { getMesasConOrdenesPendientes } from "../../../services/cashierService";
import { RefreshCw } from "lucide-react";

const KITCHEN_BLOCK_STATES = ["pendiente", "en_preparacion"];

const PaySection = () => {
  // Sincronizar mesas desde el backend (actualiza cada 3 segundos)
  const { data: mesasData, loading, error, refetch } = useDataSync(
    getMesasConOrdenesPendientes,
    3000
  );

  if (loading && !mesasData) {
    return (
      <div>
        <h1>Pedidos Listos para Pagar</h1>
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <RefreshCw className="spin" size={32} />
          <p>Cargando pedidos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1>Pedidos Listos para Pagar</h1>
        <div style={{ textAlign: "center", padding: "2rem", color: "red" }}>
          <p>Error al cargar pedidos: {error}</p>
        </div>
      </div>
    );
  }

  // Transformar datos del backend al formato esperado por PayCard
  const ordersFormatted =
    mesasData?.map((mesa) => {
      const mesaOrders = Array.isArray(mesa.ordenes_pendientes)
        ? mesa.ordenes_pendientes
        : [];

      const hasKitchenHold = mesaOrders.some((orden) =>
        KITCHEN_BLOCK_STATES.includes((orden.estado || "").toLowerCase())
      );

      let allItems = [];
      let totalMesa = 0;

      mesaOrders.forEach((orden) => {
        try {
          const pedidoItems = JSON.parse(orden.pedido);

          pedidoItems.forEach((item) => {
            const cantidad = Number(item.cantidad) || 0;
            const precio = Number(item.precio) || 0;
            const subtotal = cantidad * precio;

            allItems.push({
              type: item.categoria || item.category || "Principal",
              ready: true,
              name: item.nombre,
              quantity: cantidad,
              unitPrice: precio,
              subtotal,
              nota: item.nota || "",
              category: item.categoria || item.category || "Principal",
            });
            totalMesa += subtotal;
          });
        } catch (parseError) {
          console.error("Error parseando pedido:", orden.pedido, parseError);
          allItems.push({
            type: "Principal",
            ready: true,
            name: orden.pedido,
            quantity: orden.cantidad,
            unitPrice: 0,
            subtotal: 0,
          });
        }
      });

      // Determinar el estado general - priorizar payment_requested
      const orderStatus = mesaOrders.find(o => o.estado === 'payment_requested')?.estado || 
                         mesaOrders.find(o => o.estado === 'prefactura_enviada')?.estado ||
                         mesaOrders[0]?.estado || 
                         'completed';

      return {
        id: `MESA-${mesa.mesa_id}`,
        mesaId: mesa.mesa_id,
        tableId: mesa.mesa_id,
        orderIds: mesaOrders.map((orden) => orden.id),
        orderId: mesaOrders[0]?.id, // ID de la primera orden para enviar pre-factura
        tableNumber: mesa.mesa_nombre,
        waiter: mesaOrders[0]?.waiter_name || 
                mesaOrders[0]?.mesero || 
                mesaOrders[0]?.cliente || 
                "Sin asignar",
        kitchenHold: hasKitchenHold,
        kitchenStatuses: mesaOrders.map((orden) => ({
          id: orden.id,
          orderId: orden.order_id,
          estado: orden.estado,
        })),
        createdAt: new Date().toISOString(),
        status: orderStatus, // Estado real de la orden
        accounts: [
          {
            accountId: `ACC-${mesa.mesa_id}`,
            isPaid: false,
            label: "Cuenta principal",
            items: allItems,
            subtotal: totalMesa,
          },
        ],
        total: totalMesa,
      };
    }) || [];

  return (
    <div>
      <h1>
        Pedidos Listos para Pagar: <span>{ordersFormatted.length}</span>
      </h1>

      <section className="pay-card-section">
        {ordersFormatted.map((order) => (
          <PayCard key={order.id} order={order} onOrderUpdate={refetch} />
        ))}
      </section>

      {ordersFormatted.length === 0 && (
        <p style={{ textAlign: "center", padding: "2rem" }}>
          No hay pedidos pendientes de pago en este momento
        </p>
      )}
    </div>
  );
};

export default PaySection;
