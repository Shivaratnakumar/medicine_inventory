-- Update admin user credentials to match login form
-- This script fixes the email and password mismatch issue

-- Update admin user email and password
UPDATE users 
SET 
  email = 'admin@pharmacy.com',
  password_hash = '$2a$10$do/iizLT8QIyQFXEKf8MJOjZH.h2N1omXE3UHpxecrbqVDmUgS14S',
  updated_at = NOW()
WHERE email = 'admin@medicineinventory.com';

-- Update notifications to reference the correct admin email
UPDATE notifications 
SET user_id = (SELECT id FROM users WHERE email = 'admin@pharmacy.com')
WHERE user_id = (SELECT id FROM users WHERE email = 'admin@medicineinventory.com');

-- Update support tickets to reference the correct admin email
UPDATE support_tickets 
SET user_id = (SELECT id FROM users WHERE email = 'admin@pharmacy.com')
WHERE user_id = (SELECT id FROM users WHERE email = 'admin@medicineinventory.com');

-- Verify the update
SELECT id, email, first_name, last_name, role, created_at, updated_at 
FROM users 
WHERE email = 'admin@pharmacy.com';
