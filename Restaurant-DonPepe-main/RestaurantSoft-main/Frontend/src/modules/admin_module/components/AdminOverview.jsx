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
import { getOrden } from "../../../services/cookService";
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
  const [showMesaModal, setShowMesaModal] = useState(false);
  const [selectedMesa, setSelectedMesa] = useState(null);
  const [orderDetail, setOrderDetail] = useState(null);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [orderError, setOrderError] = useState(null);
  
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

  const openMesaModal = (mesa) => {
    setSelectedMesa(mesa);
    setShowMesaModal(true);
    setOrderDetail(null);
    setOrderError(null);

    const orderId =
      mesa.current_order_id ||
      mesa.currentOrderId ||
      mesa.orderId ||
      mesa.order_identifier ||
      null;

    // Solo intentar cargar si está ocupada y tenemos id
    if (orderId && mesa.status && mesa.status.toLowerCase().includes("ocup")) {
      setLoadingOrder(true);
      getOrden(orderId)
        .then((data) => {
          setOrderDetail(data);
          setLoadingOrder(false);
        })
        .catch((err) => {
          setOrderError(err.message || "No se pudo cargar el pedido");
          setLoadingOrder(false);
        });
    }
  };

  const closeMesaModal = () => {
    setShowMesaModal(false);
    setSelectedMesa(null);
    setOrderDetail(null);
    setOrderError(null);
  };

  const getMesaStatus = (status) => {
    const normalized = (status || "").toLowerCase();
    const map = {
      available: { label: "Libre", className: "available" },
      libre: { label: "Libre", className: "available" },
      occupied: { label: "Ocupada", className: "occupied" },
      ocupada: { label: "Ocupada", className: "occupied" },
      reserved: { label: "Reservada", className: "reserved" },
      reservada: { label: "Reservada", className: "reserved" },
    };
    return map[normalized] || map.available;
  };

  // Orden ascendente por número de mesa (maneja números y texto)
  const mesasOrdenadas = (mesas || []).slice().sort((a, b) =>
    String(a.number || "").localeCompare(String(b.number || ""), undefined, { numeric: true, sensitivity: "base" })
  );


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
        {mesasOrdenadas.length > 0 ? (
          <div className="admin-tables-grid">
            {mesasOrdenadas.map((mesa) => {
              const statusInfo = getMesaStatus(mesa.status);
              return (
                <div
                  key={mesa.id}
                  className={`admin-table-card ${statusInfo.className}`}
                  title={`Mesa ${mesa.number} · ${statusInfo.label}`}
                  onClick={() => openMesaModal(mesa)}
                >
                  <div className="admin-table-dot" />
                  <button
                    className="admin-table-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTable(mesa);
                    }}
                    title="Eliminar mesa"
                  >
                    <Trash2 size={14} />
                  </button>
                  <div className="admin-table-number-big">
                    {mesa.number}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <TableIcon size={48} strokeWidth={1.5} />
            <p>No hay mesas registradas</p>
            <small>Agrega la primera mesa usando el formulario superior</small>
          </div>
        )}
      </div>

      {/* Modal de detalles de mesa */}
      {showMesaModal && selectedMesa && (
        <div className="modal-overlay" onClick={closeMesaModal}>
          <div className="modal-content modal-content-soft" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header modal-header-soft">
              <div className="modal-icon-info soft">
                <TableIcon size={28} />
              </div>
              <div className="modal-title-stack">
                <h2 className="modal-title">Mesa {selectedMesa.number}</h2>
                <p className="modal-subtitle">Detalles rapidos de la mesa</p>
              </div>
            </div>
            <div className="modal-body modal-body-left">
              <div className="mesa-detail-row">
                <span className="mesa-detail-label">Estado</span>
                <span className={`mesa-detail-badge ${getMesaStatus(selectedMesa.status).className}`}>
                  {getMesaStatus(selectedMesa.status).label}
                </span>
              </div>
              <div className="mesa-detail-row">
                <span className="mesa-detail-label">Capacidad</span>
                <span className="mesa-detail-value">{selectedMesa.capacity || 0} personas</span>
              </div>
              {selectedMesa.status && selectedMesa.status.toLowerCase().includes('ocup') && (
                <>
                  <div className="mesa-detail-row">
                    <span className="mesa-detail-label">Mesero asignado</span>
                    <span className="mesa-detail-value">
                      {selectedMesa.waiter_name || selectedMesa.assigned_waiter || selectedMesa.assignedWaiter || selectedMesa.mesero || "No asignado"}
                    </span>
                  </div>
                  <div className="mesa-detail-row">
                    <span className="mesa-detail-label">Orden activa</span>
                    <span className="mesa-detail-value">
                      {selectedMesa.order_identifier || selectedMesa.orderId || selectedMesa.current_order_id || selectedMesa.currentOrderId || selectedMesa.current_order || "Sin pedido activo"}
                    </span>
                  </div>
                </>
              )}

              {selectedMesa.status && selectedMesa.status.toLowerCase().includes('ocup') && (
                <div className="mesa-order-panel">
                  <div className="mesa-order-header">
                    <span className="mesa-order-title">Pedido activo</span>
                    {orderDetail?.estado && (
                      <span className={`mesa-order-status ${orderDetail.estado}`}>
                        {orderDetail.estado.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>

                  {loadingOrder && (
                    <div className="mesa-order-loading">
                      <RefreshCw className="spin" size={18} />
                      <span>Cargando pedido...</span>
                    </div>
                  )}

                  {orderError && !loadingOrder && (
                    <div className="mesa-order-error">
                      {orderError}
                    </div>
                  )}

                  {!loadingOrder && !orderError && (
                    <div className="mesa-order-list">
                      {(orderDetail?.items || orderDetail?.detalles || []).map((item, idx) => {
                        const listo = item.listo_en_cocina ?? item.listo ?? false;
                        return (
                          <div key={item.id || item.uid || idx} className="mesa-order-item">
                            <div className="mesa-order-item-main">
                              <span className="mesa-order-item-name">{item.nombre_platillo || item.nombre || item.item || "Platillo"}</span>
                              <span className={`mesa-order-chip ${listo ? "listo" : "en-proceso"}`}>
                                {listo ? "Listo" : "En cocina"}
                              </span>
                            </div>
                            <div className="mesa-order-item-sub">
                              <span>Cantidad: {item.cantidad || item.quantity || 1}</span>
                              {item.nota && <span className="mesa-order-note">Nota: {item.nota}</span>}
                            </div>
                          </div>
                        );
                      })}

                      {(orderDetail?.items || orderDetail?.detalles || []).length === 0 && (
                        <div className="mesa-order-empty">
                          No hay platillos cargados para este pedido.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-modal-cancel" onClick={closeMesaModal}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

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
