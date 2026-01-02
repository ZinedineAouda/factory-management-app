// Script to kill process on port 3000
const { exec } = require('child_process');
const os = require('os');

const port = process.argv[2] || 3000;

if (os.platform() === 'win32') {
  // Windows
  exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
    if (error || !stdout) {
      console.log(`No process found on port ${port}`);
      return;
    }
    
    const lines = stdout.trim().split('\n');
    const pids = new Set();
    
    lines.forEach(line => {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      // Filter out invalid PIDs (0, empty, or non-numeric)
      if (pid && !isNaN(pid) && parseInt(pid) > 0) {
        pids.add(pid);
      }
    });
    
    if (pids.size === 0) {
      console.log(`No process found on port ${port}`);
      return;
    }
    
    if (pids.size === 0) {
      console.log(`No valid processes found on port ${port}`);
      return;
    }
    
    let killed = 0;
    pids.forEach(pid => {
      console.log(`Killing process ${pid} on port ${port}...`);
      exec(`taskkill /F /PID ${pid}`, (killError) => {
        if (killError) {
          // Ignore errors for system processes
          if (!killError.message.includes('critical system process')) {
            console.error(`Failed to kill process ${pid}:`, killError.message);
          }
        } else {
          console.log(`✓ Killed process ${pid}`);
          killed++;
        }
      });
    });
    
    setTimeout(() => {
      if (killed > 0) {
        console.log(`\n✅ Freed port ${port} (killed ${killed} process${killed > 1 ? 'es' : ''})`);
      }
    }, 1000);
  });
} else {
  // Unix/Linux/Mac
  exec(`lsof -ti:${port}`, (error, stdout) => {
    if (error || !stdout) {
      console.log(`No process found on port ${port}`);
      return;
    }
    
    const pids = stdout.trim().split('\n').filter(Boolean);
    pids.forEach(pid => {
      console.log(`Killing process ${pid} on port ${port}...`);
      exec(`kill -9 ${pid}`, (killError) => {
        if (killError) {
          console.error(`Failed to kill process ${pid}:`, killError.message);
        } else {
          console.log(`✓ Killed process ${pid}`);
        }
      });
    });
  });
}
