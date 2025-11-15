import React, { useMemo, useState } from "react";
import { X, CreditCard, Banknote, Receipt, AlertCircle, CheckCircle, Calculator, UtensilsCrossed, MessageSquare } from "lucide-react";
import { createFactura, createPago, getCajas } from "../../../services/cashierService";
import { updateMesa } from "../../../services/waiterService";
import { useNotification } from "../../../hooks/useNotification";
import Notification from "../../../common/Notification";
import "../styles/pay_dialog_modern.css";

const PayDialog = ({ orders, isOpen, onClose }) => {
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [cashReceived, setCashReceived] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const { notification, showNotification, hideNotification} = useNotification();

  // Agrupar items por nombre para mostrar resumen
  const groupedItems = useMemo(() => {
    if (!orders.accounts || orders.accounts.length === 0) return [];
    
    const itemsMap = new Map();
    orders.accounts.forEach((account) => {
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
            nota: item.nota || '',
            category: item.category || 'Otros'
          });
        }
      });
    });

    return Array.from(itemsMap.values());
  }, [orders.accounts]);

  const handleProcessPayment = async () => {
    if (orders.kitchenHold) {
      setError("No se puede procesar el pago hasta que cocina marque todos los pedidos como listos.");
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      // Validar si es pago en efectivo y hay monto
      if (paymentMethod === 'cash' && (!cashReceived || parseFloat(cashReceived) < parseFloat(orders.total))) {
        setError('El monto en efectivo debe ser mayor o igual al total');
        setIsProcessing(false);
        return;
      }

      // Obtener caja abierta
      const cajas = await getCajas();
      const cajaAbierta = cajas.find(c => c.estado === 'abierta');
      
      if (!cajaAbierta) {
        setError('No hay ninguna caja abierta. Por favor, abra una caja primero.');
        setIsProcessing(false);
        return;
      }

      const mesaId = orders.mesaId || orders.tableId;
      const orderIds = orders.orderIds || [];

      if (!mesaId || !orderIds || orderIds.length === 0) {
        setError('Error: Datos incompletos. Por favor, intente nuevamente.');
        setIsProcessing(false);
        return;
      }

      // Crear factura
      const facturaData = {
        table_id: mesaId,
        order_ids: orderIds,
        caja_id: cajaAbierta.id,
      };

      const factura = await createFactura(facturaData);

      // Crear pago
      const pagoData = {
        factura: factura.id,
        monto: parseFloat(orders.total || factura.total),
        metodo_pago: paymentMethod === 'cash' ? 'efectivo' : 'tarjeta',
        caja: cajaAbierta.id,
      };

      await createPago(pagoData);

      // Actualizar estado de la mesa a "available"
      let mesaActualizada = false;
      if (mesaId) {
        try {
          await updateMesa(mesaId, { status: 'available', assigned_waiter: null });
          mesaActualizada = true;
        } catch (mesaError) {
          console.warn('⚠️ Error al actualizar mesa:', mesaError.message);
        }
      }

      // Calcular cambio
      const total = parseFloat(orders.total || factura.total);
      const cambio = paymentMethod === 'cash' ? parseFloat(cashReceived) - total : 0;

      // Notificar éxito
      showNotification({
        type: 'success',
        title: 'Pago procesado exitosamente',
        message: `Total: C$${total.toFixed(2)} | Cambio: C$${cambio.toFixed(2)}${!mesaActualizada ? ' (Actualice mesa manualmente)' : ''}`,
        duration: 5000
      });
      onClose();
      
    } catch (err) {
      console.error('Error procesando pago:', err);
      setError('Error al procesar el pago: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (value) => `C$ ${parseFloat(value || 0).toFixed(2)}`;
  const total = parseFloat(orders.total);
  const cash = parseFloat(cashReceived) || 0;
  const change = paymentMethod === 'cash' ? Math.max(0, cash - total) : 0;

  if (!isOpen) return null;

  return (
    <>
      <div className="pay-dialog-overlay" onClick={onClose}>
        <div className="pay-dialog-container" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="pay-dialog-header">
            <div className="header-left">
              <div className="header-icon-wrapper">
                <Receipt size={32} />
              </div>
              <div>
                <h2 className="header-title">Procesar Pago</h2>
                <p className="header-subtitle">Mesa {orders.tableNumber}</p>
              </div>
            </div>
            <button className="header-close-btn" onClick={onClose}>
              <X size={24} />
            </button>
          </div>

          {/* Body */}
          <div className="pay-dialog-body">
            {/* Alerta de cocina */}
            {orders.kitchenHold && (
              <div className="alert alert-warning">
                <AlertCircle size={20} />
                <p>Hay platillos pendientes en cocina. Espera a que estén listos antes de cobrar.</p>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="alert alert-error">
                <AlertCircle size={20} />
                <p>{error}</p>
              </div>
            )}

            {/* Resumen de productos */}
            <div className="section-card">
              <div className="section-header">
                <UtensilsCrossed size={20} />
                <h3>Resumen de Consumo</h3>
              </div>
              <div className="items-list">
                {groupedItems.map((item, index) => (
                  <div key={index} className="item-row">
                    <div className="item-info">
                      <span className="item-name">{item.name}</span>
                      <div className="item-details">
                        <span className="item-qty">x{item.quantity}</span>
                        <span className="item-price-unit">@ {formatCurrency(item.unitPrice)}</span>
                      </div>
                      {item.nota && (
                        <div className="item-note">
                          <MessageSquare size={12} />
                          <span>{item.nota}</span>
                        </div>
                      )}
                    </div>
                    <span className="item-total">{formatCurrency(item.total)}</span>
                  </div>
                ))}
              </div>
              <div className="section-total">
                <span>Subtotal</span>
                <span className="total-amount">{formatCurrency(total)}</span>
              </div>
            </div>

            {/* Método de pago */}
            <div className="section-card">
              <div className="section-header">
                <CreditCard size={20} />
                <h3>Método de Pago</h3>
              </div>
              <div className="payment-methods">
                <button
                  className={`payment-method-btn ${paymentMethod === 'cash' ? 'active' : ''}`}
                  onClick={() => {
                    setPaymentMethod('cash');
                    setCashReceived('');
                  }}
                >
                  <Banknote size={24} />
                  <span>Efectivo</span>
                </button>
                <button
                  className={`payment-method-btn ${paymentMethod === 'card' ? 'active' : ''}`}
                  onClick={() => {
                    setPaymentMethod('card');
                    setCashReceived('');
                  }}
                >
                  <CreditCard size={24} />
                  <span>Tarjeta</span>
                </button>
              </div>
            </div>

            {/* Input de efectivo */}
            {paymentMethod === 'cash' && (
              <div className="section-card">
                <div className="section-header">
                  <Calculator size={20} />
                  <h3>Efectivo Recibido</h3>
                </div>
                <div className="cash-input-wrapper">
                  <span className="currency-symbol">C$</span>
                  <input
                    type="number"
                    className="cash-input"
                    placeholder="0.00"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value < 0 ? "" : e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "e" || e.key === "E" || e.key === "+" || e.key === "-") {
                        e.preventDefault();
                      }
                    }}
                  />
                </div>
                {cashReceived && cash >= total && (
                  <div className="change-display">
                    <CheckCircle size={18} />
                    <span>Cambio: {formatCurrency(change)}</span>
                  </div>
                )}
                {cashReceived && cash < total && (
                  <div className="insufficient-display">
                    <AlertCircle size={18} />
                    <span>Monto insuficiente: falta {formatCurrency(total - cash)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Resumen final */}
            <div className="final-summary">
              <div className="summary-row">
                <span className="summary-label">Total a Pagar</span>
                <span className="summary-value total">{formatCurrency(total)}</span>
              </div>
              {paymentMethod === 'cash' && cashReceived && cash >= total && (
                <>
                  <div className="summary-row">
                    <span className="summary-label">Efectivo Recibido</span>
                    <span className="summary-value">{formatCurrency(cash)}</span>
                  </div>
                  <div className="summary-row highlight">
                    <span className="summary-label">Cambio</span>
                    <span className="summary-value change">{formatCurrency(change)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="pay-dialog-footer">
            <button className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button 
              className="btn-primary"
              onClick={handleProcessPayment}
              disabled={
                isProcessing || 
                orders.kitchenHold || 
                (paymentMethod === 'cash' && (!cashReceived || cash < total))
              }
            >
              {isProcessing ? (
                <>
                  <div className="spinner"></div>
                  Procesando...
                </>
              ) : (
                <>
                  <CheckCircle size={20} />
                  Confirmar Pago
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {notification && (
        <Notification
          type={notification.type}
          title={notification.title}
          message={notification.message}
          onClose={hideNotification}
          duration={notification.duration}
        />
      )}
    </>
  );
};

export default PayDialog;
