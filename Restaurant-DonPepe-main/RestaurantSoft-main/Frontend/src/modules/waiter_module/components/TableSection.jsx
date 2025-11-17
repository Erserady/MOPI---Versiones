import React, { useMemo } from "react";
import "../styles/table_section.css";
import TableCard from "./TableCard";
import { useDataSync } from "../../../hooks/useDataSync";
import { getMesas } from "../../../services/waiterService";
import { RefreshCw } from "lucide-react";

const TableSection = ({ ordenes = [] }) => {
  // Sincronizar mesas desde el backend (actualiza cada 3 segundos)
  const { data: mesasData, loading, error } = useDataSync(getMesas, 3000);

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

  // Sin filtros - mostrar todas las mesas

  // Estadísticas
  const stats = useMemo(() => {
    return {
      total: tablesFormatted.length,
      ocupadas: tablesFormatted.filter(t => t.tableStatus === "ocupada").length,
      libres: tablesFormatted.filter(t => t.tableStatus === "libre").length,
      reservadas: tablesFormatted.filter(t => t.tableStatus === "reservada").length
    };
  }, [tablesFormatted]);

  // Renders condicionales DESPUÉS de todos los hooks
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

  return (
    <div className="tables-container">
      {/* Header con estadísticas */}
      <div className="tables-header">
        <div className="tables-title">
          <h1>Mesas del Restaurante</h1>
          <p className="tables-subtitle">Gestiona y visualiza el estado de todas las mesas</p>
        </div>
        
        <div className="tables-stats">
          <div className="stat-card">
            <span className="stat-label">Total</span>
            <span className="stat-value">{stats.total}</span>
          </div>
          <div className="stat-card libre">
            <span className="stat-label">Libres</span>
            <span className="stat-value">{stats.libres}</span>
          </div>
          <div className="stat-card ocupada">
            <span className="stat-label">Ocupadas</span>
            <span className="stat-value">{stats.ocupadas}</span>
          </div>
          {stats.reservadas > 0 && (
            <div className="stat-card reservada">
              <span className="stat-label">Reservadas</span>
              <span className="stat-value">{stats.reservadas}</span>
            </div>
          )}
        </div>
      </div>

      {/* Grid de mesas */}
      <section className="tables-grid">
        {tablesFormatted.map((table) => (
          <TableCard key={table.mesa_id || table.tableNumber} tables={table} />
        ))}
      </section>

      {tablesFormatted.length === 0 && (
        <div className="tables-empty">
          <p>No hay mesas registradas</p>
        </div>
      )}
    </div>
  );
};

export default TableSection;
