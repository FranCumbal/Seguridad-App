import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: inyectar token ──────────────────────
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('pm_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: manejar 401 globalmente ───────────
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('pm_token');
      localStorage.removeItem('pm_usuario');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
