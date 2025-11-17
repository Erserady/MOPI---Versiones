import { useState, useEffect } from "react";
import { X, TrendingDown, DollarSign } from "lucide-react";
import "../styles/expense_modal.css";

const ExpenseModal = ({ isOpen, onClose, onSave }) => {
  const [amount, setAmount] = useState("");
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setAmount("");
      setComment("");
      setError("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    // Validaciones
    const parsedAmount = parseFloat(amount);
    
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Ingresa un monto válido mayor a 0");
      return;
    }

    if (!comment.trim()) {
      setError("El comentario es obligatorio");
      return;
    }

    onSave({
      monto: parsedAmount,
      comentario: comment.trim(),
    });

    setAmount("");
    setComment("");
    setError("");
    onClose();
  };

  const handleCancel = () => {
    setAmount("");
    setComment("");
    setError("");
    onClose();
  };

  const handleOverlayClick = (e) => {
    if (e.target.className === "expense-modal-overlay") {
      handleCancel();
    }
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    // Solo permite números y un punto decimal
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      setError("");
    }
  };

  return (
    <div className="expense-modal-overlay" onClick={handleOverlayClick}>
      <div className="expense-modal-container">
        <div className="expense-modal-header">
          <div className="expense-modal-title">
            <TrendingDown size={24} />
            <h3>Registrar Egreso de Efectivo</h3>
          </div>
          <button className="expense-modal-close" onClick={handleCancel}>
            <X size={20} />
          </button>
        </div>

        <div className="expense-modal-body">
          <div className="expense-modal-field">
            <label htmlFor="expense-amount">
              <DollarSign size={18} />
              Monto del Egreso <span className="required">*</span>
            </label>
            <div className="expense-input-wrapper">
              <span className="currency-symbol">C$</span>
              <input
                id="expense-amount"
                type="text"
                className="expense-modal-input"
                placeholder="0.00"
                value={amount}
                onChange={handleAmountChange}
                autoFocus
              />
            </div>
          </div>

          <div className="expense-modal-field">
            <label htmlFor="expense-comment">
              Comentario <span className="required">*</span>
            </label>
            <textarea
              id="expense-comment"
              className="expense-modal-textarea"
              placeholder="Ej: Compra de insumos, pago a proveedor, gastos operativos..."
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
                setError("");
              }}
              rows={3}
            />
          </div>

          {error && <div className="expense-modal-error">{error}</div>}

          <div className="expense-modal-info">
            <small>
              💡 Este egreso quedará registrado en el sistema y afectará el balance de caja
            </small>
          </div>
        </div>

        <div className="expense-modal-footer">
          <button className="expense-modal-btn cancel" onClick={handleCancel}>
            Cancelar
          </button>
          <button className="expense-modal-btn save" onClick={handleSave}>
            Registrar Egreso
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExpenseModal;
