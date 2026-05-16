import { create } from 'zustand';
import { authApi } from '@/infrastructure/api/services';

interface Usuario {
  id: number;
  username: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: string;
}

interface AuthState {
  usuario: Usuario | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  restore: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  usuario: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,

  login: async (username, password) => {
    set({ isLoading: true });
    try {
      const res = await authApi.login(username, password);
      const { token, usuario } = res.data.data;
      localStorage.setItem('pm_token', token);
      localStorage.setItem('pm_usuario', JSON.stringify(usuario));
      set({ token, usuario, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try { await authApi.logout(); } catch {}
    localStorage.removeItem('pm_token');
    localStorage.removeItem('pm_usuario');
    set({ token: null, usuario: null, isAuthenticated: false });
  },

  restore: () => {
    const token = localStorage.getItem('pm_token');
    const usuarioRaw = localStorage.getItem('pm_usuario');
    if (token && usuarioRaw) {
      try {
        const usuario = JSON.parse(usuarioRaw);
        set({ token, usuario, isAuthenticated: true });
      } catch {}
    }
  },
}));
