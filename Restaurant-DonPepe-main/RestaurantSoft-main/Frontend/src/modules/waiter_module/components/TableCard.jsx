import React from "react";
import { useNavigate } from "react-router-dom";

const TableCard = ({ tables }) => {
  const navigate = useNavigate();
  const hasActiveOrder = Boolean(tables.currentOrderId || tables.currentOrder);
  const buttonLabel = hasActiveOrder ? "Editar orden" : "Anadir orden";

  const handleNavigate = () => {
    const mesaId = tables.mesa_id || tables.tableNumber;
    navigate(`/waiter-dashboard/${mesaId}/orders-handler`, {
      state: {
        mesaId,
        tableNumber: tables.tableNumber,
        currentOrder: tables.currentOrder || null,
      },
    });
  };

  return (
    <>
      <article className="table-card shadow">
        <div className="table-card-header">
          <h2>Mesa #{tables.tableNumber}</h2>
          <span className={tables.tableStatus.toLowerCase()}>
            {tables.tableStatus.toUpperCase()}
          </span>
        </div>

        <p>
          <strong>Capacidad:</strong> {tables.guestCount} persona(s)
        </p>
        <p>
          <strong>Mesero asignado:</strong>{" "}
          {tables.assignedWaiter || "No asignado"}
        </p>
        <button className="new-order-btn" onClick={handleNavigate}>
          {buttonLabel}
        </button>
      </article>
    </>
  );
};

export default TableCard;
