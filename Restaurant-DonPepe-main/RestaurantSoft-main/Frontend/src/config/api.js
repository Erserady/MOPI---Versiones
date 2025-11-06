/**
 * Configuracion de la API
 * Detecta automaticamente si estamos en desarrollo o produccion
 */

// Obtener la URL base de la API desde variables de entorno
// En desarrollo: http://localhost:8000
// En produccion: la URL configurada en Render (VITE_API_URL)
const rawBaseUrl =
  import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.trim().length > 0
    ? import.meta.env.VITE_API_URL
    : "http://localhost:8000";

// Normalizamos para evitar dobles '/' al construir los endpoints
export const API_BASE_URL = rawBaseUrl.replace(/\/+$, "");

// Configuracion de endpoints
export const API_ENDPOINTS = {
  // Autenticacion
  login: `${API_BASE_URL}/api/users/login/`,
  verifyPin: `${API_BASE_URL}/api/users/verify-pin/`,

  // Usuarios
  usersByRole: (role) => `${API_BASE_URL}/api/users/by-role/?role=${role}`,

  // Agregar mas endpoints segun sea necesario
};

// Configuracion de headers por defecto
export const getDefaultHeaders = () => ({
  Accept: "application/json",
  "Content-Type": "application/json",
});

// Helper para hacer peticiones fetch
export const apiFetch = async (url, options = {}) => {
  const defaultOptions = {
    headers: getDefaultHeaders(),
    mode: "cors",
    credentials: "include",
    cache: "no-store",
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
    console.error("Error en la peticion API:", error);
    throw new Error(
      "No se pudo conectar con el backend. Verifica que la URL sea correcta y que el servicio este activo."
    );
  }
};

export default {
  API_BASE_URL,
  API_ENDPOINTS,
  apiFetch,
};
