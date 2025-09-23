import { useState } from "react";
import PayCard from "./PayCard";

const testOrders = [
  {
    table: 5,
    orderCode: "ORD003",
    completedAt: "16:30",
    waiter: "María González",
    subtotal: 44.5,
    tax: 7.12,
    total: 51.62,
    items: [
      { name: "Pollo a la Plancha", quantity: 2, price: 31.0 },
      { name: "Coca Cola", quantity: 2, price: 5.0 },
      { name: "Flan Casero", quantity: 1, price: 8.5 },
    ],
  },
];

const PaySection = () => {
  const [orders] = useState(testOrders);

  return (
    <div>
      <h1>Pedidos Listos para Pagar</h1>
      <span>{orders.length}</span>
      <section className="pay-card-section">
        {orders.map((order, i) => (
          <PayCard key={i} order={order} />
        ))}
      </section>
    </div>
  );
};

export default PaySection;
