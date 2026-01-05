# Backend Deployment Guide

## Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```env
# Server Configuration
NODE_ENV=production
PORT=3000

# JWT Secret (Change this to a random string in production!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Frontend URL (comma-separated for multiple origins)
# For local development: http://localhost:3001
# For production: https://your-frontend.vercel.app
FRONTEND_URL=http://localhost:3001
```

## Railway Deployment

### Option 1: Using Railway's Auto-Detection (Recommended)

1. Connect your GitHub repository to Railway
2. Select the `backend` folder as the root directory
3. Railway will auto-detect Node.js and use the `railway.json` configuration
4. Add environment variables in Railway dashboard:
   - `NODE_ENV=production`
   - `PORT=3000` (Railway sets this automatically, but you can override)
   - `JWT_SECRET=<your-random-secret-key>`
   - `FRONTEND_URL=<your-frontend-url>`
5. Deploy!

### Option 2: Using Docker

If you prefer Docker:

1. Railway will automatically use the `Dockerfile` if present
2. Build command: `docker build -t factory-backend ./backend`
3. Run: `docker run -p 3000:3000 --env-file .env factory-backend`

## Database Storage on Railway

**Important**: Railway uses ephemeral storage by default. Your SQLite database will be reset if the container restarts.

### Option 1: Use Railway Volume (Recommended for SQLite)

1. In Railway dashboard, go to your service
2. Click "New" → "Volume"
3. Mount the volume at `/app` or `/app/data`
4. Update the database path in code to use the volume path

### Option 2: Use Railway's PostgreSQL (Better for production)

Consider migrating to PostgreSQL for production use. Railway provides a free PostgreSQL database that persists data.

## Local Development

```bash
cd backend
npm install
npm run dev
```

## Building

```bash
cd backend
npm install
npm run build
npm start
```

