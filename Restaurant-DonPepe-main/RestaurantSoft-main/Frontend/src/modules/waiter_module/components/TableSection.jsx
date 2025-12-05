import React, { useMemo, useState } from "react";
import "../styles/table_section.css";
import TableCard from "./TableCard";
import { useDataSync } from "../../../hooks/useDataSync";
import { getMesas } from "../../../services/waiterService";
import { RefreshCw, Filter } from "lucide-react";
import { getCurrentUserId } from "../../../utils/auth";
import ActiveOrdersSection from "./ActiveOrdersSection";

const TableSection = ({ ordenes = [] }) => {
  // Obtener ID del mesero actual
  const currentWaiterId = getCurrentUserId();
  
  // Estado para el filtro
  const [filterMode, setFilterMode] = useState("all"); // "all", "own", "available"
  
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

      // Buscar ordenes activas para esta mesa (cualquier estado excepto "pagado")
      // Esto permite agregar más items a la misma cuenta hasta que caja cierre el pedido
      const ordenesActivas = Array.isArray(ordenes)
        ? ordenes.filter((orden) => {
            const orderTable =
              orden.table ?? orden.mesa_id ?? orden.mesa ?? orden.tableNumber;
            const normalizedStatus =
              typeof orden.estado === "string"
                ? orden.estado.toLowerCase()
                : orden.estado;
            return (
              normalizedStatus !== "pagado" &&
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

      // Determinar si esta mesa pertenece al mesero actual
      const waiterId = currentOrder?.waiter_id || mesa.waiter_id;
      
      // Convertir ambos IDs a string para comparación segura
      const waiterIdStr = waiterId ? String(waiterId) : null;
      const currentWaiterIdStr = currentWaiterId ? String(currentWaiterId) : null;
      
      // Lógica corregida: solo es propia si el waiter_id coincide con el actual
      const isOwnTable = waiterIdStr === currentWaiterIdStr;
      const isAvailable = !currentOrder || currentOrder.estado === "pagado";
      
      // Log de depuración
      if (currentOrder && waiterId) {
        console.log(`🚨 Mesa ${mesa.number}: waiter_id=${waiterIdStr}, currentUser=${currentWaiterIdStr}, isOwnTable=${isOwnTable}`);
      }

      const formatted = {
        tableNumber: mesa.number || mesa.mesa || mesa.mesa_id,
        tableStatus: statusMap[mesa.status] || "libre",
        guestCount: mesa.capacity || 4,
        assignedWaiter: currentOrder?.waiter_name || mesa.assigned_waiter_name || null,
        mergedTables: [],
        currentOrderId: currentOrder?.id || null,
        currentOrder,
        orderStatus: currentOrder?.estado || null, // Estado de la orden (payment_requested, servido, etc.)
        ubicacion: mesa.ubicacion,
        mesa_id: mesa.mesa_id || mesa.id,
        isOwnTable, // Nueva propiedad para indicar si es del mesero actual
        waiterId, // ID del mesero asignado
      };

      console.log("Mesa formateada:", formatted);
      return formatted;
    }) || [];

  // Filtrar y ordenar mesas según el modo seleccionado
  const filteredTables = useMemo(() => {
    let tables = [];
    switch (filterMode) {
      case "own":
        // Solo mesas del mesero actual
        tables = tablesFormatted.filter(table => table.isOwnTable);
        break;
      case "available":
        // Solo mesas libres (sin orden activa)
        tables = tablesFormatted.filter(table => table.tableStatus === "libre");
        break;
      case "all":
      default:
        // Todas las mesas
        tables = tablesFormatted;
    }
    
    // Ordenar numéricamente por tableNumber
    return tables.sort((a, b) => {
      const numA = parseInt(a.tableNumber) || 0;
      const numB = parseInt(b.tableNumber) || 0;
      return numA - numB;
    });
  }, [tablesFormatted, filterMode]);

  // Estadísticas basadas en TODAS las mesas (no filtradas)
  const stats = useMemo(() => {
    return {
      total: tablesFormatted.length,
      ocupadas: tablesFormatted.filter(t => t.tableStatus === "ocupada").length,
      libres: tablesFormatted.filter(t => t.tableStatus === "libre").length,
      reservadas: tablesFormatted.filter(t => t.tableStatus === "reservada").length
    };
  }, [tablesFormatted]);

  const sectionStats = useMemo(() => {
    const base = {
      Restaurante: { total: 0, libres: 0, ocupadas: 0, reservadas: 0 },
      Patio: { total: 0, libres: 0, ocupadas: 0, reservadas: 0 }
    };

    tablesFormatted.forEach((table) => {
      const raw = (table.ubicacion || table.location || "").toString().toLowerCase();
      const section = raw.includes("patio") ? "Patio" : "Restaurante";
      base[section].total += 1;
      if (table.tableStatus === "libre") base[section].libres += 1;
      else if (table.tableStatus === "ocupada") base[section].ocupadas += 1;
      else if (table.tableStatus === "reservada") base[section].reservadas += 1;
    });

    return base;
  }, [tablesFormatted]);

  const filteredTablesBySection = useMemo(() => {
    return {
      Restaurante: filteredTables.filter((table) => {
        const raw = (table.ubicacion || table.location || "").toString().toLowerCase();
        return !raw.includes("patio");
      }),
      Patio: filteredTables.filter((table) => {
        const raw = (table.ubicacion || table.location || "").toString().toLowerCase();
        return raw.includes("patio");
      })
    };
  }, [filteredTables]);

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
      {/* Header con título y estadísticas */}
      <div className="tables-header">
        <div className="tables-title">
          <h1>Mesas del Restaurante</h1>
          <p className="tables-subtitle">Gestiona y visualiza el estado de todas las mesas</p>
        </div>
        
        {/* Estadísticas horizontales en el header */}
        <div className="tables-stats-header">
          <div className="stat-card-header">
            <span className="stat-label">Total</span>
            <span className="stat-value">{stats.total}</span>
          </div>
          <div className="stat-card-header libre">
            <span className="stat-label">Libres</span>
            <span className="stat-value">{stats.libres}</span>
          </div>
          <div className="stat-card-header ocupada">
            <span className="stat-label">Ocupadas</span>
            <span className="stat-value">{stats.ocupadas}</span>
          </div>
          {stats.reservadas > 0 && (
            <div className="stat-card-header reservada">
              <span className="stat-label">Reservadas</span>
              <span className="stat-value">{stats.reservadas}</span>
            </div>
          )}
        </div>
      </div>

      {/* Layout de dos columnas */}
      <div className="tables-section-breakdown">
        {["Restaurante", "Patio"].map((section) => {
          const stats = sectionStats[section] || { total: 0, libres: 0, ocupadas: 0, reservadas: 0 };
          return (
            <div className="section-breakdown-card" key={section}>
              <div className="section-breakdown-header">
                <span className="section-breakdown-title">{section}</span>
                <span className="section-breakdown-total">{stats.total} mesas</span>
              </div>
              <div className="section-breakdown-chips">
                <span className="chip libre">Libres {stats.libres}</span>
                <span className="chip ocupada">Ocupadas {stats.ocupadas}</span>
                <span className="chip reservada">Reservadas {stats.reservadas}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="tables-layout">
        {/* Columna izquierda: Grid de mesas */}
        <div className="tables-main">
          {filterMode === "own" ? (
            <div style={{ width: "100%", padding: "10px 0" }}>
              <h3 style={{ margin: "0 0 12px 4px", color: "#111827" }}>Pedidos activos</h3>
              <ActiveOrdersSection orders={ordenes || []} embedded={false} />
            </div>
          ) : (
            <>
              {["Restaurante", "Patio"].map((section, idx) => {
                const list = filteredTablesBySection[section] || [];
                return (
                  <div key={section} className="tables-section-block">
                    <div className="tables-section-header-row">
                      <h3 className="tables-section-title">{section}</h3>
                      <span className="tables-section-count">{list.length} mesas</span>
                    </div>
                    <section className="tables-grid">
                      {list.map((table) => (
                        <TableCard key={table.mesa_id || table.tableNumber} tables={table} />
                      ))}
                    </section>
                    {list.length === 0 && (
                      <div className="tables-empty">
                        <p>Sin mesas en {section}</p>
                      </div>
                    )}
                    {idx === 0 && <div className="tables-section-divider" />}
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Columna derecha: Sidebar solo con filtros */}
        <aside className="tables-sidebar">
          {/* Filtros */}
          <div className="sidebar-section">
            <h3 className="sidebar-title">
              <Filter size={18} />
              Filtros
            </h3>
            <div className="filter-buttons">
              <button
                className={`filter-btn ${filterMode === "all" ? "active" : ""}`}
                onClick={() => setFilterMode("all")}
              >
                Todas las mesas
                <span className="filter-count">{tablesFormatted.length}</span>
              </button>
              <button
                className={`filter-btn ${filterMode === "own" ? "active" : ""}`}
                onClick={() => setFilterMode("own")}
              >
                Pedidos activos
                <span className="filter-count">{tablesFormatted.filter(t => t.isOwnTable).length}</span>
              </button>
              <button
                className={`filter-btn ${filterMode === "available" ? "active" : ""}`}
                onClick={() => setFilterMode("available")}
              >
                Solo libres
                <span className="filter-count">{tablesFormatted.filter(t => t.tableStatus === "libre").length}</span>
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default TableSection;
