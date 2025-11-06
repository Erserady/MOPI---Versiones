import React, { useState } from "react";
import OrderCard from "./OrderCard";
import "../styles/order_section.css";

const initialOrders = [
  {
    orderId: "A1001",
    tableNumber: 5,
    orderStatus: "Pendiente",
    total: 37.5,
    isPaid: false,
    items: [
      {
        dishId: "d01",
        dishStatus: "Pendiente",
        dishQuantity: 2,
        unitPrice: 10.5,
        subtotal: 21.0,
        dishName: "Pollo a la Plancha",
        dishCategory: "Principal",
        cost: 8.0,
        description: "Pollo a la plancha con guarnición",
        createTime: "2025-10-23 18:12:45",
      },
      {
        dishId: "d02",
        dishStatus: "En preparación",
        dishQuantity: 1,
        unitPrice: 5.5,
        subtotal: 5.5,
        dishName: "Refresco natural",
        dishCategory: "Bebida",
        cost: 2.0,
        description: "Refresco de piña natural",
        createTime: "2025-10-23 18:14:03",
      },
      {
        dishId: "d03",
        dishStatus: "Listo",
        dishQuantity: 1,
        unitPrice: 11.0,
        subtotal: 11.0,
        dishName: "Ensalada César",
        dishCategory: "Entrada",
        cost: 7.0,
        description: "Ensalada con aderezo César",
        createTime: "2025-10-23 18:20:10",
      },
    ],
  },
];

const OrderSection = () => {
  const [orders, setOrders] = useState(initialOrders);

  const updateDishStatus = (orderId, dishId, newStatus) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.orderId === orderId
          ? {
              ...order,
              items: order.items.map((dish) =>
                dish.dishId === dishId
                  ? { ...dish, dishStatus: newStatus }
                  : dish
              ),
            }
          : order
      )
    );
  };

  return (
    <div>
      <h1>Pedidos Activos</h1>
      <section className="order-card-section">
        {orders.map((order) => (
          <OrderCard
            key={order.orderId}
            order={order}
            updateDishStatus={updateDishStatus}
          />
        ))}
      </section>
    </div>
  );
};

export default OrderSection;
