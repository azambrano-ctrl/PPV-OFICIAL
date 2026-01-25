-- Add general settings
ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS site_name TEXT DEFAULT 'PPV Streaming',
ADD COLUMN IF NOT EXISTS site_description TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS contact_email TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{"facebook": "", "instagram": "", "twitter": ""}';

-- Add payment settings
ALTER TABLE settings
ADD COLUMN IF NOT EXISTS stripe_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS stripe_public_key TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS stripe_secret_key TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS paypal_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS paypal_client_id TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS paypal_secret_key TEXT DEFAULT '';
