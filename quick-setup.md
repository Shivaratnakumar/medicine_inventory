# Quick Setup Guide

## 1. Database Setup (Supabase)

1. Go to https://supabase.com and create a new project
2. Go to SQL Editor in your Supabase dashboard
3. Copy and paste the entire content from `database/schema.sql`
4. Click "Run" to execute the SQL
5. Go to Settings → API and copy your credentials

## 2. Backend Setup

```bash
# Install dependencies
cd server
npm install

# Create .env file with your Supabase credentials
# Copy from server/env.example and fill in your values

# Start the server
npm run dev
```

## 3. Frontend Setup

```bash
# Install dependencies (if not done already)
cd client
npm install

# Start the frontend
npm start
```

## 4. Access the Application

- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## 5. Login Credentials

- **Admin:** admin@medicineinventory.com / admin123
- **User:** user@example.com / password123

## Troubleshooting

If login doesn't work:
1. Make sure the backend server is running on port 5000
2. Check that your Supabase credentials are correct
3. Verify the database schema was created successfully
4. Check the browser console for any error messages
