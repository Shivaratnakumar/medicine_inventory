-- Add order_type column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_type VARCHAR(20) DEFAULT 'regular';

-- Update existing orders to have 'regular' type
UPDATE orders SET order_type = 'regular' WHERE order_type IS NULL;

-- Add constraint to ensure valid order types
ALTER TABLE orders ADD CONSTRAINT check_order_type 
CHECK (order_type IN ('regular', 'prescription'));

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_order_type ON orders(order_type);


