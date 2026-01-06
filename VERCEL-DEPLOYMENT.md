# Vercel Deployment Configuration

## Quick Setup

### Step 1: Configure in Vercel Dashboard

1. **Framework Preset**: Select **Vite**
2. **Root Directory**: Set to `packages/web`
3. **Build Command**: 
   ```
   cd ../.. && npm install && npm run build:shared && cd packages/web && npm run build
   ```
4. **Output Directory**: `dist`
5. **Install Command**: 
   ```
   cd ../.. && npm install
   ```

### Step 2: Environment Variables

Add to Vercel Environment Variables:
```
VITE_API_URL=https://your-backend-url.up.railway.app/api
```

### Step 3: Deploy!

Click "Deploy" and wait for the build to complete.

## Why This Configuration?

Since this is a **monorepo with workspaces**:
1. **Install Command** runs from root to install all workspace dependencies
2. **Build Command**:
   - Changes to root directory
   - Installs dependencies
   - Builds the shared package (required by web package)
   - Changes to web package directory
   - Builds the web application

## Troubleshooting

**Build fails with "Cannot find module '@factory-app/shared'"?**
- Make sure the build command includes `npm run build:shared`
- Verify Root Directory is set to `packages/web`

**Build fails with TypeScript errors?**
- All TypeScript errors should be fixed
- If you see new errors, they're likely dependency-related
- Make sure `npm install` runs from root directory first

**Build succeeds but app doesn't work?**
- Check environment variable `VITE_API_URL` is set correctly
- Verify your backend URL is accessible
- Check browser console for API errors

