// Auto-start script that kills port and starts dev server
const { exec } = require('child_process');
const path = require('path');

console.log('🔧 Checking port 3000...\n');

// First, kill any process on port 3000
const killScript = path.join(__dirname, 'kill-port.js');
exec(`node "${killScript}" 3000`, (error) => {
  // Wait a moment for port to be freed
  setTimeout(() => {
    console.log('\n🚀 Starting development server...\n');
    // Start the dev server
    const devProcess = exec('npm run dev', {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit'
    });
    
    devProcess.on('error', (err) => {
      console.error('Failed to start dev server:', err);
      process.exit(1);
    });
  }, 2000);
});
