import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// Auto redirect to login on 401
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (
      error.response?.status === 401 &&
      typeof window !== "undefined" &&
      !window.location.pathname.includes("/login")
    ) {
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;

// ── Auth ──────────────────────────────────────────
export const authApi = {
  login: (short_id: string, password: string) =>
    api.post("/api/auth/login", { short_id, password }),

  logout: () =>
    api.post("/api/auth/logout"),

  me: () =>
    api.get("/api/auth/me"),

  changePassword: (current_password: string, new_password: string) =>
    api.post("/api/auth/change-password", { current_password, new_password }),
};

// ── Dashboard ─────────────────────────────────────
export const dashboardApi = {
  kpis: () => api.get("/api/dashboard/kpis"),
};

// ── Applications ──────────────────────────────────
export const applicationsApi = {
  list: (params?: Record<string, unknown>) =>
    api.get("/api/applications", { params }),

  get: (id: string) =>
    api.get(`/api/applications/${id}`),

  approve: (id: string, reason: string) =>
    api.post(`/api/applications/${id}/approve`, { reason }),

  reject: (id: string, reason: string) =>
    api.post(`/api/applications/${id}/reject`, { reason }),

  exportCsv: () =>
    api.get("/api/applications/export/csv", { responseType: "blob" }),
};

// ── Watchlist ─────────────────────────────────────
export const watchlistApi = {
  list: (params?: Record<string, unknown>) =>
    api.get("/api/watchlist", { params }),

  add: (data: {
    nic_number: string;
    reason: string;
  }) => api.post("/api/watchlist", data),

  remove: (id: number) =>
    api.delete(`/api/watchlist/${id}`),

  exportCsv: () =>
    api.get("/api/watchlist/export/csv", { responseType: "blob" }),
};

// ── Users ─────────────────────────────────────────
export const usersApi = {
  list: (params?: Record<string, unknown>) =>
    api.get("/api/users", { params }),

  create: (data: Record<string, unknown>) =>
    api.post("/api/users", data),

  update: (employeeId: string, data: Record<string, unknown>) =>
    api.patch(`/api/users/${employeeId}`, data),

  delete: (employeeId: string) =>
    api.delete(`/api/users/${employeeId}`),
};