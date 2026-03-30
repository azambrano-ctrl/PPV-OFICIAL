-- Add contact_whatsapp to settings
ALTER TABLE settings
ADD COLUMN IF NOT EXISTS contact_whatsapp TEXT DEFAULT '';
