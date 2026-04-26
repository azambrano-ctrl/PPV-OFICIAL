-- Fix: live_streams.status was VARCHAR(50) but Cloudflare returns status values
-- longer than 50 characters (observed length: 98). Expand to TEXT to prevent
-- "value too long for type character varying(50)" errors in backgroundService.
ALTER TABLE public.live_streams
    ALTER COLUMN status TYPE TEXT;
