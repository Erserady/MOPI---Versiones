import { useState } from "react";
import OrderDialog from "./OrderDialog";

const OrderCard = ({ order, updateDishStatus }) => {
  const visibleItems = order.items.slice(0, 2);
  const extraCount = order.items.length - visibleItems.length;
  const [isDialogOpen, setDialogOpen] = useState(false);

  const statusClass = order.orderStatus
    .toLowerCase()
    .replace("en ", "")
    .replace("ó", "o");

  return (
    <article className={`shadow order-card-container ${statusClass}`}>
      <section className="order-card-header">
        <h2 className="order-card-title">Mesa {order.tableNumber}</h2>
        <span className={`order-card-badge ${statusClass}`}>
          {order.orderStatus}
        </span>
      </section>

      <section className="order-card-body">
        <ul className="order-card-items">
          {visibleItems.map((item) => (
            <li key={item.dishId}>
              <b>{item.dishName}</b> x{item.dishQuantity}
            </li>
          ))}
          {extraCount > 0 && <li>+{extraCount} más</li>}
        </ul>
      </section>

      <section className="order-card-actions">
        <button className="shadow" onClick={() => setDialogOpen(true)}>
          Ver
        </button>
      </section>

      <OrderDialog
        order={order}
        isOpen={isDialogOpen}
        onClose={() => setDialogOpen(false)}
        updateDishStatus={updateDishStatus}
      />
    </article>
  );
};

export default OrderCard;
