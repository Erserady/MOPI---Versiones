import React from "react";
import "../styles/table_section.css";
import TableCard from "./TableCard";
import { useDataSync } from "../../../hooks/useDataSync";
import { getMesas } from "../../../services/waiterService";
import { RefreshCw } from "lucide-react";

const TableSection = ({ ordenes = [] }) => {
  // Sincronizar mesas desde el backend (actualiza cada 3 segundos)
  const { data: mesasData, loading, error } = useDataSync(getMesas, 3000);

  if (loading && !mesasData) {
    return (
      <div>
        <h1>Mesas Registradas</h1>
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <RefreshCw className="spin" size={32} />
          <p>Cargando mesas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1>Mesas Registradas</h1>
        <div style={{ textAlign: "center", padding: "2rem", color: "red" }}>
          <p>Error al cargar mesas: {error}</p>
        </div>
      </div>
    );
  }

  // Transformar datos del backend al formato esperado por TableCard
  const tablesFormatted =
    mesasData?.map((mesa) => {
      // LOG: Ver datos que llegan del backend
      console.log("Mesa del backend:", mesa);

      const mesaIdentifiers = [
        mesa.id,
        mesa.mesa_id,
        mesa.number,
        mesa.mesa,
      ]
        .filter((value) => value !== undefined && value !== null)
        .map((value) => value.toString());

      // Buscar ordenes pendientes para esta mesa (datos provienen del dashboard)
      const ordenesActivas = Array.isArray(ordenes)
        ? ordenes.filter((orden) => {
            const orderTable =
              orden.table ?? orden.mesa_id ?? orden.mesa ?? orden.tableNumber;
            const normalizedStatus =
              typeof orden.estado === "string"
                ? orden.estado.toLowerCase()
                : orden.estado;
            return (
              normalizedStatus === "pendiente" &&
              mesaIdentifiers.includes((orderTable ?? "").toString())
            );
          })
        : [];

      const currentOrder = ordenesActivas[0] || null;

      // Mapear el estado del backend al formato del frontend
      const statusMap = {
        available: "libre",
        occupied: "ocupada",
        reserved: "reservada",
      };

      const formatted = {
        tableNumber: mesa.number || mesa.mesa || mesa.mesa_id,
        tableStatus: statusMap[mesa.status] || "libre", // TODO: usar estado del backend real
        guestCount: mesa.capacity || 4, // TODO: usar capacidad real de la mesa
        assignedWaiter: mesa.assigned_waiter_name || null, // TODO: mostrar nombre del mesero asignado
        mergedTables: [],
        currentOrderId: currentOrder?.id || null,
        currentOrder,
        ubicacion: mesa.ubicacion,
        mesa_id: mesa.mesa_id || mesa.id,
      };

      console.log("Mesa formateada:", formatted);
      return formatted;
    }) || [];

  return (
    <div>
      <h1>Mesas Registradas</h1>

      <section className="table-card-section">
        {tablesFormatted.map((table) => (
          <TableCard key={table.mesa_id || table.tableNumber} tables={table} />
        ))}
      </section>

      {tablesFormatted.length === 0 && (
        <p style={{ textAlign: "center", padding: "2rem" }}>
          No hay mesas registradas
        </p>
      )}
    </div>
  );
};

export default TableSection;
