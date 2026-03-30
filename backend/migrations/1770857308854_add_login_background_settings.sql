-- Migration: Add login background customization settings
-- Created: 2026-02-11

ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS login_background_url TEXT,
ADD COLUMN IF NOT EXISTS login_background_position TEXT DEFAULT 'center' CHECK (login_background_position IN ('top', 'center', 'bottom'));

-- Update existing row to have default values
UPDATE settings 
SET login_background_url = '/images/octagon-bg.png',
    login_background_position = 'center';
