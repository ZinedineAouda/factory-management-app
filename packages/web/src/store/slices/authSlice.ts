import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { User, LoginCredentials, RegisterData, AuthResponse } from '@factory-app/shared';
import { ApiEndpoints } from '../../api/endpoints-override';
import { extractErrorMessage } from '../../api/axiosInstance';
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
  user: null,
  token: null,
  isAuthenticated: false,
  loading: true, // Start with loading true to prevent premature redirects
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
      // Use helper to safely extract error message
      const errorMessage = extractErrorMessage(error) || 'Login failed';
      return rejectWithValue(errorMessage);
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (data: RegisterData, { rejectWithValue }) => {
    try {
      const response = await axios.post<any>(ApiEndpoints.AUTH.REGISTER, data);
      // Backend may not return token for pending users
      if (response.data.token && response.data.user) {
        // User is approved, save auth
        saveAuth(response.data.token, response.data.user);
        return response.data;
      } else if (response.data.user) {
        // Registration successful but pending approval (no token)
        // Don't save to localStorage since user can't log in yet
        return {
          user: response.data.user,
          token: null,
          message: response.data.message,
        };
      }
      return response.data;
    } catch (error: any) {
      // Use helper to safely extract error message
      const errorMessage = extractErrorMessage(error) || 'Registration failed';
      return rejectWithValue(errorMessage);
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  clearAuth();
});

export const loadStoredAuth = createAsyncThunk('auth/loadStored', async (_, { rejectWithValue }) => {
  const token = localStorage.getItem('token');
  const user = getStoredUser();
  
  if (token && user) {
    // Validate token with backend
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : 'http://localhost:3000/api');
      await axios.get(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Token is valid
    return { token, user };
    } catch (error) {
      // Token is invalid, clear it
      clearAuth();
      return rejectWithValue('Token expired or invalid');
    }
  }
  // No token found
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
      // Use helper to safely extract error message
      const errorMessage = extractErrorMessage(error) || 'Failed to refresh user';
      return rejectWithValue(errorMessage);
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
        state.token = action.payload.token || null;
        // Only set authenticated if token exists (user is approved)
        state.isAuthenticated = !!action.payload.token;
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
      .addCase(loadStoredAuth.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadStoredAuth.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.user = action.payload.user;
          state.token = action.payload.token;
          state.isAuthenticated = true;
        } else {
          // No stored auth found
          state.isAuthenticated = false;
          state.user = null;
          state.token = null;
        }
      })
      .addCase(loadStoredAuth.rejected, (state) => {
        // Token was invalid, clear everything
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      })
      .addCase(refreshUser.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(refreshUser.rejected, (_state, action) => {
        // Handle refresh user error - don't clear auth, just log
        const payload = action.payload;
        if (typeof payload === 'string') {
          console.error('Failed to refresh user:', payload);
        } else if (payload && typeof payload === 'object') {
          console.error('Failed to refresh user:', (payload as any).message || (payload as any).error || String(payload));
        }
        // Don't set error state for refresh failures - user might still be valid
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
