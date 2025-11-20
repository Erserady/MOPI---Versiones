import React, { useState } from 'react';
import { X, Receipt, UtensilsCrossed, MessageSquare, Send, Trash2, AlertTriangle, RefreshCw } from 'lucide-react';
import '../styles/transaction_detail_modal.css';
import { cambiarEstadoOrden, deleteOrdenCocina, updateOrdenCocina } from '../../../services/cookService';
import AlertModal from '../../../components/AlertModal';
import ConfirmModal from '../../../components/ConfirmModal';

const OrderDetailsModal = ({ isOpen, onClose, order, onOrderCancelled }) => {
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [alert, setAlert] = useState({ isOpen: false, type: 'info', title: '', message: '' });
  const [editedItems, setEditedItems] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: 'cancel', itemToRemove: null });
  
  if (!isOpen || !order) return null;

  const formatCurrency = (value) => {
    return `C$ ${parseFloat(value || 0).toFixed(2)}`;
  };

  const closeAlert = () => {
    setAlert({ ...alert, isOpen: false });
    if (alert.type === 'success' && alert.shouldClose) {
      if (onOrderCancelled) onOrderCancelled();
      onClose(); // Cerrar modal principal si fue exitoso
    }
  };

  const showAlert = (type, title, message, shouldClose = true) => {
    setAlert({ isOpen: true, type, title, message, shouldClose });
  };

  const handleCancelOrder = () => {
    setConfirmModal({
      isOpen: true,
      type: 'cancel',
      itemToRemove: null
    });
  };

  const confirmCancelOrder = async () => {
    try {
      setDeleting(true);
      await deleteOrdenCocina(order.orderId);
      showAlert('success', '¡Pedido Cancelado!', `El pedido de la Mesa ${order.tableNumber} ha sido cancelado exitosamente. La mesa ahora está libre.`, true);
    } catch (error) {
      console.error('Error cancelando pedido:', error);
      showAlert('error', 'Error', 'No se pudo cancelar el pedido. Por favor, inténtalo de nuevo.', false);
    } finally {
      setDeleting(false);
    }
  };

  const handleRemoveItem = (itemToRemove) => {
    // Verificar primero si quedaría vacío
    const currentItems = editedItems || items;
    const newItems = currentItems.filter(item => item.name !== itemToRemove.name);

    if (newItems.length === 0) {
      showAlert('warning', 'Atención', 'No puedes eliminar todos los productos. Si deseas cancelar el pedido completo, usa el botón "Cancelar Pedido".', false);
      return;
    }

    setConfirmModal({
      isOpen: true,
      type: 'removeItem',
      itemToRemove: itemToRemove
    });
  };

  const confirmRemoveItem = () => {
    const itemToRemove = confirmModal.itemToRemove;
    if (!itemToRemove) return;

    const currentItems = editedItems || items;
    const newItems = currentItems.filter(item => item.name !== itemToRemove.name);

    setEditedItems(newItems);
    showAlert('success', 'Producto Eliminado', `"${itemToRemove.name}" ha sido eliminado. Recuerda guardar los cambios.`, false);
  };

  const handleSaveChanges = async () => {
    if (!editedItems) {
      showAlert('info', 'Sin Cambios', 'No hay cambios para guardar.', false);
      return;
    }

    try {
      setSending(true);
      
      // Reconstruir el pedido con los items editados
      const newPedido = editedItems.map(item => ({
        nombre: item.name,
        precio: item.unitPrice,
        cantidad: item.quantity
      }));

      await updateOrdenCocina(order.orderId, {
        pedido: JSON.stringify(newPedido)
      });

      showAlert('success', '¡Cambios Guardados!', 'Los productos del pedido han sido actualizados exitosamente.', true);
      setEditedItems(null);
    } catch (error) {
      console.error('Error guardando cambios:', error);
      showAlert('error', 'Error', 'No se pudieron guardar los cambios. Por favor, inténtalo de nuevo.', false);
    } finally {
      setSending(false);
    }
  };

  const handleSendPreFactura = async () => {
    try {
      setSending(true);
      // Cambiar estado a prefactura_enviada
      await cambiarEstadoOrden(order.orderId, 'prefactura_enviada');
      showAlert('success', '¡Pre-factura Enviada!', 'La pre-factura ha sido enviada al mesero correctamente. El mesero podrá visualizarla en su panel de pedidos activos.');
    } catch (error) {
      console.error('Error enviando pre-factura:', error);
      showAlert('error', 'Error', 'No se pudo enviar la pre-factura. Por favor, inténtalo de nuevo.');
    } finally {
      setSending(false);
    }
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
  const displayItems = editedItems || items;

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
              {displayItems.map((item, index) => (
                <div key={index}>
                  <div className="transaction-product-item" style={{ position: 'relative' }}>
                    <div className="transaction-product-info">
                      <span className="transaction-product-name">
                        {item.name}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="transaction-product-quantity">x{item.quantity}</span>
                        <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>@ {formatCurrency(item.unitPrice)}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span className="transaction-product-price">
                        {formatCurrency(item.total)}
                      </span>
                      <button
                        onClick={() => handleRemoveItem(item)}
                        style={{
                          background: '#fee2e2',
                          color: '#dc2626',
                          border: '1px solid #fecaca',
                          borderRadius: '6px',
                          padding: '0.375rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = '#fecaca';
                          e.target.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = '#fee2e2';
                          e.target.style.transform = 'scale(1)';
                        }}
                        title="Eliminar producto"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
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
        <div className="transaction-modal-footer" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
          {/* Botón Guardar Cambios - Solo si hay items editados */}
          {editedItems && (
            <button 
              className="transaction-modal-btn-primary" 
              onClick={handleSaveChanges}
              disabled={sending}
              style={{
                background: '#10b981',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Receipt size={18} />
              {sending ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          )}
          
          {/* Botón Enviar Pre-factura - Solo si la orden tiene estado payment_requested */}
          {order.status === 'payment_requested' && !editedItems && (
            <button 
              className="transaction-modal-btn-primary" 
              onClick={handleSendPreFactura}
              disabled={sending}
              style={{
                background: '#6366f1',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Send size={18} />
              {sending ? 'Enviando...' : 'Enviar Pre-factura al Mesero'}
            </button>
          )}
          
          {/* Botón Cancelar Pedido */}
          <button 
            onClick={handleCancelOrder}
            disabled={deleting || sending}
            style={{
              background: deleting ? '#9ca3af' : '#ef4444',
              color: 'white',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              border: 'none',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: deleting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!deleting && !sending) e.target.style.background = '#dc2626';
            }}
            onMouseLeave={(e) => {
              if (!deleting && !sending) e.target.style.background = '#ef4444';
            }}
          >
            {deleting ? <RefreshCw size={18} className="spin" /> : <Trash2 size={18} />}
            {deleting ? 'Cancelando...' : 'Cancelar Pedido'}
          </button>
          
          <button className="transaction-modal-btn-close" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
      
      <AlertModal
        isOpen={alert.isOpen}
        onClose={closeAlert}
        type={alert.type}
        title={alert.title}
        message={alert.message}
      />
      
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.type === 'cancel' ? confirmCancelOrder : confirmRemoveItem}
        title={confirmModal.type === 'cancel' ? '¿Cancelar Pedido?' : '¿Eliminar Producto?'}
        message={
          confirmModal.type === 'cancel' ? (
            <>
              <p>¿Estás seguro de que deseas <strong>CANCELAR</strong> este pedido?</p>
              <ul>
                <li>Se eliminará el pedido de cocina</li>
                <li>Se liberará la mesa</li>
                <li>Esta acción NO se puede deshacer</li>
              </ul>
            </>
          ) : (
            <p>¿Estás seguro de que deseas eliminar <strong>"{confirmModal.itemToRemove?.name}"</strong> del pedido?</p>
          )
        }
        confirmText={confirmModal.type === 'cancel' ? 'Sí, Cancelar Pedido' : 'Sí, Eliminar'}
        cancelText="No, Volver"
        type="danger"
      />
    </div>
  );
};

export default OrderDetailsModal;
