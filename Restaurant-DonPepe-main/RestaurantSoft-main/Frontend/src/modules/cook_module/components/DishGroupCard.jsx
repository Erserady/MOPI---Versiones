import React from "react";
import { ChefHat, Hash } from "lucide-react";

/**
 * Componente para mostrar un platillo agrupado con las mesas que lo pidieron
 */
const DishGroupCard = ({ dishName, tables, onTableClick }) => {
  return (
    <div className="dish-group-card">
      <div className="dish-group-header">
        <div className="dish-group-icon">
          <ChefHat size={24} />
        </div>
        <div className="dish-group-info">
          <h3 className="dish-group-name">{dishName}</h3>
          <p className="dish-group-count">
            <Hash size={14} />
            {tables.length} {tables.length === 1 ? "mesa" : "mesas"}
          </p>
        </div>
      </div>
      
      <div className="dish-group-tables">
        {tables.map((table) => (
          <button
            key={`${table.recordId}-${dishName}`}
            className={`dish-table-badge priority-${table.priority}`}
            onClick={() => onTableClick(table)}
            title={`Mesa ${table.tableNumber} - Prioridad ${table.priority}`}
          >
            <span className="table-priority">#{table.priority}</span>
            <span className="table-number">Mesa {table.tableNumber}</span>
            <span className="table-quantity">x{table.quantity}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default DishGroupCard;
