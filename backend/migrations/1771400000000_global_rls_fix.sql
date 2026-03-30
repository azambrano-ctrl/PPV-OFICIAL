-- MIGRACIÓN DE SEGURIDAD GLOBAL: Habilitar RLS y Políticas Base
-- Objetivo: Proteger todas las tablas sin interrumpir el funcionamiento del sistema.

-- 1. Habilitar RLS en todas las tablas del esquema público que no lo tengan
DO $$ 
DECLARE 
    tbl text;
BEGIN
    FOR tbl IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    END LOOP;
END $$;

-- 2. Eliminar políticas previas para evitar conflictos (Mantenimiento limpio)
DO $$ 
DECLARE 
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- 3. POLÍTICA MAESTRA: Acceso Total para el Sistema (service_role y postgres)
-- Esto garantiza que el backend y los scripts de mantenimiento sigan funcionando 100%
DO $$ 
DECLARE 
    tbl text;
BEGIN
    FOR tbl IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('CREATE POLICY "System Full Access" ON %I FOR ALL TO service_role, postgres USING (true) WITH CHECK (true)', tbl);
    END LOOP;
END $$;

-- 4. POLÍTICAS ESPECÍFICAS PARA USUARIOS (Garantizar funcionalidad del sitio)

-- USERS: Los usuarios solo pueden ver su propio perfil (o admins todo)
CREATE POLICY "Users access own profile" ON users 
FOR SELECT TO authenticated 
USING (auth.uid() = id OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- EVENTS: Cualquiera puede ver eventos que no sean "borradores" o cancelados
CREATE POLICY "Public can view events" ON events 
FOR SELECT TO anon, authenticated 
USING (status IN ('upcoming', 'live', 'finished'));

-- NEWS: Noticias son públicas
CREATE POLICY "Public can view news" ON news_posts 
FOR SELECT TO anon, authenticated 
USING (true);

-- CHAT: Usuarios autenticados pueden leer y escribir mensajes
CREATE POLICY "Authenticated users can read chat" ON chat_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can post chat" ON chat_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- PURCHASES: Usuarios solo ven sus propias compras
CREATE POLICY "Users can view own purchases" ON purchases 
FOR SELECT TO authenticated 
USING (user_id = auth.uid() OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- SETTINGS: Configuraciones básicas son legibles para que el sitio cargue
CREATE POLICY "Public can view settings" ON settings FOR SELECT TO anon, authenticated USING (true);

-- ANALYTICS: Solo inserción para tracking, lectura restringida a admins
CREATE POLICY "Allow insert for analytics" ON analytics FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins can view analytics" ON analytics FOR SELECT TO authenticated USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- PROMOTERS: Público puede ver promotores
CREATE POLICY "Public can view promoters" ON promoters FOR SELECT TO anon, authenticated USING (true);
