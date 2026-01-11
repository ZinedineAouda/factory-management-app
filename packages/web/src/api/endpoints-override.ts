// Override API endpoints to use Vite environment variables
// Use relative URL in development (Vite proxy) or absolute URL from env
const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  
  // Development mode - use proxy
  if (import.meta.env.DEV) {
    console.log('🔧 [DEBUG] Development mode: Using proxy API at /api');
    return '/api';
  }
  
  // Production mode
  console.log('🔧 [DEBUG] Production mode detected');
  console.log('🔧 [DEBUG] VITE_API_URL from env:', envUrl);
  
  if (envUrl) {
    // Remove trailing slashes
    let url = envUrl.trim().replace(/\/+$/, '');
    console.log('🔧 [DEBUG] After trimming:', url);
    
    // If it doesn't start with http:// or https://, add https://
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
      console.log('🔧 [DEBUG] Added https://:', url);
    }
    
    // Ensure /api is included in the base URL
    if (!url.endsWith('/api')) {
      url = `${url}/api`;
      console.log('🔧 [DEBUG] Added /api suffix:', url);
    }
    
    console.log('✅ [DEBUG] Final API_BASE_URL:', url);
    return url;
  }
  
  // Fallback - log error in production
  if (import.meta.env.PROD) {
    console.error('❌ CRITICAL: VITE_API_URL not set in production!');
    console.error('Please set VITE_API_URL in Vercel environment variables.');
    console.error('Expected format: https://your-backend.up.railway.app/api');
    // Return empty string to cause obvious failures rather than silent localhost calls
    return '';
  }
  
  // Development fallback
  return '/api';
};

const API_BASE_URL = getApiBaseUrl();
console.log('🔧 [DEBUG] API_BASE_URL initialized to:', API_BASE_URL);

// Re-export with correct base URL
export const ApiEndpoints = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
    REFRESH: `${API_BASE_URL}/auth/refresh`,
    LOGOUT: `${API_BASE_URL}/auth/logout`,
    VALIDATE_CODE: (code: string) => `${API_BASE_URL}/auth/validate-code/${code}`,
    CHECK_USERNAME: (username: string) => `${API_BASE_URL}/auth/check-username/${encodeURIComponent(username)}`,
  },
  REGISTRATION_CODES: {
    GENERATE: `${API_BASE_URL}/admin/registration-codes/generate`,
    LIST: `${API_BASE_URL}/admin/registration-codes`,
    DELETE: (id: string) => `${API_BASE_URL}/admin/registration-codes/${id}`,
    REVOKE: (id: string) => `${API_BASE_URL}/admin/registration-codes/${id}/revoke`,
  },
  USERS: {
    LIST: `${API_BASE_URL}/auth/users`,
    PENDING: `${API_BASE_URL}/auth/users/pending`,
    APPROVE: (id: string) => `${API_BASE_URL}/auth/users/${id}/approve`,
    UPDATE_GROUP: (id: string) => `${API_BASE_URL}/auth/users/${id}/group`,
    UPDATE_ROLE: (id: string) => `${API_BASE_URL}/auth/users/${id}/role`,
    UPDATE_USERNAME: (id: string) => `${API_BASE_URL}/auth/users/${id}/username`,
    UPDATE_PASSWORD: (id: string) => `${API_BASE_URL}/auth/users/${id}/password`,
    STATISTICS: (id: string) => `${API_BASE_URL}/auth/users/${id}/statistics`,
    DELETE: (id: string) => `${API_BASE_URL}/auth/users/${id}`,
  },
  GROUPS: {
    LIST: `${API_BASE_URL}/groups`,
    CREATE: `${API_BASE_URL}/groups`,
    UPDATE: (id: string) => `${API_BASE_URL}/groups/${id}`,
    DELETE: (id: string) => `${API_BASE_URL}/groups/${id}`,
  },
  PRODUCTS: {
    LIST: `${API_BASE_URL}/products`,
    CREATE: `${API_BASE_URL}/products`,
    UPDATE: (id: string) => `${API_BASE_URL}/products/${id}`,
    DELETE: (id: string) => `${API_BASE_URL}/products/${id}`,
  },
  PRODUCT_DELIVERIES: {
    CREATE: `${API_BASE_URL}/product-deliveries`,
    LIST: `${API_BASE_URL}/product-deliveries`,
    MY_DELIVERIES: `${API_BASE_URL}/product-deliveries/my-deliveries`,
    BY_PRODUCT: (productId: string) => `${API_BASE_URL}/product-deliveries/product/${productId}`,
  },
  ANALYTICS: {
    PRODUCTION: `${API_BASE_URL}/analytics/production`,
    MAINTENANCE: `${API_BASE_URL}/analytics/maintenance`,
    PERSONAL: `${API_BASE_URL}/analytics/personal`,
    GROUPS: `${API_BASE_URL}/analytics/groups`,
    PRODUCT: (productId: string) => `${API_BASE_URL}/analytics/product/${productId}`,
    DELIVERY_DROPS: `${API_BASE_URL}/analytics/delivery-drops`,
    KPIS: `${API_BASE_URL}/analytics/kpis`,
    REFRESH: `${API_BASE_URL}/analytics/refresh`,
  },
  PROFILE: {
    GET: (id: string) => `${API_BASE_URL}/profiles/${id}`,
    UPDATE: (id: string) => `${API_BASE_URL}/profiles/${id}`,
  },
  REPORTS: {
    CREATE: `${API_BASE_URL}/reports`,
    LIST: `${API_BASE_URL}/reports`,
    DETAIL: (id: string) => `${API_BASE_URL}/reports/${id}`,
    ADD_COMMENT: (id: string) => `${API_BASE_URL}/reports/${id}/comments`,
    MARK_SOLVED: (id: string) => `${API_BASE_URL}/reports/${id}/solve`,
    LINK_TO_DROP: (reportId: string) => `${API_BASE_URL}/reports/${reportId}/link-to-drop`,
  },
  REPORTS_PAGE: {
    LIST: `${API_BASE_URL}/reports`,
  },
  SHIFTS: {
    LIST: `${API_BASE_URL}/shifts`,
    CREATE: `${API_BASE_URL}/shifts`,
    UPDATE: (id: string) => `${API_BASE_URL}/shifts/${id}`,
    DELETE: (id: string) => `${API_BASE_URL}/shifts/${id}`,
    DETAIL: (id: string) => `${API_BASE_URL}/shifts/${id}`,
  },
  ROLE_PERMISSIONS: {
    LIST: `${API_BASE_URL}/role-permissions`,
    GET: (role: string) => `${API_BASE_URL}/role-permissions/${role}`,
    CREATE: `${API_BASE_URL}/role-permissions`,
    UPDATE: (role: string) => `${API_BASE_URL}/role-permissions/${role}`,
    DELETE: (role: string) => `${API_BASE_URL}/role-permissions/${role}`,
  },
  SETTINGS: {
    PREFERENCES: `${API_BASE_URL}/settings/preferences`,
    CHANGE_PASSWORD: `${API_BASE_URL}/settings/password`,
    CHANGE_USERNAME: `${API_BASE_URL}/settings/username`,
  },
  NOTIFICATIONS: {
    LIST: `${API_BASE_URL}/notifications`,
    UNREAD_COUNT: `${API_BASE_URL}/notifications/unread-count`,
    MARK_READ: (id: string) => `${API_BASE_URL}/notifications/${id}/read`,
    MARK_ALL_READ: `${API_BASE_URL}/notifications/read-all`,
  },
  ACTIVITY_LOG: {
    LIST: `${API_BASE_URL}/activity-log`,
  },
} as const;
