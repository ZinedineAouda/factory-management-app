# Database Recovery Guide

## Problem
If your account was deleted after a code update, it's likely because the database path changed and the app started using a new empty database file instead of your existing one.

## Solution

### Step 1: Check Your Database Location

When your server starts, check the logs. You should see:
```
📁 Database path: /path/to/factory_management.db
```

### Step 2: Find Your Old Database

Your old database file might be in one of these locations:

1. **Project directory**: `backend/factory_management.db` (original location)
2. **Railway volume**: `/data/factory_management.db` (if volume is mounted)
3. **Custom path**: Check your `DATABASE_PATH` environment variable

### Step 3: Restore Your Database

**Option A: Set DATABASE_PATH Environment Variable**

1. Go to Railway → Your Service → Variables
2. Add environment variable:
   ```
   DATABASE_PATH=/path/to/your/existing/factory_management.db
   ```
3. Redeploy

**Option B: Copy Database to New Location**

If your database is in the project directory but Railway is using `/data`:

1. SSH into your Railway service (or use Railway CLI)
2. Copy the database:
   ```bash
   cp backend/factory_management.db /data/factory_management.db
   ```
3. Restart your service

**Option C: Use Railway Volume**

1. Add a Railway Volume to your project
2. Mount it at `/data`
3. Copy your database file to the volume
4. Set `RAILWAY_VOLUME_PATH=/data`

### Step 4: Verify Data Recovery

After restoring:

1. Check server logs - should show existing database path
2. Try logging in with your original credentials
3. Check that all your users/data are present

## Prevention

The updated code now:
- ✅ Checks for existing databases FIRST before creating new ones
- ✅ Preserves admin accounts during any cleanup
- ✅ Uses the same database file across deployments

## If You Still Can't Find Your Database

1. **Check Railway logs** for the database path being used
2. **Check if database exists** in the project directory
3. **Contact support** with your Railway service logs

## Important Notes

- **Never delete** the `factory_management.db` file manually
- **Always backup** your database before major updates
- **Set DATABASE_PATH** environment variable to lock the database location
- **Admin accounts are preserved** - they're never deleted automatically

