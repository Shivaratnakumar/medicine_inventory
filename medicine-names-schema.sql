-- Medicine Names table for autocomplete and fuzzy search
-- This table is optimized for fast searching and autocomplete functionality
CREATE TABLE medicine_names (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255),
    brand_name VARCHAR(255),
    common_names TEXT[], -- Array of common names/aliases
    search_vector tsvector, -- Full-text search vector
    popularity_score INTEGER DEFAULT 0, -- For ranking suggestions
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique medicine names
    CONSTRAINT unique_medicine_name UNIQUE (name)
);

-- Create indexes for optimal performance
CREATE INDEX idx_medicine_names_name ON medicine_names(name);
CREATE INDEX idx_medicine_names_generic ON medicine_names(generic_name);
CREATE INDEX idx_medicine_names_brand ON medicine_names(brand_name);
CREATE INDEX idx_medicine_names_search_vector ON medicine_names USING gin(search_vector);
CREATE INDEX idx_medicine_names_popularity ON medicine_names(popularity_score DESC);
CREATE INDEX idx_medicine_names_active ON medicine_names(is_active);

-- Create GIN index for array search
CREATE INDEX idx_medicine_names_common_names ON medicine_names USING gin(common_names);

-- Create function to update search vector
CREATE OR REPLACE FUNCTION update_medicine_names_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector = to_tsvector('english', 
        COALESCE(NEW.name, '') || ' ' || 
        COALESCE(NEW.generic_name, '') || ' ' || 
        COALESCE(NEW.brand_name, '') || ' ' || 
        COALESCE(array_to_string(NEW.common_names, ' '), '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update search vector
CREATE TRIGGER update_medicine_names_search_vector_trigger
    BEFORE INSERT OR UPDATE ON medicine_names
    FOR EACH ROW EXECUTE FUNCTION update_medicine_names_search_vector();

-- Create trigger for updated_at timestamp
CREATE TRIGGER update_medicine_names_updated_at BEFORE UPDATE ON medicine_names
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample medicine names for testing
INSERT INTO medicine_names (name, generic_name, brand_name, common_names, popularity_score) VALUES
('Paracetamol', 'Acetaminophen', 'Tylenol', ARRAY['Panadol', 'Calpol', 'Tempra'], 100),
('Ibuprofen', 'Ibuprofen', 'Advil', ARRAY['Motrin', 'Nurofen', 'Brufen'], 95),
('Amoxicillin', 'Amoxicillin', 'Amoxil', ARRAY['Amox', 'Moxatag'], 90),
('Aspirin', 'Acetylsalicylic acid', 'Bayer', ARRAY['ASA', 'Aspirin'], 85),
('Metformin', 'Metformin', 'Glucophage', ARRAY['Glucophage', 'Fortamet'], 80),
('Lisinopril', 'Lisinopril', 'Prinivil', ARRAY['Zestril', 'Qbrelis'], 75),
('Atorvastatin', 'Atorvastatin', 'Lipitor', ARRAY['Lipitor', 'Torvast'], 70),
('Omeprazole', 'Omeprazole', 'Prilosec', ARRAY['Prilosec', 'Losec'], 65),
('Amlodipine', 'Amlodipine', 'Norvasc', ARRAY['Norvasc', 'Istin'], 60),
('Simvastatin', 'Simvastatin', 'Zocor', ARRAY['Zocor', 'Simvacor'], 55),
('Losartan', 'Losartan', 'Cozaar', ARRAY['Cozaar', 'Losar'], 50),
('Hydrochlorothiazide', 'Hydrochlorothiazide', 'Microzide', ARRAY['HCTZ', 'Microzide'], 45),
('Metoprolol', 'Metoprolol', 'Lopressor', ARRAY['Lopressor', 'Toprol'], 40),
('Sertraline', 'Sertraline', 'Zoloft', ARRAY['Zoloft', 'Lustral'], 35),
('Fluoxetine', 'Fluoxetine', 'Prozac', ARRAY['Prozac', 'Sarafem'], 30),
('Citalopram', 'Citalopram', 'Celexa', ARRAY['Celexa', 'Cipramil'], 25),
('Tramadol', 'Tramadol', 'Ultram', ARRAY['Ultram', 'ConZip'], 20),
('Gabapentin', 'Gabapentin', 'Neurontin', ARRAY['Neurontin', 'Gralise'], 15),
('Pregabalin', 'Pregabalin', 'Lyrica', ARRAY['Lyrica', 'Pregabalin'], 10),
('Duloxetine', 'Duloxetine', 'Cymbalta', ARRAY['Cymbalta', 'Duloxetine'], 5);

-- Create a function to search medicine names with fuzzy matching
CREATE OR REPLACE FUNCTION search_medicine_names(
    search_query TEXT,
    limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    generic_name VARCHAR,
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
        mn.brand_name,
        mn.common_names,
        mn.popularity_score,
        GREATEST(
            similarity(mn.name, search_query),
            similarity(COALESCE(mn.generic_name, ''), search_query),
            similarity(COALESCE(mn.brand_name, ''), search_query),
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

-- Enable the pg_trgm extension for similarity functions
CREATE EXTENSION IF NOT EXISTS pg_trgm;

