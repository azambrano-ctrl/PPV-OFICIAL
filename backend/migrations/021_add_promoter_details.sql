-- Add phone and city columns to promoters table
ALTER TABLE promoters ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE promoters ADD COLUMN IF NOT EXISTS city VARCHAR(100);
