-- Migration script to convert from custom auth to Supabase Auth
-- Run this in your Supabase SQL Editor

-- First, let's create a new users table that references auth.users
CREATE TABLE IF NOT EXISTS users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'participant' CHECK (role IN ('participant', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'role', 'participant')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signups
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update events table to reference users instead of users
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_created_by_fkey;
ALTER TABLE events ADD CONSTRAINT events_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- Update event_admins table
ALTER TABLE event_admins DROP CONSTRAINT IF EXISTS event_admins_user_id_fkey;
ALTER TABLE event_admins ADD CONSTRAINT event_admins_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Enable RLS on users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS policies for users
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Update existing RLS policies to work with users
DROP POLICY IF EXISTS "Users can read events they created or are admin of" ON events;
CREATE POLICY "Users can read events they created or are admin of" ON events
    FOR SELECT USING (
        created_by = auth.uid() OR 
        EXISTS (SELECT 1 FROM event_admins WHERE event_id = id AND user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can create events" ON events;
CREATE POLICY "Users can create events" ON events
    FOR INSERT WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Event creators and admins can update events" ON events;
CREATE POLICY "Event creators and admins can update events" ON events
    FOR UPDATE USING (
        created_by = auth.uid() OR 
        EXISTS (SELECT 1 FROM event_admins WHERE event_id = id AND user_id = auth.uid())
    );

-- Add trigger for updated_at on users
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a view to get user data with auth info (for backward compatibility)
CREATE OR REPLACE VIEW users_with_auth AS
SELECT 
    up.id,
    au.email,
    up.name,
    up.role,
    up.created_at,
    up.updated_at
FROM users up
JOIN auth.users au ON up.id = au.id;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON users TO authenticated;
GRANT SELECT ON users_with_auth TO authenticated;
