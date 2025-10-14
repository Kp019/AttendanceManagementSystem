import axios from 'axios';
import { store } from '../store';
import { logout } from '../store/slices/authSlice';

// Centralized Axios instance with auth and 401 handling
export const api = axios.create({
  baseURL: 'http://localhost:3001',
});

// Attach token on each request if present
api.interceptors.request.use((config) => {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    config.headers = config.headers ?? {};
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally: clear auth and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      // Dispatch logout to reset state and clear token
      store.dispatch(logout());
      // Hard redirect to login to avoid stale route state
      if (typeof window !== 'undefined') {
        window.location.replace('/login');
      }
    }
    return Promise.reject(error);
  }
);

export default api;


