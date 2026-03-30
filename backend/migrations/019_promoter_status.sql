-- Add status column to promoters table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='status') THEN
        ALTER TABLE promoters ADD COLUMN status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended'));
    END IF;
END $$;

-- Update existing promoters to 'active'
UPDATE promoters SET status = 'active' WHERE status IS NULL OR status = 'pending';
