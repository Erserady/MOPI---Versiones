import React from "react";
import "../styles/cashier_section.css";
import { CreditCard, Receipt, DollarSign, Banknote } from "lucide-react";
import { useState } from "react";
import CashierModal from "./Cashier.Modal";

const CashierSection = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState("open");
  const [state, setState] = useState({
    openedBy: "RexDex",
    openedAt: "11:18:44 a.m.",
    openingAmount: 5,
    currentAmount: 5,
    salesToday: 0,
    history: [
      { type: "Apertura de Caja", amount: 5, time: "11:18:44 a.m." },
    ],
  });

  const openModal = (type) => {
    setModalType(type);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => setIsModalOpen(false);

  const handleSaveCashier = (data) => {
    if (data.type === "open") {
      setState((prev) => ({
        ...prev,
        openingAmount: data.totalAmount,
        currentAmount: data.totalAmount,
        openedBy: data.cashier,
        openedAt: data.timestamp,
        history: [
          { type: "Apertura de Caja", amount: data.totalAmount, time: data.timestamp },
          ...prev.history,
        ],
      }));
    } else {
      setState((prev) => ({
        ...prev,
        history: [
          { type: "Cierre de Caja", amount: data.totalAmount, time: data.timestamp },
          ...prev.history,
        ],
      }));
    }
    setIsModalOpen(false);
  };

  return (
    <section className="cashier-section">
      <h2 className="cashier-title">Control de Caja</h2>

      <div className="cashier-grid">
        <CashierCard title="Estado de Caja" customClass="cashier-state">
          <p>
            Monto de Apertura: <strong>C$ {state.openingAmount.toFixed(2)}</strong>
          </p>
          <p>
            Monto Actual: <strong>C$ {state.currentAmount.toFixed(2)}</strong>
          </p>
          <p>
            Ventas del Día:
            <strong className="cashier-success">C$ {state.salesToday.toFixed(2)}</strong>
          </p>
          <small>
            Abierta por: <b>{state.openedBy}</b> a las {state.openedAt}
          </small>
        </CashierCard>

        <CashierCard title="Acciones de Caja" customClass="cashier-actions">
          <button className="cashier-btn shadow open" onClick={() => openModal("open")}>
            <DollarSign /> Abrir Caja
          </button>
          <button className="cashier-btn shadow close" onClick={() => openModal("close")}>
            <DollarSign /> Cerrar Caja
          </button>
          <button className="cashier-btn report shadow">
            <Banknote /> Reporte de Caja
          </button>
        </CashierCard>

        <CashierCard
          title="Historial de Transacciones"
          customClass="cashier-history"
        >
          {state.history.map((h, idx) => (
            <div key={idx} className="cashier-transaction">
              <div className="title-transaction">
                <Receipt />
                <div>
                  <p>
                    <strong>{h.type}</strong>
                  </p>
                  <small>{h.time}</small>
                </div>
              </div>
              <span className="cashier-amount">C$ {h.amount.toFixed(2)}</span>
            </div>
          ))}
        </CashierCard>
      </div>

      <CashierModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveCashier}
        type={modalType}
      />
    </section>
  );
};

export default CashierSection;

const CashierCard = ({ title, children, customClass }) => {
  return (
    <article className={"shadow cashier-card " + customClass}>
      {title && <h3 className="cashier-card-title">{title}</h3>}
      <div className="cashier-card-content">{children}</div>
    </article>
  );
};
