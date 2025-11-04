import React, { useState } from "react";
import OrderCard from "./OrderCard";
import "../styles/order_section.css";

const initialOrders = [
  {
    id: "1259",
    tableNumber: "7",
    status: "Pendiente", // "En preparación" | "Servido" | "Pagado"
    accounts: [
      {
        accountId: "1",
        label: "Cuenta 1", // nombre o etiqueta de la cuenta
        items: [
          {
            type: "food", // tipo de artículo (food, drink, etc.)
            name: "Pollo a la Plancha",
            quantity: 2,
            unitPrice: 12.5,
            subtotal: 25,
          },
          {
            type: "drink",
            name: "Refresco",
            quantity: 2,
            unitPrice: 2.5,
            subtotal: 5,
          },
        ],
        subtotal: 30,
      },
      {
        accountId: "2",
        label: "Cuenta 2",
        items: [
          {
            type: "food",
            name: "Ensalada César",
            quantity: 1,
            unitPrice: 8.5,
            subtotal: 8.5,
          },
        ],
        subtotal: 8.5,
      },
      {
        accountId: "3",
        label: null,
        items: [
          {
            type: "food",
            name: "Ensalada César",
            quantity: 1,
            unitPrice: 8.5,
            subtotal: 8.5,
          },
        ],
        subtotal: 8.5,
      },
      {
        accountId: "3",
        label: null,
        items: [
          {
            type: "food",
            name: "Ensalada César",
            quantity: 1,
            unitPrice: 8.5,
            subtotal: 8.5,
          },
        ],
        subtotal: 8.5,
      },
    ],
    total: 38.5,
  },
];

const OrderSection = () => {
  const [orders, setOrders] = useState(initialOrders);

  const updateOrderState = (id, newState) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === id ? { ...order, status: newState } : order
      )
    );
  };

  return (
    <div>
      <h1>Pedidos Activos</h1>
      <section className="order-card-section">
        {orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            updateOrderState={updateOrderState}
          />
        ))}
      </section>
    </div>
  );
};

export default OrderSection;
