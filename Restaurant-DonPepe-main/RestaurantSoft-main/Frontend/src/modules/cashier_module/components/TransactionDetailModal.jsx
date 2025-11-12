import React from 'react';
import { X, Receipt, CreditCard, DollarSign, Calendar, User, Table } from 'lucide-react';
import '../styles/transaction_detail_modal.css';

const TransactionDetailModal = ({ isOpen, onClose, transaction }) => {
  if (!isOpen || !transaction) return null;

  // Usar factura_detalle si existe, sino factura (para retrocompatibilidad)
  const factura = transaction.factura_detalle || transaction.factura;

  const formatCurrency = (value) => {
    return `C$ ${parseFloat(value || 0).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-NI', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="transaction-modal-overlay" onClick={onClose}>
      <div className="transaction-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="transaction-modal-header">
          <div className="transaction-modal-title-group">
            <Receipt size={28} />
            <h2>Detalles de Transacción</h2>
          </div>
          <button className="transaction-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="transaction-modal-body">
          {/* Información General */}
          <div className="transaction-section">
            <h3 className="transaction-section-title">Información General</h3>
            
            <div className="transaction-info-grid">
              <div className="transaction-info-item">
                <div className="transaction-info-icon">
                  <Receipt size={18} />
                </div>
                <div className="transaction-info-content">
                  <span className="transaction-info-label">Factura</span>
                  <span className="transaction-info-value">#{factura?.numero_factura || 'N/A'}</span>
                </div>
              </div>

              <div className="transaction-info-item">
                <div className="transaction-info-icon">
                  <Table size={18} />
                </div>
                <div className="transaction-info-content">
                  <span className="transaction-info-label">Mesa</span>
                  <span className="transaction-info-value">
                    {factura?.table?.number ? `Mesa ${factura.table.number}` : 'Mesa eliminada'}
                  </span>
                </div>
              </div>

              <div className="transaction-info-item">
                <div className="transaction-info-icon">
                  <CreditCard size={18} />
                </div>
                <div className="transaction-info-content">
                  <span className="transaction-info-label">Método de Pago</span>
                  <span className="transaction-info-value capitalize">
                    {transaction.metodo_pago === 'efectivo' ? '💵 Efectivo' : '💳 Tarjeta'}
                  </span>
                </div>
              </div>

              <div className="transaction-info-item">
                <div className="transaction-info-icon">
                  <Calendar size={18} />
                </div>
                <div className="transaction-info-content">
                  <span className="transaction-info-label">Fecha y Hora</span>
                  <span className="transaction-info-value">{formatDate(transaction.created_at)}</span>
                </div>
              </div>

              <div className="transaction-info-item">
                <div className="transaction-info-icon">
                  <User size={18} />
                </div>
                <div className="transaction-info-content">
                  <span className="transaction-info-label">Atendido por</span>
                  <span className="transaction-info-value">
                    {factura?.mesero_asignado || factura?.creado_por || 'No asignado'}
                  </span>
                </div>
              </div>

              <div className="transaction-info-item">
                <div className="transaction-info-icon">
                  <DollarSign size={18} />
                </div>
                <div className="transaction-info-content">
                  <span className="transaction-info-label">Monto Total</span>
                  <span className="transaction-info-value transaction-amount">
                    {formatCurrency(transaction.monto)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Productos Consumidos */}
          {factura?.orders && factura.orders.length > 0 && (
            <div className="transaction-section">
              <h3 className="transaction-section-title">Productos Consumidos</h3>
              
              <div className="transaction-products-list">
                {factura.orders.map((order, orderIndex) => {
                  // Intentar parsear el pedido como JSON
                  let items = [];
                  try {
                    const parsed = JSON.parse(order.pedido);
                    items = Array.isArray(parsed) ? parsed : [parsed];
                  } catch (error) {
                    // Si no es JSON válido, mostrar como texto
                    items = [{
                      nombre: order.pedido,
                      cantidad: order.cantidad || 1,
                      precio: 0
                    }];
                  }

                  // Renderizar cada item del pedido
                  return items.map((item, itemIndex) => (
                    <div key={`${orderIndex}-${itemIndex}`} className="transaction-product-item">
                      <div className="transaction-product-info">
                        <span className="transaction-product-name">
                          {item.nombre}
                        </span>
                        <span className="transaction-product-quantity">x{item.cantidad}</span>
                      </div>
                      <span className="transaction-product-price">
                        {formatCurrency(item.precio * item.cantidad)}
                      </span>
                    </div>
                  ));
                })}
              </div>

              {/* Totales */}
              <div className="transaction-totals">
                <div className="transaction-total-item transaction-total-final">
                  <span>Total (impuestos incluidos):</span>
                  <span>{formatCurrency(factura.total)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="transaction-modal-footer">
          <button className="transaction-modal-btn-close" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetailModal;
