# ✅ Deployment Verification Checklist

**Status:** BETA - Production  
**Use:** After deploying to verify everything works correctly

---

## 🔍 Pre-Deployment Checklist

### Frontend (Vercel)
- [ ] Code committed and pushed to repository
- [ ] `VITE_API_URL` environment variable set
- [ ] `VITE_API_URL` uses `https://` protocol
- [ ] `VITE_API_URL` includes `/api` suffix
- [ ] No localhost references in code
- [ ] Build command correct: `cd ../.. && npm install && npm run build:shared && cd packages/web && npm run build`
- [ ] Output directory: `dist`

### Backend (Railway)
- [ ] Code committed and pushed to repository
- [ ] `FRONTEND_URL` environment variable set
- [ ] `FRONTEND_URL` matches your Vercel URL
- [ ] `JWT_SECRET` environment variable set (min 32 chars)
- [ ] `NODE_ENV=production` set
- [ ] `RAILWAY_VOLUME_PATH=/data` set (for database persistence)
- [ ] Railway Volume added and mounted at `/data`
- [ ] Start command: `npm start`
- [ ] Build command: `npm run build`

---

## 🚀 Post-Deployment Verification

### Step 1: Check Backend Health
- [ ] Visit: `https://your-backend.up.railway.app/api/health`
- [ ] Should return: `{"status":"ok","message":"Factory Management API is running"}`
- [ ] Check Railway logs for:
  - [ ] `✅ Database connected successfully`
  - [ ] `📁 Database path: /data/factory_management.db` (or your custom path)
  - [ ] `✅ Environment variables validated`
  - [ ] No errors on startup

### Step 2: Check Frontend
- [ ] Visit your Vercel URL
- [ ] Page loads without errors
- [ ] Check browser console (F12):
  - [ ] No `localhost` references
  - [ ] No CORS errors
  - [ ] API calls go to correct backend URL
  - [ ] No 404 errors for assets

### Step 3: Test Authentication
- [ ] Login page loads
- [ ] Can login with admin account
- [ ] Redirects to correct dashboard
- [ ] Token stored in localStorage
- [ ] Can logout successfully

### Step 4: Test Critical Features
- [ ] **User Management:**
  - [ ] Can view users list
  - [ ] Can see pending users
  - [ ] Can approve user
  - [ ] Approved user can login

- [ ] **Permissions:**
  - [ ] Sidebar shows correct items
  - [ ] Cannot access pages without permission
  - [ ] Direct URL access blocked

- [ ] **Data Persistence:**
  - [ ] Create test data
  - [ ] Redeploy backend
  - [ ] Verify data still exists

### Step 5: Test Production URLs
- [ ] Open browser DevTools → Network tab
- [ ] Perform actions (login, create, etc.)
- [ ] Verify all API calls use production URL
- [ ] No `localhost` or `127.0.0.1` in requests
- [ ] All requests return 200/201 (not 404/500)

---

## 🐛 Common Issues & Solutions

### Issue: Frontend shows localhost in console
**Solution:**
1. Check `VITE_API_URL` in Vercel environment variables
2. Ensure it's set correctly
3. Redeploy frontend

### Issue: CORS errors
**Solution:**
1. Check `FRONTEND_URL` in Railway environment variables
2. Ensure it matches your Vercel URL exactly
3. No trailing slashes
4. Redeploy backend

### Issue: Database data lost on redeploy
**Solution:**
1. Check Railway Volume is mounted
2. Check `RAILWAY_VOLUME_PATH=/data` is set
3. Check backend logs for database path
4. Should show `/data/factory_management.db`

### Issue: Cannot login
**Solution:**
1. Check backend logs for errors
2. Verify JWT_SECRET is set
3. Check database is accessible
4. Verify admin account exists

### Issue: API calls fail
**Solution:**
1. Check `VITE_API_URL` is correct
2. Check backend is running (health endpoint)
3. Check CORS configuration
4. Check network tab for error details

---

## 📊 Verification Results Template

**Deployment Date:** _______________  
**Deployed By:** _______________  
**Frontend URL:** _______________  
**Backend URL:** _______________  

### Environment Variables
- [ ] Frontend: `VITE_API_URL` set correctly
- [ ] Backend: `FRONTEND_URL` set correctly
- [ ] Backend: `JWT_SECRET` set correctly
- [ ] Backend: `RAILWAY_VOLUME_PATH` set correctly

### Health Checks
- [ ] Backend health endpoint: ✅ / ❌
- [ ] Frontend loads: ✅ / ❌
- [ ] No console errors: ✅ / ❌
- [ ] No CORS errors: ✅ / ❌

### Functionality
- [ ] Login works: ✅ / ❌
- [ ] User management works: ✅ / ❌
- [ ] Permissions work: ✅ / ❌
- [ ] Data persists: ✅ / ❌

### Issues Found
(List any issues found)

### Notes
(Any additional notes)

---

## 🎯 Success Criteria

All items checked = ✅ Deployment Successful

If any items unchecked = ⚠️ Review and fix before considering production-ready

---

**Last Updated:** $(date)  
**Use After:** Every deployment

