-- Migration script to transfer existing user data to Supabase Auth + users
-- Run this AFTER you've run the migrate_to_supabase_auth.sql script
-- Run this in your Supabase SQL Editor

-- Step 1: Create Supabase Auth users from existing users table
-- This will create auth.users entries for each existing user

-- First, let's see what users we have (optional - for verification)
-- SELECT id, name, email, role FROM users ORDER BY created_at;

-- Step 2: Create auth.users entries for existing users
-- Note: This requires admin access, so you'll need to do this via Supabase Dashboard or API
-- For now, we'll create a function that can be called for each user

-- Create a function to migrate a single user
CREATE OR REPLACE FUNCTION migrate_user_to_supabase_auth(
    user_id UUID,
    user_email TEXT,
    user_password_hash TEXT,
    user_name TEXT,
    user_role TEXT DEFAULT 'participant'
) RETURNS UUID AS $$
DECLARE
    new_auth_user_id UUID;
BEGIN
    -- Insert into auth.users (this will need to be done via Supabase Admin API)
    -- For now, we'll create the users entry that will be linked when auth user is created
    
    -- Create user profile entry
    INSERT INTO users (id, name, role, created_at, updated_at)
    VALUES (user_id, user_name, user_role, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        updated_at = NOW();
    
    RETURN user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Alternative approach: Create users directly from existing users
-- This assumes you'll create the auth.users entries separately via Supabase Dashboard

-- Step 3: Insert existing users into users table
-- This will create users entries for all existing users
INSERT INTO users (id, name, role, created_at, updated_at)
SELECT 
    u.id,
    u.name,
    u.role,
    u.created_at,
    u.updated_at
FROM users u
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    updated_at = NOW();

-- Step 4: Verify the migration
-- Check that all users were migrated
SELECT 
    'Original users count' as description,
    COUNT(*) as count
FROM users
UNION ALL
SELECT 
    'Migrated users count' as description,
    COUNT(*) as count
FROM users;

-- Step 5: Check for any data discrepancies
SELECT 
    u.id,
    u.name as original_name,
    up.name as migrated_name,
    u.role as original_role,
    up.role as migrated_role,
    CASE 
        WHEN u.name = up.name AND u.role = up.role THEN 'OK'
        ELSE 'MISMATCH'
    END as status
FROM users u
LEFT JOIN users up ON u.id = up.id
ORDER BY u.created_at;

-- Step 6: Create a backup of the original users table (optional)
-- CREATE TABLE users_backup AS SELECT * FROM users;

-- Step 7: Update foreign key references
-- The migrate_to_supabase_auth.sql should have already done this, but let's verify

-- Check if events table references are updated
SELECT 
    'Events with user references' as table_name,
    COUNT(*) as count
FROM events e
WHERE e.created_by IS NOT NULL
UNION ALL
SELECT 
    'Event admins with user references' as table_name,
    COUNT(*) as count
FROM event_admins ea
WHERE ea.user_id IS NOT NULL;

-- Step 8: Manual steps you'll need to do:

-- 8.1: Create auth.users entries via Supabase Dashboard
-- Go to Authentication > Users in your Supabase dashboard
-- For each user in your users table, create a new auth user with:
-- - Email: (from users.email)
-- - Password: (you'll need to set new passwords since you can't migrate password hashes)
-- - User ID: (use the same UUID from users.id)
-- - Metadata: {"name": "user_name", "role": "user_role"}

-- 8.2: Alternative - Use Supabase Admin API to create users programmatically
-- You can create a script that calls the Supabase Admin API to create auth users

-- Step 9: After creating auth.users entries, verify everything works
-- Test that users are properly linked to auth.users
SELECT 
    up.id,
    up.name,
    up.role,
    au.email,
    au.created_at as auth_created_at
FROM users up
JOIN auth.users au ON up.id = au.id
ORDER BY up.created_at;

-- Step 10: Clean up (optional - only after everything is working)
-- DROP TABLE users; -- Only do this after confirming everything works!

-- Instructions for manual user creation:
/*
MANUAL STEPS REQUIRED:

1. Go to your Supabase Dashboard > Authentication > Users
2. For each user in your original users table, click "Add user"
3. Fill in:
   - Email: [from users.email]
   - Password: [set a temporary password, user will need to reset]
   - User ID: [use the exact same UUID from users.id]
   - User Metadata: 
     {
       "name": "[from users.name]",
       "role": "[from users.role]"
     }

4. After creating all auth users, test login functionality
5. Notify users to reset their passwords
6. Once everything is working, you can drop the original users table

ALTERNATIVE: Use Supabase Admin API
You can create a script that uses the Supabase Admin API to create users programmatically.
This would be faster if you have many users.
*/
