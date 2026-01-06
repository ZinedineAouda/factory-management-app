# 🔍 React Error #31: Production Login Crash Debugging Guide

## What is React Error #31?

**React Error #31** means: **"Objects are not valid as a React child"**

In production builds, React shows: `"Minified React error #31: object with keys {code, message}"`

### Why It Happens in Production

- **Development**: React shows detailed error messages and warnings
- **Production**: React code is minified/compressed, so errors are simplified to numbered codes
- **Error #31** specifically means you're trying to render an object directly in JSX

---

## Root Cause in Login Flow

### The Problem Pattern

When a login fails, the backend returns an error object like:
```json
{
  "error": "Invalid credentials"
}
```

OR (if network fails):
```javascript
{
  code: "ERR_NETWORK",
  message: "Network Error"
}
```

If your React code tries to render this object directly:
```jsx
{error && <div>{error}</div>}  // ❌ CRASHES if error is an object
```

React cannot render objects—only primitives (strings, numbers, JSX elements).

---

## Code Examples That Cause This Error

### ❌ BAD: Direct Object Rendering

```jsx
// Component
const LoginPage = () => {
  const [error, setError] = useState(null);

  const handleLogin = async () => {
    try {
      await axios.post('/api/auth/login', credentials);
    } catch (err) {
      setError(err.response?.data);  // ❌ Setting entire error object
    }
  };

  return (
    <div>
      {error && <Alert>{error}</Alert>}  // ❌ CRASH: error is {code, message}
    </div>
  );
};
```

### ❌ BAD: Incomplete Error Extraction

```jsx
catch (error) {
  setError(error.response?.data?.error || error);  // ❌ Falls back to error object
}

// Later in JSX:
{error && <div>{error}</div>}  // ❌ If data.error is undefined, error object is rendered
```

### ✅ GOOD: Always Extract String

```jsx
catch (error) {
  // Always extract a string message
  const errorMessage = 
    error.response?.data?.error || 
    error.response?.data?.message || 
    error.message || 
    'Login failed';
  
  setError(errorMessage);  // ✅ Always a string
}

// JSX:
{error && <Alert>{error}</Alert>}  // ✅ Safe: error is always a string
```

---

## Best Practice: Safe Error Handling

### Pattern 1: Axios Error Handling

```javascript
const handleLogin = async (credentials) => {
  try {
    const response = await axios.post('/api/auth/login', credentials);
    return response.data;
  } catch (error) {
    // Handle different error types
    let errorMessage = 'Login failed';
    
    if (error.response?.data) {
      // Backend returned error response (401, 400, etc.)
      errorMessage = error.response.data.error || 
                     error.response.data.message || 
                     errorMessage;
    } else if (error.request) {
      // Request sent but no response (network error, CORS)
      errorMessage = error.message || 'Network error. Check connection.';
    } else {
      // Request setup failed
      errorMessage = error.message || errorMessage;
    }
    
    // Ensure string
    return Promise.reject(typeof errorMessage === 'string' 
      ? errorMessage 
      : String(errorMessage));
  }
};
```

### Pattern 2: Redux Thunk Error Handling

```javascript
export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/auth/login', credentials);
      return response.data;
    } catch (error) {
      let errorMessage = 'Login failed';
      
      if (error.response?.data) {
        errorMessage = error.response.data.error || errorMessage;
      } else if (error.request) {
        errorMessage = error.message || 'Network error';
      } else {
        errorMessage = error.message || errorMessage;
      }
      
      // Always return string
      return rejectWithValue(typeof errorMessage === 'string' 
        ? errorMessage 
        : String(errorMessage));
    }
  }
);

// Reducer
const authSlice = createSlice({
  // ...
  extraReducers: (builder) => {
    builder
      .addCase(login.rejected, (state, action) => {
        const payload = action.payload;
        
        // Defensive: ensure string
        if (typeof payload === 'string') {
          state.error = payload;
        } else if (payload && typeof payload === 'object') {
          state.error = payload.message || payload.error || String(payload);
        } else {
          state.error = 'Login failed';
        }
      });
  }
});
```

### Pattern 3: Safe Rendering in Components

```jsx
const LoginPage = () => {
  const { error, loading } = useSelector((state) => state.auth);

  return (
    <form>
      {error && (
        <Alert severity="error">
          {typeof error === 'string' 
            ? error 
            : (error?.message || error?.error || 'An error occurred')}
        </Alert>
      )}
      {/* Rest of form */}
    </form>
  );
};
```

---

## Deployment Issues That Trigger This Error

### 1. **Wrong API URL (CORS/Network Error)**

**Symptom**: Network error object `{code: "ERR_NETWORK", message: "..."}`

**Fix**: Set correct `VITE_API_URL` in Vercel environment variables:
```
VITE_API_URL=https://your-backend.railway.app/api
```

**Check**: Network tab shows `CORS error` or `Failed to fetch`

---

### 2. **Backend Not Running**

**Symptom**: `{code: "ERR_CONNECTION_REFUSED", message: "..."}`

**Fix**: Verify Railway backend is running and URL is correct

---

### 3. **Backend Returns Wrong Error Format**

**Bad Backend Response**:
```json
{
  "code": 401,
  "message": "Invalid credentials"
}
```

**Good Backend Response**:
```json
{
  "error": "Invalid credentials"
}
```

**Fix**: Standardize backend error responses (see backend fixes below)

---

### 4. **Missing Environment Variable**

**Symptom**: Frontend uses `undefined` API URL, causing network errors

**Fix**: 
- Add `VITE_API_URL` to Vercel project settings
- Redeploy after adding env vars

---

## Debugging Checklist (Browser DevTools)

