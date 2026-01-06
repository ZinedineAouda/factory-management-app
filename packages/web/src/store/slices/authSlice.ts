import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { User, LoginCredentials, RegisterData, AuthResponse } from '@factory-app/shared';
import { ApiEndpoints } from '../../api/endpoints-override';
import axios from 'axios';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

// Helper functions for localStorage
const saveAuth = (token: string, user: User) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
};

const clearAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

const getStoredUser = (): User | null => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

const initialState: AuthState = {
  user: getStoredUser(),
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,
  error: null,
};

// Mock functions removed - using real backend now

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const response = await axios.post<AuthResponse>(ApiEndpoints.AUTH.LOGIN, credentials);
      saveAuth(response.data.token, response.data.user);
      return response.data;
    } catch (error: any) {
      // Handle different error structures
      let errorMessage: string = 'Login failed';
      
      if (error.response?.data) {
        // Backend returned an error response
        errorMessage = error.response.data.error || error.response.data.message || errorMessage;
      } else if (error.request) {
        // Request made but no response (network error, CORS, etc.)
        errorMessage = error.message || 'Network error. Please check your connection.';
      } else {
        // Error in request setup
        errorMessage = error.message || errorMessage;
      }
      
      // Ensure we always return a string
      return rejectWithValue(typeof errorMessage === 'string' ? errorMessage : String(errorMessage));
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (data: RegisterData, { rejectWithValue }) => {
    try {
      const response = await axios.post<AuthResponse>(ApiEndpoints.AUTH.REGISTER, data);
      saveAuth(response.data.token, response.data.user);
      return response.data;
    } catch (error: any) {
      // Handle different error structures
      let errorMessage: string = 'Registration failed';
      
      if (error.response?.data) {
        // Backend returned an error response
        errorMessage = error.response.data.error || error.response.data.message || errorMessage;
      } else if (error.request) {
        // Request made but no response (network error, CORS, etc.)
        errorMessage = error.message || 'Network error. Please check your connection.';
      } else {
        // Error in request setup
        errorMessage = error.message || errorMessage;
      }
      
      // Ensure we always return a string
      return rejectWithValue(typeof errorMessage === 'string' ? errorMessage : String(errorMessage));
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  clearAuth();
});

export const loadStoredAuth = createAsyncThunk('auth/loadStored', async () => {
  const token = localStorage.getItem('token');
  const user = getStoredUser();
  
  if (token && user) {
    return { token, user };
  }
  return null;
});

// Refresh user data from backend
export const refreshUser = createAsyncThunk(
  'auth/refreshUser',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const token = state.auth.token;
      
      if (!token) {
        return rejectWithValue('No token available');
      }

      // Use /me endpoint to get current user data
      const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : 'http://localhost:3000/api');
      const meResponse = await axios.get(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const updatedUser = meResponse.data;
      saveAuth(token, updatedUser);
      return updatedUser;
    } catch (error: any) {
      // Handle different error structures
      let errorMessage: string = 'Failed to refresh user';
      
      if (error.response?.data) {
        // Backend returned an error response
        errorMessage = error.response.data.error || error.response.data.message || errorMessage;
      } else if (error.request) {
        // Request made but no response (network error, CORS, etc.)
        errorMessage = error.message || 'Network error. Please check your connection.';
      } else {
        // Error in request setup
        errorMessage = error.message || errorMessage;
      }
      
      // Ensure we always return a string
      return rejectWithValue(typeof errorMessage === 'string' ? errorMessage : String(errorMessage));
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        const payload = action.payload;
        if (typeof payload === 'string') {
          state.error = payload;
        } else if (payload && typeof payload === 'object') {
          // Handle error objects with various structures
          state.error = (payload as any).message || (payload as any).error || String(payload) || 'Login failed';
        } else {
          state.error = 'Login failed';
        }
      })
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        const payload = action.payload;
        if (typeof payload === 'string') {
          state.error = payload;
        } else if (payload && typeof payload === 'object') {
          // Handle error objects with various structures
          state.error = (payload as any).message || (payload as any).error || String(payload) || 'Registration failed';
        } else {
          state.error = 'Registration failed';
        }
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      })
      .addCase(loadStoredAuth.fulfilled, (state, action) => {
        if (action.payload) {
          state.user = action.payload.user;
          state.token = action.payload.token;
          state.isAuthenticated = true;
        }
      })
      .addCase(refreshUser.fulfilled, (state, action) => {
        state.user = action.payload;
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
