-- Add history images to settings table
ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS about_history_image_1 TEXT,
ADD COLUMN IF NOT EXISTS about_history_image_2 TEXT,
ADD COLUMN IF NOT EXISTS about_history_image_3 TEXT;