### Step 1: Check Network Tab

1. Open DevTools → **Network** tab
2. Try to log in
3. Find the `/auth/login` request
4. Check:
   - **Status**: Is it `200`, `401`, `500`, or `CORS error`?
   - **Response**: Click request → **Preview** tab
     - If object: `{code: "...", message: "..."}` → This is the problem
     - If string/undefined: Check frontend code

### Step 2: Check Console Tab

1. Look for:
   - Red error messages
   - Network errors (`ERR_NETWORK`, `ERR_CONNECTION_REFUSED`)
   - CORS errors

### Step 3: Check React State

1. Open DevTools → **React DevTools** (if installed)
2. Or add temporary `console.log`:
   ```javascript
   console.log('Error state:', error, typeof error);
   ```
3. If `typeof error === 'object'` → This is the bug

### Step 4: Check Redux State (if using Redux)

1. Install Redux DevTools extension
2. Check `auth.error` in state
3. If it's an object → Fix reducer

### Step 5: Test Error Handling

1. Temporarily break API URL to trigger network error
2. Check if app crashes or shows error message
3. If crashes → Error handling is broken

---

## Frontend Fixes (Complete Solution)

### Fix 1: Auth Slice (Redux)

```typescript
// packages/web/src/store/slices/authSlice.ts

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const response = await axios.post<AuthResponse>(
        ApiEndpoints.AUTH.LOGIN, 
        credentials
      );
      return response.data;
    } catch (error: any) {
      // Handle different error structures
      let errorMessage: string = 'Login failed';
      
      if (error.response?.data) {
        // Backend returned error response
        errorMessage = error.response.data.error || 
                       error.response.data.message || 
                       errorMessage;
      } else if (error.request) {
        // Network error (CORS, connection refused, etc.)
        errorMessage = error.message || 'Network error. Please check your connection.';
      } else {
        // Request setup error
        errorMessage = error.message || errorMessage;
      }
      
      // Always return string
      return rejectWithValue(
        typeof errorMessage === 'string' 
          ? errorMessage 
          : String(errorMessage)
      );
    }
  }
);

// Reducer with defensive handling
const authSlice = createSlice({
  // ...
  extraReducers: (builder) => {
    builder
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        const payload = action.payload;
        
        // Defensive: handle any payload type
        if (typeof payload === 'string') {
          state.error = payload;
        } else if (payload && typeof payload === 'object') {
          state.error = (payload as any).message || 
                        (payload as any).error || 
                        String(payload) || 
                        'Login failed';
        } else {
          state.error = 'Login failed';
        }
      });
  }
});
```

### Fix 2: Login Component

```tsx
// packages/web/src/pages/auth/LoginPage.tsx

const LoginPage: React.FC = () => {
  const { error, loading } = useSelector((state: RootState) => state.auth);

  return (
    <Box>
      {/* Safe error rendering */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {typeof error === 'string' 
            ? error 
            : (error?.message || error?.error || 'An error occurred')}
        </Alert>
      )}
      
      {/* Rest of login form */}
    </Box>
  );
};
```

### Fix 3: Axios Interceptor (Global Error Handler)

```typescript
// packages/web/src/api/axiosInstance.ts

import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Response interceptor to normalize errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Extract error message
    const errorMessage = 
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'An error occurred';

    // Create new error with string message
    const normalizedError = new Error(
      typeof errorMessage === 'string' ? errorMessage : String(errorMessage)
    );
    
    // Preserve original error for debugging
    (normalizedError as any).originalError = error;
    
    return Promise.reject(normalizedError);
  }
);

export default api;
```

---

## Backend Fixes

### Fix 1: Standardize Error Responses

```typescript
// backend/src/middleware/errorHandler.ts

export const errorHandler = (
  err: any,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  console.error('Error:', err);

  // Always return consistent format
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(status).json({
    error: message,  // ✅ Always use "error" key, always string
  });
};
```

### Fix 2: Auth Route Error Handling

```typescript
// backend/src/routes/auth.ts

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        error: 'Username and password required'  // ✅ String, not object
      });
    }

    const user = await findUserByUsername(username);
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ 
        error: 'Invalid credentials'  // ✅ String
      });
    }

    // Success...
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Login failed'  // ✅ String, not error object
    });
  }
});
```

### Fix 3: CORS Configuration

```typescript
// backend/src/index.ts

const allowedOrigins = [
  'http://localhost:3001',
  'https://your-frontend.vercel.app'  // ✅ Add Vercel URL
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

---

## Testing Your Fixes

### Test 1: Network Error
```javascript
// Temporarily break API URL
const API_URL = 'https://wrong-url.com/api';
// Should show: "Network error. Please check your connection."
```

### Test 2: Backend Error
```javascript
// Use wrong credentials
// Backend should return: { error: "Invalid credentials" }
// Frontend should display: "Invalid credentials"
```

### Test 3: Production Build
```bash
npm run build
npm run preview
# Test login with errors - should not crash
```

---

## Summary: Key Rules

1. ✅ **Always extract strings** from error objects
2. ✅ **Never render objects directly** in JSX
3. ✅ **Use defensive checks** in reducers: `typeof payload === 'string'`
4. ✅ **Normalize errors** at the API layer (axios interceptors)
5. ✅ **Standardize backend** error format: `{ error: "message" }`
6. ✅ **Test error paths** in production builds

---

## Quick Reference

**Error #31 = Trying to render an object in JSX**

**Solution = Always convert to string before rendering**

```javascript
// ❌ DON'T
{error && <div>{error}</div>}

// ✅ DO
{error && <div>{typeof error === 'string' ? error : String(error)}</div>}
```

