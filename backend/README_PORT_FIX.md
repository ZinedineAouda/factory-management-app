# Port 3000 Conflict - Permanent Fix

## Problem
Sometimes when starting the backend server, you get an error:
```
Error: listen EADDRINUSE: address already in use :::3000
```

## Solution
The `npm run dev` command now automatically kills any process using port 3000 before starting the server.

## How It Works
1. **`scripts/kill-port.js`** - Finds and kills any process using port 3000
2. **`scripts/start-dev.js`** - Runs kill-port.js first, then starts the dev server
3. **`package.json`** - The `dev` script now uses `start-dev.js`

## Usage
Just run:
```bash
npm run dev
```

The script will automatically:
- ✅ Check if port 3000 is in use
- ✅ Kill any process using it
- ✅ Start the development server

## Manual Port Kill (if needed)
If you need to kill port 3000 manually:
```bash
npm run kill-port
```

Or specify a different port:
```bash
node scripts/kill-port.js 3000
```

## Alternative: Use Old Dev Command
If you want to use the old dev command (without auto-kill):
```bash
npm run dev:old
```




