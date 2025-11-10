import http from "./httpClient";

const BASE = "/api/administrador";
const MESERO_MENU = "/api/mesero/menu/";

const normalizeDishPayload = (dish = {}) => ({
  nombre: dish.nombre,
  descripcion: dish.descripcion || "",
  categoria: dish.categoria,
  precio: dish.precio,
  disponible: dish.disponible ?? true,
  ingredientes: dish.ingredientes ?? "",
  tiempo_preparacion: dish.tiempo_preparacion ?? 15,
  orden: dish.orden ?? 0,
});

export const menuService = {
  fetchAdminMenu: () => http.get(`${BASE}/menu-completo/`),
  fetchPublicMenu: () => http.get(MESERO_MENU),
  fetchCategories: () => http.get(`${BASE}/categorias-menu/`),
  createDish: (payload) =>
    http.post(`${BASE}/platos/`, normalizeDishPayload(payload)),
  updateDish: (id, payload) =>
    http.patch(`${BASE}/platos/${id}/`, normalizeDishPayload(payload)),
  deleteDish: (id) => http.delete(`${BASE}/platos/${id}/`),
  createCategory: (payload) =>
    http.post(`${BASE}/categorias-menu/`, {
      nombre: payload.nombre,
      descripcion: payload.descripcion ?? "",
      orden: payload.orden ?? 0,
      activa: payload.activa ?? true,
    }),
  updateCategory: (id, payload) =>
    http.patch(`${BASE}/categorias-menu/${id}/`, {
      nombre: payload.nombre,
      descripcion: payload.descripcion ?? "",
      orden: payload.orden ?? 0,
      activa: payload.activa ?? true,
    }),
  deleteCategory: (id) => http.delete(`${BASE}/categorias-menu/${id}/`),
};

export default menuService;
