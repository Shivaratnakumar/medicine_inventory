-- =====================================================
-- RECREATE ORDERS TABLES - SAFE APPROACH
-- This will recreate only the orders-related tables
-- =====================================================

-- 1. First, let's backup any existing data
CREATE TABLE IF NOT EXISTS orders_backup AS 
SELECT * FROM orders WHERE 1=0; -- Create empty backup table with same structure

-- 2. Drop dependent tables first (order_items)
DROP TABLE IF EXISTS order_items CASCADE;

-- 3. Drop the orders table
DROP TABLE IF EXISTS orders CASCADE;

-- 4. Recreate orders table with proper structure
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

-- 5. Recreate order_items table
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    medicine_id UUID,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Grant ALL permissions explicitly
GRANT ALL ON public.orders TO anon;
GRANT ALL ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;

GRANT ALL ON public.order_items TO anon;
GRANT ALL ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;

GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- 7. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- 8. Insert sample data
INSERT INTO orders (order_number, customer_name, customer_email, customer_phone, total_amount, status) VALUES
('ORD001', 'John Doe', 'john@example.com', '+1-555-0101', 45.97, 'delivered'::order_status),
('ORD002', 'Jane Smith', 'jane@example.com', '+1-555-0102', 28.98, 'pending'::order_status),
('ORD003', 'Bob Johnson', 'bob@example.com', '+1-555-0103', 67.95, 'shipped'::order_status);

-- 9. Insert sample order items (if medicines exist)
INSERT INTO order_items (order_id, medicine_id, quantity, unit_price, total_price) 
SELECT 
    o.id,
    m.id,
    CASE 
        WHEN o.order_number = 'ORD001' THEN 3
        WHEN o.order_number = 'ORD002' THEN 2
        WHEN o.order_number = 'ORD003' THEN 5
    END,
    m.price,
    m.price * CASE 
        WHEN o.order_number = 'ORD001' THEN 3
        WHEN o.order_number = 'ORD002' THEN 2
        WHEN o.order_number = 'ORD003' THEN 5
    END
FROM orders o
CROSS JOIN medicines m
WHERE m.sku = 'MED001' -- Use first available medicine
LIMIT 3;

-- 10. Force PostgREST schema reload
NOTIFY pgrst, 'reload schema';

-- 11. Test the tables
SELECT 'Orders table created successfully' as status, COUNT(*) as order_count FROM orders;
SELECT 'Order items table created successfully' as status, COUNT(*) as item_count FROM order_items;

-- 12. Test the exact query your API uses
SELECT 
    o.*,
    COALESCE(
        json_agg(
            json_build_object(
                'id', oi.id,
                'quantity', oi.quantity,
                'unit_price', oi.unit_price,
                'total_price', oi.total_price,
                'medicines', json_build_object(
                    'name', m.name,
                    'sku', m.sku
                )
            )
        ) FILTER (WHERE oi.id IS NOT NULL),
        '[]'::json
    ) as order_items
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN medicines m ON oi.medicine_id = m.id
GROUP BY o.id
ORDER BY o.created_at DESC;

