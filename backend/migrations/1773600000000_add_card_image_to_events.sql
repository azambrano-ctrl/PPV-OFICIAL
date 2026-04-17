-- Add card_image_url (fight card / cartelera) to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS card_image_url TEXT;
