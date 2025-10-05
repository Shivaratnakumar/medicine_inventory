-- =====================================================
-- FIX PGRST205 ERROR - SUPABASE SCHEMA CACHE ISSUE
-- This error means PostgREST can't find the table in its cache
-- =====================================================

-- 1. First, verify the table actually exists
SELECT 
    table_name, 
    table_schema,
    table_type
FROM information_schema.tables 
WHERE table_name = 'orders' 
    AND table_schema = 'public';

-- 2. Check table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check if there are any RLS policies that might be causing issues
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'orders';

-- 4. Try to access the table directly (this should work)
SELECT COUNT(*) as order_count FROM orders;

-- 5. If the table exists but PostgREST can't see it, try these fixes:

-- Option A: Grant permissions explicitly
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO service_role;

-- Option B: Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- Option C: Create a simple view to test
CREATE OR REPLACE VIEW orders_view AS
SELECT * FROM orders;

-- Grant permissions on the view
GRANT SELECT ON public.orders_view TO anon;
GRANT SELECT ON public.orders_view TO authenticated;
GRANT SELECT ON public.orders_view TO service_role;

-- 6. Force refresh the PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- 7. Alternative: Try to recreate the table (if it's safe to do so)
-- WARNING: This will delete existing data!
-- Uncomment only if you're sure you want to recreate the table

/*
-- Drop the table and recreate it
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;

-- Recreate orders table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255),
    customer_phone VARCHAR(20),
    customer_address TEXT,
    store_id UUID,
    user_id UUID,
    status order_status DEFAULT 'pending',
    total_amount DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recreate order_items table
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    medicine_id UUID,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Grant permissions
GRANT ALL ON public.orders TO anon, authenticated, service_role;
GRANT ALL ON public.order_items TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Insert sample data
INSERT INTO orders (order_number, customer_name, customer_email, customer_phone, total_amount, status) VALUES
('ORD001', 'John Doe', 'john@example.com', '+1-555-0101', 45.97, 'delivered'::order_status),
('ORD002', 'Jane Smith', 'jane@example.com', '+1-555-0102', 28.98, 'pending'::order_status),
('ORD003', 'Bob Johnson', 'bob@example.com', '+1-555-0103', 67.95, 'shipped'::order_status);

-- Force schema reload
NOTIFY pgrst, 'reload schema';
*/

-- 8. Test if the table is now accessible
SELECT 'Test query successful' as status, COUNT(*) as order_count FROM orders;

