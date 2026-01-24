-- Add about slider images to settings table
ALTER TABLE settings 
ADD COLUMN about_slider_images JSONB DEFAULT '[]';
