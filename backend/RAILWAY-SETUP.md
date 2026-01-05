# Railway Deployment Quick Setup

## Quick Steps

1. **Connect Repository to Railway**
   - Go to [railway.app](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository

2. **Configure Service** (IMPORTANT!)
   
   **Option A (Recommended): Set Root Directory**
   - Go to your service → Settings → Service
   - Find "Root Directory" setting
   - Set it to: `backend`
   - This tells Railway to run all commands from the backend folder
   - Railway will use the configuration files in `backend/` directory
   
   **Option B (Fallback): Use Root Directory**
   - If you don't set Root Directory, Railway will use root-level config files
   - The root-level `railway.json` and `nixpacks.toml` will handle the build
   - This works but Option A is cleaner

3. **Set Environment Variables**
   In Railway dashboard → Variables tab, add:
   ```
   NODE_ENV=production
   JWT_SECRET=<generate-a-random-secret-key-here>
   FRONTEND_URL=<your-frontend-url>
   ```
   - `PORT` is automatically set by Railway (usually 3000)
   - Generate a secure JWT_SECRET: Use a random string generator or run: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

4. **Deploy**
   - Railway will automatically build and deploy
   - Wait 2-3 minutes for the build to complete
   - Your backend will be available at: `https://your-service.up.railway.app`

## Important Notes

### Database Storage
- **Ephemeral Storage**: By default, Railway uses ephemeral storage. Your SQLite database will reset if the container restarts.
- **For Production**: Consider using Railway's Volume service for persistent storage, or migrate to PostgreSQL.

### Build Process
- Railway will run: `npm install && npm run build`
- Then start with: `npm start`
- The build output goes to `dist/` directory

### Health Check
- Your API health endpoint: `https://your-service.up.railway.app/api/health`
- Test it to verify the deployment is working

## Troubleshooting

### Build Fails
- Check Railway logs for errors
- Ensure all dependencies are in `package.json`
- Verify TypeScript compilation succeeds locally: `cd backend && npm run build`

### Database Errors
- Database file is created at: `backend/factory_management.db`
- Ensure the directory is writable
- For persistent storage, use Railway Volume

### Port Errors
- Railway automatically sets `PORT` environment variable
- Your code uses `process.env.PORT || 3000` which is correct

### CORS Errors
- Make sure `FRONTEND_URL` includes your frontend domain
- Can include multiple URLs separated by commas
- Example: `FRONTEND_URL=https://your-app.vercel.app,https://another-domain.com`

