import React, { useState } from "react";
import CustomDialog from "../../../common/CustomDialog";

const OrderDialog = ({ order, isOpen, onClose, updateDishStatus }) => {
  const [openTooltipId, setOpenTooltipId] = useState(null);

  const toggleTooltip = (id) => {
    setOpenTooltipId(openTooltipId === id ? null : id);
  };

  const handleStatusChange = (dishId, newStatus) => {
    updateDishStatus(order.orderId, dishId, newStatus);
  };

  return (
    <CustomDialog isOpen={isOpen} onClose={onClose}>
      <h2>
        Pedido #{order.orderId} – Mesa {order.tableNumber}
      </h2>
      <p>
        <b>Estado general:</b> {order.orderStatus}
      </p>

      <h3>Detalles del pedido</h3>
      <section className="order-dialog-items">
        {order.items.map((item) => (
          <div
            key={item.dishId}
            style={{
              marginBottom: "1rem",
              borderBottom: "1px solid #ccc",
              paddingBottom: "0.5rem",
            }}
          >
            <p>
              <b>{item.dishName}</b> x{item.dishQuantity}
            </p>
            <p>
              <small>
                <b>Estado:</b> {item.dishStatus} | <b>Hora:</b>{" "}
                {item.createTime}
              </small>
            </p>
            <button
              style={{
                fontSize: "0.8rem",
                border: "1px solid #1976d2",
                backgroundColor: "#fff",
                borderRadius: "6px",
                padding: "2px 6px",
                cursor: "pointer",
              }}
              onClick={() => toggleTooltip(item.dishId)}
            >
              Ver comentarios
            </button>

            {openTooltipId === item.dishId && (
              <div
                style={{
                  background: "#f9f9f9",
                  border: "1px solid #ccc",
                  padding: "8px",
                  marginTop: "6px",
                  borderRadius: "6px",
                }}
              >
                <p>
                  <b>Descripción:</b> {item.description}
                </p>
                <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                  {["Pendiente", "En preparación", "Listo"].map((state) => (
                    <label key={state}>
                      <input
                        type="radio"
                        name={`status-${item.dishId}`}
                        value={state}
                        checked={item.dishStatus === state}
                        onChange={() => handleStatusChange(item.dishId, state)}
                      />{" "}
                      {state}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </section>
    </CustomDialog>
  );
};

export default OrderDialog;
