import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    if (!config.headers) {
      config.headers = {} as any;
    }
    // Safely assign header
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401: Unauthorized, 422: Unprocessable Entity (often JWT related in Flask)
    if (error.response?.status === 401 || error.response?.status === 422) {
      useAuthStore.getState().logout();
      // Only redirect if not already on login/register to avoid loops
      if (!window.location.hash.includes('login') && !window.location.hash.includes('register')) {
        window.location.href = '/#/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;