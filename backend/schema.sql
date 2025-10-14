-- Event Management System Database Schema
-- Run this script in your Supabase SQL Editor

-- Enable UUID extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'participant' CHECK (role IN ('participant', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events table
CREATE TABLE events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event admins table (for co-admins)
CREATE TABLE event_admins (
    id SERIAL PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

-- Participants table
CREATE TABLE participants (
    id SERIAL PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    qr_code VARCHAR(255) UNIQUE NOT NULL,
    qr_code_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, email)
);

-- Attendance columns table (for different attendance sessions)
CREATE TABLE attendance_columns (
    id SERIAL PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    column_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, column_name)
);

-- Attendance table
CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    participant_id INTEGER REFERENCES participants(id) ON DELETE CASCADE,
    attendance_column_id INTEGER REFERENCES attendance_columns(id) ON DELETE CASCADE,
    status BOOLEAN DEFAULT TRUE,
    marked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(participant_id, attendance_column_id)
);

-- Indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_events_created_by ON events(created_by);
CREATE INDEX idx_participants_event_id ON participants(event_id);
CREATE INDEX idx_participants_email ON participants(email);
CREATE INDEX idx_attendance_participant_id ON attendance(participant_id);
CREATE INDEX idx_attendance_column_id ON attendance(attendance_column_id);

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can read their own data" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON users
    FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for events table
CREATE POLICY "Users can read events they created or are admin of" ON events
    FOR SELECT USING (
        created_by = auth.uid() OR 
        EXISTS (SELECT 1 FROM event_admins WHERE event_id = id AND user_id = auth.uid())
    );

CREATE POLICY "Users can create events" ON events
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Event creators and admins can update events" ON events
    FOR UPDATE USING (
        created_by = auth.uid() OR 
        EXISTS (SELECT 1 FROM event_admins WHERE event_id = id AND user_id = auth.uid())
    );

-- For now, allow all authenticated users to insert/read data
-- You can modify these policies later for more specific access control
CREATE POLICY "Allow authenticated users to insert users" ON users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all reads on events" ON events
    FOR SELECT USING (true);

CREATE POLICY "Allow all operations on participants" ON participants
    FOR ALL USING (true);

CREATE POLICY "Allow all operations on event_admins" ON event_admins
    FOR ALL USING (true);

CREATE POLICY "Allow all operations on attendance_columns" ON attendance_columns
    FOR ALL USING (true);

CREATE POLICY "Allow all operations on attendance" ON attendance
    FOR ALL USING (true);

-- Functions to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_participants_updated_at BEFORE UPDATE ON participants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();