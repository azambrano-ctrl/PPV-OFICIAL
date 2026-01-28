-- Create promoter_payments table
CREATE TABLE promoter_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promoter_id UUID NOT NULL REFERENCES promoters(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    payment_method VARCHAR(20) CHECK (payment_method IN ('stripe', 'paypal')),
    payment_intent_id VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for checking payments
CREATE INDEX idx_promoter_payments_promoter ON promoter_payments(promoter_id);
CREATE INDEX idx_promoter_payments_status ON promoter_payments(status);

-- Trigger for updated_at
CREATE TRIGGER update_promoter_payments_updated_at BEFORE UPDATE ON promoter_payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
