import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { config } from '../config/env';

export const useApiClient = () => {
  const makeRequest = useCallback(async (
    endpoint: string,
    options: RequestInit = {}
  ) => {
    try {
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession();
      
      const url = `${config.apiUrl}${endpoint}`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
      };

      // Add authorization header if user is authenticated
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }, []);

  const get = useCallback((endpoint: string) => 
    makeRequest(endpoint, { method: 'GET' }), [makeRequest]);

  const post = useCallback((endpoint: string, data?: unknown) => 
    makeRequest(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }), [makeRequest]);

  const put = useCallback((endpoint: string, data?: unknown) => 
    makeRequest(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }), [makeRequest]);

  const del = useCallback((endpoint: string) => 
    makeRequest(endpoint, { method: 'DELETE' }), [makeRequest]);

  const uploadFile = useCallback(async (
    endpoint: string,
    file: File,
    additionalData?: Record<string, unknown>
  ) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const url = `${config.apiUrl}${endpoint}`;
      const formData = new FormData();
      
      formData.append('csvFile', file);
      
      if (additionalData) {
        Object.entries(additionalData).forEach(([key, value]) => {
          formData.append(key, String(value));
        });
      }

      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('File upload failed:', error);
      throw error;
    }
  }, []);

  return {
    get,
    post,
    put,
    delete: del,
    uploadFile,
  };
};
