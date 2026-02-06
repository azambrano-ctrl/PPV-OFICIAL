-- Up Migration
ALTER TABLE news_posts ADD COLUMN IF NOT EXISTS source_name VARCHAR(255);
ALTER TABLE news_posts ADD COLUMN IF NOT EXISTS source_url TEXT;

-- Down Migration
ALTER TABLE news_posts DROP COLUMN IF EXISTS source_name;
ALTER TABLE news_posts DROP COLUMN IF EXISTS source_url;