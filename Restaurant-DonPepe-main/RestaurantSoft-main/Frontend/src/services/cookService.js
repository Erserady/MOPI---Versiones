import { API_BASE_URL, apiFetch } from '../config/api';

// Servicio completo para módulo de cocina

// Órdenes de cocina
export async function getOrdenesCocina() {
  const res = await apiFetch(`${API_BASE_URL}/api/cocina/orders/`);
  if (!res.ok) throw new Error('Error obteniendo órdenes de cocina');
  return res.json();
}

export async function getOrdenesActivas() {
  const res = await apiFetch(`${API_BASE_URL}/api/cocina/orders/kitchen/`);
  if (!res.ok) throw new Error('Error obteniendo órdenes activas');
  return res.json();
}

export async function getOrden(id) {
  const res = await apiFetch(`${API_BASE_URL}/api/cocina/orders/${id}/`);
  if (!res.ok) throw new Error('Error obteniendo orden');
  return res.json();
}

export async function createOrdenCocina(data) {
  const res = await apiFetch(`${API_BASE_URL}/api/cocina/orders/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error creando orden de cocina');
  return res.json();
}

export async function updateOrdenCocina(id, data) {
  const res = await apiFetch(`${API_BASE_URL}/api/cocina/orders/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error actualizando orden de cocina');
  return res.json();
}

export async function cambiarEstadoOrden(id, nuevoEstado) {
  const res = await apiFetch(`${API_BASE_URL}/api/cocina/orders/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify({ estado: nuevoEstado }),
  });
  if (!res.ok) throw new Error('Error cambiando estado de orden');
  return res.json();
}

export async function deleteOrdenCocina(id) {
  const res = await apiFetch(`${API_BASE_URL}/api/cocina/orders/${id}/`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Error eliminando orden');
  return res.status === 204;
}

// Menú/Recetas (para que cocina vea las recetas)
export async function getRecetas() {
  const res = await apiFetch(`${API_BASE_URL}/api/administrador/platos/`);
  if (!res.ok) throw new Error('Error obteniendo recetas');
  return res.json();
}

export async function getReceta(id) {
  const res = await apiFetch(`${API_BASE_URL}/api/administrador/platos/${id}/`);
  if (!res.ok) throw new Error('Error obteniendo receta');
  return res.json();
}
