-- Add about slider images to settings table
ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS about_slider_images JSONB DEFAULT '[]';
