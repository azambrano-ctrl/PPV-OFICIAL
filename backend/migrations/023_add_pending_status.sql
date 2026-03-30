-- Add 'pending' to event status enum
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_status_check;
ALTER TABLE events ADD CONSTRAINT events_status_check CHECK (status IN ('upcoming', 'live', 'finished', 'cancelled', 'reprise', 'pending'));
