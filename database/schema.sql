-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'user', 'manager');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE support_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE notification_type AS ENUM ('info', 'warning', 'error', 'success');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role user_role DEFAULT 'user',
    phone VARCHAR(20),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stores table
CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Categories table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Medicines table
CREATE TABLE medicines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255),
    description TEXT,
    category_id UUID REFERENCES categories(id),
    manufacturer VARCHAR(255),
    batch_number VARCHAR(100),
    sku VARCHAR(100) UNIQUE NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    cost_price DECIMAL(10,2) NOT NULL,
    quantity_in_stock INTEGER DEFAULT 0,
    minimum_stock_level INTEGER DEFAULT 10,
    maximum_stock_level INTEGER DEFAULT 1000,
    expiry_date DATE NOT NULL,
    manufacturing_date DATE,
    prescription_required BOOLEAN DEFAULT false,
    image_url TEXT,
    barcode VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Store inventory table (for multi-store management)
CREATE TABLE store_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    medicine_id UUID REFERENCES medicines(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 0,
    minimum_stock_level INTEGER DEFAULT 10,
    maximum_stock_level INTEGER DEFAULT 1000,
    last_restocked TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(store_id, medicine_id)
);

-- Orders table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255),
    customer_phone VARCHAR(20),
    customer_address TEXT,
    store_id UUID REFERENCES stores(id),
    user_id UUID REFERENCES users(id),
    status order_status DEFAULT 'pending',
    total_amount DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order items table
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    medicine_id UUID REFERENCES medicines(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Billing table
CREATE TABLE billing (
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

-- Payments table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    billing_id UUID REFERENCES billing(id),
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_reference VARCHAR(100),
    stripe_payment_intent_id VARCHAR(255),
    status payment_status DEFAULT 'pending',
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type notification_type DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feedback table
CREATE TABLE feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    order_id UUID REFERENCES orders(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Support tickets table
CREATE TABLE support_tickets (
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

-- Support messages table
CREATE TABLE support_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    message TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit log table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_medicines_sku ON medicines(sku);
CREATE INDEX idx_medicines_name ON medicines(name);
CREATE INDEX idx_medicines_expiry ON medicines(expiry_date);
CREATE INDEX idx_medicines_stock ON medicines(quantity_in_stock);
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_billing_invoice_number ON billing(invoice_number);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medicines_updated_at BEFORE UPDATE ON medicines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_store_inventory_updated_at BEFORE UPDATE ON store_inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_billing_updated_at BEFORE UPDATE ON billing
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default categories
INSERT INTO categories (name, description) VALUES
('Antibiotics', 'Medicines that fight bacterial infections'),
('Pain Relief', 'Medicines for pain management'),
('Cardiovascular', 'Medicines for heart and blood vessel conditions'),
('Diabetes', 'Medicines for diabetes management'),
('Respiratory', 'Medicines for breathing conditions'),
('Digestive', 'Medicines for digestive system conditions'),
('Vitamins', 'Nutritional supplements and vitamins'),
('Topical', 'Medicines applied to the skin'),
('Eye Care', 'Medicines for eye conditions'),
('Other', 'Other miscellaneous medicines');

-- Insert default admin user (password: admin123)
INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES
('admin@pharmacy.com', '$2a$10$do/iizLT8QIyQFXEKf8MJOjZH.h2N1omXE3UHpxecrbqVDmUgS14S', 'Admin', 'User', 'admin');

-- Insert demo user (password: password123)
INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES
('user@example.com', '$2a$10$hlzRK2aQiuVocilr5LaOJOXFPvRxOD3fBtsgjEnZFXL2PvtYWVKg.', 'Demo', 'User', 'user');

-- Insert sample store
INSERT INTO stores (name, address, city, state, zip_code, phone, email) VALUES
('Main Pharmacy', '123 Main Street', 'New York', 'NY', '10001', '+1-555-0123', 'main@pharmacy.com');

-- Insert sample categories
INSERT INTO categories (name, description) VALUES
('Pain Relief', 'Medicines for pain management'),
('Antibiotics', 'Antibacterial medications'),
('Vitamins', 'Nutritional supplements'),
('Cardiovascular', 'Heart and blood vessel medications'),
('Respiratory', 'Lung and breathing medications');

-- Insert sample medicines
INSERT INTO medicines (name, generic_name, sku, description, manufacturer, price, cost_price, quantity_in_stock, minimum_stock_level, maximum_stock_level, expiry_date, prescription_required, category_id) VALUES
('Paracetamol 500mg', 'Acetaminophen', 'MED001', 'Pain relief and fever reducer', 'PharmaCorp', 5.99, 2.50, 100, 20, 500, '2025-12-31', false, (SELECT id FROM categories WHERE name = 'Pain Relief')),
('Amoxicillin 250mg', 'Amoxicillin', 'MED002', 'Antibiotic for bacterial infections', 'MediPharm', 12.99, 6.00, 50, 10, 200, '2025-06-30', true, (SELECT id FROM categories WHERE name = 'Antibiotics')),
('Vitamin D3 1000IU', 'Cholecalciferol', 'MED003', 'Vitamin D supplement', 'NutriLife', 8.99, 4.00, 200, 30, 1000, '2026-03-15', false, (SELECT id FROM categories WHERE name = 'Vitamins')),
('Aspirin 100mg', 'Acetylsalicylic acid', 'MED004', 'Blood thinner and pain relief', 'CardioMed', 3.99, 1.50, 25, 15, 300, '2025-09-30', false, (SELECT id FROM categories WHERE name = 'Cardiovascular')),
('Albuterol Inhaler', 'Salbutamol', 'MED005', 'Bronchodilator for asthma', 'RespiraCorp', 25.99, 12.00, 8, 5, 100, '2025-08-15', true, (SELECT id FROM categories WHERE name = 'Respiratory'));

-- Insert sample orders
INSERT INTO orders (order_number, customer_name, customer_email, customer_phone, total_amount, status) VALUES
('ORD001', 'John Doe', 'john@example.com', '+1-555-0101', 45.97, 'delivered'),
('ORD002', 'Jane Smith', 'jane@example.com', '+1-555-0102', 28.98, 'pending'),
('ORD003', 'Bob Johnson', 'bob@example.com', '+1-555-0103', 67.95, 'shipped');

-- Insert sample order items
INSERT INTO order_items (order_id, medicine_id, quantity, unit_price, total_price) VALUES
((SELECT id FROM orders WHERE order_number = 'ORD001'), (SELECT id FROM medicines WHERE sku = 'MED001'), 3, 5.99, 17.97),
((SELECT id FROM orders WHERE order_number = 'ORD001'), (SELECT id FROM medicines WHERE sku = 'MED002'), 2, 12.99, 25.98),
((SELECT id FROM orders WHERE order_number = 'ORD001'), (SELECT id FROM medicines WHERE sku = 'MED003'), 1, 8.99, 8.99),
((SELECT id FROM orders WHERE order_number = 'ORD002'), (SELECT id FROM medicines WHERE sku = 'MED004'), 2, 3.99, 7.98),
((SELECT id FROM orders WHERE order_number = 'ORD002'), (SELECT id FROM medicines WHERE sku = 'MED005'), 1, 25.99, 25.99),
((SELECT id FROM orders WHERE order_number = 'ORD003'), (SELECT id FROM medicines WHERE sku = 'MED001'), 5, 5.99, 29.95),
((SELECT id FROM orders WHERE order_number = 'ORD003'), (SELECT id FROM medicines WHERE sku = 'MED002'), 3, 12.99, 38.97);

-- Insert sample billing records
INSERT INTO billing (invoice_number, customer_name, customer_email, total_amount, tax_amount, discount_amount, payment_status, due_date) VALUES
('INV001', 'John Doe', 'john@example.com', 45.97, 3.68, 0.00, 'paid', '2025-01-31'),
('INV002', 'Jane Smith', 'jane@example.com', 28.98, 2.32, 5.00, 'pending', '2025-02-15'),
('INV003', 'Bob Johnson', 'bob@example.com', 67.95, 5.44, 0.00, 'paid', '2025-02-20');

-- Insert sample notifications
INSERT INTO notifications (title, message, type, is_read, user_id) VALUES
('Low Stock Alert', 'Paracetamol is running low (25 units remaining)', 'warning', false, (SELECT id FROM users WHERE email = 'admin@pharmacy.com')),
('Order Completed', 'Order ORD001 has been completed successfully', 'success', true, (SELECT id FROM users WHERE email = 'admin@pharmacy.com')),
('Medicine Expiring', 'Amoxicillin will expire in 30 days', 'info', false, (SELECT id FROM users WHERE email = 'admin@pharmacy.com'));

-- Create function to get low stock medicines
CREATE OR REPLACE FUNCTION get_low_stock_medicines()
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  generic_name VARCHAR,
  sku VARCHAR,
  description TEXT,
  manufacturer VARCHAR,
  price DECIMAL,
  cost_price DECIMAL,
  quantity_in_stock INTEGER,
  minimum_stock_level INTEGER,
  maximum_stock_level INTEGER,
  expiry_date DATE,
  prescription_required BOOLEAN,
  category_id UUID,
  is_active BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  categories JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.name,
    m.generic_name,
    m.sku,
    m.description,
    m.manufacturer,
    m.price,
    m.cost_price,
    m.quantity_in_stock,
    m.minimum_stock_level,
    m.maximum_stock_level,
    m.expiry_date,
    m.prescription_required,
    m.category_id,
    m.is_active,
    m.created_at,
    m.updated_at,
    jsonb_build_object('name', c.name) as categories
  FROM medicines m
  LEFT JOIN categories c ON m.category_id = c.id
  WHERE m.is_active = true 
    AND m.quantity_in_stock <= m.minimum_stock_level;
END;
$$ LANGUAGE plpgsql;
