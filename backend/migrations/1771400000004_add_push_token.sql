-- Migration to add push_token to users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS push_token TEXT;
