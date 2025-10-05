const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class ProcessManager {
  constructor() {
    this.serverProcess = null;
    this.restartCount = 0;
    this.maxRestarts = 5;
    this.restartDelay = 5000; // 5 seconds
    this.isShuttingDown = false;
  }

  startServer() {
    if (this.isShuttingDown) return;

    console.log(`🚀 Starting server (attempt ${this.restartCount + 1})`);
    
    this.serverProcess = spawn('node', ['index.js'], {
      cwd: __dirname,
      stdio: 'inherit',
      env: { ...process.env }
    });

    this.serverProcess.on('exit', (code, signal) => {
      console.log(`📤 Server process exited with code ${code}, signal ${signal}`);
      
      if (!this.isShuttingDown && this.restartCount < this.maxRestarts) {
        this.restartCount++;
        console.log(`🔄 Restarting server in ${this.restartDelay/1000} seconds...`);
        
        setTimeout(() => {
          this.startServer();
        }, this.restartDelay);
      } else if (this.restartCount >= this.maxRestarts) {
        console.log(`❌ Maximum restart attempts (${this.maxRestarts}) reached. Stopping.`);
        process.exit(1);
      }
    });

    this.serverProcess.on('error', (error) => {
      console.error(`❌ Server process error:`, error);
    });

    // Handle graceful shutdown
    process.on('SIGTERM', () => this.shutdown());
    process.on('SIGINT', () => this.shutdown());
  }

  shutdown() {
    console.log('🛑 Shutting down process manager...');
    this.isShuttingDown = true;
    
    if (this.serverProcess) {
      this.serverProcess.kill('SIGTERM');
      
      // Force kill after 10 seconds
      setTimeout(() => {
        if (this.serverProcess && !this.serverProcess.killed) {
          console.log('🔨 Force killing server process');
          this.serverProcess.kill('SIGKILL');
        }
        process.exit(0);
      }, 10000);
    } else {
      process.exit(0);
    }
  }

  getStatus() {
    return {
      isRunning: this.serverProcess && !this.serverProcess.killed,
      restartCount: this.restartCount,
      maxRestarts: this.maxRestarts,
      isShuttingDown: this.isShuttingDown
    };
  }
}

// If running directly, start the process manager
if (require.main === module) {
  const manager = new ProcessManager();
  manager.startServer();
  
  // Log status every minute
  setInterval(() => {
    const status = manager.getStatus();
    console.log(`📊 Process Manager Status:`, status);
  }, 60000);
}

module.exports = ProcessManager;
