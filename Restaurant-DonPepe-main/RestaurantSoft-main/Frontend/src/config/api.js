/**
 * Configuración de la API
 * Detecta automáticamente si estamos en desarrollo o producción
 */

// Obtener la URL base de la API desde variables de entorno
// En desarrollo: http://localhost:8000
// En producción: la URL configurada en Render (VITE_API_URL)
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Configuración de endpoints
export const API_ENDPOINTS = {
  // Autenticación
  login: `${API_BASE_URL}/api/users/login/`,
  verifyPin: `${API_BASE_URL}/api/users/verify-pin/`,
  
  // Usuarios
  usersByRole: (role) => `${API_BASE_URL}/api/users/by-role/?role=${role}`,
  
  // Agregar más endpoints según sea necesario
};

// Configuración de headers por defecto
export const getDefaultHeaders = () => ({
  'Content-Type': 'application/json',
});

// Helper para hacer peticiones fetch
export const apiFetch = async (url, options = {}) => {
  const defaultOptions = {
    headers: getDefaultHeaders(),
  };

  const finalOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...(options.headers || {}),
    },
  };

  try {
    const response = await fetch(url, finalOptions);
    return response;
  } catch (error) {
    console.error('Error en la petición API:', error);
    throw error;
  }
};

export default {
  API_BASE_URL,
  API_ENDPOINTS,
  apiFetch,
};
