/// <reference types="../types/global" />
// API Base URL configuration
// This will be overridden in web/mobile apps to use environment variables
// Default fallback for development

const getApiBaseUrl = (): string => {
  // For web apps, this will be overridden to use import.meta.env.VITE_API_URL
  // For mobile apps, this will use process.env.REACT_APP_API_URL
  // Fallback for shared package compilation
  if (typeof process !== 'undefined' && process.env) {
    return process.env.REACT_APP_API_URL || process.env.API_URL || 'http://localhost:3000/api';
  }
  return 'http://localhost:3000/api';
};

const API_BASE_URL = getApiBaseUrl();

export const ApiEndpoints = {
  // Auth
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
    REFRESH: `${API_BASE_URL}/auth/refresh`,
    LOGOUT: `${API_BASE_URL}/auth/logout`,
    VALIDATE_CODE: (code: string) => `${API_BASE_URL}/auth/validate-code/${code}`,
  },

  // Analytics
  ANALYTICS: {
    OVERVIEW: `${API_BASE_URL}/admin/analytics/overview`,
    EFFICIENCY: `${API_BASE_URL}/admin/analytics/efficiency`,
    PRIORITY_DISTRIBUTION: `${API_BASE_URL}/admin/analytics/priority-distribution`,
  },

  // Registration Codes
  REGISTRATION_CODES: {
    GENERATE: `${API_BASE_URL}/admin/registration-codes/generate`,
    LIST: `${API_BASE_URL}/admin/registration-codes`,
    REVOKE: (id: string) => `${API_BASE_URL}/admin/registration-codes/${id}/revoke`,
  },
} as const;
