#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Setting up Medicine Inventory Management System...\n');

// Check if Node.js is installed
try {
  const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
  console.log(`✅ Node.js version: ${nodeVersion}`);
} catch (error) {
  console.error('❌ Node.js is not installed. Please install Node.js first.');
  process.exit(1);
}

// Check if npm is installed
try {
  const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
  console.log(`✅ npm version: ${npmVersion}\n`);
} catch (error) {
  console.error('❌ npm is not installed. Please install npm first.');
  process.exit(1);
}

// Install dependencies
console.log('📦 Installing dependencies...\n');

try {
  console.log('Installing root dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  
  console.log('\nInstalling server dependencies...');
  execSync('cd server && npm install', { stdio: 'inherit' });
  
  console.log('\nInstalling client dependencies...');
  execSync('cd client && npm install', { stdio: 'inherit' });
  
  console.log('\n✅ All dependencies installed successfully!\n');
} catch (error) {
  console.error('❌ Error installing dependencies:', error.message);
  process.exit(1);
}

// Create environment files
console.log('🔧 Setting up environment files...\n');

// Server .env
const serverEnvPath = path.join(__dirname, 'server', '.env');
if (!fs.existsSync(serverEnvPath)) {
  const serverEnvContent = `# Server Configuration
PORT=5000
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here_${Math.random().toString(36).substr(2, 9)}
JWT_EXPIRES_IN=7d

# Email Configuration (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Payment Configuration (Stripe)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# File Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
`;
  fs.writeFileSync(serverEnvPath, serverEnvContent);
  console.log('✅ Created server/.env file');
} else {
  console.log('⚠️  server/.env already exists, skipping...');
}

// Client .env
const clientEnvPath = path.join(__dirname, 'client', '.env');
if (!fs.existsSync(clientEnvPath)) {
  const clientEnvContent = `REACT_APP_API_URL=http://localhost:5000/api
`;
  fs.writeFileSync(clientEnvPath, clientEnvContent);
  console.log('✅ Created client/.env file');
} else {
  console.log('⚠️  client/.env already exists, skipping...');
}

console.log('\n🎉 Setup completed successfully!\n');

console.log('📋 Next steps:');
console.log('1. Set up your Supabase project:');
console.log('   - Go to https://supabase.com and create a new project');
console.log('   - Copy the database schema from database/schema.sql');
console.log('   - Run it in the Supabase SQL editor');
console.log('   - Update the SUPABASE_URL and keys in server/.env\n');

console.log('2. Start the development servers:');
console.log('   npm run dev\n');

console.log('3. Access the application:');
console.log('   - Frontend: http://localhost:3000');
console.log('   - Backend API: http://localhost:5000\n');

console.log('4. Default login credentials:');
console.log('   - Admin: admin@medicineinventory.com / admin123');
console.log('   - User: user@example.com / password123\n');

console.log('📚 For more information, check the README.md file');
console.log('🐛 If you encounter any issues, please check the troubleshooting section in README.md\n');

console.log('Happy coding! 🚀');
