# Database Persistence Setup Guide

## Problem
The database file gets cleared on each deployment because it's stored in the project directory, which is ephemeral.

## Solution
The database path now uses persistent storage locations that survive deployments.

## Railway Setup

### Option 1: Use Railway Volume (Recommended)

1. **Add a Volume to your Railway project:**
   - Go to your Railway project dashboard
   - Click on "New" → "Volume"
   - Name it: `database-storage`
   - Mount path: `/data`

2. **Set Environment Variable:**
   - Go to your Railway service settings
   - Add environment variable:
     ```
     RAILWAY_VOLUME_PATH=/data
     ```

3. **Redeploy:**
   - The database will now persist in `/data/factory_management.db`

### Option 2: Use Custom Path

1. **Set Environment Variable:**
   ```
   DATABASE_PATH=/path/to/persistent/storage/factory_management.db
   ```

2. **Make sure the directory exists and is writable**

## Environment Variables

The database path is determined in this order:

1. `DATABASE_PATH` - Custom path (highest priority)
2. `RAILWAY_VOLUME_PATH` - Railway volume path
3. `/data` - Default persistent storage directory
4. Project directory - Fallback for local development

## Verification

After setup, check the logs when the server starts. You should see:
```
📁 Database path: /data/factory_management.db
✅ Database connected successfully
📊 Database file: /data/factory_management.db
```

## Important Notes

- **Backup your database regularly** - Even with persistent storage, backups are important
- **The database file persists across deployments** - Your data will survive code updates
- **Local development** - Still uses the project directory (no changes needed)

## Alternative: Use PostgreSQL (Future)

For production, consider migrating to PostgreSQL:
- Railway offers PostgreSQL as a managed service
- More robust for production workloads
- Better concurrent access handling
- Built-in backup and replication

