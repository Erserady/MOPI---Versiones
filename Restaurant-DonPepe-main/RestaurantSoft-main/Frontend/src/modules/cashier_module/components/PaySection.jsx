import { useState } from "react";
import PayCard from "./PayCard";
import "../styles/pay_section.css";

const testOrders = [
  {
    id: "ORD001",
    tableNumber: 4,
    createdAt: "2025-09-21T16:30:00Z",
    status: "completed",
    accounts: [
      {
        accountId: "ACC001",
        isPaid: false,
        label: "Cuenta principal",
        items: [
          {
            type: "Principal",
            ready: true,
            name: "Pollo a la Plancha",
            quantity: 2,
            unitPrice: 15.5,
            subtotal: 31.0,
          },
        ],
        subtotal: 49.5,
      },
      {
        accountId: "ACC002",
        isPaid: false,
        label: "Cuenta principal",
        items: [
          {
            type: "Principal",
            ready: true,
            name: "Pollo a la Plancha",
            quantity: 2,
            unitPrice: 15.5,
            subtotal: 31.0,
          },
        ],
        subtotal: 49.5,
      },
    ],
    total: 49.5,
  },
];

const PaySection = () => {
  const [orders] = useState(testOrders);

  return (
    <div>
      <h1>
        Pedidos Listos para Pagar: <span>{orders.length}</span>
      </h1>

      <section className="pay-card-section">
        {orders.map((order, i) => (
          <PayCard key={i} order={order} />
        ))}
      </section>
    </div>
  );
};

export default PaySection;
