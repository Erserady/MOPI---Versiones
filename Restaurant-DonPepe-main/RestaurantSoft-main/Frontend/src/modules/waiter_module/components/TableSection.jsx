import React from "react";
import "../styles/table_section.css";
import TableCard from "./TableCard";
import { useDataSync } from "../../../hooks/useDataSync";
import { getMesas, getOrdenes } from "../../../services/waiterService";
import { RefreshCw } from "lucide-react";

const TableSection = () => {
  // Sincronizar mesas desde el backend (actualiza cada 3 segundos)
  const { data: mesasData, loading, error } = useDataSync(getMesas, 3000);
  
  // Sincronizar órdenes para saber qué mesas están ocupadas
  const { data: ordenesData } = useDataSync(getOrdenes, 3000);

  if (loading && !mesasData) {
    return (
      <div>
        <h1>Mesas Registradas</h1>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
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
        <div style={{ textAlign: 'center', padding: '2rem', color: 'red' }}>
          <p>Error al cargar mesas: {error}</p>
        </div>
      </div>
    );
  }

  // Transformar datos del backend al formato esperado por TableCard
  const tablesFormatted = mesasData?.map(mesa => {
    // Buscar órdenes pendientes para esta mesa
    const ordenesActivas = ordenesData?.filter(
      orden => orden.table === mesa.id && orden.estado === 'pendiente'
    ) || [];
    
    return {
      tableNumber: mesa.mesa || mesa.mesa_id,
      tableStatus: ordenesActivas.length > 0 ? "ocupada" : "libre",
      guestCount: ordenesActivas.length,
      assignedWaiter: "",
      mergedTables: [],
      currentOrderId: ordenesActivas[0]?.id || null,
      ubicacion: mesa.ubicacion,
      mesa_id: mesa.mesa_id,
    };
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
        <p style={{ textAlign: 'center', padding: '2rem' }}>
          No hay mesas registradas
        </p>
      )}
    </div>
  );
};

export default TableSection;
