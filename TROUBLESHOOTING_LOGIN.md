# 🔧 Troubleshooting: Admin Login "Network Error"

**Issue:** Cannot login with `admin:admin1234` - getting "Network Error"

---

## 🔍 Quick Diagnosis

### Step 1: Check Browser Console
1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Look for error messages
4. Check what API URL is being used

**Expected:** Should see `🌐 Production mode: Using API at https://your-backend.up.railway.app/api`

**If you see:** `❌ CRITICAL: VITE_API_URL environment variable is not set`
→ **Solution:** Set `VITE_API_URL` in Vercel environment variables

---

### Step 2: Check Network Tab
1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Try to login again
4. Look for the `/api/auth/login` request

**Check:**
- **Request URL:** Should be your Railway backend URL, NOT localhost
- **Status:** 
  - `(failed)` = Network error (backend unreachable)
  - `404` = Wrong URL
  - `CORS error` = CORS not configured
  - `200` = Success (but might be wrong response)

---

### Step 3: Check Backend Health
Visit: `https://your-backend.up.railway.app/api/health`

**Expected:** `{"status":"ok","message":"Factory Management API is running"}`

**If error:**
- Backend is not running
- Wrong URL
- Backend crashed

---

## 🐛 Common Issues & Solutions

### Issue 1: VITE_API_URL Not Set

**Symptoms:**
- Console shows: `❌ CRITICAL: VITE_API_URL environment variable is not set`
- Network requests go to `/api` (relative path)
- All requests fail

**Solution:**
1. Go to Vercel → Your Project → Settings → Environment Variables
2. Add: `VITE_API_URL` = `https://your-backend.up.railway.app/api`
3. Redeploy frontend

---

### Issue 2: Backend Not Running

**Symptoms:**
- Network tab shows `(failed)` or `ERR_CONNECTION_REFUSED`
- Health endpoint doesn't respond

**Solution:**
1. Check Railway logs
2. Ensure backend service is running
3. Check for errors in Railway logs
4. Restart backend service if needed

---

### Issue 3: CORS Error

**Symptoms:**
- Console shows CORS error
- Network tab shows CORS preflight failed
- Request blocked by browser

**Solution:**
1. Check `FRONTEND_URL` in Railway environment variables
2. Ensure it matches your Vercel URL exactly
3. No trailing slashes
4. Format: `https://your-app.vercel.app`
5. Redeploy backend

---

### Issue 4: Wrong Backend URL

**Symptoms:**
- Network requests go to wrong URL
- 404 errors
- Backend URL in console doesn't match Railway URL

**Solution:**
1. Verify Railway backend URL
2. Update `VITE_API_URL` in Vercel
3. Ensure URL includes `/api` suffix
4. Redeploy frontend

---

### Issue 5: Admin Account Doesn't Exist

**Symptoms:**
- Network request succeeds (200)
- But login fails with "Account not found"
- Backend logs show no admin user

**Solution:**
1. Check Railway backend logs
2. Look for: `✅ Admin account created successfully` or `✅ Admin account already exists`
3. If not found, backend might be using wrong database
4. Check database path in logs: `📁 Database path: /data/factory_management.db`

---

## 🔧 Step-by-Step Fix

### For Production (Vercel + Railway)

1. **Get Your Backend URL:**
   - Go to Railway → Your Service → Settings
   - Copy the domain (e.g., `https://factory-backend.up.railway.app`)

2. **Set Frontend Environment Variable:**
   - Go to Vercel → Your Project → Settings → Environment Variables
   - Add: `VITE_API_URL` = `https://factory-backend.up.railway.app/api`
   - **Important:** Include `/api` suffix

3. **Set Backend Environment Variables:**
   - Go to Railway → Your Service → Variables
   - Ensure these are set:
     ```
     FRONTEND_URL=https://your-frontend.vercel.app
     JWT_SECRET=your-secret-key-min-32-chars
     NODE_ENV=production
     RAILWAY_VOLUME_PATH=/data
     ```

4. **Redeploy:**
   - Redeploy frontend (Vercel)
   - Redeploy backend (Railway)

5. **Verify:**
   - Check browser console - should show correct API URL
   - Check Network tab - requests should go to Railway URL
   - Try login again

---

## 🧪 Test Backend Connection

### Test 1: Health Endpoint
```bash
curl https://your-backend.up.railway.app/api/health
```

**Expected:** `{"status":"ok","message":"Factory Management API is running"}`

### Test 2: Login Endpoint (from browser console)
```javascript
fetch('https://your-backend.up.railway.app/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'admin', password: 'admin1234' })
})
.then(r => r.json())
.then(console.log)
.catch(console.error)
```

**Expected:** User object with token, or error message

---

## 📋 Checklist

- [ ] Backend is running (check Railway logs)
- [ ] Backend health endpoint works
- [ ] `VITE_API_URL` is set in Vercel
- [ ] `VITE_API_URL` includes `/api` suffix
- [ ] `FRONTEND_URL` is set in Railway
- [ ] `FRONTEND_URL` matches Vercel URL exactly
- [ ] No trailing slashes in URLs
- [ ] Frontend redeployed after env var changes
- [ ] Backend redeployed after env var changes
- [ ] Browser console shows correct API URL
- [ ] Network tab shows requests to Railway URL
- [ ] Admin account exists (check backend logs)

---

## 🆘 Still Not Working?

1. **Check Railway Logs:**
   - Look for database connection errors
   - Look for admin account creation messages
   - Look for any startup errors

2. **Check Vercel Logs:**
   - Look for build errors
   - Look for environment variable issues

3. **Test Locally:**
   - Run backend locally: `cd backend && npm run dev`
   - Run frontend locally: `cd packages/web && npm run dev`
   - Try login - if it works locally, it's a deployment config issue

4. **Verify Database:**
   - Check Railway logs for database path
   - Ensure Railway volume is mounted
   - Admin account should be created automatically

---

**Last Updated:** $(date)

