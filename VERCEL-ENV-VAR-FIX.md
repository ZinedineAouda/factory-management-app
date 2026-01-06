# Fix Vercel Environment Variable

## Problem
The API URL is being constructed incorrectly because `VITE_API_URL` is not set correctly in Vercel.

## Solution

### Step 1: Set the Environment Variable in Vercel

1. Go to your Vercel project dashboard
2. Click on **Settings**
3. Click on **Environment Variables**
4. Find or add `VITE_API_URL`
5. Set it to:
   ```
   https://factory-appbackend-production.up.railway.app/api
   ```
   ⚠️ **Important**: Include `https://` and `/api` at the end

### Step 2: Redeploy

After setting the environment variable:
1. Go to **Deployments** tab
2. Click on the latest deployment
3. Click **Redeploy**
   - Make sure "Use existing Build Cache" is **unchecked**
   - This ensures the new env var is picked up

### Alternative: If Railway URL is Different

If your Railway backend URL is different, use this format:
```
https://YOUR-RAILWAY-URL.railway.app/api
```

Replace `YOUR-RAILWAY-URL` with your actual Railway URL.

## Verification

After redeploying, check the browser console:
- The login request should go to: `https://factory-appbackend-production.up.railway.app/api/auth/login`
- NOT: `https://vercel-app.../factory-appbackend-production.up.railway.app/auth/login`

## Quick Test

After redeploy, open browser DevTools → Network tab:
1. Try to login
2. Look for the `/auth/login` request
3. Check the request URL - it should be your Railway URL, not Vercel URL

