-- Migration to add site_logo column to settings table
ALTER TABLE settings ADD COLUMN IF NOT EXISTS site_logo TEXT;
