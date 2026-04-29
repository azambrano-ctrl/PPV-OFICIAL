-- Add waiting room configuration fields to events
ALTER TABLE events ADD COLUMN IF NOT EXISTS waiting_room_bg_url TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS waiting_room_music_url TEXT;
