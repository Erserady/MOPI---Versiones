import React, { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import "../styles/cashier_modal.css";

const CashierModal = ({ isOpen, onClose, onSave, type, currentCashier = "RexDex", expectedAmount = 0 }) => {
  const [cashData, setCashData] = useState({
    coins1: 0,
    coins5: 0,
    bills10: 0,
    bills20: 0,
    bills50: 0,
    bills100: 0,
    bills200: 0,
    bills500: 0,
    bills1000: 0,
    cardAmount: 0
  });

  const denominations = [
    { key: "coins1", label: "Monedas de C$1", value: 1 },
    { key: "coins5", label: "Monedas de C$5", value: 5 },
    { key: "bills10", label: "Billetes de C$10", value: 10 },
    { key: "bills20", label: "Billetes de C$20", value: 20 },
    { key: "bills50", label: "Billetes de C$50", value: 50 },
    { key: "bills100", label: "Billetes de C$100", value: 100 },
    { key: "bills200", label: "Billetes de C$200", value: 200 },
    { key: "bills500", label: "Billetes de C$500", value: 500 },
    { key: "bills1000", label: "Billetes de C$1000", value: 1000 }
  ];

  const calculateTotalCash = () => {
    return denominations.reduce((total, denom) => {
      return total + (cashData[denom.key] * denom.value);
    }, 0);
  };

  const handleInputChange = (key, value) => {
    const numValue = value === "" ? 0 : parseInt(value) || 0;
    setCashData(prev => ({
      ...prev,
      [key]: numValue
    }));
  };

  const handleSave = () => {
    const totalCash = calculateTotalCash();
    const totalAmount = totalCash + cashData.cardAmount;
    
    onSave({
      cash: cashData,
      totalCash,
      cardAmount: cashData.cardAmount,
      totalAmount,
      type,
      cashier: currentCashier,
      timestamp: new Date().toLocaleTimeString()
    });
    
    // Reset form
    setCashData({
      coins1: 0,
      coins5: 0,
      bills10: 0,
      bills20: 0,
      bills50: 0,
      bills100: 0,
      bills200: 0,
      bills500: 0,
      bills1000: 0,
      cardAmount: 0
    });
  };

  if (!isOpen) return null;

  const totalCash = calculateTotalCash();
  const totalAmount = totalCash + cashData.cardAmount;
  const hasDiscrepancy = type === 'close' && totalAmount < expectedAmount;
  const difference = expectedAmount - totalAmount;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{type === "open" ? "Apertura de Caja" : "Cierre de Caja"}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="cash-section">
            <h3>Efectivo en Caja</h3>
            <div className="denominations-grid">
              {denominations.map(denom => (
                <div key={denom.key} className="denomination-item">
                  <label>{denom.label}</label>
                  <input
                    type="number"
                    min="0"
                    value={cashData[denom.key]}
                    onChange={(e) => handleInputChange(denom.key, e.target.value)}
                    className="denomination-input"
                  />
                  <span className="denomination-total">
                    C$ {(cashData[denom.key] * denom.value).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="card-section">
            <h3>Pagos con Tarjeta</h3>
            <div className="card-input">
              <label>Monto total en tarjetas:</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={cashData.cardAmount}
                onChange={(e) => handleInputChange("cardAmount", e.target.value)}
                className="card-amount-input"
              />
            </div>
          </div>

          <div className="summary-section">
            <div className="summary-item">
              <span>Total Efectivo:</span>
              <strong>C$ {totalCash.toFixed(2)}</strong>
            </div>
            <div className="summary-item">
              <span>Total Tarjetas:</span>
              <strong>C$ {cashData.cardAmount.toFixed(2)}</strong>
            </div>
            <div className="summary-total">
              <span>Total General:</span>
              <strong>C$ {totalAmount.toFixed(2)}</strong>
            </div>
            {type === 'close' && expectedAmount > 0 && (
              <div className="summary-item" style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #bae6fd' }}>
                <span>Saldo Esperado:</span>
                <strong>C$ {expectedAmount.toFixed(2)}</strong>
              </div>
            )}
          </div>

          {hasDiscrepancy && (
            <div className="summary-warning">
              <AlertTriangle size={24} />
              <div>
                <strong style={{ display: 'block', marginBottom: '0.25rem' }}>
                  ⚠️ Faltante en Caja
                </strong>
                <span>
                  El monto contado (C$ {totalAmount.toFixed(2)}) es menor al esperado.
                  <br />
                  Diferencia: <strong>C$ {difference.toFixed(2)}</strong>
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn-save" onClick={handleSave}>
            {type === "open" ? "Abrir Caja" : "Cerrar Caja"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CashierModal;