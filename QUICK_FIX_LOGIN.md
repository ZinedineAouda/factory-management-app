# 🚨 QUICK FIX: Admin Login "Network Error"

## ⚡ Immediate Steps

### Step 1: Check Browser Console (F12)
1. Open your website
2. Press **F12** to open DevTools
3. Go to **Console** tab
4. Look for one of these messages:

**If you see:**
```
❌ CRITICAL: VITE_API_URL environment variable is not set in production!
```
→ **FIX:** Set `VITE_API_URL` in Vercel (see Step 2)

**If you see:**
```
🌐 Production mode: Using API at https://your-backend.up.railway.app/api
```
→ Good! URL is set. Check Step 3.

**If you see:**
```
🔧 Development mode: Using proxy API at /api
```
→ You're in dev mode. This is fine for local testing.

---

### Step 2: Set VITE_API_URL in Vercel

1. **Get your Railway backend URL:**
   - Go to Railway → Your Service → Settings → Domains
   - Copy the URL (e.g., `https://factory-backend.up.railway.app`)

2. **Set in Vercel:**
   - Go to Vercel → Your Project → Settings → Environment Variables
   - Click **Add New**
   - Name: `VITE_API_URL`
   - Value: `https://your-backend-url.up.railway.app/api`
   - **IMPORTANT:** Include `/api` at the end!
   - Click **Save**

3. **Redeploy:**
   - Go to Vercel → Your Project → Deployments
   - Click **Redeploy** on latest deployment
   - Wait for deployment to finish

---

### Step 3: Test Backend Connection

**In browser console, run this:**
```javascript
// Replace with your actual Railway URL
fetch('https://your-backend.up.railway.app/api/health')
  .then(r => r.json())
  .then(data => console.log('✅ Backend is running:', data))
  .catch(err => console.error('❌ Backend error:', err))
```

**Expected:** `{status: "ok", message: "Factory Management API is running"}`

**If error:** Backend is not running or wrong URL

---

### Step 4: Test Login Directly

**In browser console, run this:**
```javascript
// Replace with your actual Railway URL
fetch('https://your-backend.up.railway.app/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'admin', password: 'admin1234' })
})
  .then(r => r.json())
  .then(data => {
    if (data.token) {
      console.log('✅ Login works! Token:', data.token.substring(0, 20) + '...');
    } else {
      console.error('❌ Login failed:', data);
    }
  })
  .catch(err => console.error('❌ Network error:', err))
```

**If this works:** The issue is frontend configuration  
**If this fails:** The issue is backend or admin account

---

## 🔍 Check Backend Logs (Railway)

1. Go to Railway → Your Service → Logs
2. Look for:
   - `✅ Database connected successfully`
   - `✅ Admin account created successfully` OR `✅ Admin account already exists`
   - `📁 Database path: /data/factory_management.db`

**If you see errors:** Backend has issues

---

## ✅ Most Common Fix

**90% of cases:** `VITE_API_URL` is not set in Vercel

**Solution:**
1. Set `VITE_API_URL=https://your-backend.up.railway.app/api` in Vercel
2. Redeploy frontend
3. Try login again

---

## 🆘 Still Not Working?

Run this diagnostic in browser console:

```javascript
console.log('=== DIAGNOSTIC ===');
console.log('Environment:', import.meta.env.MODE);
console.log('API URL:', import.meta.env.VITE_API_URL || 'NOT SET');
console.log('Dev mode:', import.meta.env.DEV);
console.log('Prod mode:', import.meta.env.PROD);

// Test backend
fetch((import.meta.env.VITE_API_URL || '/api') + '/health')
  .then(r => r.json())
  .then(d => console.log('✅ Backend health:', d))
  .catch(e => console.error('❌ Backend unreachable:', e));
```

**Copy the output and check:**
- Is `VITE_API_URL` set?
- Does backend health check work?

---

**Need more help?** See `TROUBLESHOOTING_LOGIN.md` for detailed guide.

