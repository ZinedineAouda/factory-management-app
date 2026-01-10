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
  // Get API URL from environment variable
  const envUrl = import.meta.env.VITE_API_URL;
  
  // Development mode - use proxy
  if (import.meta.env.DEV) {
    const API_BASE_URL = '/api';
    console.log('🔧 Development mode: Using proxy API at', API_BASE_URL);
    
    const instance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // Add interceptors and return
    return setupInterceptors(instance);
  }
  
  // Production mode - MUST have VITE_API_URL set
  if (!envUrl) {
    const errorMsg = '❌ CRITICAL: VITE_API_URL environment variable is not set in production!';
    console.error(errorMsg);
    console.error('Please set VITE_API_URL in your Vercel environment variables.');
    console.error('Example: https://your-backend.up.railway.app/api');
    
    // Still create instance but log error - let the app fail gracefully
    // This prevents silent failures
    const instance = axios.create({
      baseURL: '/api', // Fallback to relative path (will fail but be obvious)
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    return setupInterceptors(instance);
  }
  
  // Process production URL
  let url = envUrl.trim().replace(/\/+$/, '');
  
  // Ensure protocol
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }
  
  // Ensure /api suffix
  if (!url.endsWith('/api')) {
    url = `${url}/api`;
  }
  
  const API_BASE_URL = url;
  console.log('🌐 Production mode: Using API at', API_BASE_URL);
  
  const instance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  return setupInterceptors(instance);
};

/**
 * Setup request/response interceptors
 */
const setupInterceptors = (instance: AxiosInstance): AxiosInstance => {

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

