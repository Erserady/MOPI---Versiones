import React, { useMemo } from 'react';
import { X, Receipt, CreditCard, Banknote, Calendar, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import '../styles/transaction_history_modal.css';

const TransactionHistoryModal = ({ isOpen, onClose, transactions, cajaInfo }) => {
  if (!isOpen) return null;

  // Agrupar transacciones por fecha
  const transactionsByDate = useMemo(() => {
    if (!transactions || transactions.length === 0) return {};
    
    const grouped = {};
    transactions.forEach(transaction => {
      const date = new Date(transaction.created_at).toLocaleDateString('es-NI', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(transaction);
    });
    
    return grouped;
  }, [transactions]);

  const formatCurrency = (value) => `C$ ${parseFloat(value || 0).toFixed(2)}`;
  
  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('es-NI', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Calcular totales
  const totales = useMemo(() => {
    if (!transactions) return { efectivo: 0, tarjeta: 0, egresos: 0, total: 0 };
    
    const efectivo = transactions
      .filter(t => t.tipo !== 'egreso' && t.metodo_pago === 'efectivo')
      .reduce((sum, t) => sum + parseFloat(t.monto || 0), 0);
    
    const tarjeta = transactions
      .filter(t => t.tipo !== 'egreso' && t.metodo_pago === 'tarjeta')
      .reduce((sum, t) => sum + parseFloat(t.monto || 0), 0);
    
    const egresos = transactions
      .filter(t => t.tipo === 'egreso')
      .reduce((sum, t) => sum + parseFloat(t.monto || 0), 0);
    
    return {
      efectivo,
      tarjeta,
      egresos,
      total: efectivo + tarjeta - egresos
    };
  }, [transactions]);

  return (
    <div className="history-modal-overlay" onClick={onClose}>
      <div className="history-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="history-modal-header">
          <div className="header-left">
            <div className="header-icon">
              <Receipt size={28} />
            </div>
            <div>
              <h2 className="header-title">Historial de Transacciones</h2>
              <p className="header-subtitle">
                {cajaInfo?.estado === 'abierta' 
                  ? 'Caja Actual - Abierta' 
                  : 'Historial Completo'}
              </p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Resumen */}
        <div className="history-summary">
          <div className="summary-card">
            <div className="summary-icon efectivo">
              <Banknote size={20} />
            </div>
            <div>
              <p className="summary-label">Efectivo</p>
              <p className="summary-value">{formatCurrency(totales.efectivo)}</p>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon tarjeta">
              <CreditCard size={20} />
            </div>
            <div>
              <p className="summary-label">Tarjeta</p>
              <p className="summary-value">{formatCurrency(totales.tarjeta)}</p>
            </div>
          </div>
          {totales.egresos > 0 && (
            <div className="summary-card">
              <div className="summary-icon egreso">
                <TrendingDown size={20} />
              </div>
              <div>
                <p className="summary-label">Egresos</p>
                <p className="summary-value egreso">- {formatCurrency(totales.egresos)}</p>
              </div>
            </div>
          )}
          <div className="summary-card highlight">
            <div className="summary-icon total">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="summary-label">Total Neto</p>
              <p className="summary-value total">{formatCurrency(totales.total)}</p>
            </div>
          </div>
        </div>

        {/* Lista de transacciones */}
        <div className="history-body">
          {transactions && transactions.length > 0 ? (
            Object.entries(transactionsByDate).map(([date, dayTransactions]) => (
              <div key={date} className="transactions-group">
                <div className="group-header">
                  <Calendar size={18} />
                  <h3>{date}</h3>
                  <span className="group-count">{dayTransactions.length} transacciones</span>
                </div>
                <div className="transactions-list">
                  {dayTransactions.map((transaction, index) => (
                    <div key={transaction.id || index} className="transaction-item">
                      <div className={`transaction-icon ${transaction.tipo === 'egreso' ? 'egreso' : ''}`}>
                        {transaction.tipo === 'egreso' ? (
                          <TrendingDown size={20} />
                        ) : transaction.metodo_pago === 'efectivo' ? (
                          <Banknote size={20} />
                        ) : (
                          <CreditCard size={20} />
                        )}
                      </div>
                      <div className="transaction-info">
                        <div className="transaction-main">
                          <span className="transaction-method">
                            {transaction.tipo === 'egreso' 
                              ? '📉 Egreso'
                              : (transaction.metodo_pago === 'efectivo' ? '💵 Efectivo' : '💳 Tarjeta')}
                          </span>
                          <span className="transaction-time">{formatTime(transaction.created_at)}</span>
                        </div>
                        {transaction.tipo === 'egreso' && transaction.comentario ? (
                          <div className="transaction-details">
                            <span className="detail-label">Concepto:</span>
                            <span className="detail-value">{transaction.comentario}</span>
                          </div>
                        ) : transaction.factura_detalle && (
                          <div className="transaction-details">
                            <span className="detail-label">Factura:</span>
                            <span className="detail-value">#{transaction.factura_detalle.numero_factura || transaction.factura}</span>
                            {transaction.factura_detalle.table && (
                              <>
                                <span className="detail-separator">•</span>
                                <span className="detail-value">Mesa {transaction.factura_detalle.table.number}</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      <div className={`transaction-amount ${transaction.tipo === 'egreso' ? 'egreso' : ''}`}>
                        {transaction.tipo === 'egreso' ? '- ' : ''}{formatCurrency(transaction.monto)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <Receipt size={48} strokeWidth={1.5} />
              <p>No hay transacciones registradas</p>
              <small>Las transacciones aparecerán aquí cuando se procesen pagos</small>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="history-footer">
          <div className="footer-info">
            <DollarSign size={18} />
            <span>{transactions?.length || 0} transacciones en total</span>
          </div>
          <button className="btn-close" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionHistoryModal;
