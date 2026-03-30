-- Seed data for development and testing

-- Insert admin user (password: Admin123!)
INSERT INTO users (email, password_hash, full_name, role, is_verified) VALUES
('admin@tupeleas.com', '$2a$10$YourHashedPasswordHere', 'Administrador', 'admin', TRUE);

-- Insert test users
INSERT INTO users (email, password_hash, full_name, is_verified) VALUES
('user1@test.com', '$2a$10$YourHashedPasswordHere', 'Juan Pérez', TRUE),
('user2@test.com', '$2a$10$YourHashedPasswordHere', 'María García', TRUE),
('user3@test.com', '$2a$10$YourHashedPasswordHere', 'Carlos López', TRUE);

-- Insert upcoming events
INSERT INTO events (title, description, event_date, price, thumbnail_url, status, stream_key) VALUES
(
    'Pelea Estelar: Campeón vs Retador',
    'La pelea más esperada del año. El campeón actual defiende su título contra el retador número 1.',
    CURRENT_TIMESTAMP + INTERVAL '7 days',
    15.00,
    'https://via.placeholder.com/800x450/FF6B6B/FFFFFF?text=Pelea+Estelar',
    'upcoming',
    'stream_key_' || substr(md5(random()::text), 1, 16)
),
(
    'Noche de Knockouts',
    'Una noche llena de acción con 5 peleas profesionales. No te lo pierdas.',
    CURRENT_TIMESTAMP + INTERVAL '14 days',
    12.00,
    'https://via.placeholder.com/800x450/4ECDC4/FFFFFF?text=Noche+de+Knockouts',
    'upcoming',
    'stream_key_' || substr(md5(random()::text), 1, 16)
),
(
    'Torneo Regional - Semifinales',
    'Las mejores peleas del torneo regional. Semifinales con los mejores peleadores.',
    CURRENT_TIMESTAMP + INTERVAL '21 days',
    10.00,
    'https://via.placeholder.com/800x450/95E1D3/FFFFFF?text=Torneo+Regional',
    'upcoming',
    'stream_key_' || substr(md5(random()::text), 1, 16)
);

-- Insert a past event for testing recordings
INSERT INTO events (title, description, event_date, price, status, stream_key) VALUES
(
    'Pelea Histórica - Revive el Momento',
    'La pelea que marcó historia. Ahora disponible en grabación.',
    CURRENT_TIMESTAMP - INTERVAL '30 days',
    8.00,
    'finished',
    'stream_key_past_event'
);

-- Insert sample coupons
INSERT INTO coupons (code, discount_type, discount_value, max_uses, valid_until) VALUES
('PRIMERA10', 'percentage', 10.00, 100, CURRENT_TIMESTAMP + INTERVAL '30 days'),
('PROMO5USD', 'fixed', 5.00, 50, CURRENT_TIMESTAMP + INTERVAL '60 days'),
('VIP20', 'percentage', 20.00, 20, CURRENT_TIMESTAMP + INTERVAL '90 days');

-- Insert sample purchases (for testing)
INSERT INTO purchases (user_id, event_id, amount, payment_method, payment_status, final_amount)
SELECT 
    u.id,
    e.id,
    e.price,
    'stripe',
    'completed',
    e.price
FROM users u
CROSS JOIN events e
WHERE u.email = 'user1@test.com'
AND e.status = 'finished'
LIMIT 1;

-- Insert sample recording
INSERT INTO recordings (event_id, file_url, duration_seconds, quality)
SELECT 
    id,
    'https://cdn.example.com/recordings/sample-fight.mp4',
    7200,
    '1080p'
FROM events
WHERE status = 'finished'
LIMIT 1;

-- Insert sample analytics
INSERT INTO analytics (event_id, metric_type, metric_value)
SELECT 
    id,
    'peak_viewers',
    250
FROM events
WHERE status = 'finished'
LIMIT 1;

COMMENT ON TABLE users IS 'Datos de prueba insertados: 1 admin + 3 usuarios';
COMMENT ON TABLE events IS 'Datos de prueba insertados: 3 eventos futuros + 1 evento pasado';
COMMENT ON TABLE coupons IS 'Datos de prueba insertados: 3 cupones de descuento';
