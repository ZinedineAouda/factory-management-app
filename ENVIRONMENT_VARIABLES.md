# 🔧 Environment Variables Guide

**Status:** BETA - Production  
**Last Updated:** $(date)

---

## 📋 Required Environment Variables

### Frontend (Vercel)

#### `VITE_API_URL` ⚠️ **REQUIRED IN PRODUCTION**

**Description:** Backend API base URL (without `/api` suffix)

**Format:** `https://your-backend.up.railway.app` or `https://your-backend.up.railway.app/api`

**Example:**
```env
VITE_API_URL=https://factory-backend.up.railway.app/api
```

**Important:**
- ✅ Must be set in Vercel environment variables
- ✅ Should include `/api` suffix
- ✅ Must use `https://` protocol
- ❌ Do NOT use `localhost` or `127.0.0.1`
- ❌ Do NOT hardcode URLs in code

**How to Set in Vercel:**
1. Go to your Vercel project
2. Settings → Environment Variables
3. Add: `VITE_API_URL` = `https://your-backend-url/api`
4. Redeploy

---

### Backend (Railway)

#### `FRONTEND_URL` ⚠️ **REQUIRED IN PRODUCTION**

**Description:** Comma-separated list of allowed frontend URLs for CORS

**Format:** `https://domain1.com,https://domain2.com`

**Example:**
```env
FRONTEND_URL=https://factory-management-app.vercel.app,https://www.yourdomain.com
```

**Important:**
- ✅ Must include your Vercel frontend URL
- ✅ Can include multiple URLs (comma-separated)
- ✅ Must use `https://` protocol
- ❌ Do NOT include trailing slashes

**How to Set in Railway:**
1. Go to your Railway project
2. Service → Variables
3. Add: `FRONTEND_URL` = `https://your-frontend-url.vercel.app`
4. Redeploy

---

#### `DATABASE_PATH` (Optional)

**Description:** Custom database file path (overrides default)

**Format:** `/path/to/database.db`

**Example:**
```env
DATABASE_PATH=/data/factory_management.db
```

**When to Use:**
- If you have a custom persistent storage location
- If Railway volume is mounted at a different path

---

#### `RAILWAY_VOLUME_PATH` (Optional - Recommended)

**Description:** Railway volume mount path

**Format:** `/data` or `/mnt/data`

**Example:**
```env
RAILWAY_VOLUME_PATH=/data
```

**How to Set Up:**
1. Add a Volume to your Railway project
2. Mount it at `/data`
3. Set `RAILWAY_VOLUME_PATH=/data`
4. Database will be stored at `/data/factory_management.db`

---

#### `JWT_SECRET` ⚠️ **REQUIRED**

**Description:** Secret key for JWT token signing

**Format:** Any secure random string (min 32 characters)

**Example:**
```env
JWT_SECRET=your-super-secret-key-change-this-in-production-min-32-chars
```

**Important:**
- ✅ Must be unique and secret
- ✅ Minimum 32 characters recommended
- ✅ Change from default in production
- ❌ Do NOT commit to git

---

#### `NODE_ENV` (Optional)

**Description:** Node.js environment

**Values:** `development` | `production`

**Default:** `development`

**Example:**
```env
NODE_ENV=production
```

---

#### `PORT` (Optional)

**Description:** Server port

**Default:** `3000`

**Example:**
```env
PORT=3000
```

**Note:** Railway automatically sets this - usually not needed

---

#### `ADMIN_USERNAME` (Optional)

**Description:** Default admin username

**Default:** `admin`

**Example:**
```env
ADMIN_USERNAME=admin
```

---

#### `ADMIN_PASSWORD` (Optional)

**Description:** Default admin password

**Default:** `admin1234`

**Example:**
```env
ADMIN_PASSWORD=your-secure-password
```

**Important:** Change this in production!

---

#### `ADMIN_EMAIL` (Optional)

**Description:** Default admin email

**Default:** `admin@factory.com`

**Example:**
```env
ADMIN_EMAIL=admin@yourdomain.com
```

---

## 🔍 Verification Checklist

### Frontend (Vercel)
- [ ] `VITE_API_URL` is set
- [ ] `VITE_API_URL` uses `https://`
- [ ] `VITE_API_URL` includes `/api` suffix
- [ ] No `localhost` or `127.0.0.1` in production

### Backend (Railway)
- [ ] `FRONTEND_URL` is set
- [ ] `FRONTEND_URL` includes your Vercel URL
- [ ] `JWT_SECRET` is set and secure
- [ ] `NODE_ENV=production` (if in production)
- [ ] Database path is configured (volume or custom path)

---

## 🐛 Troubleshooting

### Frontend shows "localhost" in console

**Problem:** `VITE_API_URL` not set or incorrect

**Solution:**
1. Check Vercel environment variables
2. Ensure `VITE_API_URL` is set correctly
3. Redeploy frontend

### CORS errors

**Problem:** `FRONTEND_URL` not set or incorrect

**Solution:**
1. Check Railway environment variables
2. Ensure `FRONTEND_URL` includes your Vercel URL
3. No trailing slashes
4. Redeploy backend

### Database data lost on redeploy

**Problem:** Database not using persistent storage

**Solution:**
1. Add Railway Volume
2. Set `RAILWAY_VOLUME_PATH=/data`
3. Or set `DATABASE_PATH=/data/factory_management.db`
4. Check logs for database path

---

## 📝 Example Configuration

### Vercel (Frontend)
```env
VITE_API_URL=https://factory-backend.up.railway.app/api
```

### Railway (Backend)
```env
FRONTEND_URL=https://factory-management-app.vercel.app
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
NODE_ENV=production
RAILWAY_VOLUME_PATH=/data
ADMIN_PASSWORD=change-this-secure-password
```

---

**Need Help?** Check the deployment logs or see `DEPLOYMENT.md`

