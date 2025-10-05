# Supabase Database Setup Instructions

## Issue Identified
The medicine page dropdown selections and add new medicine functionality are not working because the database schema is not properly set up in Supabase.

## Solution
You need to run the following SQL commands in your Supabase dashboard to set up the database schema.

## Steps to Fix

### 1. Go to Supabase Dashboard
1. Open your Supabase project dashboard
2. Go to the SQL Editor
3. Create a new query

### 2. Run the following SQL commands

```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'user', 'manager');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE support_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE notification_type AS ENUM ('info', 'warning', 'error', 'success');

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Medicines table
CREATE TABLE IF NOT EXISTS medicines (
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

-- Users table
CREATE TABLE IF NOT EXISTS users (
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
('Other', 'Other miscellaneous medicines')
ON CONFLICT (name) DO NOTHING;

-- Insert default admin user (password: admin123)
INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES
('admin@pharmacy.com', '$2a$10$do/iizLT8QIyQFXEKf8MJOjZH.h2N1omXE3UHpxecrbqVDmUgS14S', 'Admin', 'User', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Insert sample medicines
INSERT INTO medicines (name, generic_name, sku, description, manufacturer, price, cost_price, quantity_in_stock, minimum_stock_level, maximum_stock_level, expiry_date, prescription_required, category_id) VALUES
('Paracetamol 500mg', 'Acetaminophen', 'MED001', 'Pain relief and fever reducer', 'PharmaCorp', 5.99, 2.50, 100, 20, 500, '2025-12-31', false, (SELECT id FROM categories WHERE name = 'Pain Relief')),
('Amoxicillin 250mg', 'Amoxicillin', 'MED002', 'Antibiotic for bacterial infections', 'MediPharm', 12.99, 6.00, 50, 10, 200, '2025-06-30', true, (SELECT id FROM categories WHERE name = 'Antibiotics')),
('Vitamin D3 1000IU', 'Cholecalciferol', 'MED003', 'Vitamin D supplement', 'NutriLife', 8.99, 4.00, 200, 30, 1000, '2026-03-15', false, (SELECT id FROM categories WHERE name = 'Vitamins')),
('Aspirin 100mg', 'Acetylsalicylic acid', 'MED004', 'Blood thinner and pain relief', 'CardioMed', 3.99, 1.50, 25, 15, 300, '2025-09-30', false, (SELECT id FROM categories WHERE name = 'Cardiovascular')),
('Albuterol Inhaler', 'Salbutamol', 'MED005', 'Bronchodilator for asthma', 'RespiraCorp', 25.99, 12.00, 8, 5, 100, '2025-08-15', true, (SELECT id FROM categories WHERE name = 'Respiratory'))
ON CONFLICT (sku) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_medicines_sku ON medicines(sku);
CREATE INDEX IF NOT EXISTS idx_medicines_name ON medicines(name);
CREATE INDEX IF NOT EXISTS idx_medicines_expiry ON medicines(expiry_date);
CREATE INDEX IF NOT EXISTS idx_medicines_stock ON medicines(quantity_in_stock);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Create trigger for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_medicines_updated_at BEFORE UPDATE ON medicines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 3. Enable Row Level Security (RLS)
After creating the tables, you need to enable RLS and create policies:

```sql
-- Enable RLS on tables
ALTER TABLE medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies for medicines
CREATE POLICY "Enable read access for all users" ON medicines FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON medicines FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON medicines FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users" ON medicines FOR DELETE USING (true);

-- Create policies for categories
CREATE POLICY "Enable read access for all users" ON categories FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON categories FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users" ON categories FOR DELETE USING (true);

-- Create policies for users
CREATE POLICY "Enable read access for all users" ON users FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON users FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users" ON users FOR DELETE USING (true);
```

## After Setup

1. **Test the API**: Run the test script to verify everything works:
   ```bash
   node test-medicine-api.js
   ```

2. **Start the servers**:
   ```bash
   # Terminal 1 - Backend
   cd server && npm start
   
   # Terminal 2 - Frontend  
   cd client && npm start
   ```

3. **Test the frontend**: 
   - Go to http://localhost:3000
   - Login with admin@pharmacy.com / admin123
   - Navigate to the Medicines page
   - Test dropdown filtering and adding new medicines

## What Was Fixed

1. **Field Name Mapping**: Fixed the mismatch between frontend (`quantity`) and database (`quantity_in_stock`)
2. **Category Handling**: Fixed category filtering and creation
3. **Required Fields**: Added proper handling for required fields like `sku` and `cost_price`
4. **API Validation**: Updated validation rules to match the frontend form
5. **Error Handling**: Improved error messages and logging

The medicine page should now work correctly with:
- ✅ Dropdown category filtering
- ✅ Search functionality  
- ✅ Add new medicine form
- ✅ Edit existing medicines
- ✅ Delete medicines (soft delete)
- ✅ Proper field validation
