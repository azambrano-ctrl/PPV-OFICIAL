-- Add general settings
ALTER TABLE settings 
ADD COLUMN site_name TEXT DEFAULT 'PPV Streaming',
ADD COLUMN site_description TEXT DEFAULT '',
ADD COLUMN contact_email TEXT DEFAULT '',
ADD COLUMN social_links JSONB DEFAULT '{"facebook": "", "instagram": "", "twitter": ""}';

-- Add payment settings
ALTER TABLE settings
ADD COLUMN stripe_enabled BOOLEAN DEFAULT false,
ADD COLUMN stripe_public_key TEXT DEFAULT '',
ADD COLUMN stripe_secret_key TEXT DEFAULT '',
ADD COLUMN paypal_enabled BOOLEAN DEFAULT false,
ADD COLUMN paypal_client_id TEXT DEFAULT '',
ADD COLUMN paypal_secret_key TEXT DEFAULT '';
