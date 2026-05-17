import apiClient from './client';

// =============================================
// AUTH SERVICE
// =============================================
export const authApi = {
  login: (username: string, password: string) =>
    apiClient.post('/auth/login', { username, password }),

  logout: () =>
    apiClient.post('/auth/logout'),

  me: () =>
    apiClient.get('/auth/me'),
};

// =============================================
// ENTREVISTADORES SERVICE
// =============================================
export const entrevistadoresApi = {
  getAll: () =>
    apiClient.get('/entrevistadores'),

  getById: (id: number) =>
    apiClient.get(`/entrevistadores/${id}`),

  create: (data: FormData) =>
    apiClient.post('/entrevistadores', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  update: (id: number, data: FormData) =>
    apiClient.put(`/entrevistadores/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  delete: (id: number) =>
    apiClient.delete(`/entrevistadores/${id}`),
};

// =============================================
// ENTREVISTAS SERVICE
// =============================================
export const entrevistasApi = {
  getAll: (params?: { search?: string; estado?: string; page?: number; limit?: number }) =>
    apiClient.get('/entrevistas', { params }),

  getById: (id: number) =>
    apiClient.get(`/entrevistas/${id}`),

  create: (data: { entrevistadorIds: number[]; observaciones_iniciales?: string }) =>
    apiClient.post('/entrevistas', data),

  delete: (id: number) =>
    apiClient.delete(`/entrevistas/${id}`),

  // Secciones
  saveDatosPersonales: (id: number, data: any) =>
    apiClient.put(`/entrevistas/${id}/datos-personales`, data),

  // Dentro de const entrevistasApi = { ...
  
  saveFamilia: (id: number, payload: any) =>
    apiClient.put(`/entrevistas/${id}/familia`, payload),

  saveEstudios: (id: number, estudios: any[]) =>
    apiClient.put(`/entrevistas/${id}/estudios`, { estudios }),

  saveFinanzas: (id: number, data: any) =>
    apiClient.put(`/entrevistas/${id}/finanzas`, data),

  saveHistorialLaboral: (id: number, trabajos: any[]) =>
    apiClient.put(`/entrevistas/${id}/historial-laboral`, { trabajos }),

  saveDrogasAlcohol: (id: number, data: any) =>
    apiClient.put(`/entrevistas/${id}/drogas-alcohol`, data),

  saveJudicial: (id: number, data: any) =>
    apiClient.put(`/entrevistas/${id}/judicial`, data),

  saveInfiltracion: (id: number, data: any) =>
    apiClient.put(`/entrevistas/${id}/infiltracion`, data),

  saveValidaciones: (id: number, data: any) =>
    apiClient.put(`/entrevistas/${id}/validaciones`, data),
};

// =============================================
// ESTADÍSTICAS SERVICE
// =============================================
export const estadisticasApi = {
  dashboard: () =>
    apiClient.get('/estadisticas/dashboard'),
};

// =============================================
// USUARIOS SERVICE
// =============================================
export const usuariosApi = {
  getAll: () =>
    apiClient.get('/usuarios'),

  create: (data: any) =>
    apiClient.post('/usuarios', data),

  update: (id: number, data: any) =>
    apiClient.put(`/usuarios/${id}`, data),

  delete: (id: number) =>
    apiClient.delete(`/usuarios/${id}`),
};
