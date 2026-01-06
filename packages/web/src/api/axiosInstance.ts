import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

/**
 * Safely extracts error message from any error object
 */
export const extractErrorMessage = (error: any): string => {
  if (typeof error === 'string') {
    return error;
  }

  if (error?.response?.data) {
    // Backend returned an error response
    return error.response.data.error || 
           error.response.data.message || 
           'An error occurred';
  }

  if (error?.request) {
    // Request made but no response (network error, CORS, etc.)
    return error.message || 'Network error. Please check your connection.';
  }

  if (error?.message) {
    return error.message;
  }

  // Fallback: convert to string
  return String(error || 'An error occurred');
};

/**
 * Centralized axios instance with error normalization
 */
const createAxiosInstance = (): AxiosInstance => {
  const API_BASE_URL = import.meta.env.VITE_API_URL || 
                       (import.meta.env.DEV ? '/api' : 'http://localhost:3000/api');

  const instance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor - Add auth token
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = localStorage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error: AxiosError) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor - Normalize errors to always return Error with string message
  instance.interceptors.response.use(
    (response) => response,
    (error: AxiosError | any) => {
      // Extract error message safely
      const errorMessage = extractErrorMessage(error);

      // Create normalized error with string message
      const normalizedError = new Error(errorMessage);
      
      // Preserve original error for debugging (non-enumerable)
      Object.defineProperty(normalizedError, 'originalError', {
        value: error,
        enumerable: false,
        writable: false,
      });

      // Preserve response for error handling
      if (error?.response) {
        Object.defineProperty(normalizedError, 'response', {
          value: error.response,
          enumerable: false,
          writable: false,
        });
      }

      return Promise.reject(normalizedError);
    }
  );

  return instance;
};

// Export singleton instance
export const apiClient = createAxiosInstance();

// Export default for convenience
export default apiClient;

