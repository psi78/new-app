-- Fix admin passwords in database
-- Run this SQL script to update admin passwords to "admin123"
-- Make sure you have bcryptjs installed and run the hash generator first

-- Update admin password (replace HASH_HERE with actual bcrypt hash)
-- To generate hash, run in backend folder:
--   npm install bcryptjs
--   node -e "const bcrypt=require('bcryptjs');bcrypt.hash('admin123',10).then(h=>console.log(h))"

-- Pre-generated hash for "admin123":
-- $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy

UPDATE users 
SET password = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy' 
WHERE admin_id IN ('admin', 'sysadmin') AND role = 'system_admin';

-- Or create new admin if doesn't exist:
INSERT INTO users (admin_id, full_name, password, gender, role) 
VALUES 
  ('admin', 'System Administrator', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'male', 'system_admin'),
  ('sysadmin', 'System Administrator', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'male', 'system_admin')
ON DUPLICATE KEY UPDATE password = VALUES(password);

