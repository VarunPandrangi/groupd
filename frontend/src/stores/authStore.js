import { create } from 'zustand';
import api from '../services/api';

export const useAuthStore = create((set, get) => ({
  // State
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,

  // Actions
  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    const { user, accessToken, refreshToken } = data.data;
    localStorage.setItem('refreshToken', refreshToken);
    set({ user, accessToken, isAuthenticated: true });
    return user;
  },

  register: async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    const { user, accessToken, refreshToken } = data.data;
    localStorage.setItem('refreshToken', refreshToken);
    set({ user, accessToken, isAuthenticated: true });
    return user;
  },

  logout: () => {
    localStorage.removeItem('refreshToken');
    set({ user: null, accessToken: null, isAuthenticated: false });
  },

  setAccessToken: (token) => {
    set({ accessToken: token });
  },

  checkAuth: async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      set({ isLoading: false });
      return;
    }

    try {
      // Refresh the access token
      const { data: refreshData } = await api.post('/auth/refresh', { refreshToken });
      const newAccessToken = refreshData.data.accessToken;
      set({ accessToken: newAccessToken });

      // Fetch user profile
      const { data: meData } = await api.get('/auth/me');
      set({
        user: meData.data.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      // Refresh failed — clear everything
      get().logout();
      set({ isLoading: false });
    }
  },
}));
