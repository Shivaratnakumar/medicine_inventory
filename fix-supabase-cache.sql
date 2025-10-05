-- =====================================================
-- FIX SUPABASE SCHEMA CACHE ISSUE
-- Run this to refresh the schema cache and verify tables
-- =====================================================

-- 1. First, let's verify the orders table exists and check its structure
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'orders' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check if the table has any data
SELECT COUNT(*) as order_count FROM orders;

-- 3. Check if order_items table exists
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'order_items' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Check if medicines table exists (needed for order_items)
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'medicines' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. If tables exist but are empty, insert sample data
-- Insert sample medicines first (if they don't exist)
INSERT INTO medicines (name, generic_name, sku, description, manufacturer, price, cost_price, quantity_in_stock, minimum_stock_level, maximum_stock_level, expiry_date, prescription_required) 
SELECT * FROM (VALUES
    ('Paracetamol 500mg', 'Acetaminophen', 'MED001', 'Pain relief and fever reducer', 'PharmaCorp', 5.99, 2.50, 100, 20, 500, '2025-12-31'::date, false),
    ('Amoxicillin 250mg', 'Amoxicillin', 'MED002', 'Antibiotic for bacterial infections', 'MediPharm', 12.99, 6.00, 50, 10, 200, '2025-06-30'::date, true),
    ('Vitamin D3 1000IU', 'Cholecalciferol', 'MED003', 'Vitamin D supplement', 'NutriLife', 8.99, 4.00, 200, 30, 1000, '2026-03-15'::date, false),
    ('Aspirin 100mg', 'Acetylsalicylic acid', 'MED004', 'Blood thinner and pain relief', 'CardioMed', 3.99, 1.50, 25, 15, 300, '2025-09-30'::date, false),
    ('Albuterol Inhaler', 'Salbutamol', 'MED005', 'Bronchodilator for asthma', 'RespiraCorp', 25.99, 12.00, 8, 5, 100, '2025-08-15'::date, true)
) AS v(name, generic_name, sku, description, manufacturer, price, cost_price, quantity_in_stock, minimum_stock_level, maximum_stock_level, expiry_date, prescription_required)
WHERE NOT EXISTS (SELECT 1 FROM medicines WHERE sku = v.sku);

-- Insert sample orders (if they don't exist)
INSERT INTO orders (order_number, customer_name, customer_email, customer_phone, total_amount, status) 
SELECT * FROM (VALUES
    ('ORD001', 'John Doe', 'john@example.com', '+1-555-0101', 45.97, 'delivered'::order_status),
    ('ORD002', 'Jane Smith', 'jane@example.com', '+1-555-0102', 28.98, 'pending'::order_status),
    ('ORD003', 'Bob Johnson', 'bob@example.com', '+1-555-0103', 67.95, 'shipped'::order_status)
) AS v(order_number, customer_name, customer_email, customer_phone, total_amount, status)
WHERE NOT EXISTS (SELECT 1 FROM orders WHERE order_number = v.order_number);

-- Insert sample order items (if they don't exist)
INSERT INTO order_items (order_id, medicine_id, quantity, unit_price, total_price) 
SELECT * FROM (VALUES
    ((SELECT id FROM orders WHERE order_number = 'ORD001' LIMIT 1), (SELECT id FROM medicines WHERE sku = 'MED001' LIMIT 1), 3, 5.99, 17.97),
    ((SELECT id FROM orders WHERE order_number = 'ORD001' LIMIT 1), (SELECT id FROM medicines WHERE sku = 'MED002' LIMIT 1), 2, 12.99, 25.98),
    ((SELECT id FROM orders WHERE order_number = 'ORD001' LIMIT 1), (SELECT id FROM medicines WHERE sku = 'MED003' LIMIT 1), 1, 8.99, 8.99),
    ((SELECT id FROM orders WHERE order_number = 'ORD002' LIMIT 1), (SELECT id FROM medicines WHERE sku = 'MED004' LIMIT 1), 2, 3.99, 7.98),
    ((SELECT id FROM orders WHERE order_number = 'ORD002' LIMIT 1), (SELECT id FROM medicines WHERE sku = 'MED005' LIMIT 1), 1, 25.99, 25.99),
    ((SELECT id FROM orders WHERE order_number = 'ORD003' LIMIT 1), (SELECT id FROM medicines WHERE sku = 'MED001' LIMIT 1), 5, 5.99, 29.95),
    ((SELECT id FROM orders WHERE order_number = 'ORD003' LIMIT 1), (SELECT id FROM medicines WHERE sku = 'MED002' LIMIT 1), 3, 12.99, 38.97)
) AS v(order_id, medicine_id, quantity, unit_price, total_price)
WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = v.order_id AND medicine_id = v.medicine_id);

-- 6. Test the orders query that the API uses
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

-- 7. Force refresh the schema cache (this might help with PGRST205 error)
NOTIFY pgrst, 'reload schema';
