# Admin Account Preservation

## Overview
The system now **ALWAYS preserves admin accounts** during any database operations. Admin accounts are never deleted, even when clearing all users.

## Features

### 1. **Automatic Admin Account Creation**
- Admin account is automatically created if it doesn't exist
- Uses environment variables for credentials (if set)
- Default credentials: `admin` / `admin1234`

### 2. **Admin Account Preservation**
- **ALL admin accounts are preserved** during cleanup operations
- Admin accounts are never deleted, even in `clearAllUsers()`
- Admin status is automatically set to `active` if it's not

### 3. **Environment Variables**

You can customize admin credentials using environment variables:

```bash
ADMIN_USERNAME=admin          # Default: 'admin'
ADMIN_PASSWORD=yourpassword    # Default: 'admin1234'
ADMIN_EMAIL=admin@factory.com # Default: 'admin@factory.com'
```

**⚠️ Important:** Set these in your Railway/Vercel environment variables for production!

## How It Works

### Database Initialization
- On startup, `ensureAdminAccount()` is called
- Checks if admin account exists
- Creates it if missing
- Ensures it's active

### Clear All Users
- `clearAllUsers()` now preserves ALL admin accounts
- Only non-admin users are deleted
- Admin accounts are logged and protected

### User Cleanup
- `cleanupUsersExceptAdmin()` already preserves admin
- Any cleanup operation respects admin accounts

## Safety Features

1. **Multiple Admin Support**: All admin accounts are preserved (not just one)
2. **Automatic Recovery**: If admin is accidentally deleted, it's recreated on next startup
3. **Status Protection**: Admin accounts are always set to `active`
4. **Task Reassignment**: When users are deleted, their tasks are reassigned to admin (not deleted)

## Testing

To verify admin preservation:

1. **Check logs on startup:**
   ```
   🔐 Creating admin account (username: admin)...
   ✅ Admin account created successfully
   ```

2. **After clearing users:**
   ```
   🔒 Preserving 1 admin account(s): admin
   ✅ Successfully deleted X non-admin user(s) (1 admin account(s) preserved)
   ```

## Production Setup

**Set these environment variables in Railway:**

1. Go to your Railway project → Variables
2. Add:
   - `ADMIN_USERNAME` = your admin username
   - `ADMIN_PASSWORD` = your secure password
   - `ADMIN_EMAIL` = your admin email

**⚠️ Security Note:** 
- Change default password in production!
- Use strong passwords
- Keep admin credentials secure

## What Gets Preserved

✅ **Always Preserved:**
- All users with `role = 'admin'`
- Admin account status (always `active`)
- Admin account credentials

❌ **Can Be Deleted:**
- Non-admin users (workers, operators, leaders)
- Pending users
- Inactive users (except admin)

## Code Functions

- `ensureAdminAccount()` - Creates/ensures admin exists
- `clearAllUsers()` - Clears all users EXCEPT admin
- `cleanupUsersExceptAdmin()` - Cleans up users except admin

All these functions respect admin accounts and never delete them.

