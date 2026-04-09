-- Add trailer_url column to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS trailer_url TEXT;
