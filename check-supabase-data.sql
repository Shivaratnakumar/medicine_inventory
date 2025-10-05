-- =====================================================
-- CHECK SUPABASE DATA - VERIFY DATA EXISTS
-- Run this to see what data is actually in your database
-- =====================================================

-- 1. Check if we have any data in each table
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'medicines' as table_name, COUNT(*) as count FROM medicines
UNION ALL
SELECT 'orders' as table_name, COUNT(*) as count FROM orders
UNION ALL
SELECT 'order_items' as table_name, COUNT(*) as count FROM order_items
UNION ALL
SELECT 'billing' as table_name, COUNT(*) as count FROM billing
UNION ALL
SELECT 'notifications' as table_name, COUNT(*) as count FROM notifications;

-- 2. Show actual orders data
SELECT 
    id,
    order_number,
    customer_name,
    customer_email,
    total_amount,
    status,
    created_at
FROM orders
ORDER BY created_at DESC;

-- 3. Show order items with medicine details
SELECT 
    oi.id,
    o.order_number,
    m.name as medicine_name,
    m.sku,
    oi.quantity,
    oi.unit_price,
    oi.total_price
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
JOIN medicines m ON oi.medicine_id = m.id
ORDER BY o.created_at DESC;

-- 4. Test the exact query that the API uses
SELECT 
    o.id,
    o.order_number,
    o.customer_name,
    o.customer_email,
    o.customer_phone,
    o.total_amount,
    o.status,
    o.created_at,
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
GROUP BY o.id, o.order_number, o.customer_name, o.customer_email, o.customer_phone, o.total_amount, o.status, o.created_at
ORDER BY o.created_at DESC;

-- 5. Check if there are any RLS (Row Level Security) policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('orders', 'order_items', 'medicines', 'users')
ORDER BY tablename, policyname;

