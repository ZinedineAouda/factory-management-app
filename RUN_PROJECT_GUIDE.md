# 🚀 How to Run This Project - Complete Guide

## 📋 Project Structure

This is a **monorepo** (monolithic repository) using **npm workspaces** with:
- **Root** (`/`): Monorepo orchestrator
- **Backend** (`/backend`): Node.js/Express API (TypeScript)
- **Frontend Web** (`/packages/web`): React + Vite application
- **Shared** (`/packages/shared`): Shared TypeScript code
- **Mobile** (`/packages/mobile`): React Native app (optional)

---

## 🔍 1. Current Package.json Scripts Analysis

### ✅ Root `package.json` Scripts (CORRECT - Already Fixed)

```json
{
  "scripts": {
    "start": "cd backend && npm start",           // ✅ Starts production backend
    "dev:backend": "cd backend && npm run dev",    // ✅ Starts dev backend
    "dev:web": "cd packages/web && npm run dev",   // ✅ Starts dev frontend
    "dev:mobile": "cd packages/mobile && npm run start", // ✅ Starts mobile
    "build": "npm install && npm run build:all",   // ✅ Builds everything
    "build:all": "npm run build:shared && npm run build:backend && npm run build:web",
    "build:shared": "cd packages/shared && npm run build",
    "build:backend": "cd backend && npm run build",
    "build:web": "cd packages/web && npm run build"
  }
}
```

### ✅ Backend `package.json` Scripts

```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",  // Development with hot reload
    "build": "tsc",                                                // Compile TypeScript → dist/
    "start": "node dist/index.js"                                  // Run compiled production code
  }
}
```

### ✅ Frontend `package.json` Scripts

```json
{
  "scripts": {
    "dev": "vite",                    // Development server (usually port 5173)
    "build": "tsc && vite build",     // Build for production
    "preview": "vite preview"         // Preview production build
  }
}
```

---

## 🛠️ 2. Step-by-Step: How to Run the Project

### **Option A: Development Mode (Recommended for Development)**

#### Step 1: Install Dependencies (One-Time Setup)
```bash
# From the root directory
npm install
```

This installs dependencies for all workspaces (backend, frontend, shared, mobile).

#### Step 2: Build Shared Package (Required First Time)
```bash
npm run build:shared
```

#### Step 3: Start Backend (Development Mode)
Open **Terminal 1**:
```bash
npm run dev:backend
```
- Backend runs with hot-reload on `http://localhost:5000` (or your configured port)
- Uses `ts-node-dev` - no build step needed

#### Step 4: Start Frontend (Development Mode)
Open **Terminal 2**:
```bash
npm run dev:web
```
- Frontend runs on `http://localhost:5173` (Vite default)
- Hot-reload enabled

#### ✅ Result:
- ✅ Backend API: `http://localhost:5000`
- ✅ Frontend: `http://localhost:5173`
- ✅ Both running in development mode with hot-reload

---

### **Option B: Production Mode (For Deployment/Testing)**

#### Step 1: Install Dependencies
```bash
npm install
```

#### Step 2: Build Everything
```bash
npm run build
```
This runs:
1. `build:shared` - Builds shared TypeScript package
2. `build:backend` - Compiles backend TypeScript → `backend/dist/`
3. `build:web` - Builds frontend → `packages/web/dist/`

#### Step 3: Start Backend (Production)
```bash
npm start
```
This runs: `cd backend && npm start` → `node dist/index.js`

#### Step 4: Serve Frontend (If Needed)
The frontend build is static files in `packages/web/dist/`. Serve it with:
```bash
cd packages/web
npm run preview
```
Or use any static file server (nginx, serve, etc.)

---

## ❌ 3. Why You're Getting the Error

### Error: `npm error Missing script: "start"`

**Most Likely Causes:**

1. **Running from wrong directory**
   - ❌ Running `npm start` from `/backend` or `/packages/web`
   - ✅ Must run from **root directory** (`/`)

2. **Backend not built**
   - `npm start` runs `cd backend && npm start` → `node dist/index.js`
   - If `backend/dist/` doesn't exist, it will fail
   - **Solution**: Run `npm run build:backend` first

3. **Package.json not saved/pushed**
   - If using git, make sure changes are committed
   - Deployment platforms need the updated `package.json`

4. **Node modules not installed**
   - Missing dependencies can cause script detection issues
   - **Solution**: Run `npm install` from root

---

## 🔧 4. Quick Fix Checklist

Run these commands in order:

```bash
# 1. Navigate to root directory
cd /path/to/factory-management-app

# 2. Install all dependencies
npm install

# 3. Build backend (if running production)
npm run build:backend

# 4. Verify scripts exist
npm run

# 5. Start (production) or dev:backend (development)
npm start              # Production
# OR
npm run dev:backend    # Development
```

---

## ⚠️ 5. About the `--omit=dev` Warning

### Warning: `npm warn config production Use '--omit=dev' instead.`

**What it means:**
- This is a **warning, not an error** - your project will still work
- npm is suggesting a newer flag syntax

**Why it appears:**
- Older npm config: `npm install --production`
- Newer npm (v9+): `npm install --omit=dev`

**What it affects:**
- When installing in production, devDependencies are skipped
- Your local development is unaffected

**How to fix (optional):**
1. Update your CI/CD/deployment scripts:
   ```bash
   # Old (still works but shows warning)
   npm install --production
   
   # New (no warning)
   npm install --omit=dev
   ```

2. Or ignore it - it's just a deprecation warning and won't break anything

---

## 📝 6. Recommended Development Workflow

### Daily Development:
```bash
# Terminal 1: Backend
npm run dev:backend

# Terminal 2: Frontend  
npm run dev:web
```

### Before Deployment:
```bash
# Build everything
npm run build

# Test production build locally
npm start  # Backend
cd packages/web && npm run preview  # Frontend
```

### Troubleshooting:
```bash
# Clean install
rm -rf node_modules backend/node_modules packages/*/node_modules
npm install

# Rebuild
npm run build:shared
npm run build:backend
npm run build:web
```

---

## 🎯 Summary

| Command | What It Does | When to Use |
|---------|--------------|-------------|
| `npm install` | Install all workspace dependencies | First time setup |
| `npm run dev:backend` | Start backend dev server (hot-reload) | Development |
| `npm run dev:web` | Start frontend dev server (hot-reload) | Development |
| `npm run build` | Build all packages for production | Before deployment |
| `npm start` | Start production backend | Production/deployment |
| `npm run build:backend` | Build only backend | If backend needs rebuilding |

---

## ✅ Verification

After following these steps, verify:

1. **Backend is running:**
   ```bash
   curl http://localhost:5000/api/health
   # or check browser: http://localhost:5000
   ```

2. **Frontend is running:**
   ```bash
   # Open browser: http://localhost:5173
   ```

3. **Scripts are available:**
   ```bash
   npm run
   # Should show all scripts listed above
   ```

---

## 🆘 Still Having Issues?

1. **Check current directory:**
   ```bash
   pwd  # Should be root of project
   ```

2. **Verify package.json exists:**
   ```bash
   cat package.json | grep "start"
   # Should show: "start": "cd backend && npm start"
   ```

3. **Check if backend is built:**
   ```bash
   ls backend/dist/index.js
   # Should exist if using production mode
   ```

4. **Check npm version:**
   ```bash
   npm --version  # Should be 9+ for workspaces
   ```

---

**Your project is configured correctly!** The `start` script exists. Follow the steps above to run it properly. 🚀

