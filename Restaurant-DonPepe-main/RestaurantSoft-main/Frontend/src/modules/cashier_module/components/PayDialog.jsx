import React, { useMemo, useState } from "react";
import CustomDialog from "../../../common/CustomDialog";
import { createFactura, createPago, getCajas } from "../../../services/cashierService";
import { updateMesa } from "../../../services/waiterService";
import { useNotification } from "../../../hooks/useNotification";
import Notification from "../../../common/Notification";
import "../styles/pay_dialog.css";

const PayDialog = ({ orders, isOpen, onClose }) => {
  const payTypesInput = [
    { id: "payTypeComplete", value: "complete", label: "Una sola cuenta" },
    {
      id: "payTypeIndividual",
      value: "individual",
      label: "Cuenta individual",
    },
  ];
  const paymenthMethodInput = [
    { id: "cashMethod", value: "cash", label: "En efectivo" },
    { id: "cardMethod", value: "card", label: "Con tarjeta" },
  ];

  const [payType, setPayType] = useState("complete");
  const [paymentMethod, setpaymentMethod] = useState("cash");
  const [paymenthAmmount, setpaymenthAmmount] = useState(0);
  const [accountSelected, setaccountSelected] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const { notification, showNotification, hideNotification } = useNotification();

  const renderFlag = useMemo(() => {
    return orders.accounts.filter((item) => item.isPaid === false).length > 1;
  }, [orders.accounts]);

  const handleProcessPayment = async () => {
    if (orders.kitchenHold) {
      setError("No se puede procesar el pago hasta que cocina marque todos los pedidos como listos.");
      return;
    }
    try {
      setIsProcessing(true);
      setError(null);

      // 🔍 Debug: Ver qué datos tenemos
      console.log('📦 Datos del objeto orders:', orders);
      console.log('🆔 mesaId:', orders.mesaId);
      console.log('🆔 tableId:', orders.tableId);
      console.log('📋 orderIds:', orders.orderIds);

      // Validar si es pago en efectivo y hay monto
      if (paymentMethod === 'cash' && (!paymenthAmmount || parseFloat(paymenthAmmount) < parseFloat(orders.total))) {
        setError('El monto en efectivo debe ser mayor o igual al total');
        setIsProcessing(false);
        return;
      }

      // 0. Obtener caja abierta
      const cajas = await getCajas();
      const cajaAbierta = cajas.find(c => c.estado === 'abierta');
      
      if (!cajaAbierta) {
        setError('No hay ninguna caja abierta. Por favor, abra una caja primero.');
        setIsProcessing(false);
        return;
      }

      // ✅ Validar que tenemos los datos necesarios
      const mesaId = orders.mesaId || orders.tableId;
      const orderIds = orders.orderIds || [];

      console.log('✅ Validación de datos:');
      console.log('  - Mesa ID:', mesaId);
      console.log('  - Order IDs:', orderIds);
      console.log('  - Caja ID:', cajaAbierta.id);

      if (!mesaId) {
        setError('Error: No se encontró el ID de la mesa. Por favor, intente nuevamente.');
        setIsProcessing(false);
        return;
      }

      if (!orderIds || orderIds.length === 0) {
        setError('Error: No hay órdenes para procesar. Por favor, intente nuevamente.');
        setIsProcessing(false);
        return;
      }

      // 1. Crear factura con los datos correctos que espera el backend
      const facturaData = {
        table_id: mesaId,  // ID de la mesa
        order_ids: orderIds,  // IDs de las órdenes
        caja_id: cajaAbierta.id,  // ID de la caja abierta
      };

      console.log('Enviando datos de factura:', facturaData);
      const factura = await createFactura(facturaData);
      console.log('Factura creada:', factura);

      // 2. Crear pago
      const pagoData = {
        factura: factura.id,
        monto: parseFloat(orders.total || factura.total),
        metodo_pago: paymentMethod === 'cash' ? 'efectivo' : 'tarjeta',
        caja: cajaAbierta.id,
      };

      console.log('Enviando datos de pago:', pagoData);
      await createPago(pagoData);

      // 3. Actualizar estado de la mesa a "available" (libre)
      let mesaActualizada = false;
      if (mesaId) {
        try {
          console.log('Intentando actualizar mesa a disponible:', mesaId);
          await updateMesa(mesaId, { status: 'available', assigned_waiter: null });
          mesaActualizada = true;
          console.log('✅ Mesa actualizada correctamente (liberada y sin mesero asignado)');
        } catch (mesaError) {
          // ⚠️ No detener el flujo si falla la actualización de mesa
          console.warn('⚠️ Error al actualizar mesa (pago ya procesado):', mesaError.message);
          // El pago ya se procesó correctamente, solo notificar el problema
        }
      }

      // 4. Calcular cambio
      const total = parseFloat(orders.total || factura.total);
      const cambio = paymentMethod === 'cash' ? parseFloat(paymenthAmmount) - total : 0;

      // 5. Cerrar modal y notificar éxito
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

  // Organizar items por categoría
  const itemsByCategory = useMemo(() => {
    if (!orders.accounts || orders.accounts.length === 0) return {};
    
    const allItems = orders.accounts.flatMap(account => account.items || []);
    const grouped = {};
    
    allItems.forEach(item => {
      const category = item.category || item.type || 'Otros';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(item);
    });
    
    return grouped;
  }, [orders.accounts]);

  return isOpen ? (
    <CustomDialog isOpen={isOpen} onClose={onClose}>
      <div className="dialog-header">
        <h2>Procesar pago - Mesa {orders.tableNumber} </h2>
        <p>Selecciona el tipo y método de pago</p>
      </div>

      {/* Detalle de consumo organizado por categorías */}
      <section className="order-detail-section" style={{ 
        maxHeight: '300px', 
        overflowY: 'auto', 
        marginBottom: '1.5rem',
        padding: '1rem',
        background: '#f9fafb',
        borderRadius: '8px'
      }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Detalle de Consumo</h3>
        {Object.entries(itemsByCategory).map(([category, items]) => (
          <div key={category} style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ 
              color: '#374151', 
              fontWeight: '600', 
              marginBottom: '0.5rem',
              textTransform: 'uppercase',
              fontSize: '0.9rem',
              borderBottom: '2px solid #d1d5db',
              paddingBottom: '0.25rem'
            }}>
              {category}
            </h4>
            <div style={{ paddingLeft: '0.5rem' }}>
              {items.map((item, index) => (
                <div 
                  key={`${category}-${index}`}
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    padding: '0.5rem 0',
                    borderBottom: index < items.length - 1 ? '1px solid #e5e7eb' : 'none'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: '500' }}>{item.name}</span>
                    {item.nota && (
                      <span style={{ 
                        display: 'block', 
                        fontSize: '0.85rem', 
                        color: '#6b7280',
                        fontStyle: 'italic'
                      }}>
                        Nota: {item.nota}
                      </span>
                    )}
                  </div>
                  <div style={{ 
                    textAlign: 'right',
                    minWidth: '180px',
                    display: 'flex',
                    gap: '1rem',
                    justifyContent: 'flex-end'
                  }}>
                    <span style={{ color: '#6b7280' }}>
                      {item.quantity} x C${item.unitPrice.toFixed(2)}
                    </span>
                    <span style={{ fontWeight: '600', minWidth: '80px', textAlign: 'right' }}>
                      C${item.subtotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="dialog-pay-type">
        <label htmlFor="payType">Tipo de pago</label>
        <div className="input-section">
          {payTypesInput.map(({ id, value, label }) => (
            <div key={id}>
              <input
                type="radio"
                id={id}
                name="payType"
                value={value}
                checked={payType === value}
                onChange={() => setPayType(value)}
                disabled={renderFlag == false && id == "payTypeIndividual"}
              />
              <label htmlFor={id}>{label}</label>
            </div>
          ))}
        </div>
      </section>

      {payType == "individual" && (
        <section className="order-dialog-items">
          <label htmlFor="payType">Cuentas a pagar</label>
          <div className="input-section">
            {orders.accounts &&
              orders.accounts
                .filter((item) => item.isPaid == false)
                .map((account, index) => (
                  <div>
                    <input
                      checked={account.accountId == accountSelected}
                      id={account.accountId}
                      type="radio"
                      onChange={(e) => setaccountSelected(e.target.id)}
                    />
                    <label htmlFor={account.accountId}>
                      Cuenta #{index + 1} - C${account.subtotal}
                    </label>
                  </div>
                ))}
          </div>
        </section>
      )}

      <section className="order-dialog-items">
        <label htmlFor="payType">Méstodos de pago</label>
        <div className="input-section">
          {paymenthMethodInput.map((method) => (
            <div>
              <input
                id={method.id}
                type="radio"
                value={method.value}
                checked={method.value == paymentMethod}
                onChange={() => {
                  setpaymentMethod(method.value);
                  setpaymenthAmmount(0);
                }}
              />
              <label htmlFor={method.id}>{method.label}</label>
            </div>
          ))}
        </div>
      </section>

      {paymentMethod == "cash" && (
        <section className="text-input-section">
          <label htmlFor="">Efectivo Recibido</label>
          <input
            className="shadow"
            type="number"
            value={paymenthAmmount}
            onChange={(e) =>
              setpaymenthAmmount(e.target.value < 0 ? "" : e.target.value)
            }
            onKeyDown={(e) => {
              if (
                e.key === "e" ||
                e.key === "E" ||
                e.key === "+" ||
                e.key === "-"
              ) {
                e.preventDefault();
              }
            }}
          />
        </section>
      )}

      <section className="total-section">
        <div>
          <h4>Total</h4>
          <p>{parseFloat(orders.total)}</p>
        </div>

        {paymenthAmmount != 0 && paymenthAmmount != "" && (
          <div>
            <h4>Cambio</h4>
            <p>{parseFloat(paymenthAmmount) - parseFloat(orders.total)}</p>
          </div>
        )}
      </section>

      {error && (
        <div style={{ padding: '1rem', background: '#fee2e2', borderRadius: '8px', marginBottom: '1rem' }}>
          <p style={{ color: '#dc2626', margin: 0 }}>{error}</p>
        </div>
      )}

      {orders.kitchenHold && (
        <div style={{ padding: '1rem', background: '#fff7ed', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #fed7aa' }}>
          <p style={{ color: '#b45309', margin: 0 }}>
            Hay platillos en cocina. Espera a que el equipo de cocina termine antes de cobrar esta mesa.
          </p>
        </div>
      )}

      <section className="button-action">
        <button 
          className="shadow"
          onClick={handleProcessPayment}
          disabled={isProcessing || orders.kitchenHold}
        >
          {isProcessing ? 'Procesando...' : 'Realizar pago'}
        </button>
      </section>

      {notification && (
        <Notification
          type={notification.type}
          title={notification.title}
          message={notification.message}
          onClose={hideNotification}
          duration={notification.duration}
        />
      )}
    </CustomDialog>
  ) : (
    ""
  );
};

export default PayDialog;
