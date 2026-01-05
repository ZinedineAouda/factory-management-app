# 🚀 Simple Railway Setup (No Docker!)

## Step-by-Step Guide

### 1. Connect Your Repository
- Go to [railway.app](https://railway.app)
- Click "New Project" → "Deploy from GitHub repo"
- Select your repository

### 2. Configure Root Directory (CRITICAL!)
- Click on your service
- Go to **Settings** tab
- Scroll down to **Service** section
- Find **Root Directory** field
- Set it to: `backend`
- Click **Save**

### 3. Set Environment Variables
Go to **Variables** tab and add:
```
NODE_ENV=production
JWT_SECRET=your-random-secret-key-here
FRONTEND_URL=your-frontend-url
```

Generate a secure JWT_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Deploy!
- Railway will automatically detect Node.js
- It will use Nixpacks builder (no Docker needed)
- Build command: `npm install && npm run build`
- Start command: `npm start`
- Wait 2-3 minutes for deployment

### 5. Get Your URL
- Go to **Settings** → **Domains**
- Copy your Railway URL (e.g., `https://your-app.up.railway.app`)

## That's It! 🎉

Railway will:
- ✅ Auto-detect Node.js
- ✅ Install dependencies
- ✅ Build TypeScript
- ✅ Start your server
- ✅ Handle everything automatically

No Docker configuration needed!

## Troubleshooting

**Build fails?**
- Make sure Root Directory is set to `backend`
- Check Railway logs for errors

**Port errors?**
- Railway automatically sets PORT - your code handles this correctly

**Database errors?**
- SQLite database will be created automatically
- For production, consider Railway's Volume for persistence

