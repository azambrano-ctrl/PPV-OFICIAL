-- Add site_favicon column to settings table
ALTER TABLE settings ADD COLUMN IF NOT EXISTS site_favicon TEXT;
