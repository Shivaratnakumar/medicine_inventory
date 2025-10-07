-- Medicine Names Table Compatible with Existing Medicines Table
-- Run this script in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create the medicine_names table with same structure as medicines table
CREATE TABLE IF NOT EXISTS medicine_names (
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Additional fields for autocomplete and fuzzy search
    brand_name VARCHAR(255),
    common_names TEXT[],
    search_vector tsvector,
    popularity_score INTEGER DEFAULT 0,
    
    CONSTRAINT unique_medicine_name UNIQUE (name)
);

-- Create indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_medicine_names_name ON medicine_names(name);
CREATE INDEX IF NOT EXISTS idx_medicine_names_generic ON medicine_names(generic_name);
CREATE INDEX IF NOT EXISTS idx_medicine_names_brand ON medicine_names(brand_name);
CREATE INDEX IF NOT EXISTS idx_medicine_names_manufacturer ON medicine_names(manufacturer);
CREATE INDEX IF NOT EXISTS idx_medicine_names_sku ON medicine_names(sku);
CREATE INDEX IF NOT EXISTS idx_medicine_names_search_vector ON medicine_names USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_medicine_names_popularity ON medicine_names(popularity_score DESC);
CREATE INDEX IF NOT EXISTS idx_medicine_names_active ON medicine_names(is_active);
CREATE INDEX IF NOT EXISTS idx_medicine_names_category ON medicine_names(category_id);

-- Create GIN index for array search
CREATE INDEX IF NOT EXISTS idx_medicine_names_common_names ON medicine_names USING gin(common_names);

