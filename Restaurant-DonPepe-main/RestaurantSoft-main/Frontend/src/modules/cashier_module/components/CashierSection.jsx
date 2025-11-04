import React, { useState, useEffect } from "react";
import "../styles/cashier_section.css";
import { CreditCard, Receipt, DollarSign, Banknote } from "lucide-react";
import CashierModal from "./Cashier.Modal";

const CashierSection = () => {
  const [isCashierOpen, setIsCashierOpen] = useState(false);
  const [openingAmount, setOpeningAmount] = useState(5.00);
  const [currentAmount, setCurrentAmount] = useState(5.00);
  const [dailySales, setDailySales] = useState(0.00);
  const [cashierName] = useState("RexDex");
  const [openingTime, setOpeningTime] = useState("");
  const [closingTime, setClosingTime] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("open");
  const [transactions, setTransactions] = useState([
    { type: "open", amount: 5.00, time: "11:18:44 a.m.", description: "Apertura de Caja" }
  ]);

  // Función para obtener la hora actual formateada
  const getCurrentTime = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    
    const ampm = hours >= 12 ? 'p.m.' : 'a.m.';
    const formattedHours = hours % 12 || 12;
    
    return `${formattedHours}:${minutes}:${seconds} ${ampm}`;
  };

  const handleCashierAction = () => {
    if (isCashierOpen) {
      setModalType("close");
    } else {
      setModalType("open");
    }
    setShowModal(true);
  };

  const handleModalSave = (data) => {
    const currentTime = getCurrentTime();

    if (data.type === "open") {
      setIsCashierOpen(true);
      setOpeningAmount(data.totalAmount);
      setCurrentAmount(data.totalAmount);
      setDailySales(0.00);
      setOpeningTime(currentTime); // Guardar la hora de apertura actual
      
      const newTransaction = {
        type: "open",
        amount: data.totalAmount,
        time: currentTime, // Usar la hora actual
        description: "Apertura de Caja"
      };
      setTransactions(prev => [newTransaction, ...prev]);
      
    } else {
      setIsCashierOpen(false);
      const sales = data.totalAmount - openingAmount;
      setDailySales(sales > 0 ? sales : 0);
      setClosingTime(currentTime); // Guardar la hora de cierre actual
      
      const newTransaction = {
        type: "close",
        amount: data.totalAmount,
        time: currentTime, // Usar la hora actual
        description: "Cierre de Caja"
      };
      setTransactions(prev => [newTransaction, ...prev]);
    }
    
    setShowModal(false);
  };

  const handleModalClose = () => {
    setShowModal(false);
  };

  return (
    <section className="cashier-section">
      <h2 className="cashier-title">Control de Caja</h2>

      <div className="cashier-grid">
        <CashierCard title="Estado de Caja" customClass="cashier-state">
          <p>
            Estado: <strong>{isCashierOpen ? "Abierta" : "Cerrada"}</strong>
          </p>
          <p>
            Monto de Apertura: <strong>C$ {openingAmount.toFixed(2)}</strong>
          </p>
          <p>
            Monto Actual: <strong>C$ {currentAmount.toFixed(2)}</strong>
          </p>
          <p>
            Ventas del Día:
            <strong className={dailySales >= 0 ? "cashier-success" : "cashier-danger"}>
              C$ {dailySales.toFixed(2)}
            </strong>
          </p>
          <small>
            {isCashierOpen ? (
              <>Abierta por: <b>{cashierName}</b> a las {openingTime || "N/A"}</> 
            ) : (
              <>Cerrada por: <b>{cashierName}</b> a las {closingTime || "N/A"}</>
            )}
          </small>
        </CashierCard>

        <CashierCard title="Acciones de Caja" customClass="cashier-actions">
          <button 
            className={`cashier-btn shadow ${isCashierOpen ? "close" : "open"}`}
            onClick={handleCashierAction}
          >
            <DollarSign /> 
            {isCashierOpen ? "Cerrar Caja" : "Abrir Caja"}
          </button>
          <button className="cashier-btn report shadow">
            <Banknote /> Reporte de Caja
          </button>
        </CashierCard>

        <CashierCard
          title="Historial de Transacciones"
          customClass="cashier-history"
        >
          {transactions.map((transaction, index) => (
            <div key={index} className="cashier-transaction">
              <div className="title-transaction">
                <Receipt />
                <div>
                  <p>
                    <strong>{transaction.description}</strong>
                  </p>
                  <small>{transaction.time}</small>
                </div>
              </div>
              <span className={`cashier-amount ${
                transaction.type === "open" ? "cashier-open" : "cashier-close"
              }`}>
                C${transaction.amount.toFixed(2)}
              </span>
            </div>
          ))}
        </CashierCard>
      </div>

      <CashierModal
        isOpen={showModal}
        onClose={handleModalClose}
        onSave={handleModalSave}
        type={modalType}
        currentCashier={cashierName}
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