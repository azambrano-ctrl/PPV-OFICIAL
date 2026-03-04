-- Sponsor Splash & Page Views
ALTER TABLE settings ADD COLUMN IF NOT EXISTS sponsor_image TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS sponsor_link TEXT DEFAULT '';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS sponsor_enabled BOOLEAN DEFAULT false;

-- Page Views Counter
CREATE TABLE IF NOT EXISTS page_views (
    id SERIAL PRIMARY KEY,
    page TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    user_id UUID,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views(created_at);
CREATE INDEX IF NOT EXISTS idx_page_views_page ON page_views(page);
