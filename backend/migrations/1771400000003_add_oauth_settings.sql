-- Migration to add OAuth settings columns
ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS google_client_id_android TEXT,
ADD COLUMN IF NOT EXISTS google_client_id_ios TEXT,
ADD COLUMN IF NOT EXISTS google_client_id_web TEXT,
ADD COLUMN IF NOT EXISTS facebook_app_id TEXT;
