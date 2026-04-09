-- MIGRACIÓN DE REFINAMIENTO: Seguridad en Analíticas
-- Objetivo: Resolver "RLS Policy Always True" sin romper el sistema de tracking.

-- 1. Eliminar la política permisiva anterior de forma segura
DROP POLICY IF EXISTS "Allow insert for analytics" ON analytics;

-- 2. Crear nueva política con validación de Integridad Referencial
-- Esto permite que cualquier usuario (público o autenticado) inserte analíticas,
-- pero SOLO si el event_id existe realmente en la tabla de eventos.
-- Esto previene la inserción de datos "basura" o inconsistentes.
CREATE POLICY "Allow insert for analytics" ON analytics 
FOR INSERT 
TO anon, authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM events 
    WHERE events.id = analytics.event_id
  )
);

-- NOTA: Las políticas de lectura (SELECT) para administradores y sistema
-- definidas en la migración global 028 se mantienen intactas.
