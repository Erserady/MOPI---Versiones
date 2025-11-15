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
                    {factura?.mesero_asignado || 
                     factura?.orders?.[0]?.waiter_name || 
                     factura?.orders?.[0]?.mesero || 
                     factura?.creado_por || 
                     transaction.waiter_name ||
                     'Sin asignar'}
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

          {/* Resumen de Cuenta */}
          {factura?.orders && factura.orders.length > 0 && (
            <div className="transaction-section">
              <h3 className="transaction-section-title">📋 Resumen de Cuenta</h3>
              
              <div className="transaction-products-list">
                {(() => {
                  // Agrupar items por nombre para mostrar resumen
                  const itemsMap = new Map();
                  
                  factura.orders.forEach((order) => {
                    let items = [];
                    try {
                      const parsed = JSON.parse(order.pedido);
                      items = Array.isArray(parsed) ? parsed : [parsed];
                    } catch (error) {
                      items = [{
                        nombre: order.pedido,
                        cantidad: order.cantidad || 1,
                        precio: 0
                      }];
                    }

                    items.forEach((item) => {
                      const key = item.nombre;
                      if (itemsMap.has(key)) {
                        const existing = itemsMap.get(key);
                        existing.cantidad += item.cantidad || 0;
                        existing.total += (item.precio || 0) * (item.cantidad || 0);
                      } else {
                        itemsMap.set(key, {
                          nombre: item.nombre,
                          cantidad: item.cantidad || 0,
                          precioUnitario: item.precio || 0,
                          total: (item.precio || 0) * (item.cantidad || 0)
                        });
                      }
                    });
                  });

                  // Renderizar items agrupados
                  return Array.from(itemsMap.values()).map((item, index) => (
                    <div key={index} className="transaction-product-item">
                      <div className="transaction-product-info">
                        <span className="transaction-product-name">
                          {item.nombre}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="transaction-product-quantity">x{item.cantidad}</span>
                          <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>@ {formatCurrency(item.precioUnitario)}</span>
                        </div>
                      </div>
                      <span className="transaction-product-price">
                        {formatCurrency(item.total)}
                      </span>
                    </div>
                  ));
                })()}
              </div>

              {/* Totales */}
              <div className="transaction-totals">
                <div className="transaction-total-item" style={{ padding: '0.75rem 0', borderTop: '2px dashed #e5e7eb' }}>
                  <span style={{ color: '#6b7280' }}>Subtotal:</span>
                  <span style={{ color: '#6b7280' }}>{formatCurrency(factura.subtotal || factura.total)}</span>
                </div>
                {factura.impuesto > 0 && (
                  <div className="transaction-total-item" style={{ padding: '0.5rem 0' }}>
                    <span style={{ color: '#6b7280' }}>Impuestos:</span>
                    <span style={{ color: '#6b7280' }}>{formatCurrency(factura.impuesto)}</span>
                  </div>
                )}
                <div className="transaction-total-item transaction-total-final">
                  <span>Total:</span>
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
