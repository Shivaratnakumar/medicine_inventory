-- Create missing tables for Medicine Inventory Management System

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255),
    customer_phone VARCHAR(20),
    customer_address TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    total_amount DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Billing table
CREATE TABLE IF NOT EXISTS billing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    order_id UUID REFERENCES orders(id),
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255),
    customer_address TEXT,
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'pending',
    payment_method VARCHAR(50),
    payment_reference VARCHAR(100),
    due_date DATE,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stores table
CREATE TABLE IF NOT EXISTS stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    zip_code VARCHAR(20) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    manager_id UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Support tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id),
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'open',
    priority VARCHAR(20) DEFAULT 'medium',
    assigned_to UUID REFERENCES users(id),
    resolution TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample data

-- Sample orders
INSERT INTO orders (order_number, customer_name, customer_email, customer_phone, total_amount, status) VALUES
('ORD001', 'John Doe', 'john@example.com', '+1-555-0101', 45.97, 'delivered'),
('ORD002', 'Jane Smith', 'jane@example.com', '+1-555-0102', 28.98, 'pending'),
('ORD003', 'Bob Johnson', 'bob@example.com', '+1-555-0103', 67.95, 'shipped');

-- Sample stores
INSERT INTO stores (name, address, city, state, zip_code, phone, email) VALUES
('Main Pharmacy', '123 Main Street', 'New York', 'NY', '10001', '+1-555-0123', 'main@pharmacy.com'),
('Downtown Branch', '456 Oak Avenue', 'New York', 'NY', '10002', '+1-555-0124', 'downtown@pharmacy.com');

-- Sample notifications
INSERT INTO notifications (user_id, title, message, type) VALUES
((SELECT id FROM users WHERE email = 'admin@pharmacy.com'), 'Welcome to MedInventory', 'Welcome to the Medicine Inventory Management System!', 'info'),
((SELECT id FROM users WHERE email = 'admin@pharmacy.com'), 'System Update', 'The system has been updated with new features.', 'success'),
((SELECT id FROM users WHERE email = 'admin@pharmacy.com'), 'Low Stock Alert', 'Some medicines are running low on stock.', 'warning');

-- Sample support tickets
INSERT INTO support_tickets (ticket_number, user_id, subject, description, status, priority) VALUES
('TKT001', (SELECT id FROM users WHERE email = 'admin@pharmacy.com'), 'Login Issue', 'Having trouble logging into the system', 'open', 'high'),
('TKT002', (SELECT id FROM users WHERE email = 'admin@pharmacy.com'), 'Feature Request', 'Would like to add bulk import functionality', 'open', 'medium'),
('TKT003', (SELECT id FROM users WHERE email = 'admin@pharmacy.com'), 'Bug Report', 'Medicines page not loading properly', 'resolved', 'high');
