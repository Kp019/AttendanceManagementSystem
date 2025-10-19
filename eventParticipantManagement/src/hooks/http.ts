import axios from 'axios';
import { store } from '../store';
import { logout } from '../hooks/authActions';
import { supabase } from '../lib/supabase';

// Centralized Axios instance with auth and 401 handling
export const api = axios.create({
  baseURL: 'http://localhost:3001',
});

// Attach token on each request if present
api.interceptors.request.use(async (config) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    console.log(session, "session");
    if (session?.access_token) {
      config.headers = config.headers ?? {};
      config.headers['Authorization'] = `Bearer ${session.access_token}`;
    }
  } catch (error) {
    console.error('Error getting session for API request:', error);
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


