import React, { useEffect, useMemo, useState } from "react";
import { X, CreditCard, Banknote, Receipt, AlertCircle, CheckCircle, Calculator, UtensilsCrossed, MessageSquare } from "lucide-react";
import { createFactura, createPago, getCajas } from "../../../services/cashierService";
import { updateMesa } from "../../../services/waiterService";
import { useNotification } from "../../../hooks/useNotification";
import Notification from "../../../common/Notification";
import ReceiptPrinter from "./ReceiptPrinter";
import "../styles/pay_dialog_modern.css";

const PayDialog = ({ orders, isOpen, onClose }) => {
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [cashReceived, setCashReceived] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [receiptData, setReceiptData] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const { notification, showNotification, hideNotification} = useNotification();

  useEffect(() => {
    if (isOpen) {
      setCashReceived("");
      setPaymentMethod("cash");
      setError(null);
    }
  }, [isOpen]);

  const baseItems = useMemo(() => {
    if (!orders.accounts || orders.accounts.length === 0) return [];
    const items = [];
    orders.accounts.forEach((account) => {
      (account.items || []).forEach((item, idx) => {
        const basePrice = Number(
          item.unitPrice ?? item.originalUnitPrice ?? item.precio ?? 0
        );
        const originalPrice =
          Number(item.originalUnitPrice ?? basePrice ?? 0) || 0;
        const uid =
          item.itemUid ||
          item.item_uid ||
          item.uid ||
          item.id ||
          `${account.accountId || orders.id || "acc"}-${idx}-${item.name || "item"}`;

        items.push({
          ...item,
          itemUid: uid,
          orderDbId:
            item.orderDbId ||
            item.order_id ||
            orders.orderIds?.[0] ||
            orders.orderId ||
            orders.id,
          orderIdentifier:
            item.orderIdentifier ||
            item.orderId ||
            item.order_id ||
            orders.orderId,
          quantity: Number(item.quantity) || 0,
          basePrice,
          originalUnitPrice: originalPrice,
          unitPrice: basePrice,
          subtotal: (Number(item.quantity) || 0) * basePrice,
        });
      });
    });
    return items;
  }, [orders.accounts, orders.orderIds, orders.orderId, orders.id]);

  const displayItems = useMemo(() => {
    return baseItems.map((item) => {
      const unitPrice = item.basePrice;
      const quantity = Number(item.quantity) || 0;
      return {
        ...item,
        unitPrice,
        subtotal: unitPrice * quantity,
      };
    });
  }, [baseItems]);

  const paymentTotal = useMemo(
    () =>
      displayItems.reduce(
        (acc, item) => acc + (Number(item.subtotal) || 0),
        0
      ),
    [displayItems]
  );

  const formatCurrency = (value) => `C$ ${parseFloat(value || 0).toFixed(2)}`;
  const cash = parseFloat(cashReceived) || 0;
  const change = paymentMethod === 'cash' ? Math.max(0, cash - paymentTotal) : 0;

  const handleProcessPayment = async () => {
    if (orders.kitchenHold) {
      setError("No se puede procesar el pago hasta que cocina marque todos los pedidos como listos.");
      return;
    }

    const totalToCharge = Number(paymentTotal) || 0;
    try {
      setIsProcessing(true);
      setError(null);

      if (
        paymentMethod === "cash" &&
        (!cashReceived || parseFloat(cashReceived) < totalToCharge)
      ) {
        setError('El monto en efectivo debe ser mayor o igual al total');
        setIsProcessing(false);
        return;
      }

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

      const facturaData = {
        table_id: mesaId,
        order_ids: orderIds,
        caja_id: cajaAbierta.id,
      };

      const factura = await createFactura(facturaData);

      const facturaTotal = parseFloat(factura.total);
      const totalPago = Number.isFinite(facturaTotal) ? facturaTotal : totalToCharge;
      const pagoData = {
        factura: factura.id,
        monto: totalPago,
        metodo_pago: paymentMethod === 'cash' ? 'efectivo' : 'tarjeta',
        caja: cajaAbierta.id,
      };

      await createPago(pagoData);

      let mesaActualizada = false;
      if (mesaId) {
        try {
          await updateMesa(mesaId, { status: 'available', assigned_waiter: null });
          mesaActualizada = true;
        } catch (mesaError) {
          console.warn('Aviso: Error al actualizar mesa:', mesaError.message);
        }
      }

      const cambio = paymentMethod === 'cash' ? parseFloat(cashReceived || 0) - totalPago : 0;

      const receiptItems = displayItems.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
        nota: item.nota,
        category: item.category,
      }));
      const ticketData = {
        ticketNumber: factura.numero_factura || factura.id,
        facturaId: factura.id,
        correlativo: String(factura.id).padStart(3, '0'),
        vendorId: factura.caja_id || 1,
        tableNumber: orders.tableNumber,
        waiter: orders.waiter,
        waiterName: orders.waiter,
        customerName: orders.customerName || '',
        customerAddress: orders.customerAddress || '',
        items: receiptItems,
        paymentMethod: paymentMethod,
        total: totalPago,
        cashReceived: paymentMethod === 'cash' ? parseFloat(cashReceived) : totalPago,
        change: cambio,
      };

      setReceiptData(ticketData);
      setShowReceipt(true);

      showNotification({
        type: 'success',
        title: 'Pago procesado exitosamente',
        message: `Total: C$${totalPago.toFixed(2)} | Cambio: C$${cambio.toFixed(2)}${!mesaActualizada ? ' (Actualice mesa manualmente)' : ''}`,
        duration: 5000
      });
      
      setTimeout(() => {
        onClose();
      }, 500);
      
    } catch (err) {
      console.error('Error procesando pago:', err);
      setError('Error al procesar el pago: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="pay-dialog-overlay" onClick={onClose}>
        <div className="pay-dialog-container" onClick={(e) => e.stopPropagation()}>
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

          <div className="pay-dialog-body">
            {orders.kitchenHold && (
                  <div className="alert alert-warning">
                <AlertCircle size={20} />
                <p>
                  {orders.nonCookableOnly
                    ? "Marca las bebidas en \"Bebidas pendientes\" como entregadas para poder cobrar."
                    : "Hay platillos pendientes en cocina. Espera a que esten listos antes de cobrar."}
                </p>
              </div>
            )}

            {error && (
              <div className="alert alert-error">
                <AlertCircle size={20} />
                <p>{error}</p>
              </div>
            )}

            <div className="section-card">
              <div className="section-header">
                <UtensilsCrossed size={20} />
                <h3>Resumen de Consumo</h3>
              </div>
              <div className="items-list">
                {displayItems.map((item) => (
                  <div key={item.itemUid} className="item-row">
                    <div className="item-info">
                      <span className="item-name">{item.name}</span>
                      <div className="item-details">
                        <span className="item-qty">x{item.quantity}</span>
                        <span className="item-price-unit">Precio: {formatCurrency(item.unitPrice)}</span>
                      </div>
                      {item.nota && (
                        <div className="item-note">
                          <MessageSquare size={12} />
                          <span>{item.nota}</span>
                        </div>
                      )}
                    </div>
                    <span className="item-total">{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
              </div>
              <div className="section-total">
                <span>Subtotal</span>
                <span className="total-amount">{formatCurrency(paymentTotal)}</span>
              </div>
            </div>

            <div className="section-card">
              <div className="section-header">
                <CreditCard size={20} />
                <h3>Metodo de Pago</h3>
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
                {cashReceived && cash >= paymentTotal && (
                  <div className="change-display">
                    <CheckCircle size={18} />
                    <span>Cambio: {formatCurrency(change)}</span>
                  </div>
                )}
                {cashReceived && cash < paymentTotal && (
                  <div className="insufficient-display">
                    <AlertCircle size={18} />
                    <span>Monto insuficiente: falta {formatCurrency(paymentTotal - cash)}</span>
                  </div>
                )}
              </div>
            )}

            <div className="final-summary">
              <div className="summary-row">
                <span className="summary-label">Total a Pagar</span>
                <span className="summary-value total">{formatCurrency(paymentTotal)}</span>
              </div>
              {paymentMethod === 'cash' && cashReceived && cash >= paymentTotal && (
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
                (paymentMethod === 'cash' && (!cashReceived || cash < paymentTotal))
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

      <ReceiptPrinter
        isOpen={showReceipt}
        onClose={() => setShowReceipt(false)}
        receiptData={receiptData}
      />
    </>
  );
};

export default PayDialog;
