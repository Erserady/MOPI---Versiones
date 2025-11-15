import { API_BASE_URL, apiFetch } from '../config/api';

const extractErrorMessage = (data) => {
  if (!data) return null;
  if (typeof data === 'string') return data;
  if (data.error) return data.error;
  if (data.detail) return data.detail;
  if (data.message) return data.message;
  if (Array.isArray(data.non_field_errors) && data.non_field_errors.length > 0) {
    return data.non_field_errors[0];
  }

  const firstValue = Object.values(data).find(Boolean);
  if (Array.isArray(firstValue) && firstValue.length > 0) {
    return firstValue[0];
  }
  if (typeof firstValue === 'string') return firstValue;
  return null;
};

const handleResponse = async (res, fallbackMessage) => {
  let payload = null;
  if (res.status !== 204) {
    try {
      payload = await res.json();
    } catch (_err) {
      payload = null;
    }
  }

  if (!res.ok) {
    const message = extractErrorMessage(payload) || fallbackMessage;
    throw new Error(message);
  }

  return payload;
};

// Servicio completo para administraci��n de personal

export async function listStaff() {
  const res = await apiFetch(`${API_BASE_URL}/api/administrador/personal/`);
  const data = await handleResponse(res, 'Error obteniendo personal');
  return Array.isArray(data) ? data : [];
}

// Alias para compatibilidad
export const getStaff = listStaff;

export async function createStaff(payload) {
  const res = await apiFetch(`${API_BASE_URL}/api/administrador/personal/`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return handleResponse(res, 'Error creando personal');
}

export async function updateStaff(id, payload) {
  const res = await apiFetch(`${API_BASE_URL}/api/administrador/personal/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return handleResponse(res, 'Error actualizando personal');
}

export async function deleteStaff(id) {
  const res = await apiFetch(`${API_BASE_URL}/api/administrador/personal/${id}/`, {
    method: 'DELETE',
  });
  await handleResponse(res, 'Error eliminando personal');
  return true;
}

export async function getMeseros() {
  const res = await apiFetch(`${API_BASE_URL}/api/administrador/personal/meseros/`);
  return handleResponse(res, 'Error obteniendo meseros');
}

// Facturas
export async function getFacturas() {
  const res = await apiFetch(`${API_BASE_URL}/api/administrador/facturas/`);
  return handleResponse(res, 'Error obteniendo facturas');
}

export async function anularFactura(id, motivo) {
  const res = await apiFetch(`${API_BASE_URL}/api/administrador/facturas/${id}/anular/`, {
    method: 'POST',
    body: JSON.stringify({ motivo }),
  });
  return handleResponse(res, 'Error anulando factura');
}
