-- Migration script to convert events table from SERIAL to UUID
-- Run this script in your Supabase SQL Editor AFTER updating the schema

-- Step 1: Add new UUID column to events table
ALTER TABLE events ADD COLUMN new_id UUID DEFAULT uuid_generate_v4();

-- Step 2: Update all related tables to use the new UUID
-- Update event_admins table
ALTER TABLE event_admins ADD COLUMN new_event_id UUID;
UPDATE event_admins SET new_event_id = events.new_id 
FROM events WHERE event_admins.event_id = events.id;
ALTER TABLE event_admins DROP CONSTRAINT event_admins_event_id_fkey;
ALTER TABLE event_admins DROP COLUMN event_id;
ALTER TABLE event_admins RENAME COLUMN new_event_id TO event_id;
ALTER TABLE event_admins ADD CONSTRAINT event_admins_event_id_fkey 
    FOREIGN KEY (event_id) REFERENCES events(new_id) ON DELETE CASCADE;

-- Update participants table
ALTER TABLE participants ADD COLUMN new_event_id UUID;
UPDATE participants SET new_event_id = events.new_id 
FROM events WHERE participants.event_id = events.id;
ALTER TABLE participants DROP CONSTRAINT participants_event_id_fkey;
ALTER TABLE participants DROP COLUMN event_id;
ALTER TABLE participants RENAME COLUMN new_event_id TO event_id;
ALTER TABLE participants ADD CONSTRAINT participants_event_id_fkey 
    FOREIGN KEY (event_id) REFERENCES events(new_id) ON DELETE CASCADE;

-- Update attendance_columns table
ALTER TABLE attendance_columns ADD COLUMN new_event_id UUID;
UPDATE attendance_columns SET new_event_id = events.new_id 
FROM events WHERE attendance_columns.event_id = events.id;
ALTER TABLE attendance_columns DROP CONSTRAINT attendance_columns_event_id_fkey;
ALTER TABLE attendance_columns DROP COLUMN event_id;
ALTER TABLE attendance_columns RENAME COLUMN new_event_id TO event_id;
ALTER TABLE attendance_columns ADD CONSTRAINT attendance_columns_event_id_fkey 
    FOREIGN KEY (event_id) REFERENCES events(new_id) ON DELETE CASCADE;

-- Step 3: Update events table
ALTER TABLE events DROP CONSTRAINT events_pkey;
ALTER TABLE events DROP COLUMN id;
ALTER TABLE events RENAME COLUMN new_id TO id;
ALTER TABLE events ADD PRIMARY KEY (id);

-- Step 4: Recreate indexes
CREATE INDEX idx_events_created_by ON events(created_by);
CREATE INDEX idx_participants_event_id ON participants(event_id);
CREATE INDEX idx_attendance_participant_id ON attendance(participant_id);
CREATE INDEX idx_attendance_column_id ON attendance(attendance_column_id);

-- Step 5: Update RLS policies to use UUID
DROP POLICY IF EXISTS "Users can read events they created or are admin of" ON events;
DROP POLICY IF EXISTS "Users can create events" ON events;
DROP POLICY IF EXISTS "Event creators and admins can update events" ON events;
DROP POLICY IF EXISTS "Allow all reads on events" ON events;

-- Recreate RLS policies
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

CREATE POLICY "Allow all reads on events" ON events
    FOR SELECT USING (true);
