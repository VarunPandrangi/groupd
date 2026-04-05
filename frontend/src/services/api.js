import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach access token when present
api.interceptors.request.use(
  (config) => {
    try {
      const token = useAuthStore.getState()?.accessToken;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Store not initialized yet — proceed without token
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — 401 handling stub (full refresh flow in Sprint 3)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      console.log('Token refresh needed');
    }
    return Promise.reject(error);
  }
);

export default api;
