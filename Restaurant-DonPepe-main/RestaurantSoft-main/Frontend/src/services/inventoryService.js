import http from "./httpClient";

const BASE = "/api/administrador";

export const inventoryService = {
  fetchInventory: () => http.get(`${BASE}/inventario/`),
  createItem: (payload) => http.post(`${BASE}/inventario/`, payload),
  updateItem: (id, payload) => http.patch(`${BASE}/inventario/${id}/`, payload),
  deleteItem: (id) => http.delete(`${BASE}/inventario/${id}/`),
  adjustStock: (id, payload) =>
    http.post(`${BASE}/inventario/${id}/ajustar_stock/`, payload),
};

export default inventoryService;
