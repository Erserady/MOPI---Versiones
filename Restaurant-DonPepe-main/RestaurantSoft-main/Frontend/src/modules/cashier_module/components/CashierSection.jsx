import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import "../styles/cashier_section.css";
import { CreditCard, Receipt, DollarSign, Banknote, RefreshCw, AlertCircle } from "lucide-react";
import CashierModal from "./Cashier.Modal";
import TransactionDetailModal from "./TransactionDetailModal";
import ReportDateModal from "./ReportDateModal";
import { getCajas, getPagos, abrirCaja, cerrarCaja, getPagosByDate, getPagosByMonth } from "../../../services/cashierService";
import { generateDetailedCashReport } from "../utils/reportGenerator";
import { useDataSync } from "../../../hooks/useDataSync";
import { useNotification } from "../../../hooks/useNotification";
import Notification from "../../../common/Notification";

const CashierSection = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState("open");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { notification, showNotification, hideNotification } = useNotification();
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  
  // Sincronizar datos de cajas y pagos cada 5 segundos
  const { data: cajas, refetch: refetchCajas } = useDataSync(getCajas, 5000);
  const { data: pagos, refetch: refetchPagos } = useDataSync(getPagos, 5000);
  
  // Obtener caja actual (la primera abierta o la última)
  const cajaActual = cajas?.find(c => c.estado === 'abierta') || cajas?.[0];
  
  // Debug: Log cuando cambia el estado de la caja
  useEffect(() => {
    if (cajaActual) {
      console.log('Estado actual de caja:', cajaActual.estado, 'ID:', cajaActual.id);
    }
  }, [cajaActual?.estado]);

  // Calcular estadísticas de la caja
  // Solo mostrar pagos de la caja actual (abierta) Y después de la fecha de apertura
  // Si la caja está cerrada, no mostrar pagos (nuevo día)
  const pagosHoy = cajaActual?.estado === 'abierta' 
    ? (pagos?.filter(p => {
        // Filtrar pagos que pertenecen a la caja actual Y son después de la apertura
        if (p.caja !== cajaActual.id) return false;
        
        // Verificar que el pago sea después de la apertura de esta caja
        const fechaPago = new Date(p.created_at);
        const fechaApertura = new Date(cajaActual.fecha_apertura);
        
        return fechaPago >= fechaApertura;
      }) || [])
    : [];
  
  const ventasEfectivo = cajaActual?.estado === 'abierta'
    ? pagosHoy
        .filter(p => p.metodo_pago === 'efectivo')
        .reduce((sum, p) => sum + parseFloat(p.monto || 0), 0)
    : 0;
  
  const ventasTarjeta = cajaActual?.estado === 'abierta'
    ? pagosHoy
        .filter(p => p.metodo_pago === 'tarjeta')
        .reduce((sum, p) => sum + parseFloat(p.monto || 0), 0)
    : 0;
  
  const ventasTotal = ventasEfectivo + ventasTarjeta;
  
  const saldoActual = cajaActual?.estado === 'abierta'
    ? (parseFloat(cajaActual?.saldo_inicial || 0) + ventasEfectivo)
    : 0;

  const openModal = (type) => {
    if (type === 'open' && cajaActual?.estado === 'abierta') {
      showNotification({
        type: 'warning',
        title: 'Caja ya abierta',
        message: 'Ya hay una caja abierta. Primero debe cerrar la caja actual.',
        duration: 4000
      });
      return;
    }
    if (type === 'close' && cajaActual?.estado !== 'abierta') {
      showNotification({
        type: 'warning',
        title: 'No hay caja abierta',
        message: 'No hay ninguna caja abierta para cerrar.',
        duration: 4000
      });
      return;
    }
    setModalType(type);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setError(null);
  };

  const handleTransactionClick = (pago) => {
    setSelectedTransaction(pago);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedTransaction(null);
  };

  const handleOpenReportModal = () => {
    if (!pagos || pagos.length === 0) {
      showNotification({
        type: 'info',
        title: 'Sin datos',
        message: 'No hay transacciones registradas en el sistema.',
        duration: 4000
      });
      return;
    }
    setIsReportModalOpen(true);
  };

  const handleGenerateReport = async ({ type, date, month, year }) => {
    try {
      setIsGeneratingReport(true);
      setIsReportModalOpen(false);

      let transactions = [];
      let dateInfo = '';

      // Obtener transacciones según el tipo de reporte
      if (type === 'day') {
        transactions = await getPagosByDate(date);
        dateInfo = new Date(date).toLocaleDateString('es-NI', {
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        });
      } else if (type === 'month') {
        transactions = await getPagosByMonth(year, month);
        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
          'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        dateInfo = `${monthNames[month - 1]} ${year}`;
      }

      if (transactions.length === 0) {
        showNotification({
          type: 'warning',
          title: 'Sin transacciones',
          message: `No hay transacciones para ${dateInfo}`,
          duration: 4000
        });
        return;
      }

      const cajeroActual =
        cajaActual?.responsable ||
        cajaActual?.usuario?.nombre ||
        cajaActual?.usuario?.username ||
        cajaActual?.encargado ||
        cajaActual?.creado_por ||
        'N/D';

      // Generar reporte detallado
      const result = generateDetailedCashReport({
        transactions,
        cajaInfo: cajaActual,
        reportType: type,
        dateInfo,
        cajeroName: cajeroActual
      });

      showNotification({
        type: 'success',
        title: 'Reporte generado',
        message: `Se descargó ${result.fileName}`,
        duration: 4000
      });
    } catch (err) {
      console.error('Error generando reporte:', err);
      showNotification({
        type: 'error',
        title: 'Error al generar reporte',
        message: err.message || 'Intenta nuevamente o contacta al administrador.',
        duration: 5000
      });
    } finally {
      setIsGeneratingReport(false);
    }
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
          showNotification({
            type: 'error',
            title: 'Error al abrir caja',
            message: 'No se puede abrir la caja. Contacte al administrador.',
            duration: 5000
          });
          return;
        }
        showNotification({
          type: 'success',
          title: 'Caja abierta exitosamente',
          message: `Saldo inicial: C$${data.totalAmount.toFixed(2)}`,
          duration: 4000
        });
      } else {
        // Cerrar caja
        if (cajaActual && cajaActual.estado === 'abierta') {
          const result = await cerrarCaja(cajaActual.id, data.totalAmount, 'Cierre normal');
          console.log('Resultado de cerrar caja:', result);
        } else {
          showNotification({
            type: 'error',
            title: 'Error al cerrar caja',
            message: 'No hay caja abierta para cerrar.',
            duration: 5000
          });
          return;
        }
        
        // Cerrar modal primero
        setIsModalOpen(false);
        
        // Refrescar datos múltiples veces para asegurar actualización
        await refetchCajas();
        await new Promise(resolve => setTimeout(resolve, 500)); // Esperar 500ms
        await refetchCajas();
        await refetchPagos();
        
        showNotification({
          type: 'success',
          title: 'Caja cerrada exitosamente',
          message: `Saldo final: C$${data.totalAmount.toFixed(2)}`,
          duration: 4000
        });
      }
      
      // Refrescar datos (para apertura)
      if (data.type === "open") {
        await refetchCajas();
        await refetchPagos();
        setIsModalOpen(false);
      }
      
    } catch (err) {
      console.error('Error al gestionar caja:', err);
      
      // Intentar extraer mensaje del error
      let errorMessage = err.message;
      try {
        const errorData = JSON.parse(err.message);
        if (errorData.mensaje) {
          errorMessage = errorData.mensaje;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (e) {
        // Si no es JSON, usar el mensaje tal cual
      }
      
      setError(errorMessage);
      showNotification({
        type: 'error',
        title: 'Error',
        message: errorMessage,
        duration: 6000
      });
      
      setIsModalOpen(false); // Cerrar modal en caso de error
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

      {cajaActual?.estado === 'cerrada' && (
        <div style={{ 
          padding: '1.5rem', 
          background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', 
          borderRadius: '12px', 
          marginBottom: '1.5rem',
          border: '2px solid #3b82f6',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#1e40af', margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>
            📅 Nuevo Día
          </h3>
          <p style={{ color: '#1e3a8a', margin: 0, fontSize: '1rem' }}>
            La caja está cerrada. Los datos del día anterior están guardados en el historial.
            <br />
            <strong>Abre una nueva caja para comenzar el día.</strong>
          </p>
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
          <button className="cashier-btn shadow open" onClick={() => openModal("open")} disabled={loading}>
            <DollarSign size={20} />
            <span>Abrir Caja</span>
          </button>
          <button className="cashier-btn shadow close" onClick={() => openModal("close")} disabled={loading}>
            <DollarSign size={20} />
            <span>Cerrar Caja</span>
          </button>
          <button
            className="cashier-btn report shadow"
            onClick={handleOpenReportModal}
            disabled={loading || isGeneratingReport}
          >
            <Banknote size={20} />
            <span>{isGeneratingReport ? 'Generando...' : 'Reporte de Caja'}</span>
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
              <div 
                key={pago.id || idx} 
                className="cashier-transaction"
                onClick={() => handleTransactionClick(pago)}
                style={{ cursor: 'pointer' }}
              >
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
        expectedAmount={saldoActual}
      />

      {notification && (
        <Notification
          type={notification.type}
          title={notification.title}
          message={notification.message}
          onClose={hideNotification}
          duration={notification.duration}
        />
      )}

      <TransactionDetailModal
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
        transaction={selectedTransaction}
      />

      <ReportDateModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onGenerate={handleGenerateReport}
        availableData={pagos || []}
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
