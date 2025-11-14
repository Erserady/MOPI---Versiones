import React from "react";
import { MessageSquareText, Trash2 } from "lucide-react";
import "../styles/dish_table.css";

const DishTable = ({
  data = [],
  headers,
  utility = "menu",
  onAdd,
  onRemove,
  onComment,
  onQuantityChange,
}) => {
  const defaultHeaders = ["Nombre", "Precio", "Disponibilidad"];
  const tableHeaders = headers || defaultHeaders;

  const renderRow = (dish, index) => {
    switch (utility) {
      // 🧾 Modo Menú: lista de platillos disponibles
      case "addorder":
        return (
          <tr key={dish.id || index}>
            <td className="dish-name">{dish.name}</td>
            <td className="dish-price">C${dish.price.toFixed(2)}</td>
            <td className="dish-availability">
              {dish.available ? (
                <button
                  className="add-btn"
                  onClick={() => onAdd && onAdd(dish)}
                  disabled={!dish.available}
                >
                  Agregar al carrito
                </button>
              ) : (
                <span className="dish-availability unavailable">Agotado</span>
              )}
            </td>
          </tr>
        );

      // 🍽️ Modo agregar orden (opcional)
      case "menu":
        return (
          <tr key={dish.id || index}>
            <td className="dish-name">{dish.name}</td>
            <td className="dish-price">C${dish.price.toFixed(2)}</td>
            <td
              className={`dish-availability ${
                dish.available ? "available" : "unavailable"
              }`}
            >
              {dish.available ? "Disponible" : "Agotado"}
            </td>
          </tr>
        );

      // 🛒 Modo Carrito de compra
      case "buycar":
        return (
          <tr key={dish.dishId || index}>
            <td className="dish-name">{dish.dishName}</td>

            <td className="dish-quantity">
              <button
                className="qty-btn"
                onClick={() => onQuantityChange(index, -1)}
              >
                -
              </button>
              <span>{dish.dishQuantity}</span>
              <button
                className="qty-btn"
                onClick={() => onQuantityChange(index, 1)}
              >
                +
              </button>
            </td>

            <td className="dish-subtotal">C${dish.subtotal.toFixed(2)}</td>

            <td className="dish-actions">
              <button
                className="comment-btn"
                onClick={() => onComment && onComment(dish)}
              >
                <MessageSquareText size={14} />
              </button>
              <button
                className="remove-btn"
                onClick={() => onRemove && onRemove(dish)}
              >
                <Trash2 size={14} />
              </button>
            </td>
          </tr>
        );

      case "summary":
        return (
          <tr key={dish.dishId || index}>
            <td className="dish-name">{dish.dishName}</td>
            <td className="dish-quantity">{dish.dishQuantity}</td>
            <td className="dish-notes">{dish.description || "Sin notas"}</td>
            <td className="dish-subtotal">
              C$
              {(
                dish.subtotal ||
                (dish.unitPrice || 0) * (dish.dishQuantity || 0)
              ).toFixed(2)}
            </td>
          </tr>
        );

      default:
        return null;
    }
  };

  return (
    <table className="dish-table shadow">
      <thead>
        <tr>
          {tableHeaders.map((head, i) => (
            <th key={i}>{head}</th>
          ))}
        </tr>
      </thead>
      <tbody>{data.map((dish, index) => renderRow(dish, index))}</tbody>
    </table>
  );
};

export default DishTable;
