import React from "react";

/**
 * Componente para mostrar un platillo agrupado con las mesas que lo pidieron
 * REDISEÑO COMPLETO - Elegante y profesional
 */
const DishGroupCard = ({ dishName, tables, totalCount, onTableClick }) => {
  const total = totalCount ?? tables.reduce((sum, t) => sum + (t.quantity || 1), 0);

  return (
    <div className="dish-card-pro">
      <div className="dish-card-header">
        <h3 className="dish-title">{dishName}</h3>
        <span className="dish-quantity">×{total}</span>
      </div>

      <div className="dish-tables">
        {tables.map((table) => (
          <button
            key={`${table.recordId}-${dishName}`}
            className="mesa-badge"
            onClick={() => onTableClick(table)}
            title={`Mesa ${table.tableNumber} - Cantidad: ${table.quantity}`}
          >
            Mesa {table.tableNumber}
          </button>
        ))}
      </div>
    </div>
  );
};

export default DishGroupCard;
