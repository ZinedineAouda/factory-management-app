# Port 3000 Conflict Fix

## Problem
Sometimes when starting the backend server, you get an error:
```
Error: listen EADDRINUSE: address already in use :::3000
```

This happens when port 3000 is already occupied by another process (usually a previous instance of the server).

## Solutions

### Option 1: Automatic Fix (Recommended)
Use the `dev:clean` script which automatically kills any process on port 3000 and starts the server:

```bash
cd backend
npm run dev:clean
```

### Option 2: Manual Fix
If you just want to free the port without starting the server:

```bash
cd backend
npm run kill-port
```

Then start the server normally:
```bash
npm run dev
```

### Option 3: Manual Process Kill (Windows)
If the scripts don't work, you can manually find and kill the process:

1. Find the process:
   ```bash
   netstat -ano | findstr :3000
   ```

2. Kill the process (replace PID with the actual process ID):
   ```bash
   taskkill /F /PID <PID>
   ```

## Available Scripts

- `npm run dev` - Start development server (will fail if port is in use)
- `npm run dev:clean` - Automatically kill port 3000 and start server
- `npm run kill-port` - Just kill any process on port 3000

## Notes

- The `dev:clean` script is the easiest solution - use it whenever you get a port conflict error
- The server will now show helpful error messages if the port is in use
- The kill-port script automatically filters out system processes (PID 0)

