-- Update santoshbiradi@gmail.com to admin role
UPDATE users 
SET 
  role = 'admin'::user_role,
  updated_at = NOW()
WHERE email = 'santoshbiradi@gmail.com';

-- Verify the update
SELECT id, email, first_name, last_name, role, created_at, updated_at 
FROM users 
WHERE email = 'santoshbiradi@gmail.com';















