-- Add experience_links column to promoters table if it doesn't exist
ALTER TABLE promoters ADD COLUMN IF NOT EXISTS experience_links TEXT;