-- Create function to update search vector
CREATE OR REPLACE FUNCTION update_medicine_names_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector = to_tsvector('english', 
        COALESCE(NEW.name, '') || ' ' || 
        COALESCE(NEW.generic_name, '') || ' ' || 
        COALESCE(NEW.brand_name, '') || ' ' || 
        COALESCE(NEW.manufacturer, '') || ' ' ||
        COALESCE(NEW.description, '') || ' ' ||
        COALESCE(array_to_string(NEW.common_names, ' '), '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update search vector
DROP TRIGGER IF EXISTS update_medicine_names_search_vector_trigger ON medicine_names;
CREATE TRIGGER update_medicine_names_search_vector_trigger
    BEFORE INSERT OR UPDATE ON medicine_names
    FOR EACH ROW EXECUTE FUNCTION update_medicine_names_search_vector();

-- Create trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_medicine_names_updated_at ON medicine_names;
CREATE TRIGGER update_medicine_names_updated_at BEFORE UPDATE ON medicine_names
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample medicine names with same format as medicines table
INSERT INTO medicine_names (
    name, generic_name, description, manufacturer, sku, price, cost_price, 
    quantity_in_stock, minimum_stock_level, maximum_stock_level, 
    expiry_date, prescription_required, brand_name, common_names, popularity_score
) VALUES
('Paracetamol 500mg', 'Acetaminophen', 'Pain relief and fever reducer', 'PharmaCorp', 'MED001', 5.99, 2.50, 100, 20, 500, '2025-12-31', false, 'Tylenol', ARRAY['Panadol', 'Calpol', 'Tempra'], 100),
('Ibuprofen 400mg', 'Ibuprofen', 'Anti-inflammatory pain relief', 'MediPharm', 'MED002', 8.99, 4.00, 50, 10, 200, '2025-06-30', false, 'Advil', ARRAY['Motrin', 'Nurofen', 'Brufen'], 95),
('Amoxicillin 250mg', 'Amoxicillin', 'Antibiotic for bacterial infections', 'MediPharm', 'MED003', 12.99, 6.00, 50, 10, 200, '2025-06-30', true, 'Amoxil', ARRAY['Amox', 'Moxatag'], 90),
('Aspirin 100mg', 'Acetylsalicylic acid', 'Blood thinner and pain relief', 'CardioMed', 'MED004', 3.99, 1.50, 25, 15, 300, '2025-09-30', false, 'Bayer', ARRAY['ASA', 'Aspirin'], 85),
('Metformin 500mg', 'Metformin', 'Diabetes medication', 'DiabCare', 'MED005', 4.99, 2.00, 200, 30, 1000, '2026-03-15', true, 'Glucophage', ARRAY['Glucophage', 'Fortamet'], 80),
('Lisinopril 10mg', 'Lisinopril', 'ACE inhibitor for blood pressure', 'CardioMed', 'MED006', 6.99, 3.00, 75, 20, 400, '2025-08-15', true, 'Prinivil', ARRAY['Zestril', 'Qbrelis'], 75),
('Atorvastatin 20mg', 'Atorvastatin', 'Cholesterol lowering medication', 'CardioMed', 'MED007', 15.99, 8.00, 60, 15, 300, '2025-11-30', true, 'Lipitor', ARRAY['Lipitor', 'Torvast'], 70),
('Omeprazole 20mg', 'Omeprazole', 'Proton pump inhibitor for acid reflux', 'DigestCorp', 'MED008', 9.99, 5.00, 80, 25, 500, '2025-10-20', false, 'Prilosec', ARRAY['Prilosec', 'Losec'], 65),
('Amlodipine 5mg', 'Amlodipine', 'Calcium channel blocker for blood pressure', 'CardioMed', 'MED009', 7.99, 4.00, 70, 20, 350, '2025-09-15', true, 'Norvasc', ARRAY['Norvasc', 'Istin'], 60),
('Simvastatin 20mg', 'Simvastatin', 'Cholesterol lowering medication', 'CardioMed', 'MED010', 12.99, 6.50, 55, 15, 300, '2025-12-10', true, 'Zocor', ARRAY['Zocor', 'Simvacor'], 55),
('Losartan 50mg', 'Losartan', 'ARB for blood pressure management', 'CardioMed', 'MED011', 8.99, 4.50, 65, 20, 400, '2025-07-25', true, 'Cozaar', ARRAY['Cozaar', 'Losar'], 50),
('Hydrochlorothiazide 25mg', 'Hydrochlorothiazide', 'Diuretic for blood pressure', 'CardioMed', 'MED012', 3.99, 2.00, 90, 30, 500, '2025-08-30', true, 'Microzide', ARRAY['HCTZ', 'Microzide'], 45),
('Metoprolol 50mg', 'Metoprolol', 'Beta blocker for heart conditions', 'CardioMed', 'MED013', 6.99, 3.50, 70, 20, 350, '2025-09-20', true, 'Lopressor', ARRAY['Lopressor', 'Toprol'], 40),
('Sertraline 50mg', 'Sertraline', 'SSRI antidepressant', 'PsychMed', 'MED014', 11.99, 6.00, 45, 15, 200, '2025-10-15', true, 'Zoloft', ARRAY['Zoloft', 'Lustral'], 35),
('Fluoxetine 20mg', 'Fluoxetine', 'SSRI antidepressant', 'PsychMed', 'MED015', 9.99, 5.00, 50, 20, 250, '2025-11-05', true, 'Prozac', ARRAY['Prozac', 'Sarafem'], 30),
('Citalopram 20mg', 'Citalopram', 'SSRI antidepressant', 'PsychMed', 'MED016', 8.99, 4.50, 40, 15, 200, '2025-12-20', true, 'Celexa', ARRAY['Celexa', 'Cipramil'], 25),
('Tramadol 50mg', 'Tramadol', 'Opioid pain medication', 'PainRelief', 'MED017', 18.99, 9.50, 30, 10, 150, '2025-06-15', true, 'Ultram', ARRAY['Ultram', 'ConZip'], 20),
('Gabapentin 300mg', 'Gabapentin', 'Anticonvulsant for nerve pain', 'NeuroMed', 'MED018', 14.99, 7.50, 35, 15, 200, '2025-08-10', true, 'Neurontin', ARRAY['Neurontin', 'Gralise'], 15),
('Pregabalin 75mg', 'Pregabalin', 'Anticonvulsant for nerve pain', 'NeuroMed', 'MED019', 22.99, 11.50, 25, 10, 150, '2025-09-25', true, 'Lyrica', ARRAY['Lyrica', 'Pregabalin'], 10),
('Duloxetine 30mg', 'Duloxetine', 'SNRI antidepressant', 'PsychMed', 'MED020', 16.99, 8.50, 30, 15, 180, '2025-10-30', true, 'Cymbalta', ARRAY['Cymbalta', 'Duloxetine'], 5)
ON CONFLICT (name) DO NOTHING;

-- Create a function to search medicine names with fuzzy matching
CREATE OR REPLACE FUNCTION search_medicine_names(
    search_query TEXT,
    limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    generic_name VARCHAR,
    description TEXT,
    manufacturer VARCHAR,
    sku VARCHAR,
    price DECIMAL,
    brand_name VARCHAR,
    common_names TEXT[],
    popularity_score INTEGER,
    similarity_score REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mn.id,
        mn.name,
        mn.generic_name,
        mn.description,
        mn.manufacturer,
        mn.sku,
        mn.price,
        mn.brand_name,
        mn.common_names,
        mn.popularity_score,
        GREATEST(
            similarity(mn.name, search_query),
            similarity(COALESCE(mn.generic_name, ''), search_query),
            similarity(COALESCE(mn.brand_name, ''), search_query),
            similarity(COALESCE(mn.manufacturer, ''), search_query),
            CASE 
                WHEN mn.common_names IS NOT NULL THEN 
                    (SELECT MAX(similarity(unnest(mn.common_names), search_query))
                     FROM unnest(mn.common_names))
                ELSE 0
            END
        ) as similarity_score
    FROM medicine_names mn
    WHERE mn.is_active = true
        AND (
            mn.name ILIKE '%' || search_query || '%'
            OR mn.generic_name ILIKE '%' || search_query || '%'
            OR mn.brand_name ILIKE '%' || search_query || '%'
            OR mn.manufacturer ILIKE '%' || search_query || '%'
            OR EXISTS (
                SELECT 1 FROM unnest(mn.common_names) AS common_name
                WHERE common_name ILIKE '%' || search_query || '%'
            )
        )
    ORDER BY 
        similarity_score DESC,
        mn.popularity_score DESC,
        mn.name ASC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT ALL ON medicine_names TO authenticated;
GRANT ALL ON medicine_names TO service_role;
GRANT EXECUTE ON FUNCTION search_medicine_names TO authenticated;
GRANT EXECUTE ON FUNCTION search_medicine_names TO service_role;

-- Verify the table was created successfully
SELECT 
    'Table created successfully' as status,
    COUNT(*) as total_records
FROM medicine_names;

