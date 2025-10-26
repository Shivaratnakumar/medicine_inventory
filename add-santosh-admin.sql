-- Add santoshbiradi@gmail.com as admin user
-- This script adds a new admin user to the system

-- Insert new admin user (password: admin123)
INSERT INTO users (email, password_hash, first_name, last_name, role) 
VALUES (
    'santoshbiradi@gmail.com', 
    '$2a$10$do/iizLT8QIyQFXEKf8MJOjZH.h2N1omXE3UHpxecrbqVDmUgS14S', 
    'Santosh', 
    'Biradi', 
    'admin'::user_role
)
ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    updated_at = NOW();

-- Verify the insertion
SELECT id, email, first_name, last_name, role, created_at, updated_at 
FROM users 
WHERE email = 'santoshbiradi@gmail.com';



