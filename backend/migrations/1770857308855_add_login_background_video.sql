-- Migration: Add login background video support
-- Created: 2026-02-11

ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS login_background_video TEXT;

-- Set default to null (no video by default)
UPDATE settings 
SET login_background_video = NULL;
