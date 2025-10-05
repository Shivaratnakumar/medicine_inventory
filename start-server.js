#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting Medicine Inventory Server with Enhanced Stability...\n');

// Check if .env file exists
const envPath = path.join(__dirname, 'server', '.env');
if (!fs.existsSync(envPath)) {
  console.log('⚠️  No .env file found. Please create one based on server/env.example');
  console.log('   Copy server/env.example to server/.env and update the values\n');
}

// Check if node_modules exists
const nodeModulesPath = path.join(__dirname, 'server', 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.log('📦 Installing server dependencies...');
  const install = spawn('npm', ['install'], { 
    cwd: path.join(__dirname, 'server'),
    stdio: 'inherit' 
  });
  
  install.on('close', (code) => {
    if (code === 0) {
      startServer();
    } else {
      console.error('❌ Failed to install dependencies');
      process.exit(1);
    }
  });
} else {
  startServer();
}

function startServer() {
  console.log('🔧 Starting server with process management...\n');
  
  // Start the server with process management
  const server = spawn('node', ['process-manager.js'], {
    cwd: path.join(__dirname, 'server'),
    stdio: 'inherit',
    env: { ...process.env }
  });

  server.on('exit', (code) => {
    console.log(`\n📤 Server process exited with code ${code}`);
    process.exit(code);
  });

  server.on('error', (error) => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  });

  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    server.kill('SIGTERM');
  });

  process.on('SIGINT', () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...');
    server.kill('SIGTERM');
  });
}
