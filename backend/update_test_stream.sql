-- Actualizar evento con stream de prueba de Mux
-- Este stream está siempre disponible y es perfecto para desarrollo

UPDATE events 
SET stream_key = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
WHERE title = 'TFL 014 REDENCION';

-- Verificar el cambio
SELECT id, title, stream_key, status 
FROM events 
WHERE title = 'TFL 014 REDENCION';
