import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  // State
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,

  // Actions — wired up in Sprint 2
  login: async (_email, _password) => {
    // TODO: Sprint 2 — call POST /auth/login, store tokens, set user
  },

  register: async (_payload) => {
    // TODO: Sprint 2 — call POST /auth/register, store tokens, set user
  },

  logout: () => {
    // TODO: Sprint 2 — clear tokens + user, redirect
    set({ user: null, accessToken: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    // TODO: Sprint 2 — try refresh via stored refresh token, restore session
    set({ isLoading: false });
  },

  setAccessToken: (token) => {
    // TODO: Sprint 2 — used by refresh interceptor
    set({ accessToken: token });
  },
}));
