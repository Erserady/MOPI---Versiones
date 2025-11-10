import http from "./httpClient";

const BASE = "/api/administrador";

export const dashboardService = {
  fetchAdminSummary: () => http.get(`${BASE}/dashboard/`),
};

export default dashboardService;
