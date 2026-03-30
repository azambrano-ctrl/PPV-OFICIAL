-- Add season pass settings to the settings table
ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS season_pass_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS season_pass_title TEXT DEFAULT 'Pase de Temporada',
ADD COLUMN IF NOT EXISTS season_pass_description TEXT DEFAULT 'Obtén acceso a todos los eventos del año por un precio especial.',
ADD COLUMN IF NOT EXISTS season_pass_price DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS season_pass_button_text TEXT DEFAULT 'Comprar Pase';
