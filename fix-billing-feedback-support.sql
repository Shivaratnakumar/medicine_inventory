-- Fix for Billing, Feedback, and Support pages
-- This script creates the missing tables and inserts sample data

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types if they don't exist
DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE support_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM ('info', 'warning', 'error', 'success');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create billing table if it doesn't exist
CREATE TABLE IF NOT EXISTS billing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    order_id UUID REFERENCES orders(id),
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255),
    customer_address TEXT,
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_status payment_status DEFAULT 'pending',
    payment_method VARCHAR(50),
    payment_reference VARCHAR(100),
    due_date DATE,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create feedback table if it doesn't exist
CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    order_id UUID REFERENCES orders(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create support_tickets table if it doesn't exist
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id),
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status support_status DEFAULT 'open',
    priority VARCHAR(20) DEFAULT 'medium',
    assigned_to UUID REFERENCES users(id),
    resolution TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type notification_type DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample billing records
INSERT INTO billing (invoice_number, customer_name, customer_email, total_amount, tax_amount, discount_amount, payment_status, due_date) 
SELECT * FROM (VALUES
    ('INV001', 'John Doe', 'john@example.com', 45.97, 3.68, 0.00, 'paid'::payment_status, '2025-01-31'::date),
    ('INV002', 'Jane Smith', 'jane@example.com', 28.98, 2.32, 5.00, 'pending'::payment_status, '2025-02-15'::date),
    ('INV003', 'Bob Johnson', 'bob@example.com', 67.95, 5.44, 0.00, 'paid'::payment_status, '2025-02-20'::date),
    ('INV004', 'Alice Brown', 'alice@example.com', 89.50, 7.16, 10.00, 'pending'::payment_status, '2025-02-25'::date),
    ('INV005', 'Charlie Wilson', 'charlie@example.com', 156.75, 12.54, 0.00, 'failed'::payment_status, '2025-01-15'::date)
) AS v(invoice_number, customer_name, customer_email, total_amount, tax_amount, discount_amount, payment_status, due_date)
WHERE NOT EXISTS (SELECT 1 FROM billing WHERE invoice_number = v.invoice_number);

-- Insert sample feedback records
INSERT INTO feedback (user_id, order_id, rating, comment, is_public) 
SELECT * FROM (VALUES
    ((SELECT id FROM users WHERE email = 'admin@pharmacy.com' LIMIT 1), (SELECT id FROM orders WHERE order_number = 'ORD001' LIMIT 1), 5, 'Excellent service! Fast delivery and great quality medicines.', true),
    ((SELECT id FROM users WHERE email = 'user@example.com' LIMIT 1), (SELECT id FROM orders WHERE order_number = 'ORD002' LIMIT 1), 4, 'Good experience overall. Could improve on packaging.', true),
    ((SELECT id FROM users WHERE email = 'admin@pharmacy.com' LIMIT 1), (SELECT id FROM orders WHERE order_number = 'ORD003' LIMIT 1), 3, 'Average service. Some delays in processing.', true),
    ((SELECT id FROM users WHERE email = 'user@example.com' LIMIT 1), NULL, 5, 'Great customer support team!', true),
    ((SELECT id FROM users WHERE email = 'admin@pharmacy.com' LIMIT 1), NULL, 4, 'Good selection of medicines available.', true)
) AS v(user_id, order_id, rating, comment, is_public)
WHERE NOT EXISTS (SELECT 1 FROM feedback WHERE user_id = v.user_id AND (order_id = v.order_id OR (order_id IS NULL AND v.order_id IS NULL)));

-- Insert sample support tickets
INSERT INTO support_tickets (ticket_number, user_id, subject, description, status, priority) 
SELECT * FROM (VALUES
    ('TKT001', (SELECT id FROM users WHERE email = 'user@example.com' LIMIT 1), 'Order not delivered', 'My order ORD002 was supposed to be delivered yesterday but I haven\'t received it yet.', 'open'::support_status, 'high'),
    ('TKT002', (SELECT id FROM users WHERE email = 'admin@pharmacy.com' LIMIT 1), 'Payment issue', 'I\'m having trouble processing payment for my recent order. The payment keeps failing.', 'in_progress'::support_status, 'medium'),
    ('TKT003', (SELECT id FROM users WHERE email = 'user@example.com' LIMIT 1), 'Medicine quality concern', 'The medicine I received seems to be expired. Can you please check this?', 'resolved'::support_status, 'high'),
    ('TKT004', (SELECT id FROM users WHERE email = 'admin@pharmacy.com' LIMIT 1), 'Account access issue', 'I cannot log into my account. Getting authentication errors.', 'closed'::support_status, 'low'),
    ('TKT005', (SELECT id FROM users WHERE email = 'user@example.com' LIMIT 1), 'Refund request', 'I need to return some medicines and get a refund. What is the process?', 'open'::support_status, 'medium')
) AS v(ticket_number, user_id, subject, description, status, priority)
WHERE NOT EXISTS (SELECT 1 FROM support_tickets WHERE ticket_number = v.ticket_number);

-- Insert sample notifications
INSERT INTO notifications (title, message, type, is_read, user_id) 
SELECT * FROM (VALUES
    ('New Support Ticket', 'A new support ticket TKT001 has been created', 'info'::notification_type, false, (SELECT id FROM users WHERE email = 'admin@pharmacy.com' LIMIT 1)),
    ('Payment Received', 'Payment for invoice INV001 has been received', 'success'::notification_type, true, (SELECT id FROM users WHERE email = 'admin@pharmacy.com' LIMIT 1)),
    ('Low Stock Alert', 'Some medicines are running low on stock', 'warning'::notification_type, false, (SELECT id FROM users WHERE email = 'admin@pharmacy.com' LIMIT 1)),
    ('Order Status Update', 'Your order ORD002 status has been updated', 'info'::notification_type, false, (SELECT id FROM users WHERE email = 'user@example.com' LIMIT 1)),
    ('Feedback Received', 'New feedback has been submitted', 'info'::notification_type, false, (SELECT id FROM users WHERE email = 'admin@pharmacy.com' LIMIT 1))
) AS v(title, message, type, is_read, user_id)
WHERE NOT EXISTS (SELECT 1 FROM notifications WHERE title = v.title AND user_id = v.user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_billing_invoice_number ON billing(invoice_number);
CREATE INDEX IF NOT EXISTS idx_billing_payment_status ON billing(payment_status);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_rating ON feedback(rating);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_billing_updated_at ON billing;
CREATE TRIGGER update_billing_updated_at BEFORE UPDATE ON billing
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_support_tickets_updated_at ON support_tickets;
CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Force refresh the schema cache
NOTIFY pgrst, 'reload schema';

-- Final verification
SELECT 
    'SUCCESS' as status,
    'Billing, Feedback, and Support tables created and populated' as message,
    (SELECT COUNT(*) FROM billing) as billing_count,
    (SELECT COUNT(*) FROM feedback) as feedback_count,
    (SELECT COUNT(*) FROM support_tickets) as support_tickets_count,
    (SELECT COUNT(*) FROM notifications) as notifications_count;
