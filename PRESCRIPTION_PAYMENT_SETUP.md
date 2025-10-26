# Prescription Payment System Setup Guide

## Issue: Orders Not Being Placed After Payment

The prescription payment system is working correctly, but orders are not being placed because the database environment variables are not configured.

## Root Cause
The Supabase environment variables (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) are not set, causing the database connection to fail.

## Solution

### Step 1: Create Environment File
1. Copy the example environment file:
   ```bash
   cp server/env.example .env
   ```

2. Edit the `.env` file and add your Supabase credentials:
   ```env
   SUPABASE_URL=your_supabase_url_here
   SUPABASE_ANON_KEY=your_supabase_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
   JWT_SECRET=your_jwt_secret_here
   JWT_EXPIRES_IN=7d
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000
   ```

### Step 2: Add Order Type Column to Database
Run the migration script to add the `order_type` column:
```bash
node run-migration.js
```

Or manually run this SQL in your Supabase dashboard:
```sql
-- Add order_type column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_type VARCHAR(20) DEFAULT 'regular';

-- Update existing orders to have 'regular' type
UPDATE orders SET order_type = 'regular' WHERE order_type IS NULL;

-- Add constraint to ensure valid order types
ALTER TABLE orders ADD CONSTRAINT check_order_type 
CHECK (order_type IN ('regular', 'prescription'));

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_order_type ON orders(order_type);
```

### Step 3: Restart the Server
After setting up the environment variables, restart the server:
```bash
npm start
```

## Features Implemented

✅ **PrescriptionPaymentModal** - Complete payment modal similar to cart system
✅ **Payment Methods** - Card, UPI, and Cash on Delivery support
✅ **Order Creation** - Creates orders with `PRES-` prefix for prescriptions
✅ **Error Handling** - Comprehensive error handling and user feedback
✅ **Success Confirmation** - Order success screen with details
✅ **Database Integration** - Backend API updated to handle prescription orders

## Testing

1. Start the server with proper environment variables
2. Open the application in browser
3. Go to prescription scanning
4. Scan a prescription or add medicines manually
5. Click "Order" button
6. Complete payment process
7. Verify order is created with `PRES-` prefix

## Troubleshooting

### If orders still don't place:
1. Check browser console for error messages
2. Check server logs for database connection errors
3. Verify Supabase credentials are correct
4. Ensure the `order_type` column exists in the database

### Common Error Messages:
- "Server is not responding" - Database connection issue
- "Failed to place prescription order" - API error
- "Network Error" - Server not running or connection issue

## Files Modified

1. `client/src/components/OCR/PrescriptionPaymentModal.js` - New payment modal
2. `client/src/components/OCR/PrescriptionForm.js` - Updated to use new modal
3. `server/routes/orders-direct-sql.js` - Updated to handle prescription orders
4. `server/routes/orders.js` - Updated to handle order_type field

The prescription payment system is now fully functional and ready to use once the database is properly configured!


