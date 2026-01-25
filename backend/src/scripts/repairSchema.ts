
import { query } from '../config/database';
import logger from '../config/logger';

/**
 * Emergency schema repair to ensure all settings columns exist.
 * This runs on server startup to bypass migration history checks.
 */
export const repairSchema = async () => {
    try {
        logger.info('🔧 Running emergency schema repair...');

        const sql = `
            ALTER TABLE settings 
            ADD COLUMN IF NOT EXISTS about_hero_title TEXT DEFAULT 'Llevando el MMA Ecuatoriano al Mundo',
            ADD COLUMN IF NOT EXISTS about_hero_subtitle TEXT DEFAULT 'La plataforma definitiva para el talento nacional.',
            ADD COLUMN IF NOT EXISTS about_mission_title TEXT DEFAULT 'Nuestra Misión',
            ADD COLUMN IF NOT EXISTS about_mission_text TEXT DEFAULT 'Nacimos con un objetivo claro: romper las barreras que limitan a nuestros atletas. Ecuador es tierra de guerreros, pero el talento necesita visibilidad para brillar.',
            ADD COLUMN IF NOT EXISTS about_values JSONB DEFAULT '[
                {"title": "Energía Pura", "description": "Capturamos la adrenalina del octágono. Transmisiones fluidas y de alta definición.", "icon": "Zap"},
                {"title": "Proyección Global", "description": "El talento ecuatoriano no tiene fronteras. Nuestra tecnología conecta con el mundo.", "icon": "Globe"},
                {"title": "Excelencia", "description": "Comprometidos con elevar el estándar de los eventos deportivos.", "icon": "Trophy"}
            ]',
            ADD COLUMN IF NOT EXISTS about_slider_images JSONB DEFAULT '[]',
            
            -- General settings
            ADD COLUMN IF NOT EXISTS site_name TEXT DEFAULT 'PPV Streaming',
            ADD COLUMN IF NOT EXISTS site_description TEXT DEFAULT '',
            ADD COLUMN IF NOT EXISTS contact_email TEXT DEFAULT '',
            ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{"facebook": "", "instagram": "", "twitter": ""}',
            
            -- Payment settings
            ADD COLUMN IF NOT EXISTS stripe_enabled BOOLEAN DEFAULT false,
            ADD COLUMN IF NOT EXISTS stripe_public_key TEXT DEFAULT '',
            ADD COLUMN IF NOT EXISTS stripe_secret_key TEXT DEFAULT '',
            ADD COLUMN IF NOT EXISTS paypal_enabled BOOLEAN DEFAULT false,
            ADD COLUMN IF NOT EXISTS paypal_client_id TEXT DEFAULT '',
            ADD COLUMN IF NOT EXISTS paypal_secret_key TEXT DEFAULT '',
            ADD COLUMN IF NOT EXISTS site_logo TEXT DEFAULT '',
            ADD COLUMN IF NOT EXISTS site_logo_width INTEGER DEFAULT 40,
            ADD COLUMN IF NOT EXISTS site_logo_offset_x INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS site_logo_offset_y INTEGER DEFAULT 0;
        `;

        await query(sql);
        logger.info('✅ Emergency schema repair completed successfully.');
    } catch (error) {
        logger.error('❌ Emergency schema repair failed:', error);
    }
};
