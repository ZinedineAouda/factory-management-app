# 🚨 Railway Build Error Fix

## IMPORTANT: Use Root Directory Setting

**The easiest fix:** Set Root Directory to `backend` in Railway UI (Settings → Service → Root Directory).

## The Problem
Railway might try to run commands from the wrong directory, or try to use Docker when you don't need it.

## Solution Options

### ✅ Option 1: Set Root Directory in Railway UI (RECOMMENDED)

1. Go to your Railway project dashboard
2. Click on your service
3. Go to **Settings** tab
4. Scroll to **Service** section
5. Find **Root Directory** field
6. Set it to: `backend`
7. Click **Save**
8. Redeploy your service

This tells Railway to run all commands from the `backend` directory, where your `package.json` with the build script is located.

### ✅ Option 2: Use Root-Level Configuration (FALLBACK)

If you can't set Root Directory (or if it's already set and not working), the root-level configuration files will handle it:

- `railway.json` at root - Contains build command: `cd backend && npm install && npm run build`
- `nixpacks.toml` at root - Alternative build configuration

These files will automatically change to the backend directory before running commands.

## Which Option to Use?

**Use Option 1** - It's cleaner and Railway's recommended approach. The root directory should be set to `backend` so Railway knows where your service code lives.

**Use Option 2** only if Option 1 doesn't work or if you have a specific reason to keep root directory at the repository root.

## After Fixing

Once you've set the root directory (Option 1) or confirmed the root-level configs are being used (Option 2), your build should succeed!

