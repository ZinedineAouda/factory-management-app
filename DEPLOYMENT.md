# 🚀 Deployment Guide - Step by Step for Beginners

This guide will help you host your Factory Management System for FREE. We'll use **Vercel** for the frontend (web app) and **Railway** or **Render** for the backend (API server).

## 📋 Table of Contents

1. [Why These Platforms?](#why-these-platforms)
2. [Part 1: Prepare Your Code](#part-1-prepare-your-code)
3. [Part 2: Host the Backend (API)](#part-2-host-the-backend-api)
4. [Part 3: Host the Frontend (Web App)](#part-3-host-the-frontend-web-app)
5. [Part 4: Connect Everything](#part-4-connect-everything)
6. [Troubleshooting](#troubleshooting)

---

## Why These Platforms?

### For Backend (API Server):
- **Railway** or **Render** - Both offer free tiers, easy database setup, and automatic deployments
- **Why?** Your backend needs to run 24/7, and these platforms provide that for free

### For Frontend (Web App):
- **Vercel** - Best for React apps, automatic deployments, free SSL, and super fast
- **Why?** Vercel is made by the creators of Next.js and works perfectly with React/Vite apps

---

## Part 1: Prepare Your Code

### Step 1.1: Make Sure Everything Works Locally

Before deploying, test that everything works on your computer:

```bash
# 1. Build the shared package
npm run build:shared

# 2. Start backend (in one terminal)
cd backend
npm run dev

# 3. Start web app (in another terminal)
cd packages/web
npm run dev
```

Visit `http://localhost:3001` and make sure you can log in. If it works, you're ready!

### Step 1.2: Create a GitHub Account (If You Don't Have One)

1. Go to [github.com](https://github.com)
2. Click "Sign up"
3. Fill in your email, password, and username
4. Verify your email

### Step 1.3: Push Your Code to GitHub

**If you're new to Git, follow these steps:**

1. **Install Git** (if not installed):
   - Windows: Download from [git-scm.com](https://git-scm.com/download/win)
   - Mac: Usually pre-installed, or use Homebrew: `brew install git`

2. **Open terminal/command prompt in your project folder**

3. **Initialize Git** (if not already done):
   ```bash
   git init
   ```

4. **Create a `.gitignore` file** (we already have one, but verify it includes):
   - `node_modules/`
   - `dist/`
   - `*.db`
   - `.env`

5. **Add all files to Git**:
   ```bash
   git add .
   ```

6. **Create your first commit**:
   ```bash
   git commit -m "Initial commit - Factory Management System"
   ```

7. **Create a new repository on GitHub**:
   - Go to [github.com/new](https://github.com/new)
   - Name it: `factory-management-app` (or any name you like)
   - Make it **Public** (required for free hosting)
   - Click "Create repository"

8. **Connect and push your code**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/factory-management-app.git
   git branch -M main
   git push -u origin main
   ```
   (Replace `YOUR_USERNAME` with your actual GitHub username)

**If it asks for login:**
- Use a Personal Access Token instead of password
- Create one: GitHub → Settings → Developer settings → Personal access tokens → Generate new token
- Give it "repo" permissions
- Copy the token and use it as your password

---

## Part 2: Host the Backend (API)

We'll use **Railway** (easiest for beginners) or **Render** (alternative).

### Option A: Railway (Recommended)

#### Step 2.1: Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Click "Start a New Project"
3. Sign up with GitHub (click "Login with GitHub")
4. Authorize Railway to access your GitHub

#### Step 2.2: Deploy Backend

1. **Create New Project**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Select the `backend` folder (or we'll configure it)

2. **Configure the Project**:
   - Railway will detect it's a Node.js project
   - **Root Directory**: Set to `backend` (important!)
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

3. **Add Environment Variables**:
   - Click on your project → "Variables" tab
   - Add these variables:
     ```
     NODE_ENV=production
     PORT=3000
     JWT_SECRET=your-super-secret-key-change-this-to-random-string
     ```
   - Click "Add" for each one

4. **Add SQLite Database**:
   - Click "New" → "Database" → "SQLite"
   - Railway will create a database for you
   - The database file will be stored automatically

5. **Deploy**:
   - Railway will automatically start building
   - Wait 2-3 minutes
   - You'll see a URL like: `https://your-app-name.up.railway.app`
   - **Copy this URL** - this is your backend API URL!

#### Step 2.3: Get Your Backend URL

- Click on your deployed service
- Go to "Settings" → "Domains"
- You'll see a URL like: `https://your-backend.up.railway.app`
- **This is your API URL** - save it!

---

### Option B: Render (Alternative)

#### Step 2.1: Create Render Account

1. Go to [render.com](https://render.com)
2. Click "Get Started for Free"
3. Sign up with GitHub

#### Step 2.2: Deploy Backend

1. **New Web Service**:
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Select the repository

2. **Configure**:
   - **Name**: `factory-backend` (or any name)
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

3. **Environment Variables**:
   - Scroll down to "Environment Variables"
   - Add:
     ```
     NODE_ENV=production
     PORT=3000
     JWT_SECRET=your-super-secret-key-change-this
     ```

4. **Deploy**:
   - Click "Create Web Service"
   - Wait 3-5 minutes
   - You'll get a URL like: `https://factory-backend.onrender.com`
   - **Save this URL!**

---

## Part 3: Host the Frontend (Web App)

We'll use **Vercel** (best for React apps).

### Step 3.1: Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Click "Sign Up"
3. Choose "Continue with GitHub"
4. Authorize Vercel

### Step 3.2: Deploy Web App

1. **Import Project**:
   - Click "Add New" → "Project"
   - Select your GitHub repository
   - Click "Import"

2. **Configure Project**:
   - **Framework Preset**: Vite (or React)
   - **Root Directory**: `packages/web` (click "Edit" and change it)
   - **Build Command**: `cd ../.. && npm install && npm run build:shared && cd packages/web && npm run build`
   - **Output Directory**: `dist` (should auto-detect)
   - **Install Command**: `cd ../.. && npm install`

3. **Environment Variables**:
   - Click "Environment Variables"
   - Add:
     ```
     VITE_API_URL=https://your-backend-url.up.railway.app/api
     ```
   - (Replace with your actual backend URL from Part 2)

4. **Deploy**:
   - Click "Deploy"
   - Wait 1-2 minutes
   - **You'll get a URL like**: `https://factory-management-app.vercel.app`
   - **This is your live website!** 🎉

---

## Part 4: Connect Everything

### Step 4.1: Update Backend CORS Settings

Your backend needs to allow requests from your frontend URL.

1. **Edit `backend/src/index.ts`**:
   Find the CORS configuration and update it:

   ```typescript
   app.use(cors({
     origin: [
       'http://localhost:3001',
       'https://your-frontend-url.vercel.app'
     ],
     credentials: true
   }));
   ```

2. **Commit and push**:
   ```bash
   git add backend/src/index.ts
   git commit -m "Update CORS for production"
   git push
   ```

3. **Railway/Render will automatically redeploy**

### Step 4.2: Test Your Live Website

1. Visit your Vercel URL (e.g., `https://factory-management-app.vercel.app`)
2. Try to log in with:
   - Username: `admin`
   - Password: `admin1234`
3. If it works, you're done! 🎊

---

## Troubleshooting

### Problem: "Cannot connect to API"

**Solution:**
1. Check your backend URL is correct in Vercel environment variables
2. Make sure backend is running (check Railway/Render dashboard)
3. Verify CORS settings include your frontend URL

### Problem: "Database errors"

**Solution:**
1. On Railway: Make sure SQLite database is added
2. On Render: You might need to use PostgreSQL (free tier available)
3. Check backend logs in Railway/Render dashboard

### Problem: "Build failed"

**Solution:**
1. Check build logs in Vercel/Railway dashboard
2. Make sure `npm run build:shared` works locally first
3. Verify all environment variables are set

### Problem: "Port already in use"

**Solution:**
- This shouldn't happen in production, but if it does:
- Railway/Render automatically assigns ports
- Make sure your code uses `process.env.PORT || 3000`

---

## Updating Your Website

Every time you make changes:

1. **Make your changes** in your code
2. **Commit and push**:
   ```bash
   git add .
   git commit -m "Your change description"
   git push
   ```
3. **Vercel and Railway/Render will automatically redeploy!**
   - Usually takes 1-3 minutes
   - You'll see the update live automatically

---

## Summary

✅ **Backend URL**: `https://your-backend.up.railway.app`  
✅ **Frontend URL**: `https://your-app.vercel.app`  
✅ **Both update automatically** when you push to GitHub

**You're live!** Share your website URL with others! 🚀

---

## Need Help?

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Railway Docs**: [docs.railway.app](https://docs.railway.app)
- **Render Docs**: [render.com/docs](https://render.com/docs)

