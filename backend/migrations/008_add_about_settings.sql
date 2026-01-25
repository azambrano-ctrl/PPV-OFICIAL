-- Add about page content to settings table
ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS about_hero_title TEXT DEFAULT 'Llevando el MMA Ecuatoriano al Mundo',
ADD COLUMN IF NOT EXISTS about_hero_subtitle TEXT DEFAULT 'La plataforma definitiva para el talento nacional.',
ADD COLUMN IF NOT EXISTS about_mission_title TEXT DEFAULT 'Nuestra Misión',
ADD COLUMN IF NOT EXISTS about_mission_text TEXT DEFAULT 'Nacimos con un objetivo claro: romper las barreras que limitan a nuestros atletas. Ecuador es tierra de guerreros, pero el talento necesita visibilidad para brillar.',
ADD COLUMN IF NOT EXISTS about_values JSONB DEFAULT '[
    {"title": "Energía Pura", "description": "Capturamos la adrenalina del octágono. Transmisiones fluidas y de alta definición.", "icon": "Zap"},
    {"title": "Proyección Global", "description": "El talento ecuatoriano no tiene fronteras. Nuestra tecnología conecta con el mundo.", "icon": "Globe"},
    {"title": "Excelencia", "description": "Comprometidos con elevar el estándar de los eventos deportivos.", "icon": "Trophy"}
]';
