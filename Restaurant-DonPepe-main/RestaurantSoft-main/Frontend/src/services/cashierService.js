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
  
  if (!res.ok) {
    let errorMessage = 'Error abriendo caja';
    try {
      const errorData = await res.json();
      if (errorData.mensaje) {
        errorMessage = errorData.mensaje;
      } else if (errorData.error) {
        errorMessage = errorData.error;
      }
    } catch (e) {
      errorMessage = `Error ${res.status}: ${res.statusText}`;
    }
    throw new Error(errorMessage);
  }
  
  return res.json();
}

export async function cerrarCaja(id, saldoFinal, observaciones = '') {
  const res = await apiFetch(`${API_BASE_URL}/api/caja/cajas/${id}/cerrar/`, {
    method: 'POST',
    body: JSON.stringify({ saldo_final: saldoFinal, observaciones }),
  });
  
  if (!res.ok) {
    // Intentar extraer mensaje de error del backend
    let errorMessage = 'Error cerrando caja';
    try {
      const errorData = await res.json();
      if (errorData.mensaje) {
        errorMessage = errorData.mensaje;
      } else if (errorData.error) {
        errorMessage = errorData.error;
      }
    } catch (e) {
      // Si no se puede parsear, usar mensaje genérico
      errorMessage = `Error ${res.status}: ${res.statusText}`;
    }
    throw new Error(errorMessage);
  }
  
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
  
  if (!res.ok) {
    let errorMessage = 'Error creando factura';
    try {
      const errorData = await res.json();
      console.error('Error del backend:', errorData);
      errorMessage = JSON.stringify(errorData);
    } catch (e) {
      errorMessage = `Error ${res.status}: ${res.statusText}`;
    }
    throw new Error(errorMessage);
  }
  
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
  
  if (!res.ok) {
    let errorMessage = 'Error creando pago';
    try {
      const errorData = await res.json();
      if (errorData.mensaje) {
        errorMessage = errorData.mensaje;
      } else if (errorData.error) {
        errorMessage = errorData.error;
      } else if (errorData.detail) {
        errorMessage = errorData.detail;
      }
      // Si hay errores de validación, concatenarlos
      if (typeof errorData === 'object' && !errorData.mensaje && !errorData.error) {
        const errors = Object.entries(errorData)
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
          .join('; ');
        if (errors) errorMessage = errors;
      }
    } catch (e) {
      errorMessage = `Error ${res.status}: ${res.statusText}`;
    }
    throw new Error(errorMessage);
  }
  
  return res.json();
}

// Mesas con órdenes pendientes
export async function getMesasConOrdenesPendientes() {
  const res = await apiFetch(`${API_BASE_URL}/api/caja/mesas-pendientes/`);
  if (!res.ok) throw new Error('Error obteniendo mesas pendientes');
  return res.json();
}

// Cierres de caja (historial)
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

// Obtener historial de una caja específica
export async function getHistorialCaja(cajaId) {
  const res = await apiFetch(`${API_BASE_URL}/api/caja/cierres/?caja=${cajaId}`);
  if (!res.ok) throw new Error('Error obteniendo historial de caja');
  return res.json();
}

// Menú (para ver precios al cobrar)
export async function getPlatos() {
  const res = await apiFetch(`${API_BASE_URL}/api/administrador/platos/`);
  if (!res.ok) throw new Error('Error obteniendo platos');
  return res.json();
}
