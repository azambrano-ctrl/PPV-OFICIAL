-- Fix security definer view for event_stats
-- Using security_invoker=true ensures RLS is respected
-- This resolves the security warning regarding SECURITY DEFINER views

DROP VIEW IF EXISTS event_stats;

CREATE VIEW event_stats WITH (security_invoker = true) AS
SELECT 
    e.id,
    e.title,
    e.event_date,
    e.price,
    e.status,
    COUNT(DISTINCT p.id) as total_purchases,
    SUM(COALESCE(p.final_amount, 0)) as total_revenue,
    COUNT(DISTINCT st.user_id) as active_viewers
FROM events e
LEFT JOIN purchases p ON e.id = p.event_id AND p.payment_status = 'completed'
LEFT JOIN stream_tokens st ON e.id = st.event_id AND st.expires_at > CURRENT_TIMESTAMP AND st.is_revoked = FALSE
GROUP BY e.id, e.title, e.event_date, e.price, e.status;

-- Comment for documentation
COMMENT ON VIEW event_stats IS 'Estadísticas de eventos con seguridad de invocador para respetar RLS';
