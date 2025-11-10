import { useState } from "react";
import PayCard from "./PayCard";
import "../styles/pay_section.css";
import { useDataSync } from "../../../hooks/useDataSync";
import { getMesasConOrdenesPendientes } from "../../../services/cashierService";
import { RefreshCw } from "lucide-react";


const PaySection = () => {
  // Sincronizar mesas con órdenes pendientes desde el backend (actualiza cada 3 segundos)
  const { data: mesasData, loading, error } = useDataSync(getMesasConOrdenesPendientes, 3000);

  if (loading && !mesasData) {
    return (
      <div>
        <h1>Pedidos Listos para Pagar</h1>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
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
        <div style={{ textAlign: 'center', padding: '2rem', color: 'red' }}>
          <p>Error al cargar pedidos: {error}</p>
        </div>
      </div>
    );
  }

  // Transformar datos del backend al formato esperado por PayCard
  const ordersFormatted = mesasData?.map(mesa => ({
    id: `MESA-${mesa.mesa_id}`,
    tableNumber: mesa.mesa_nombre,
    createdAt: new Date().toISOString(),
    status: 'completed',
    accounts: [
      {
        accountId: `ACC-${mesa.mesa_id}`,
        isPaid: false,
        label: 'Cuenta principal',
        items: mesa.ordenes_pendientes.map(orden => ({
          type: 'Principal',
          ready: true,
          name: orden.pedido,
          quantity: orden.cantidad,
          unitPrice: 10.0, // Precio por defecto, debería venir del plato
          subtotal: orden.cantidad * 10.0,
        })),
        subtotal: mesa.ordenes_pendientes.reduce((acc, orden) => acc + (orden.cantidad * 10.0), 0),
      },
    ],
    total: mesa.ordenes_pendientes.reduce((acc, orden) => acc + (orden.cantidad * 10.0), 0),
  })) || [];

  return (
    <div>
      <h1>
        Pedidos Listos para Pagar: <span>{ordersFormatted.length}</span>
      </h1>

      <section className="pay-card-section">
        {ordersFormatted.map((order, i) => (
          <PayCard key={order.id} order={order} />
        ))}
      </section>
      
      {ordersFormatted.length === 0 && (
        <p style={{ textAlign: 'center', padding: '2rem' }}>
          No hay pedidos pendientes de pago en este momento
        </p>
      )}
    </div>
  );
};

export default PaySection;
