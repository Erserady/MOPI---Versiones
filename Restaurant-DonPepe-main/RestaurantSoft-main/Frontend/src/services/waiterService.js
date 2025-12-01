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

  if (!res.ok) {
    // Intentar extraer mensaje de error del backend
    let errorMessage = 'Error creando orden';
    try {
      const errorData = await res.json();
      if (errorData.mensaje) {
        errorMessage = errorData.mensaje;
      } else if (errorData.error) {
        errorMessage = errorData.error;
      } else if (errorData.detail) {
        errorMessage = errorData.detail;
      }
    } catch (e) {
      errorMessage = `Error ${res.status}: ${res.statusText}`;
    }
    throw new Error(errorMessage);
  }

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

// ============================================
// SOLICITUDES DE ELIMINACIÓN DE ITEMS
// ============================================

/**
 * Crear una solicitud de eliminación de item
 * El mesero solicita, el cajero debe autorizar
 * 
 * @param {string} orderId - ID de la orden
 * @param {number} itemIndex - Índice del item en el array de pedido
 * @param {string} razon - Razón de la eliminación
 * @param {string} solicitadoPor - Nombre del mesero que solicita
 * @returns {Promise} Solicitud creada
 */
export async function requestRemoveItem(orderId, itemIndex, razon, solicitadoPor) {
  const payload = {
    item_index: itemIndex,
    razon,
    solicitado_por: solicitadoPor,
    // cantidad_eliminar es opcional; backend lo usará para ajustar cantidad
    cantidad_eliminar: arguments.length > 4 ? arguments[4] : undefined,
  };

  // Probamos variantes de endpoint (guion, guion bajo, con/sin slash) para evitar 404 por configuraciones distintas.
  const endpoints = [
    `${API_BASE_URL}/api/mesero/mesero-orders/${orderId}/request-remove-item/`,
    `${API_BASE_URL}/api/mesero/mesero-orders/${orderId}/request-remove-item`,
    `${API_BASE_URL}/api/mesero/mesero-orders/${orderId}/request_remove_item/`,
    `${API_BASE_URL}/api/mesero/mesero-orders/${orderId}/request_remove_item`,
  ];

  let lastErrorMessage = 'Error creando solicitud de eliminacion';

  for (let i = 0; i < endpoints.length; i++) {
    const url = endpoints[i];
    const res = await apiFetch(url, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      return res.json();
    }

    try {
      const errorData = await res.json();
      lastErrorMessage =
        errorData.error ||
        errorData.detail ||
        errorData.message ||
        `Error ${res.status}: ${res.statusText}`;
    } catch (e) {
      lastErrorMessage = `Error ${res.status}: ${res.statusText}`;
    }

    // Si 404, intenta la siguiente variante; para otros errores sal pronto.
    if (res.status === 404 && i < endpoints.length - 1) {
      continue;
    }

    throw new Error(lastErrorMessage);
  }

  throw new Error(lastErrorMessage);
}

/**
 * Aprobar una solicitud de eliminación (cajero)
 * @param {string} requestId - ID de la solicitud
 * @param {string} autorizadoPor - Nombre del cajero que autoriza
 * @returns {Promise} Orden actualizada
 */
export async function approveRemoveItem(requestId, autorizadoPor) {
  const res = await apiFetch(
    `${API_BASE_URL}/api/cajero/remove-requests/${requestId}/approve/`,
    {
      method: 'POST',
      body: JSON.stringify({
        autorizado_por: autorizadoPor,
      }),
    }
  );

  if (!res.ok) {
    let errorMessage = 'Error aprobando solicitud';
    try {
      const errorData = await res.json();
      errorMessage = errorData.error || errorData.detail || errorMessage;
    } catch (e) {
      errorMessage = `Error ${res.status}: ${res.statusText}`;
    }
    throw new Error(errorMessage);
  }

  return res.json();
}

/**
 * Rechazar una solicitud de eliminación (cajero)
 * @param {string} requestId - ID de la solicitud
 * @param {string} rechazadoPor - Nombre del cajero que rechaza
 * @param {string} motivoRechazo - Razón del rechazo (opcional)
 * @returns {Promise} Solicitud actualizada
 */
export async function rejectRemoveItem(requestId, rechazadoPor, motivoRechazo = '') {
  const res = await apiFetch(
    `${API_BASE_URL}/api/cajero/remove-requests/${requestId}/reject/`,
    {
      method: 'POST',
      body: JSON.stringify({
        rechazado_por: rechazadoPor,
        motivo_rechazo: motivoRechazo,
      }),
    }
  );

  if (!res.ok) {
    let errorMessage = 'Error rechazando solicitud';
    try {
      const errorData = await res.json();
      errorMessage = errorData.error || errorData.detail || errorMessage;
    } catch (e) {
      errorMessage = `Error ${res.status}: ${res.statusText}`;
    }
    throw new Error(errorMessage);
  }

  return res.json();
}

/**
 * Obtener solicitudes de eliminación pendientes (cajero)
 * @returns {Promise<Array>} Lista de solicitudes pendientes
 */
export async function getPendingRemoveRequests() {
  const res = await apiFetch(`${API_BASE_URL}/api/cajero/remove-requests/pending/`);
  if (!res.ok) throw new Error('Error obteniendo solicitudes pendientes');
  return res.json();
}

/**
 * Obtener todas las solicitudes de eliminación de una orden
 * @param {string} orderId - ID de la orden
 * @returns {Promise<Array>} Lista de solicitudes (pendientes, aprobadas, rechazadas)
 */
export async function getOrderRemoveRequests(orderId) {
  const endpoints = [
    `${API_BASE_URL}/api/mesero/mesero-orders/${orderId}/remove-requests/`,
    `${API_BASE_URL}/api/mesero/mesero-orders/${orderId}/remove-requests`,
    `${API_BASE_URL}/api/mesero/mesero-orders/${orderId}/remove_requests/`,
    `${API_BASE_URL}/api/mesero/mesero-orders/${orderId}/remove_requests`,
  ];

  let lastError = 'Error obteniendo solicitudes de la orden';

  for (let i = 0; i < endpoints.length; i++) {
    const res = await apiFetch(endpoints[i]);
    if (res.ok) {
      return res.json();
    }

    try {
      const errData = await res.json();
      lastError = errData.error || errData.detail || lastError;
    } catch (e) {
      lastError = `Error ${res.status}: ${res.statusText}`;
    }

    if (res.status === 404 && i < endpoints.length - 1) {
      continue;
    }

    throw new Error(lastError);
  }

  throw new Error(lastError);
}
