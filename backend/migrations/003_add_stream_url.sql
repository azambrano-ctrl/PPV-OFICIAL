-- Add stream_url column to events table
ALTER TABLE events ADD COLUMN stream_url TEXT;

COMMENT ON COLUMN events.stream_url IS 'URL externa del stream (HLS/m3u8) para reproducción';
