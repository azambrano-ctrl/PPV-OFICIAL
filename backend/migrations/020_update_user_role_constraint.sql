-- Update users role check constraint to include 'promoter'
DO $$ 
BEGIN 
    -- Drop the old constraint if it exists
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
    
    -- Add the new constraint with 'promoter' role
    ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'admin', 'promoter'));
END $$;
