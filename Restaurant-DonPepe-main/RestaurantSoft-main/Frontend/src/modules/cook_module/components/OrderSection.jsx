import React, { useState } from "react";
import OrderCard from "./OrderCard";
import "../styles/order_section.css";
import { useDataSync } from "../../../hooks/useDataSync";
import { getOrdenesActivas, cambiarEstadoOrden } from "../../../services/cookService";
import { RefreshCw } from "lucide-react";

const estadosMap = {
  'pendiente': 'Pendiente',
  'en_preparacion': 'En preparación',
  'listo': 'Listo',
  'entregado': 'Entregado',
};

const OrderSection = () => {
  // Sincronizar órdenes activas desde el backend (actualiza cada 3 segundos)
  const { data: ordenesData, loading, error, refetch } = useDataSync(getOrdenesActivas, 3000);

  const updateDishStatus = async (orderId, dishId, newStatus) => {
    try {
      // Mapear estado de UI a estado del backend
      const estadosBackendMap = {
        'Pendiente': 'pendiente',
        'En preparación': 'en_preparacion',
        'Listo': 'listo',
        'Entregado': 'entregado',
      };
      
      await cambiarEstadoOrden(orderId, estadosBackendMap[newStatus]);
      // Refrescar datos después de cambiar el estado
      await refetch();
    } catch (error) {
      console.error('Error actualizando estado:', error);
      alert('Error al actualizar el estado del pedido');
    }
  };

  if (loading && !ordenesData) {
    return (
      <div>
        <h1>Pedidos Activos</h1>
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
        <h1>Pedidos Activos</h1>
        <div style={{ textAlign: 'center', padding: '2rem', color: 'red' }}>
          <p>Error al cargar pedidos: {error}</p>
        </div>
      </div>
    );
  }

  // Transformar datos del backend al formato esperado por OrderCard
  const ordersFormatted = ordenesData?.map(orden => ({
    orderId: orden.pedido_id,
    tableNumber: orden.orden?.match(/Mesa: (.+)/)?.[1] || 'N/A',
    orderStatus: estadosMap[orden.estado] || orden.estado,
    total: 0, // Se calcularía en base a los items
    isPaid: orden.estado === 'entregado',
    items: [
      {
        dishId: orden.id,
        dishStatus: estadosMap[orden.estado] || orden.estado,
        dishQuantity: 1,
        unitPrice: 0,
        subtotal: 0,
        dishName: orden.plato,
        dishCategory: 'Principal',
        cost: 0,
        description: orden.preparacion || '',
        createTime: orden.created_at,
      }
    ],
  })) || [];

  return (
    <div>
      <h1>Pedidos Activos</h1>
      <section className="order-card-section">
        {ordersFormatted.map((order) => (
          <OrderCard
            key={order.orderId}
            order={order}
            updateDishStatus={updateDishStatus}
          />
        ))}
      </section>
      
      {ordersFormatted.length === 0 && (
        <p style={{ textAlign: 'center', padding: '2rem' }}>
          No hay pedidos activos en este momento
        </p>
      )}
    </div>
  );
};

export default OrderSection;
