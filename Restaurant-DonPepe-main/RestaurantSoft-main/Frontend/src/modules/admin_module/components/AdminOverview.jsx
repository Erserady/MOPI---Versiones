import React, { useState, useEffect } from "react";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Plus, 
  Trash2, 
  Table as TableIcon,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  RefreshCw
} from "lucide-react";
import "../styles/admin_overview.css";
import AdminCards from "./AdminCards";
import TransactionHistoryModal from "./TransactionHistoryModal";
import { useMetadata } from "../../../hooks/useMetadata";
import { getMesas, createMesa, deleteMesa } from "../../../services/waiterService";
import { getCajas, getFacturas, getPagos, getEgresos } from "../../../services/cashierService";
import { useDataSync } from "../../../hooks/useDataSync";

const AdminOverview = () => {
  const { data: adminMeta } = useMetadata("admin");
  const currencySymbol = adminMeta?.currency?.symbol || "C$";
  
  // Estados locales
  const [newTableNumber, setNewTableNumber] = useState("");
  const [newTableCapacity, setNewTableCapacity] = useState(4);
  const [isAddingTable, setIsAddingTable] = useState(false);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [mesaToDelete, setMesaToDelete] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  
  // Obtener datos en tiempo real (cada 5 segundos para reflejar cambios inmediatamente)
  const { data: mesas, loading: loadingMesas, refetch: refetchMesas } = useDataSync(getMesas, 5000);
  const { data: cajas, loading: loadingCajas, refetch: refetchCajas } = useDataSync(getCajas, 5000);
  const { data: facturas, loading: loadingFacturas } = useDataSync(getFacturas, 5000);
  const { data: pagos, loading: loadingPagos } = useDataSync(getPagos, 5000);
  const { data: egresos } = useDataSync(getEgresos, 5000);

  // Calcular métricas de caja con validación defensiva
  const cajaAbierta = cajas?.find(c => c.estado === 'abierta');
  const saldoInicial = parseFloat(cajaAbierta?.saldo_inicial || 0) || 0;
  
  // Filtrar pagos solo de la caja abierta actual Y después de su apertura
  // Si no hay caja abierta, mostrar 0
  const pagosHoy = cajaAbierta
    ? (pagos?.filter(p => {
        // Solo pagos de la caja abierta actual Y después de su apertura
        if (p.caja !== cajaAbierta.id) return false;
        
        // Verificar que el pago sea después de la apertura de esta caja
        const fechaPago = new Date(p.created_at);
        const fechaApertura = new Date(cajaAbierta.fecha_apertura);
        
        return fechaPago >= fechaApertura;
      }) || [])
    : [];
  
  // Filtrar egresos de la caja abierta actual
  const egresosHoy = cajaAbierta
    ? (egresos?.filter(e => {
        if (e.caja !== cajaAbierta.id) return false;
        
        const fechaEgreso = new Date(e.created_at);
        const fechaApertura = new Date(cajaAbierta.fecha_apertura);
        
        return fechaEgreso >= fechaApertura;
      }) || [])
    : [];
  
  // Combinar pagos y egresos para el modal de transacciones
  const todasLasTransacciones = [
    ...pagosHoy.map(p => ({ ...p, tipo: 'pago' })),
    ...egresosHoy.map(e => ({ ...e, tipo: 'egreso' }))
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  
  // Calcular ingresos por método de pago (solo si hay caja abierta)
  const ingresosEfectivo = cajaAbierta
    ? pagosHoy
        .filter(p => p.metodo_pago === 'efectivo')
        .reduce((sum, p) => sum + parseFloat(p.monto || 0), 0)
    : 0;
  
  const ingresosTarjeta = cajaAbierta
    ? pagosHoy
        .filter(p => p.metodo_pago === 'tarjeta')
        .reduce((sum, p) => sum + parseFloat(p.monto || 0), 0)
    : 0;
  
  // Calcular total de egresos del día
  const totalEgresos = cajaAbierta
    ? egresosHoy.reduce((sum, e) => sum + parseFloat(e.monto || 0), 0)
    : 0;
  
  // Efectivo neto (ventas en efectivo - egresos)
  const efectivoNeto = ingresosEfectivo - totalEgresos;
  
  // Total de ingresos menos egresos
  const totalIngresos = ingresosEfectivo + ingresosTarjeta - totalEgresos;
  
  // El saldo en caja solo incluye efectivo (tarjetas no están físicamente en caja)
  const saldoEnCaja = cajaAbierta
    ? parseFloat(saldoInicial) + parseFloat(ingresosEfectivo) - parseFloat(totalEgresos)
    : 0;
  // Ganancia total ya tiene los egresos restados en totalIngresos
  const gananciaTotal = parseFloat(totalIngresos);
  
  // Función helper para formatear moneda de forma segura
  const formatCurrency = (value) => {
    const num = parseFloat(value);
    if (isNaN(num)) return '0.00';
    return num.toFixed(2);
  };
  
  // Manejar agregar mesa
  const handleAddTable = async () => {
    if (!newTableNumber || newTableNumber.trim() === '') {
      setError('El número de mesa es requerido');
      return;
    }
    
    try {
      setError(null);
      setIsAddingTable(true);
      await createMesa({
        number: newTableNumber.trim(),
        capacity: parseInt(newTableCapacity) || 4,
        status: 'available'
      });
      setNewTableNumber('');
      setNewTableCapacity(4);
      await refetchMesas();
    } catch (err) {
      setError('Error al crear la mesa: ' + err.message);
    } finally {
      setIsAddingTable(false);
    }
  };
  
  // Manejar eliminar mesa - mostrar modal
  const handleDeleteTable = (mesa) => {
    setMesaToDelete(mesa);
    setShowDeleteModal(true);
  };
  
  // Confirmar eliminación de mesa
  const confirmDeleteTable = async () => {
    if (!mesaToDelete) return;
    
    // Guardar posición actual del scroll
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;
    
    try {
      setError(null);
      await deleteMesa(mesaToDelete.id);
      await refetchMesas();
      setShowDeleteModal(false);
      setMesaToDelete(null);
      
      // Restaurar posición del scroll después de eliminar
      setTimeout(() => {
        window.scrollTo(scrollX, scrollY);
      }, 0);
    } catch (err) {
      setError('Error al eliminar la mesa: ' + err.message);
      setShowDeleteModal(false);
      
      // Restaurar scroll incluso si hay error
      setTimeout(() => {
        window.scrollTo(scrollX, scrollY);
      }, 0);
    }
  };
  
  // Cancelar eliminación
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setMesaToDelete(null);
  };


  if (loadingMesas || loadingCajas) {
    return (
      <section className="admin-overview-new">
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <RefreshCw className="spin" size={40} />
          <p style={{ marginTop: '1rem', color: '#6b7280' }}>Cargando panel de administración...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="admin-overview-new">
      {/* Modal de Confirmación para Eliminar */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={cancelDelete}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-icon-danger">
                <Trash2 size={32} />
              </div>
              <h2 className="modal-title">¿Eliminar mesa?</h2>
            </div>
            <div className="modal-body">
              <p className="modal-message">
                ¿Estás seguro de que deseas eliminar la mesa <strong>{mesaToDelete?.number}</strong>?
              </p>
              <p className="modal-warning">
                Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn-modal-cancel" onClick={cancelDelete}>
                Cancelar
              </button>
              <button className="btn-modal-danger" onClick={confirmDeleteTable}>
                <Trash2 size={18} />
                Eliminar Mesa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="overview-header-new">
        <div>
          <h1 className="overview-title">Panel de Administración</h1>
          <p className="overview-subtitle">Gestiona las operaciones del restaurante</p>
        </div>
        <div className="header-status">
          <span className="status-badge">
            <span className="status-dot"></span>
            Sistema Activo
          </span>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* Sección de Ventas del Día */}
      <div className="section-container">
        <div className="section-header">
          <div className="section-title-group">
            <Wallet size={24} className="section-icon" />
            <h2 className="section-title">Ventas del Día</h2>
          </div>
          <button className="btn-refresh" onClick={refetchCajas} title="Actualizar">
            <RefreshCw size={16} />
          </button>
        </div>

        <div className="cash-flow-grid">
          {/* Saldo Inicial */}
          <div className="cash-card">
            <div className="cash-card-icon blue">
              <DollarSign size={24} />
            </div>
            <div className="cash-card-content">
              <p className="cash-card-label">Saldo Inicial</p>
              <h3 className="cash-card-value">{currencySymbol}{formatCurrency(saldoInicial)}</h3>
              <p className="cash-card-detail">Al apertura de caja</p>
            </div>
          </div>

          {/* Ingresos */}
          <div className="cash-card">
            <div className="cash-card-icon green">
              <ArrowUpRight size={24} />
            </div>
            <div className="cash-card-content">
              <p className="cash-card-label">Ingresos Hoy</p>
              <h3 className="cash-card-value success">{currencySymbol}{formatCurrency(totalIngresos)}</h3>
              <p className="cash-card-detail">
                💵 {currencySymbol}{formatCurrency(efectivoNeto)} | 
                💳 {currencySymbol}{formatCurrency(ingresosTarjeta)}
                {totalEgresos > 0 && <span style={{color: '#dc2626', fontSize: '0.85rem', display: 'block', marginTop: '0.25rem'}}>
                  (Ventas: {currencySymbol}{formatCurrency(ingresosEfectivo)} - Egresos: {currencySymbol}{formatCurrency(totalEgresos)})
                </span>}
              </p>
            </div>
          </div>

          {/* Egresos */}
          <div className="cash-card">
            <div className="cash-card-icon red">
              <ArrowDownRight size={24} />
            </div>
            <div className="cash-card-content">
              <p className="cash-card-label">Egresos Hoy</p>
              <h3 className="cash-card-value danger">{currencySymbol}{formatCurrency(totalEgresos)}</h3>
              <p className="cash-card-detail">Gastos operacionales</p>
            </div>
          </div>

          {/* Saldo en Caja (Solo Efectivo) - Clickeable */}
          <div 
            className="cash-card highlight clickable" 
            onClick={() => setShowHistoryModal(true)}
            style={{ cursor: 'pointer' }}
            title="Click para ver historial de transacciones"
          >
            <div className="cash-card-icon purple">
              <Wallet size={24} />
            </div>
            <div className="cash-card-content">
              <p className="cash-card-label">Saldo en Caja (Efectivo)</p>
              <h3 className="cash-card-value">{currencySymbol}{formatCurrency(saldoEnCaja)}</h3>
              <div className="cash-card-badge">
                {gananciaTotal >= 0 ? (
                  <>
                    <TrendingUp size={14} />
                    <span>+{currencySymbol}{formatCurrency(gananciaTotal)} total</span>
                  </>
                ) : (
                  <>
                    <TrendingDown size={14} />
                    <span>{currencySymbol}{formatCurrency(gananciaTotal)} total</span>
                  </>
                )}
              </div>
              <p className="cash-card-hint">Click para ver historial</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sección de Administración de Mesas */}
      <div className="section-container">
        <div className="section-header">
          <div className="section-title-group">
            <TableIcon size={24} className="section-icon" />
            <h2 className="section-title">Administración de Mesas</h2>
          </div>
          <span className="section-count">{mesas?.length || 0} mesas</span>
        </div>

        {/* Formulario para agregar mesa */}
        <div className="add-table-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="tableNumber">Número de Mesa</label>
              <input
                id="tableNumber"
                type="text"
                placeholder="Ej: A1, B2, 10"
                value={newTableNumber}
                onChange={(e) => setNewTableNumber(e.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="tableCapacity">Capacidad</label>
              <input
                id="tableCapacity"
                type="number"
                min="1"
                max="20"
                value={newTableCapacity}
                onChange={(e) => setNewTableCapacity(e.target.value)}
                className="form-input"
              />
            </div>
            <button 
              onClick={handleAddTable} 
              disabled={isAddingTable}
              className="btn-primary"
            >
              <Plus size={18} />
              {isAddingTable ? 'Agregando...' : 'Agregar Mesa'}
            </button>
          </div>
        </div>

        {/* Tabla de mesas */}
        {mesas && mesas.length > 0 ? (
          <div className="tables-table-container">
            <table className="tables-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Mesa</th>
                  <th>Capacidad</th>
                  <th>Estado</th>
                  <th className="actions-column">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {mesas.map((mesa) => (
                  <tr key={mesa.id} className="table-row">
                    <td className="table-id">#{mesa.id}</td>
                    <td className="table-number">
                      <div className="table-number-cell">
                        <TableIcon size={18} />
                        <span>Mesa {mesa.number}</span>
                      </div>
                    </td>
                    <td className="table-capacity">
                      <span className="capacity-badge">{mesa.capacity} personas</span>
                    </td>
                    <td className="table-status-cell">
                      <span className={`status-badge-table ${mesa.status}`}>
                        {mesa.status === 'available' ? 'Disponible' : 
                         mesa.status === 'occupied' ? 'Ocupada' : 'Reservada'}
                      </span>
                    </td>
                    <td className="table-actions">
                      <button 
                        onClick={() => handleDeleteTable(mesa)}
                        className="btn-delete-table"
                        title="Eliminar mesa"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <TableIcon size={48} strokeWidth={1.5} />
            <p>No hay mesas registradas</p>
            <small>Agrega la primera mesa usando el formulario superior</small>
          </div>
        )}
      </div>

      {/* Modal de Historial de Transacciones */}
      <TransactionHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        transactions={todasLasTransacciones}
        cajaInfo={cajaAbierta}
      />
    </section>
  );
};

export default AdminOverview;
