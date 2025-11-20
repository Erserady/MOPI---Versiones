import React from 'react';
import { X, Receipt, DollarSign } from 'lucide-react';
import '../styles/prefactura_modal.css';

const PreFacturaModal = ({ isOpen, onClose, preFactura }) => {
  if (!isOpen || !preFactura) return null;

  const formatCurrency = (value) => {
    return `C$ ${parseFloat(value || 0).toFixed(2)}`;
  };

  return (
    <div className="prefactura-modal-overlay" onClick={onClose}>
      <div className="prefactura-modal" onClick={(e) => e.stopPropagation()}>
        <button className="prefactura-modal__close" onClick={onClose}>
          <X size={20} />
        </button>
        
        <div className="prefactura-modal__icon">
          <Receipt size={48} />
        </div>
        
        <h2 className="prefactura-modal__title">Pre-factura</h2>
        <p className="prefactura-modal__subtitle">Mesa {preFactura.mesa}</p>
        
        <div className="prefactura-modal__content">
          {/* Información de la mesa */}
          <div className="prefactura-info-row">
            <span>Mesa:</span>
            <strong>{preFactura.mesa}</strong>
          </div>
          
          {preFactura.mesero && (
            <div className="prefactura-info-row">
              <span>Mesero:</span>
              <strong>{preFactura.mesero}</strong>
            </div>
          )}
          
          {/* Productos */}
          <div className="prefactura-section">
            <h3>Productos Consumidos</h3>
            <div className="prefactura-items">
              {preFactura.items.map((item, index) => (
                <div key={index} className="prefactura-item">
                  <div className="prefactura-item__info">
                    <span className="prefactura-item__name">{item.nombre}</span>
                    <span className="prefactura-item__quantity">
                      x{item.cantidad} @ {formatCurrency(item.precio)}
                    </span>
                  </div>
                  <span className="prefactura-item__price">
                    {formatCurrency(item.subtotal)}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Total */}
          <div className="prefactura-total">
            <DollarSign size={20} />
            <span>Total a Pagar:</span>
            <strong>{formatCurrency(preFactura.total)}</strong>
          </div>
        </div>
        
        <button className="prefactura-modal__button" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </div>
  );
};

export default PreFacturaModal;
