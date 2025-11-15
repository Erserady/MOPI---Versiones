import { useState } from "react";
import { Receipt, Printer, CreditCard, CircleCheckBig } from "lucide-react";
import PayDialog from "./PayDialog";
import OrderDetailsModal from "./OrderDetailsModal";

const PayCard = ({ order }) => {
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [isDetailsModalOpen, setDetailsModalOpen] = useState(false);
  const kitchenBlocked = order.kitchenHold;
  const kitchenBlockedText =
    "Hay platillos en cocina. Espera a que cocina termine antes de cobrar.";

  const handleCardClick = (e) => {
    // Solo abrir el modal si no se hizo clic en un botón
    if (!e.target.closest('button')) {
      setDetailsModalOpen(true);
    }
  };

  return (
    <article 
      className="pay-card shadow" 
      onClick={handleCardClick}
      style={{ cursor: 'pointer' }}
    >
      <section className="pay-card-body">
        <div className="pay-card-header">
          <Receipt size={30} />
          <div className="pay-card-text">
            <h2 className="pay-card-title">
              Mesa {order.tableNumber}
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
        {kitchenBlocked && (
          <p className="pay-card-subtitle" style={{ color: "#b45309" }}>
            ⚠ Pendiente en cocina. No se puede cobrar todavia.
          </p>
        )}
        <div className="pay-card-actions">
          <button
            className="shadow paid"
            onClick={() => setDialogOpen(true)}
            disabled={kitchenBlocked}
            title={kitchenBlocked ? kitchenBlockedText : undefined}
          >
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
      <OrderDetailsModal
        order={order}
        isOpen={isDetailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
      />
    </article>
  );
};

export default PayCard;
