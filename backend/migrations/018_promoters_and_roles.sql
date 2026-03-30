-- Create promoters table
CREATE TABLE IF NOT EXISTS promoters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    logo_url TEXT,
    banner_url TEXT,
    gallery JSONB DEFAULT '[]',
    social_links JSONB DEFAULT '{}',
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Add promoter_id to users
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='promoter_id') THEN
        ALTER TABLE users ADD COLUMN promoter_id UUID REFERENCES promoters(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add promoter_id to events
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='promoter_id') THEN
        ALTER TABLE events ADD COLUMN promoter_id UUID REFERENCES promoters(id) ON DELETE SET NULL;
    END IF;
END $$;
