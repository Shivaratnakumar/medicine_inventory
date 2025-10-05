const fs = require('fs');
const path = require('path');

// Create .env file for server
const envContent = `# Server Configuration
PORT=5000
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=https://wjxlvmagozgkxlzjqmtc.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqeGx2bWFnb3pna3hsempxbXRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzOTA5MjEsImV4cCI6MjA3NDk2NjkyMX0.EhMQb84saPoKRRz9pyb_grV9BGQ3kAT0vb2MbUvXgkA
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqeGx2bWFnb3pna3hsempxbXRjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM5MDkyMSwiZXhwIjoyMDc0OTY2OTIxfQ.KApfAyILed4SlX7JQwG8RzrZNCdoW2DqqBCcmuDmoyE

# JWT Configuration
JWT_SECRET=Santosh@123
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
RATE_LIMIT_MAX_REQUESTS=100`;

// Write .env file
const envPath = path.join(__dirname, 'server', '.env');
fs.writeFileSync(envPath, envContent);
console.log('✅ Created server/.env file');

console.log(`
📋 Setup Instructions:

1. Copy the database/schema.sql content and run it in your Supabase SQL editor
2. Start the server: cd server && npm start
3. Start the client: cd client && npm start
4. Login with admin@pharmacy.com / admin123

The Orders page should now display the sample orders and the "New Order" functionality should work.
`);

