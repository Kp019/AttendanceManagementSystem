-- Fix RLS policy for user registration
-- Run this in your Supabase SQL Editor

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Allow authenticated users to insert users" ON users;

-- Create a new policy that allows public registration
CREATE POLICY "Allow public user registration" ON users
    FOR INSERT WITH CHECK (true);

-- Optional: Add a more restrictive policy for reading user data
DROP POLICY IF EXISTS "Users can read their own data" ON users;
CREATE POLICY "Users can read their own data" ON users
    FOR SELECT USING (
        auth.uid() = id OR 
        auth.role() = 'service_role'
    );

-- Optional: Update policy for user updates
DROP POLICY IF EXISTS "Users can update their own data" ON users;
CREATE POLICY "Users can update their own data" ON users
    FOR UPDATE USING (
        auth.uid() = id OR 
        auth.role() = 'service_role'
    );