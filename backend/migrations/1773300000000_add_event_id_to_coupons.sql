-- Add event_id to coupons (NULL = aplica a cualquier evento)
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES events(id) ON DELETE CASCADE;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS min_amount DECIMAL(10,2) DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_coupons_event ON coupons(event_id);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
