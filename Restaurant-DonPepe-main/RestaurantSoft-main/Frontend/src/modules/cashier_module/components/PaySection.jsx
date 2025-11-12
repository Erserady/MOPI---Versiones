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
  const ordersFormatted = mesasData?.map(mesa => {
    console.log('🔍 Mesa del backend:', mesa);
    
    // Procesar todas las órdenes de la mesa
    let allItems = [];
    let totalMesa = 0;
    
    mesa.ordenes_pendientes.forEach(orden => {
      try {
        // Parsear el JSON del pedido
        const pedidoItems = JSON.parse(orden.pedido);
        
        // Agregar cada item con su precio real
        pedidoItems.forEach(item => {
          const subtotal = item.cantidad * item.precio;
          allItems.push({
            type: 'Principal',
            ready: true,
            name: item.nombre,
            quantity: item.cantidad,
            unitPrice: item.precio,
            subtotal: subtotal,
            nota: item.nota || ''
          });
          totalMesa += subtotal;
        });
      } catch (error) {
        console.error('Error parseando pedido:', orden.pedido, error);
        // Fallback si no se puede parsear
        allItems.push({
          type: 'Principal',
          ready: true,
          name: orden.pedido,
          quantity: orden.cantidad,
          unitPrice: 0,
          subtotal: 0,
        });
      }
    });
    
    return {
      id: `MESA-${mesa.mesa_id}`,
      mesaId: mesa.mesa_id,  // ✅ ID de la mesa para el backend
      tableId: mesa.mesa_id,  // ✅ Alias alternativo
      orderIds: mesa.ordenes_pendientes.map(orden => orden.id),  // ✅ IDs de las órdenes
      tableNumber: mesa.mesa_nombre,
      waiter: mesa.ordenes_pendientes[0]?.cliente || 'Sin asignar',  // Nombre del mesero/cliente
      createdAt: new Date().toISOString(),
      status: 'completed',
      accounts: [
        {
          accountId: `ACC-${mesa.mesa_id}`,
          isPaid: false,
          label: 'Cuenta principal',
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
