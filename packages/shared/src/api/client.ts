import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

export class ApiClient {
  private client: AxiosInstance;

  constructor(baseURL?: string) {
    this.client = axios.create({
      baseURL: baseURL || (typeof process !== 'undefined' && process.env?.API_URL) || 'http://localhost:3000/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - Add auth token
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = this.getToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - Handle errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Handle token refresh or redirect to login
          this.handleUnauthorized();
        }
        return Promise.reject(error);
      }
    );
  }

  // Override this method in platform-specific implementations
  protected getToken(): string | null {
    // This should be implemented in mobile/web specific code
    return null;
  }

  // Override this method in platform-specific implementations
  protected handleUnauthorized(): void {
    // This should be implemented in mobile/web specific code
  }

  get instance(): AxiosInstance {
    return this.client;
  }
}
