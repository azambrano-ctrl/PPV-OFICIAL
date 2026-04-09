-- Prevent duplicate free purchases via race condition
-- Adds UNIQUE(user_id, event_id) partial index for non-season_pass purchases

CREATE UNIQUE INDEX IF NOT EXISTS purchases_user_event_unique
    ON purchases (user_id, event_id)
    WHERE purchase_type != 'season_pass' AND payment_status = 'completed';
