# 🔗 How to Find Your Railway Deployment URL

## Step-by-Step Guide

### Method 1: From Settings (Easiest)

1. **Go to Railway Dashboard**
   - Visit [railway.app](https://railway.app)
   - Log in to your account

2. **Open Your Project**
   - Click on your project name

3. **Click on Your Service**
   - Click on the service (usually named after your repo or "backend")

4. **Go to Settings Tab**
   - Click on **"Settings"** tab at the top

5. **Find Domains Section**
   - Scroll down to **"Domains"** section
   - You'll see your Railway URL like:
     ```
     https://your-app-name.up.railway.app
     ```

6. **Copy the URL**
   - Click the copy button or manually copy the URL
   - This is your backend API URL!

### Method 2: From Service Overview

1. **Open Your Service**
   - Click on your service in Railway dashboard

2. **Look at the Top**
   - The URL is often displayed at the top of the service page
   - Look for a link or "Open" button

### Method 3: From Deployments

1. **Go to Deployments Tab**
   - Click on **"Deployments"** tab
   - Open the latest deployment

2. **Find the URL**
   - The deployment details will show the service URL

## What to Do With the URL

Once you have your Railway URL (e.g., `https://your-app.up.railway.app`):

1. **Test Your Backend**
   - Visit: `https://your-app.up.railway.app/api/health`
   - Should return: `{"status":"ok","message":"Factory Management API is running"}`

2. **Use in Frontend**
   - Set `VITE_API_URL=https://your-app.up.railway.app/api` in your frontend environment variables

3. **Update CORS**
   - Make sure `FRONTEND_URL` environment variable in Railway includes your frontend domain

## Example URLs

- **Backend API**: `https://factory-backend.up.railway.app`
- **Health Check**: `https://factory-backend.up.railway.app/api/health`
- **API Endpoint**: `https://factory-backend.up.railway.app/api`

## Troubleshooting

**Can't find the URL?**
- Make sure your service is deployed successfully (green status)
- Check if the deployment completed without errors
- Try redeploying if the service isn't showing a URL

**URL not working?**
- Check Railway logs for errors
- Verify the service is running (not paused)
- Make sure environment variables are set correctly

