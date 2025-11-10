import { API_BASE_URL, apiFetch } from '../config/api';

// Servicio completo para administración de personal

export async function listStaff() {
  const res = await apiFetch(`${API_BASE_URL}/api/administrador/personal/`);
  if (!res.ok) throw new Error('Error obteniendo personal');
  return res.json();
}

// Alias para compatibilidad
export const getStaff = listStaff;

export async function createStaff(payload) {
  const res = await apiFetch(`${API_BASE_URL}/api/administrador/personal/`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Error creando personal');
  return res.json();
}

export async function updateStaff(id, payload) {
  const res = await apiFetch(`${API_BASE_URL}/api/administrador/personal/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Error actualizando personal');
  return res.json();
}

export async function deleteStaff(id) {
  const res = await apiFetch(`${API_BASE_URL}/api/administrador/personal/${id}/`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Error eliminando personal');
  return res.status === 204;
}

export async function getMeseros() {
  const res = await apiFetch(`${API_BASE_URL}/api/administrador/personal/meseros/`);
  if (!res.ok) throw new Error('Error obteniendo meseros');
  return res.json();
}

// Facturas
export async function getFacturas() {
  const res = await apiFetch(`${API_BASE_URL}/api/administrador/facturas/`);
  if (!res.ok) throw new Error('Error obteniendo facturas');
  return res.json();
}

export async function anularFactura(id, motivo) {
  const res = await apiFetch(`${API_BASE_URL}/api/administrador/facturas/${id}/anular/`, {
    method: 'POST',
    body: JSON.stringify({ motivo }),
  });
  if (!res.ok) throw new Error('Error anulando factura');
  return res.json();
}
