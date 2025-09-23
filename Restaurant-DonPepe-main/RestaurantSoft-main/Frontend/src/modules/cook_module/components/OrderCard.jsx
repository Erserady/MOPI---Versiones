import { useState } from "react";
import OrderDialog from "./OrderDialog";

const OrderCard = ({ order, updateOrderState }) => {
  const visibleAccounts = order.accounts.slice(0, 2); // mostrar solo 2 cuentas
  const extraCount = order.accounts.length - visibleAccounts.length; // cuentas sobrantes
  const [isDialogOpen, setDialogOpen] = useState(false);

  return (
    <article
      className={`shadow order-card-container  ${order.status
        .toLowerCase()
        .replace("en ", "")
        .replace("ó", "o")}`}
    >
      <section className="order-card-header">
        <h2 className="order-card-title">Mesa {order.tableNumber}</h2>
        <span
          className={`order-card-badge ${order.status
            .toLowerCase()
            .replace("en ", "")
            .replace("ó", "o")}`}
        >
          {order.status}
        </span>
      </section>

      <section className="order-card-body">
        <ul className="order-card-items">
          {visibleAccounts.map((account) => (
            <li key={account.accountId}>
              <b>{account.label || "Cuenta"}</b> | <b>Pedidos:</b>{" "}
              {account.items.length}
            </li>
          ))}
          {extraCount > 0 && <li>+{extraCount} más</li>}
        </ul>
      </section>

      <section className="order-card-actions">
        <button className="shadow" onClick={() => setDialogOpen(true)}>
          Ver
        </button>
        <button
          className={
            order.status === "En preparación" ? "disabled shadow" : "shadow"
          }
          onClick={() => updateOrderState(order.id, "En preparación")}
        >
          Preparar
        </button>
        <button
          className={order.status === "Listo" ? "disabled shadow" : "shadow"}
          onClick={() => updateOrderState(order.id, "Listo")}
        >
          Listo
        </button>
      </section>

      <OrderDialog
        order={order}
        isOpen={isDialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </article>
  );
};

export default OrderCard;
