-- Add current_session_id to users table for concurrent session control
ALTER TABLE users ADD COLUMN current_session_id VARCHAR(255);

-- Create index for performance on lookups (though we usually look up by ID)
-- This is optional but good practice if we ever query by session_id
CREATE INDEX idx_users_session_id ON users(current_session_id);
