CREATE TYPE fighter_stance AS ENUM ('Ortodoxo', 'Zurdo', 'Ambidiestro');
CREATE TYPE fighter_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE IF NOT EXISTS fighters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,     -- El peleador que administra este perfil
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    nickname VARCHAR(100),
    slug VARCHAR(255) UNIQUE NOT NULL,                       -- Para URLs limpias: /fighters/il-ia-topuria

    -- Bio & Físico
    date_of_birth DATE,
    country VARCHAR(100),
    city VARCHAR(100),
    team_association VARCHAR(200),
    height_cm DECIMAL(5,2),
    weight_kg DECIMAL(5,2),
    reach_cm DECIMAL(5,2),
    stance fighter_stance DEFAULT 'Ortodoxo',
    base_style VARCHAR(100),                                 -- Ej. Striker, Grappler, Jiu-Jitsu

    -- Récord Profesional
    wins INT DEFAULT 0,
    losses INT DEFAULT 0,
    draws INT DEFAULT 0,
    kos INT DEFAULT 0,
    submissions INT DEFAULT 0,

    -- Multimedia
    profile_image_url TEXT,
    banner_image_url TEXT,
    social_instagram TEXT,
    social_twitter TEXT,

    -- Estado y Auditoría
    status fighter_status DEFAULT 'pending',                 -- Requiere aprobación del admin para salir público
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para búsquedas rápidas en la web
CREATE INDEX IF NOT EXISTS idx_fighters_slug ON fighters(slug);
CREATE INDEX IF NOT EXISTS idx_fighters_status ON fighters(status);
