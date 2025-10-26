-- Supply Relationships Schema
-- This table manages the connections between your store (as supplier) and other medical stores

-- Create supply_relationships table
CREATE TABLE IF NOT EXISTS supply_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    customer_store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) DEFAULT 'supply', -- 'supply', 'partnership', 'exclusive'
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'pending', 'suspended'
    contract_start_date DATE,
    contract_end_date DATE,
    commission_rate DECIMAL(5,2) DEFAULT 0.00, -- Commission percentage for supplier
    credit_limit DECIMAL(10,2) DEFAULT 0.00,
    payment_terms VARCHAR(100) DEFAULT '30 days', -- '15 days', '30 days', '45 days', '60 days'
    contact_person VARCHAR(255),
    contact_phone VARCHAR(20),
    contact_email VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    
    -- Ensure unique relationship between stores
    UNIQUE(supplier_store_id, customer_store_id)
);

-- Create supply_orders table (extended orders for supply relationships)
CREATE TABLE IF NOT EXISTS supply_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    supply_relationship_id UUID REFERENCES supply_relationships(id) ON DELETE CASCADE,
    customer_store_id UUID REFERENCES stores(id),
    supplier_store_id UUID REFERENCES stores(id),
    order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expected_delivery_date DATE,
    actual_delivery_date DATE,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'
    total_amount DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    commission_amount DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Create supply_order_items table
CREATE TABLE IF NOT EXISTS supply_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supply_order_id UUID REFERENCES supply_orders(id) ON DELETE CASCADE,
    medicine_id UUID REFERENCES medicines(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    commission_rate DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create supply_payments table (extended payments for supply orders)
CREATE TABLE IF NOT EXISTS supply_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_number VARCHAR(50) UNIQUE NOT NULL,
    supply_order_id UUID REFERENCES supply_orders(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL, -- 'cash', 'card', 'upi', 'bank_transfer', 'cheque'
    payment_reference VARCHAR(100),
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_supply_relationships_supplier ON supply_relationships(supplier_store_id);
CREATE INDEX IF NOT EXISTS idx_supply_relationships_customer ON supply_relationships(customer_store_id);
CREATE INDEX IF NOT EXISTS idx_supply_relationships_status ON supply_relationships(status);
CREATE INDEX IF NOT EXISTS idx_supply_orders_relationship ON supply_orders(supply_relationship_id);
CREATE INDEX IF NOT EXISTS idx_supply_orders_customer ON supply_orders(customer_store_id);
CREATE INDEX IF NOT EXISTS idx_supply_orders_supplier ON supply_orders(supplier_store_id);
CREATE INDEX IF NOT EXISTS idx_supply_orders_date ON supply_orders(order_date);
CREATE INDEX IF NOT EXISTS idx_supply_orders_status ON supply_orders(status);
CREATE INDEX IF NOT EXISTS idx_supply_order_items_order ON supply_order_items(supply_order_id);
CREATE INDEX IF NOT EXISTS idx_supply_order_items_medicine ON supply_order_items(medicine_id);
CREATE INDEX IF NOT EXISTS idx_supply_payments_order ON supply_payments(supply_order_id);
CREATE INDEX IF NOT EXISTS idx_supply_payments_date ON supply_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_supply_payments_status ON supply_payments(status);

-- Grant permissions
GRANT ALL ON public.supply_relationships TO anon;
GRANT ALL ON public.supply_relationships TO authenticated;
GRANT ALL ON public.supply_relationships TO service_role;

GRANT ALL ON public.supply_orders TO anon;
GRANT ALL ON public.supply_orders TO authenticated;
GRANT ALL ON public.supply_orders TO service_role;

GRANT ALL ON public.supply_order_items TO anon;
GRANT ALL ON public.supply_order_items TO authenticated;
GRANT ALL ON public.supply_order_items TO service_role;

GRANT ALL ON public.supply_payments TO anon;
GRANT ALL ON public.supply_payments TO authenticated;
GRANT ALL ON public.supply_payments TO service_role;

-- Add RLS policies for security
ALTER TABLE supply_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE supply_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE supply_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE supply_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for supply_relationships
CREATE POLICY "Users can view supply relationships for their stores" ON supply_relationships
    FOR SELECT USING (
        supplier_store_id IN (
            SELECT id FROM stores WHERE manager_id = auth.uid()
        ) OR
        customer_store_id IN (
            SELECT id FROM stores WHERE manager_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert supply relationships for their stores" ON supply_relationships
    FOR INSERT WITH CHECK (
        supplier_store_id IN (
            SELECT id FROM stores WHERE manager_id = auth.uid()
        )
    );

CREATE POLICY "Users can update supply relationships for their stores" ON supply_relationships
    FOR UPDATE USING (
        supplier_store_id IN (
            SELECT id FROM stores WHERE manager_id = auth.uid()
        )
    );

-- RLS Policies for supply_orders
CREATE POLICY "Users can view supply orders for their stores" ON supply_orders
    FOR SELECT USING (
        supplier_store_id IN (
            SELECT id FROM stores WHERE manager_id = auth.uid()
        ) OR
        customer_store_id IN (
            SELECT id FROM stores WHERE manager_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert supply orders for their stores" ON supply_orders
    FOR INSERT WITH CHECK (
        supplier_store_id IN (
            SELECT id FROM stores WHERE manager_id = auth.uid()
        )
    );

CREATE POLICY "Users can update supply orders for their stores" ON supply_orders
    FOR UPDATE USING (
        supplier_store_id IN (
            SELECT id FROM stores WHERE manager_id = auth.uid()
        )
    );

-- RLS Policies for supply_order_items
CREATE POLICY "Users can view supply order items for their stores" ON supply_order_items
    FOR SELECT USING (
        supply_order_id IN (
            SELECT id FROM supply_orders WHERE 
            supplier_store_id IN (
                SELECT id FROM stores WHERE manager_id = auth.uid()
            ) OR
            customer_store_id IN (
                SELECT id FROM stores WHERE manager_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert supply order items for their stores" ON supply_order_items
    FOR INSERT WITH CHECK (
        supply_order_id IN (
            SELECT id FROM supply_orders WHERE 
            supplier_store_id IN (
                SELECT id FROM stores WHERE manager_id = auth.uid()
            )
        )
    );

-- RLS Policies for supply_payments
CREATE POLICY "Users can view supply payments for their stores" ON supply_payments
    FOR SELECT USING (
        supply_order_id IN (
            SELECT id FROM supply_orders WHERE 
            supplier_store_id IN (
                SELECT id FROM stores WHERE manager_id = auth.uid()
            ) OR
            customer_store_id IN (
                SELECT id FROM stores WHERE manager_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert supply payments for their stores" ON supply_payments
    FOR INSERT WITH CHECK (
        supply_order_id IN (
            SELECT id FROM supply_orders WHERE 
            supplier_store_id IN (
                SELECT id FROM stores WHERE manager_id = auth.uid()
            )
        )
    );


