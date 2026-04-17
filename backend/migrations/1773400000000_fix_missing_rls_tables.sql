-- MIGRACIÓN DE SEGURIDAD: Habilitar RLS en tablas creadas después de la migración global
-- Tablas afectadas: fighters, web_push_subscriptions, user_sessions,
--                   email_verification_tokens, event_fighters, page_views
-- El backend Express usa service_role (bypasses RLS) → ninguna funcionalidad se rompe.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Habilitar RLS
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.fighters                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.web_push_subscriptions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_verification_tokens   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_fighters              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_views                  ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Política maestra: acceso total para el sistema (service_role y postgres)
--    Garantiza que el backend Express siga operando sin restricciones.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE POLICY "System Full Access" ON public.fighters
    FOR ALL TO service_role, postgres USING (true) WITH CHECK (true);

CREATE POLICY "System Full Access" ON public.web_push_subscriptions
    FOR ALL TO service_role, postgres USING (true) WITH CHECK (true);

CREATE POLICY "System Full Access" ON public.user_sessions
    FOR ALL TO service_role, postgres USING (true) WITH CHECK (true);

CREATE POLICY "System Full Access" ON public.email_verification_tokens
    FOR ALL TO service_role, postgres USING (true) WITH CHECK (true);

CREATE POLICY "System Full Access" ON public.event_fighters
    FOR ALL TO service_role, postgres USING (true) WITH CHECK (true);

CREATE POLICY "System Full Access" ON public.page_views
    FOR ALL TO service_role, postgres USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Políticas para usuarios autenticados / anónimos
-- ─────────────────────────────────────────────────────────────────────────────

-- FIGHTERS: datos públicos, cualquiera puede leer
CREATE POLICY "Public can view fighters" ON public.fighters
    FOR SELECT TO anon, authenticated USING (true);

-- EVENT_FIGHTERS: tabla de relación, lectura pública (nombres en páginas de evento)
CREATE POLICY "Public can view event_fighters" ON public.event_fighters
    FOR SELECT TO anon, authenticated USING (true);

-- PAGE_VIEWS: solo inserción anónima para tracking; nadie más lee directamente
CREATE POLICY "Allow insert page_views" ON public.page_views
    FOR INSERT TO anon, authenticated WITH CHECK (true);

-- WEB_PUSH_SUBSCRIPTIONS: privado — solo el propio usuario puede ver/gestionar su suscripción
CREATE POLICY "Users manage own push subscription" ON public.web_push_subscriptions
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- USER_SESSIONS: completamente privado — sin acceso directo por clientes
-- (solo service_role accede, cubierto en paso 2)

-- EMAIL_VERIFICATION_TOKENS: completamente privado — sin acceso directo por clientes
-- (solo service_role accede, cubierto en paso 2)
