import { useState } from "react";
import { Receipt, Printer, CreditCard, CircleCheckBig } from "lucide-react";
import PayDialog from "./PayDialog";

const PayCard = ({ order }) => {
  const [isDialogOpen, setDialogOpen] = useState(false);

  return (
    <article className="pay-card shadow">
      <section className="pay-card-body">
        <div className="pay-card-header">
          <Receipt size={30} />
          <div className="pay-card-text">
            <h2 className="pay-card-title">
              Mesa {order.tableNumber} - {order?.id || "orden"}
            </h2>
            <p className="pay-card-subtitle">
              <span className="waiter">Mesero:</span> {order.waiter}
            </p>
            <p className="pay-card-subtitle">
              <span className="account">Cuentas pendientes:</span>{" "}
              {order.accounts.filter((item) => item.isPaid == false).length}{" "}
            </p>
            <span className="pay-card-total">
              <span className="total">Total:</span> C${order.total.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="pay-card-actions">
          <button className="shadow paid" onClick={() => setDialogOpen(true)}>
            <CreditCard size={20} /> Procesar Pago
          </button>
          <button className="shadow ticket">
            <Printer size={20} /> Imprimir Ticket
          </button>
        </div>
      </section>
      <div className="check-paid" style={{ display: "none" }}>
        <CircleCheckBig size={30} />
      </div>
      <PayDialog
        orders={order}
        isOpen={isDialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </article>
  );
};

export default PayCard;
