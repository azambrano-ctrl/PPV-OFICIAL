-- Modify purchases table to support Season Pass
-- 1. Allow event_id to be NULL (for global purchases like Season Pass)
ALTER TABLE purchases ALTER COLUMN event_id DROP NOT NULL;

-- 2. Add purchase_type column
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'purchase_type_enum') THEN
        CREATE TYPE purchase_type_enum AS ENUM ('event', 'season_pass');
    END IF;
END $$;

ALTER TABLE purchases ADD COLUMN IF NOT EXISTS purchase_type purchase_type_enum DEFAULT 'event';

-- 3. Update unique constraint
-- The current constraint is UNIQUE(user_id, event_id). 
-- For season_pass, event_id will be NULL.
-- In PostgreSQL, UNIQUE constraints allow multiple NULLs, which is fine for multiple season pass attempts, 
-- but we might want to prevent duplicate COMPLETED season passes. 
-- We'll handle refined uniqueness via business logic or a partial index if needed.

-- Create a partial index to ensure a user only has one COMPLETED season pass
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_season_pass_per_user 
ON purchases (user_id) 
WHERE purchase_type = 'season_pass' AND payment_status = 'completed';
