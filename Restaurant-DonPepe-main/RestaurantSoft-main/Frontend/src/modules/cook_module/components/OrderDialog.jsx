import React from "react";
import CustomDialog from "../../../common/CustomDialog";

const OrderDialog = ({ order, isOpen, onClose }) => {
  return (
    <CustomDialog isOpen={isOpen} onClose={onClose}>
      <h2>
        Pedido #{order.id} – Mesa {order.tableNumber}
      </h2>
      <p>
        <b>Estado:</b> {order.status}
      </p>
      <h3>Desglose del pedido</h3>
      <section className="order-dialog-items">
        {" "}
        {order.accounts.map((account) => (
          <React.Fragment key={account.accountId}>
            <h4>Pedidos para {account.label}</h4>

            <ul>
              {account.items.map((item, i) => (
                <li key={`${account.accountId}-${i}`}>
                  {item.name} x{item.quantity}
                </li>
              ))}
            </ul>
            <br></br>
          </React.Fragment>
        ))}
      </section>
    </CustomDialog>
  );
};

export default OrderDialog;
