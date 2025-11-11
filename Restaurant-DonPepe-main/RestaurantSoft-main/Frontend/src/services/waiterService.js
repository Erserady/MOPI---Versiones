import { API_BASE_URL, apiFetch } from '../config/api';

// Servicio completo para módulo de mesero

// Mesas
export async function getMesas() {
  const res = await apiFetch(`${API_BASE_URL}/api/mesero/tables/`);
  if (!res.ok) throw new Error('Error obteniendo mesas');
  return res.json();
}

export async function getMesa(id) {
  const res = await apiFetch(`${API_BASE_URL}/api/mesero/tables/${id}/`);
  if (!res.ok) throw new Error('Error obteniendo mesa');
  return res.json();
}

export async function createMesa(data) {
  const res = await apiFetch(`${API_BASE_URL}/api/mesero/tables/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error creando mesa');
  return res.json();
}

export async function updateMesa(id, data) {
  const res = await apiFetch(`${API_BASE_URL}/api/mesero/tables/${id}/`, {
    method: 'PATCH',  // Cambiar a PATCH para actualización parcial
    body: JSON.stringify(data),
  });
  
  if (!res.ok) {
    // Intentar obtener mensaje de error del backend
    let errorMessage = 'Error actualizando mesa';
    try {
      const errorData = await res.json();
      console.error('Error del backend al actualizar mesa:', errorData);
      errorMessage = errorData.error || errorData.detail || JSON.stringify(errorData);
    } catch (e) {
      errorMessage = `Error ${res.status}: ${res.statusText}`;
    }
    throw new Error(errorMessage);
  }
  
  return res.json();
}

export async function deleteMesa(id) {
  const res = await apiFetch(`${API_BASE_URL}/api/mesero/tables/${id}/`, {
    method: 'DELETE',
  });
  
  if (!res.ok) {
    // Intentar obtener mensaje de error del backend
    let errorMessage = 'Error eliminando mesa';
    try {
      const errorData = await res.json();
      errorMessage = errorData.error || errorData.detail || errorMessage;
    } catch (e) {
      // Si no hay JSON, usar mensaje por defecto
    }
    throw new Error(errorMessage);
  }
  
  return res.status === 204 || res.status === 200;
}

// Órdenes de mesero
export async function getOrdenes() {
  const res = await apiFetch(`${API_BASE_URL}/api/mesero/mesero-orders/`);
  if (!res.ok) throw new Error('Error obteniendo órdenes');
  return res.json();
}

export async function getOrdenesAbiertas() {
  const res = await apiFetch(`${API_BASE_URL}/api/mesero/mesero-orders/open/`);
  if (!res.ok) throw new Error('Error obteniendo órdenes abiertas');
  return res.json();
}

export async function createOrden(data) {
  const res = await apiFetch(`${API_BASE_URL}/api/mesero/mesero-orders/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error creando orden');
  return res.json();
}

export async function updateOrden(id, data) {
  const res = await apiFetch(`${API_BASE_URL}/api/mesero/mesero-orders/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error actualizando orden');
  return res.json();
}

export async function deleteOrden(id) {
  const res = await apiFetch(`${API_BASE_URL}/api/mesero/mesero-orders/${id}/`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Error eliminando orden');
  return res.status === 204;
}

// Menú (para que el mesero pueda ver los platos disponibles)
export async function getMenuDisponible() {
  const res = await apiFetch(`${API_BASE_URL}/api/administrador/menu-completo/`);
  if (!res.ok) throw new Error('Error obteniendo menú');
  return res.json();
}

export async function getPlatos() {
  const res = await apiFetch(`${API_BASE_URL}/api/administrador/platos/`);
  if (!res.ok) throw new Error('Error obteniendo platos');
  return res.json();
}
