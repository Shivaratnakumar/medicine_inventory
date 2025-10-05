-- =====================================================
-- QUICK FIX FOR ORDERS PAGE
-- Run this if you already have the basic tables but missing order items
-- =====================================================

-- Ensure order_items table exists
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    medicine_id UUID REFERENCES medicines(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample order items (only if they don't exist)
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

-- Verify the data was inserted
SELECT 
    o.order_number,
    o.customer_name,
    o.total_amount,
    o.status,
    COUNT(oi.id) as item_count
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, o.order_number, o.customer_name, o.total_amount, o.status
ORDER BY o.created_at DESC;

