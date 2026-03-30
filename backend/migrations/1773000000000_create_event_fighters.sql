CREATE TABLE IF NOT EXISTS event_fighters (
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    fighter_id UUID NOT NULL REFERENCES fighters(id) ON DELETE CASCADE,
    order_index INT DEFAULT 0, -- To define the bout order in the fight card (optional)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (event_id, fighter_id)
);

-- Index for searching exactly which fighters are in an event quickly
CREATE INDEX IF NOT EXISTS idx_event_fighters_event ON event_fighters(event_id);
-- Index for searching exactly which events a fighter is in
CREATE INDEX IF NOT EXISTS idx_event_fighters_fighter ON event_fighters(fighter_id);
