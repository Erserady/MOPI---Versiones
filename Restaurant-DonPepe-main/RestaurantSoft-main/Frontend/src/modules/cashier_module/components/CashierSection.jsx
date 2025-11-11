import React, { useState, useEffect } from "react";
import "../styles/cashier_section.css";
import { CreditCard, Receipt, DollarSign, Banknote, RefreshCw, AlertCircle } from "lucide-react";
import CashierModal from "./Cashier.Modal";
import { getCajas, getPagos, abrirCaja, cerrarCaja } from "../../../services/cashierService";
import { useDataSync } from "../../../hooks/useDataSync";

const CashierSection = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState("open");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Sincronizar datos de cajas y pagos cada 5 segundos
  const { data: cajas, refetch: refetchCajas } = useDataSync(getCajas, 5000);
  const { data: pagos, refetch: refetchPagos } = useDataSync(getPagos, 5000);
  
  // Obtener caja actual (la primera abierta o la última)
  const cajaActual = cajas?.find(c => c.estado === 'abierta') || cajas?.[0];

  // Calcular estadísticas de la caja
  const pagosHoy = pagos?.filter(p => {
    const today = new Date().toISOString().split('T')[0];
    return p.created_at?.startsWith(today);
  }) || [];
  
  const ventasEfectivo = pagosHoy
    .filter(p => p.metodo_pago === 'efectivo')
    .reduce((sum, p) => sum + parseFloat(p.monto || 0), 0);
  
  const ventasTarjeta = pagosHoy
    .filter(p => p.metodo_pago === 'tarjeta')
    .reduce((sum, p) => sum + parseFloat(p.monto || 0), 0);
  
  const ventasTotal = ventasEfectivo + ventasTarjeta;
  
  const saldoActual = (parseFloat(cajaActual?.saldo_inicial || 0) + ventasEfectivo);

  const openModal = (type) => {
    if (type === 'open' && cajaActual?.estado === 'abierta') {
      alert('Ya hay una caja abierta. Primero debe cerrar la caja actual.');
      return;
    }
    if (type === 'close' && cajaActual?.estado !== 'abierta') {
      alert('No hay ninguna caja abierta para cerrar.');
      return;
    }
    setModalType(type);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setError(null);
  };

  const handleSaveCashier = async (data) => {
    try {
      setLoading(true);
      setError(null);
      
      if (data.type === "open") {
        // Crear o abrir una caja existente
        if (cajaActual && cajaActual.estado === 'cerrada') {
          await abrirCaja(cajaActual.id, data.totalAmount);
        } else {
          alert('No se puede abrir la caja. Contacte al administrador.');
          return;
        }
        alert(`✅ Caja abierta con saldo inicial de C$${data.totalAmount.toFixed(2)}`);
      } else {
        // Cerrar caja
        if (cajaActual && cajaActual.estado === 'abierta') {
          await cerrarCaja(cajaActual.id, data.totalAmount, 'Cierre normal');
        } else {
          alert('No hay caja abierta para cerrar.');
          return;
        }
        alert(`✅ Caja cerrada. Saldo final: C$${data.totalAmount.toFixed(2)}`);
      }
      
      // Refrescar datos
      await refetchCajas();
      await refetchPagos();
      setIsModalOpen(false);
      
    } catch (err) {
      console.error('Error al gestionar caja:', err);
      setError(err.message);
      alert(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!cajas) {
    return (
      <section className="cashier-section">
        <h2 className="cashier-title">Control de Caja</h2>
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <RefreshCw className="spin" size={40} />
          <p style={{ marginTop: '1rem', color: '#6b7280' }}>Cargando información de caja...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="cashier-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 className="cashier-title">Control de Caja</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {cajaActual?.estado === 'abierta' ? (
            <span style={{ 
              padding: '0.5rem 1rem', 
              background: '#10b981', 
              color: 'white', 
              borderRadius: '8px',
              fontWeight: 'bold'
            }}>
              ✅ Caja Abierta
            </span>
          ) : (
            <span style={{ 
              padding: '0.5rem 1rem', 
              background: '#ef4444', 
              color: 'white', 
              borderRadius: '8px',
              fontWeight: 'bold'
            }}>
              ⚠️ Caja Cerrada
            </span>
          )}
        </div>
      </div>

      {error && (
        <div style={{ 
          padding: '1rem', 
          background: '#fee2e2', 
          borderRadius: '8px', 
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <AlertCircle size={20} color="#dc2626" />
          <p style={{ color: '#dc2626', margin: 0 }}>{error}</p>
        </div>
      )}

      <div className="cashier-grid">
        <CashierCard title="Estado de Caja" customClass="cashier-state">
          <p>
            Monto de Apertura: <strong>C$ {parseFloat(cajaActual?.saldo_inicial || 0).toFixed(2)}</strong>
          </p>
          <p>
            Saldo Actual en Efectivo: <strong>C$ {saldoActual.toFixed(2)}</strong>
          </p>
          <p>
            Ventas del Día:
            <strong className="cashier-success">C$ {ventasTotal.toFixed(2)}</strong>
          </p>
          <small>
            {cajaActual?.estado === 'abierta' ? (
              <>
                Caja: <b>{cajaActual?.numero_caja}</b><br />
                Abierta: {new Date(cajaActual?.fecha_apertura).toLocaleString('es-ES', {
                  dateStyle: 'short',
                  timeStyle: 'short'
                })}
              </>
            ) : (
              <span style={{ color: '#ef4444' }}>No hay caja abierta</span>
            )}
          </small>
        </CashierCard>

        <CashierCard title="Acciones de Caja" customClass="cashier-actions">
          <button className="cashier-btn shadow open" onClick={() => openModal("open")}>
            <DollarSign /> Abrir Caja
          </button>
          <button className="cashier-btn shadow close" onClick={() => openModal("close")}>
            <DollarSign /> Cerrar Caja
          </button>
          <button className="cashier-btn report shadow">
            <Banknote /> Reporte de Caja
          </button>
        </CashierCard>

        <CashierCard title="Flujo de Efectivo Hoy" customClass="cashier-flow">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f3f4f6', borderRadius: '8px' }}>
              <span>💵 Ventas en Efectivo:</span>
              <strong style={{ color: '#10b981' }}>C$ {ventasEfectivo.toFixed(2)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f3f4f6', borderRadius: '8px' }}>
              <span>💳 Ventas con Tarjeta:</span>
              <strong style={{ color: '#3b82f6' }}>C$ {ventasTarjeta.toFixed(2)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#10b981', color: 'white', borderRadius: '8px', fontWeight: 'bold' }}>
              <span>Total Ventas:</span>
              <span>C$ {ventasTotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f9fafb', borderRadius: '8px', borderTop: '2px solid #e5e7eb' }}>
              <span>📊 Transacciones:</span>
              <strong>{pagosHoy.length}</strong>
            </div>
          </div>
        </CashierCard>

        <CashierCard
          title="Últimas Transacciones"
          customClass="cashier-history"
        >
          {pagosHoy.length > 0 ? (
            pagosHoy.slice(0, 10).reverse().map((pago, idx) => (
              <div key={pago.id || idx} className="cashier-transaction">
                <div className="title-transaction">
                  <Receipt />
                  <div>
                    <p>
                      <strong>
                        {pago.metodo_pago === 'efectivo' ? '💵 Efectivo' : '💳 Tarjeta'}
                      </strong>
                    </p>
                    <small>
                      {new Date(pago.created_at).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </small>
                  </div>
                </div>
                <span className="cashier-amount">C$ {parseFloat(pago.monto || 0).toFixed(2)}</span>
              </div>
            ))
          ) : (
            <p style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>
              No hay transacciones hoy
            </p>
          )}
        </CashierCard>
      </div>

      <CashierModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveCashier}
        type={modalType}
      />
    </section>
  );
};

export default CashierSection;

const CashierCard = ({ title, children, customClass }) => {
  return (
    <article className={"shadow cashier-card " + customClass}>
      {title && <h3 className="cashier-card-title">{title}</h3>}
      <div className="cashier-card-content">{children}</div>
    </article>
  );
};
