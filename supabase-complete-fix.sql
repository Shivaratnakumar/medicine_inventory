-- =====================================================
-- COMPLETE SUPABASE FIX - ALL TYPE CASTING ISSUES RESOLVED
-- This script fixes all potential type casting errors
-- =====================================================

-- 1. Check if tables exist and their structure
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('orders', 'order_items', 'medicines', 'users', 'billing', 'notifications') 
    AND table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- 2. Check current data counts
SELECT 
    'orders' as table_name, COUNT(*) as count FROM orders
UNION ALL
SELECT 
    'order_items' as table_name, COUNT(*) as count FROM order_items
UNION ALL
SELECT 
    'medicines' as table_name, COUNT(*) as count FROM medicines
UNION ALL
SELECT 
    'users' as table_name, COUNT(*) as count FROM users;

-- 3. Insert sample medicines (with proper type casting)
INSERT INTO medicines (name, generic_name, sku, description, manufacturer, price, cost_price, quantity_in_stock, minimum_stock_level, maximum_stock_level, expiry_date, prescription_required) 
SELECT * FROM (VALUES
    ('Paracetamol 500mg', 'Acetaminophen', 'MED001', 'Pain relief and fever reducer', 'PharmaCorp', 5.99, 2.50, 100, 20, 500, '2025-12-31'::date, false),
    ('Amoxicillin 250mg', 'Amoxicillin', 'MED002', 'Antibiotic for bacterial infections', 'MediPharm', 12.99, 6.00, 50, 10, 200, '2025-06-30'::date, true),
    ('Vitamin D3 1000IU', 'Cholecalciferol', 'MED003', 'Vitamin D supplement', 'NutriLife', 8.99, 4.00, 200, 30, 1000, '2026-03-15'::date, false),
    ('Aspirin 100mg', 'Acetylsalicylic acid', 'MED004', 'Blood thinner and pain relief', 'CardioMed', 3.99, 1.50, 25, 15, 300, '2025-09-30'::date, false),
    ('Albuterol Inhaler', 'Salbutamol', 'MED005', 'Bronchodilator for asthma', 'RespiraCorp', 25.99, 12.00, 8, 5, 100, '2025-08-15'::date, true)
) AS v(name, generic_name, sku, description, manufacturer, price, cost_price, quantity_in_stock, minimum_stock_level, maximum_stock_level, expiry_date, prescription_required)
WHERE NOT EXISTS (SELECT 1 FROM medicines WHERE sku = v.sku);

-- 4. Insert sample users (with proper enum casting)
INSERT INTO users (email, password_hash, first_name, last_name, role) 
SELECT 'admin@pharmacy.com', '$2a$10$do/iizLT8QIyQFXEKf8MJOjZH.h2N1omXE3UHpxecrbqVDmUgS14S', 'Admin', 'User', 'admin'::user_role
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@pharmacy.com');

INSERT INTO users (email, password_hash, first_name, last_name, role) 
SELECT 'user@example.com', '$2a$10$hlzRK2aQiuVocilr5LaOJOXFPvRxOD3fBtsgjEnZFXL2PvtYWVKg.', 'Demo', 'User', 'user'::user_role
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'user@example.com');

-- 5. Insert sample orders (with proper enum casting)
INSERT INTO orders (order_number, customer_name, customer_email, customer_phone, total_amount, status) 
SELECT * FROM (VALUES
    ('ORD001', 'John Doe', 'john@example.com', '+1-555-0101', 45.97, 'delivered'::order_status),
    ('ORD002', 'Jane Smith', 'jane@example.com', '+1-555-0102', 28.98, 'pending'::order_status),
    ('ORD003', 'Bob Johnson', 'bob@example.com', '+1-555-0103', 67.95, 'shipped'::order_status)
) AS v(order_number, customer_name, customer_email, customer_phone, total_amount, status)
WHERE NOT EXISTS (SELECT 1 FROM orders WHERE order_number = v.order_number);

-- 6. Insert sample order items
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

-- 7. Insert sample billing records (with proper enum and date casting)
INSERT INTO billing (invoice_number, customer_name, customer_email, total_amount, tax_amount, discount_amount, payment_status, due_date) 
SELECT * FROM (VALUES
    ('INV001', 'John Doe', 'john@example.com', 45.97, 3.68, 0.00, 'paid'::payment_status, '2025-01-31'::date),
    ('INV002', 'Jane Smith', 'jane@example.com', 28.98, 2.32, 5.00, 'pending'::payment_status, '2025-02-15'::date),
    ('INV003', 'Bob Johnson', 'bob@example.com', 67.95, 5.44, 0.00, 'paid'::payment_status, '2025-02-20'::date)
) AS v(invoice_number, customer_name, customer_email, total_amount, tax_amount, discount_amount, payment_status, due_date)
WHERE NOT EXISTS (SELECT 1 FROM billing WHERE invoice_number = v.invoice_number);

-- 8. Insert sample notifications (with proper enum casting)
INSERT INTO notifications (title, message, type, is_read, user_id) 
SELECT * FROM (VALUES
    ('Low Stock Alert', 'Paracetamol is running low (25 units remaining)', 'warning'::notification_type, false, (SELECT id FROM users WHERE email = 'admin@pharmacy.com' LIMIT 1)),
    ('Order Completed', 'Order ORD001 has been completed successfully', 'success'::notification_type, true, (SELECT id FROM users WHERE email = 'admin@pharmacy.com' LIMIT 1)),
    ('Medicine Expiring', 'Amoxicillin will expire in 30 days', 'info'::notification_type, false, (SELECT id FROM users WHERE email = 'admin@pharmacy.com' LIMIT 1))
) AS v(title, message, type, is_read, user_id)
WHERE NOT EXISTS (SELECT 1 FROM notifications WHERE title = v.title AND user_id = v.user_id);

-- 9. Test the exact query that your API uses
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

-- 10. Force refresh the schema cache
NOTIFY pgrst, 'reload schema';

-- 11. Final verification
SELECT 
    'SUCCESS' as status,
    'All tables populated with sample data' as message,
    (SELECT COUNT(*) FROM orders) as orders_count,
    (SELECT COUNT(*) FROM order_items) as order_items_count,
    (SELECT COUNT(*) FROM medicines) as medicines_count;

