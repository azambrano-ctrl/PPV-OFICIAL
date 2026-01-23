-- Update events with valid test HLS streams and proper images
-- This migration fixes the placeholder stream keys with working test streams

-- Update upcoming events with valid test streams
UPDATE events 
SET 
    stream_key = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    thumbnail_url = 'https://via.placeholder.com/800x450/FF6B6B/FFFFFF?text=Pelea+Estelar',
    banner_url = 'https://via.placeholder.com/1920x600/FF6B6B/FFFFFF?text=Pelea+Estelar+Banner'
WHERE title = 'Pelea Estelar: Campeón vs Retador';

UPDATE events 
SET 
    stream_key = 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
    thumbnail_url = 'https://via.placeholder.com/800x450/4ECDC4/FFFFFF?text=Noche+de+Knockouts',
    banner_url = 'https://via.placeholder.com/1920x600/4ECDC4/FFFFFF?text=Noche+de+Knockouts+Banner'
WHERE title = 'Noche de Knockouts';

UPDATE events 
SET 
    stream_key = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    thumbnail_url = 'https://via.placeholder.com/800x450/95E1D3/FFFFFF?text=Torneo+Regional',
    banner_url = 'https://via.placeholder.com/1920x600/95E1D3/FFFFFF?text=Torneo+Regional+Banner'
WHERE title = 'Torneo Regional - Semifinales';

-- Update past event with recording stream
UPDATE events 
SET 
    stream_key = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    thumbnail_url = 'https://via.placeholder.com/800x450/F38181/FFFFFF?text=Pelea+Historica',
    banner_url = 'https://via.placeholder.com/1920x600/F38181/FFFFFF?text=Pelea+Historica+Banner'
WHERE title = 'Pelea Histórica - Revive el Momento';

-- Add comment
COMMENT ON TABLE events IS 'Updated with valid test HLS streams for development';
