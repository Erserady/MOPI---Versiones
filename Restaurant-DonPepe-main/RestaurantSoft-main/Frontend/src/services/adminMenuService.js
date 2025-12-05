import { API_BASE_URL, apiFetch } from '../config/api';

// Servicio completo para administración del menú

// Categorías de Menú
export async function getCategorias() {
  const res = await apiFetch(`${API_BASE_URL}/api/administrador/categorias-menu/`);
  if (!res.ok) throw new Error('Error obteniendo categorías');
  return res.json();
}

export async function createCategoria(data) {
  const res = await apiFetch(`${API_BASE_URL}/api/administrador/categorias-menu/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error creando categoría');
  return res.json();
}

export async function updateCategoria(id, data) {
  const res = await apiFetch(`${API_BASE_URL}/api/administrador/categorias-menu/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error actualizando categoría');
  return res.json();
}

export async function deleteCategoria(id) {
  const res = await apiFetch(`${API_BASE_URL}/api/administrador/categorias-menu/${id}/`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Error eliminando categoría');
  return res.status === 204;
}

// Platos
export async function getPlatos(categoriaId = null) {
  const url = categoriaId 
    ? `${API_BASE_URL}/api/administrador/platos/?categoria_id=${categoriaId}`
    : `${API_BASE_URL}/api/administrador/platos/`;
  const res = await apiFetch(url);
  if (!res.ok) throw new Error('Error obteniendo platos');
  return res.json();
}

export async function createPlato(data) {
  const res = await apiFetch(`${API_BASE_URL}/api/administrador/platos/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error creando plato');
  return res.json();
}

export async function updatePlato(id, data) {
  const res = await apiFetch(`${API_BASE_URL}/api/administrador/platos/${id}/`, {
    method: 'PATCH', // Usar PATCH para actualización parcial
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Error actualizando plato: ${errorText}`);
  }
  return res.json();
}

export async function deletePlato(id) {
  const res = await apiFetch(`${API_BASE_URL}/api/administrador/platos/${id}/`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Error eliminando plato');
  return res.status === 204;
}

// Menú completo (categorías con sus platos)
export async function getMenuCompleto() {
  const res = await apiFetch(`${API_BASE_URL}/api/administrador/menu-completo/`);
  if (!res.ok) throw new Error('Error obteniendo menú completo');
  return res.json();
}

// Inventario
export async function getInventario() {
  const res = await apiFetch(`${API_BASE_URL}/api/administrador/inventario/`);
  if (!res.ok) throw new Error('Error obteniendo inventario');
  return res.json();
}

export async function getInventarioBajo() {
  const res = await apiFetch(`${API_BASE_URL}/api/administrador/inventario/bajos/`);
  if (!res.ok) throw new Error('Error obteniendo inventario bajo');
  return res.json();
}

export async function createInventario(data) {
  const res = await apiFetch(`${API_BASE_URL}/api/administrador/inventario/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error creando item de inventario');
  return res.json();
}

export async function updateInventario(id, data) {
  const res = await apiFetch(`${API_BASE_URL}/api/administrador/inventario/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error actualizando inventario');
  return res.json();
}

export async function ajustarStock(id, cantidad, motivo, tipo = 'ajuste') {
  const res = await apiFetch(`${API_BASE_URL}/api/administrador/inventario/${id}/ajustar_stock/`, {
    method: 'POST',
    body: JSON.stringify({ cantidad, motivo, tipo }),
  });
  if (!res.ok) throw new Error('Error ajustando stock');
  return res.json();
}

// Dashboard
export async function getDashboardData() {
  const res = await apiFetch(`${API_BASE_URL}/api/administrador/dashboard/`);
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const errJson = await res.json();
      detail = errJson?.error || errJson?.detail || detail;
    } catch {
      // sin cuerpo legible
    }
    throw new Error(`Error obteniendo datos del dashboard: ${detail}`);
  }
  return res.json();
}
