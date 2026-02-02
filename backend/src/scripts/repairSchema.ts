
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
            ADD COLUMN IF NOT EXISTS site_name TEXT DEFAULT 'Arena Fight Pass',
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
            ADD COLUMN IF NOT EXISTS site_logo_offset_y INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS season_pass_enabled BOOLEAN DEFAULT false,
            ADD COLUMN IF NOT EXISTS season_pass_title TEXT DEFAULT 'Pase de Temporada',
            ADD COLUMN IF NOT EXISTS season_pass_description TEXT DEFAULT 'Obtén acceso a todos los eventos del año por un precio especial.',
            ADD COLUMN IF NOT EXISTS season_pass_price DECIMAL(10,2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS season_pass_button_text TEXT DEFAULT 'Comprar Pase';

            -- Chat moderation
            ALTER TABLE chat_messages 
            ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

            CREATE TABLE IF NOT EXISTS chat_bans (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                event_id UUID REFERENCES events(id) ON DELETE CASCADE,
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                type TEXT NOT NULL, -- 'ban' or 'mute'
                reason TEXT,
                expires_at TIMESTAMP WITH TIME ZONE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(event_id, user_id, type)
            );

            -- Events table repairs
            ALTER TABLE events
            ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'upcoming',
            ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
            ADD COLUMN IF NOT EXISTS stream_key TEXT,
            ADD COLUMN IF NOT EXISTS stream_url TEXT;

            -- Users table repairs
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS current_session_id UUID;

            -- Newsletter subscribers
            CREATE TABLE IF NOT EXISTS newsletter_subscribers (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                email TEXT UNIQUE NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            -- Purchases table updates for Season Pass
            ALTER TABLE purchases ALTER COLUMN event_id DROP NOT NULL;
            
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'purchase_type_enum') THEN
                    CREATE TYPE purchase_type_enum AS ENUM ('event', 'season_pass');
                END IF;
            END $$;

            ALTER TABLE purchases ADD COLUMN IF NOT EXISTS purchase_type purchase_type_enum DEFAULT 'event';
            
            CREATE UNIQUE INDEX IF NOT EXISTS idx_one_season_pass_per_user 
            ON purchases (user_id) 
            WHERE purchase_type = 'season_pass' AND payment_status = 'completed';

            -- Notifications table
            CREATE TABLE IF NOT EXISTS notifications (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                type TEXT NOT NULL DEFAULT 'system', -- 'event_reminder', 'system', 'purchase'
                link TEXT,
                is_read BOOLEAN DEFAULT false,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
        `;

        await query(sql);
        logger.info('✅ Emergency schema repair completed successfully.');
    } catch (error) {
        logger.error('❌ Emergency schema repair failed:', error);
    }
};
