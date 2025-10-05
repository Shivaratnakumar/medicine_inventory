const axios = require('axios');

class ServerMonitor {
  constructor(serverUrl = 'http://localhost:5000') {
    this.serverUrl = serverUrl;
    this.isRunning = false;
    this.lastHealthCheck = null;
    this.consecutiveFailures = 0;
    this.maxFailures = 3;
  }

  async checkHealth() {
    try {
      const response = await axios.get(`${this.serverUrl}/health`, {
        timeout: 5000
      });
      
      const health = response.data;
      this.lastHealthCheck = new Date();
      this.consecutiveFailures = 0;
      
      if (health.status === 'OK') {
        console.log(`✅ Server healthy - Uptime: ${Math.floor(health.uptime)}s, Memory: ${Math.round(health.memory.heapUsed / 1024 / 1024)}MB`);
        this.isRunning = true;
        return true;
      } else {
        console.log(`⚠️ Server unhealthy - Status: ${health.status}, Database: ${health.database}`);
        this.isRunning = false;
        return false;
      }
    } catch (error) {
      this.consecutiveFailures++;
      this.isRunning = false;
      
      if (error.code === 'ECONNREFUSED') {
        console.log(`❌ Server not responding - Connection refused`);
      } else if (error.code === 'ETIMEDOUT') {
        console.log(`❌ Server timeout - Request took too long`);
      } else {
        console.log(`❌ Server health check failed: ${error.message}`);
      }
      
      if (this.consecutiveFailures >= this.maxFailures) {
        console.log(`🚨 Server has been down for ${this.consecutiveFailures} consecutive checks`);
      }
      
      return false;
    }
  }

  async startMonitoring(intervalMs = 30000) {
    console.log(`🔍 Starting server monitoring (checking every ${intervalMs/1000}s)`);
    
    // Initial check
    await this.checkHealth();
    
    // Set up interval
    setInterval(async () => {
      await this.checkHealth();
    }, intervalMs);
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      lastHealthCheck: this.lastHealthCheck,
      consecutiveFailures: this.consecutiveFailures
    };
  }
}

// If running directly, start monitoring
if (require.main === module) {
  const monitor = new ServerMonitor();
  monitor.startMonitoring(30000); // Check every 30 seconds
}

module.exports = ServerMonitor;
