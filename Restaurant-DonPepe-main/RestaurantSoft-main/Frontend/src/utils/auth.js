/**
 * Utilidades de autenticación
 * Funciones helper para gestionar el usuario autenticado
 */

/**
 * Obtiene el usuario actual desde sessionStorage
 * @returns {Object|null} Usuario actual o null si no hay sesión
 */
export const getCurrentUser = () => {
  try {
    const userStr = sessionStorage.getItem("user");
    if (!userStr) return null;
    return JSON.parse(userStr);
  } catch (error) {
    console.error("Error al obtener usuario actual:", error);
    return null;
  }
};

/**
 * Obtiene el ID del usuario actual
 * @returns {number|null} ID del usuario o null
 */
export const getCurrentUserId = () => {
  const user = getCurrentUser();
  const userId = user?.id || null;
  console.log(`👤 getCurrentUserId llamado:`, { user, userId });
  return userId;
};

/**
 * Obtiene el nombre del usuario actual
 * @returns {string} Nombre del usuario o "Usuario"
 */
export const getCurrentUserName = () => {
  const user = getCurrentUser();
  
  // Priorizar full_name si existe
  if (user?.full_name) {
    return user.full_name;
  }
  
  // Construir nombre completo desde first_name y last_name
  const firstName = user?.first_name || '';
  const lastName = user?.last_name || '';
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
  
  if (fullName) {
    return fullName;
  }
  
  // Fallback a name, username o "Usuario"
  return user?.name || user?.username || "Usuario";
};

/**
 * Obtiene el rol del usuario actual
 * @returns {string|null} Rol del usuario o null
 */
export const getCurrentUserRole = () => {
  const user = getCurrentUser();
  return user?.role || null;
};

/**
 * Verifica si hay un usuario autenticado
 * @returns {boolean} true si hay sesión activa
 */
export const isAuthenticated = () => {
  return Boolean(sessionStorage.getItem("token") && sessionStorage.getItem("user"));
};

/**
 * Obtiene el rol activo elegido en el flujo de seleccion
 * @returns {string|null} Rol activo
 */
export const getActiveRole = () => {
  return sessionStorage.getItem("activeRole") || null;
};

/**
 * Define el rol activo (por ejemplo, cook/waiter/cashier/admin)
 * @param {string|null} role
 */
export const setActiveRole = (role) => {
  if (role) {
    sessionStorage.setItem("activeRole", role);
  } else {
    sessionStorage.removeItem("activeRole");
  }
};

/**
 * Guarda la etapa actual del flujo (login, area-selection, role-selected)
 * @param {string} stage
 */
export const setAuthStage = (stage) => {
  sessionStorage.setItem("authStage", stage);
};

/**
 * Obtiene la etapa actual del flujo de autenticacion
 * @returns {string|null}
 */
export const getAuthStage = () => {
  return sessionStorage.getItem("authStage");
};

/**
 * Limpia toda la informacion de sesion usada en el flujo
 */
export const clearAuthSession = () => {
  sessionStorage.removeItem("user");
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("activeRole");
  sessionStorage.removeItem("authStage");
};
