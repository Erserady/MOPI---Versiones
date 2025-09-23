import { useState } from "react";
import { Receipt, Printer, CreditCard } from "lucide-react";

const PayCard = ({ order }) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <article className="pay-card shadow">
      <section className="pay-card-body">
        <div className="pay-card-header">
          <Receipt />
          <div className="pay-card-text">
            <h2 className="pay-card-title">
              Mesa {order.table} - {order.orderCode}
            </h2>
            <p className="pay-card-subtitle">
              Completado: {order.completedAt} • Mesero: {order.waiter}
            </p>
          </div>
          <span className="pay-card-total">${order.total.toFixed(2)}</span>
        </div>
        <div className="pay-card-info">
          <p>
            Subtotal: ${order.subtotal.toFixed(2)} + IVA: ${order.tax.toFixed(2)}
          </p>
        </div>
        {showDetails && (
          <div className="pay-card-details">
            <h3 className="font-semibold">Cuenta Principal</h3>
            <ul className="pay-items-list">
              {order.items.map((item, i) => (
                <li key={i} className="pay-item">
                  <span>
                    {item.name} x{item.quantity}
                  </span>
                  <span>${item.price.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="pay-card-actions">
          <button
            className="shadow"
            onClick={() => setShowDetails((prev) => !prev)}
          >
            {showDetails ? "Ocultar Detalles" : "Ver Detalles"}
          </button>
          <button className="shadow flex items-center gap-1">
            <CreditCard size={16} /> Procesar Pago
          </button>
          <button className="shadow flex items-center gap-1">
            <Printer size={16} /> Imprimir Ticket
          </button>
        </div>
      </section>
    </article>
  );
};

export default PayCard;
