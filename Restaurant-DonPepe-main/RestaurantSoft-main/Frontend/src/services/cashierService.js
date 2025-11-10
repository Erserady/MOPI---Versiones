import { API_BASE_URL, apiFetch } from '../config/api';

// Servicio completo para módulo de caja

// Cajas
export async function getCajas() {
  const res = await apiFetch(`${API_BASE_URL}/api/caja/cajas/`);
  if (!res.ok) throw new Error('Error obteniendo cajas');
  return res.json();
}

export async function getCaja(id) {
  const res = await apiFetch(`${API_BASE_URL}/api/caja/cajas/${id}/`);
  if (!res.ok) throw new Error('Error obteniendo caja');
  return res.json();
}

export async function abrirCaja(id, saldoInicial) {
  const res = await apiFetch(`${API_BASE_URL}/api/caja/cajas/${id}/abrir/`, {
    method: 'POST',
    body: JSON.stringify({ saldo_inicial: saldoInicial }),
  });
  if (!res.ok) throw new Error('Error abriendo caja');
  return res.json();
}

export async function cerrarCaja(id, saldoFinal, observaciones = '') {
  const res = await apiFetch(`${API_BASE_URL}/api/caja/cajas/${id}/cerrar/`, {
    method: 'POST',
    body: JSON.stringify({ saldo_final: saldoFinal, observaciones }),
  });
  if (!res.ok) throw new Error('Error cerrando caja');
  return res.json();
}

// Facturas
export async function getFacturas() {
  const res = await apiFetch(`${API_BASE_URL}/api/caja/facturas/`);
  if (!res.ok) throw new Error('Error obteniendo facturas');
  return res.json();
}

export async function getFactura(id) {
  const res = await apiFetch(`${API_BASE_URL}/api/caja/facturas/${id}/`);
  if (!res.ok) throw new Error('Error obteniendo factura');
  return res.json();
}

export async function createFactura(data) {
  const res = await apiFetch(`${API_BASE_URL}/api/caja/facturas/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error creando factura');
  return res.json();
}

// Pagos
export async function getPagos() {
  const res = await apiFetch(`${API_BASE_URL}/api/caja/pagos/`);
  if (!res.ok) throw new Error('Error obteniendo pagos');
  return res.json();
}

export async function createPago(data) {
  const res = await apiFetch(`${API_BASE_URL}/api/caja/pagos/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error creando pago');
  return res.json();
}

// Mesas con órdenes pendientes
export async function getMesasConOrdenesPendientes() {
  const res = await apiFetch(`${API_BASE_URL}/api/caja/mesas-pendientes/`);
  if (!res.ok) throw new Error('Error obteniendo mesas pendientes');
  return res.json();
}

// Cierres de caja
export async function getCierresCaja() {
  const res = await apiFetch(`${API_BASE_URL}/api/caja/cierres/`);
  if (!res.ok) throw new Error('Error obteniendo cierres de caja');
  return res.json();
}

export async function getCierreCaja(id) {
  const res = await apiFetch(`${API_BASE_URL}/api/caja/cierres/${id}/`);
  if (!res.ok) throw new Error('Error obteniendo cierre de caja');
  return res.json();
}

// Menú (para ver precios al cobrar)
export async function getPlatos() {
  const res = await apiFetch(`${API_BASE_URL}/api/administrador/platos/`);
  if (!res.ok) throw new Error('Error obteniendo platos');
  return res.json();
}
