-- Migration to add Cloudflare and Bunny stream provider columns
-- This migration makes the live_streams table compatible with multiple streaming providers

-- Make Mux columns nullable since we support multiple providers
ALTER TABLE live_streams ALTER COLUMN mux_live_stream_id DROP NOT NULL;
ALTER TABLE live_streams ALTER COLUMN stream_key DROP NOT NULL;
ALTER TABLE live_streams ALTER COLUMN rtmp_url DROP NOT NULL;

-- Add Cloudflare Stream column
ALTER TABLE live_streams ADD COLUMN IF NOT EXISTS cloudflare_stream_id VARCHAR(255);

-- Add Bunny.net Stream column
ALTER TABLE live_streams ADD COLUMN IF NOT EXISTS bunny_live_stream_id VARCHAR(255);

-- Add index for Cloudflare stream ID
CREATE INDEX IF NOT EXISTS idx_live_streams_cloudflare ON live_streams(cloudflare_stream_id);

-- Add index for Bunny stream ID
CREATE INDEX IF NOT EXISTS idx_live_streams_bunny ON live_streams(bunny_live_stream_id);
