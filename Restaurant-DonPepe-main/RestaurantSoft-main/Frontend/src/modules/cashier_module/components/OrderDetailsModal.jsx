import React from 'react';
import { X, Receipt, UtensilsCrossed, MessageSquare } from 'lucide-react';
import '../styles/transaction_detail_modal.css';

const OrderDetailsModal = ({ isOpen, onClose, order }) => {
  if (!isOpen || !order) return null;

  const formatCurrency = (value) => {
    return `C$ ${parseFloat(value || 0).toFixed(2)}`;
  };

  // Agrupar items por nombre para mostrar resumen
  const groupedItems = () => {
    const itemsMap = new Map();
    
    order.accounts.forEach((account) => {
      account.items.forEach((item) => {
        const key = item.name;
        if (itemsMap.has(key)) {
          const existing = itemsMap.get(key);
          existing.quantity += item.quantity || 0;
          existing.total += item.subtotal || 0;
        } else {
          itemsMap.set(key, {
            name: item.name,
            quantity: item.quantity || 0,
            unitPrice: item.unitPrice || 0,
            total: item.subtotal || 0,
            nota: item.nota || ''
          });
        }
      });
    });

    return Array.from(itemsMap.values());
  };

  const items = groupedItems();

  return (
    <div className="transaction-modal-overlay" onClick={onClose}>
      <div className="transaction-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="transaction-modal-header">
          <div className="transaction-modal-title-group">
            <Receipt size={28} />
            <h2>Detalle del Pedido - Mesa {order.tableNumber}</h2>
          </div>
          <button className="transaction-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="transaction-modal-body">
          {/* Información General */}
          <div className="transaction-section">
            <h3 className="transaction-section-title">Información</h3>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '1rem',
              padding: '1rem',
              background: '#f9fafb',
              borderRadius: '8px'
            }}>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Mesa</p>
                <p style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#111827' }}>Mesa {order.tableNumber}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Mesero</p>
                <p style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#111827' }}>{order.waiter}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Total</p>
                <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#059669' }}>{formatCurrency(order.total)}</p>
              </div>
            </div>
          </div>

          {/* Productos Consumidos */}
          <div className="transaction-section">
            <h3 className="transaction-section-title">
              <UtensilsCrossed size={20} />
              Productos Consumidos
            </h3>
            
            <div className="transaction-products-list">
              {items.map((item, index) => (
                <div key={index}>
                  <div className="transaction-product-item">
                    <div className="transaction-product-info">
                      <span className="transaction-product-name">
                        {item.name}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="transaction-product-quantity">x{item.quantity}</span>
                        <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>@ {formatCurrency(item.unitPrice)}</span>
                      </div>
                    </div>
                    <span className="transaction-product-price">
                      {formatCurrency(item.total)}
                    </span>
                  </div>
                  {item.nota && (
                    <div style={{ 
                      marginLeft: '1rem', 
                      marginTop: '-0.5rem',
                      marginBottom: '0.75rem',
                      padding: '0.5rem 0.75rem',
                      background: '#fffbeb',
                      borderLeft: '3px solid #fbbf24',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.5rem'
                    }}>
                      <MessageSquare size={14} style={{ marginTop: '0.15rem', color: '#f59e0b', flexShrink: 0 }} />
                      <span style={{ fontSize: '0.875rem', color: '#92400e' }}>{item.nota}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Totales */}
            <div className="transaction-totals">
              <div className="transaction-total-item" style={{ padding: '0.75rem 0', borderTop: '2px dashed #e5e7eb' }}>
                <span style={{ color: '#6b7280' }}>Subtotal:</span>
                <span style={{ color: '#6b7280' }}>{formatCurrency(order.total)}</span>
              </div>
              <div className="transaction-total-item transaction-total-final">
                <span>Total a Pagar:</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>
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

export default OrderDetailsModal;
