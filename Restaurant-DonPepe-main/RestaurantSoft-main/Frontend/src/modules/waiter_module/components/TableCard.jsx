import React from "react";
import { useNavigate } from "react-router-dom";

const TableCard = ({ tables }) => {
  const navigate = useNavigate();

  const handleNavigate = (tableNumber) => {
    navigate(`/waiter-dashboard/${tableNumber}/orders-handler`);
  };

  return (
    <>
      <article className="table-card shadow">
        <div className="table-card-header">
          {" "}
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
        <button
          className="new-order-btn"
          onClick={() => handleNavigate(tables.tableNumber)}
        >
          {tables.tableStatus === "ocupada" ? "Editar Orden" : "Añadir Orden"}
        </button>
      </article>
    </>
  );
};

export default TableCard;
