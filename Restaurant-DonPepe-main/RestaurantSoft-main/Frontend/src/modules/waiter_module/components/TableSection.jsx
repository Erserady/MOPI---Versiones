import React from "react";
import "../styles/table_section.css"; // puedes crear un css similar al de order_section
import TableCard from "./TableCard";

const tablesTest = [
  {
    tableNumber: "5",
    tableStatus: "ocupada", // libre | ocupada | reservada
    guestCount: 3,
    assignedWaiter: "Carlos",
    combinedTableNumbers: [],
    currentOrderId: 101,
  },
  {
    tableNumber: "7",
    tableStatus: "libre",
    guestCount: 0,
    assignedWaiter: "",
    combinedTableNumbers: [],
    currentOrderId: null,
  },
];

const TableSection = () => {
  return (
    <div>
      <h1>Mesas Registradas</h1>

      <section className="table-card-section">
        {tablesTest.map((table) => (
          <TableCard key={table.tableNumber || "a"} tables={table} />
        ))}
      </section>
    </div>
  );
};

export default TableSection;
