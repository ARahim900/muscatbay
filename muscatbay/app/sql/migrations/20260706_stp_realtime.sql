-- =============================================================================
-- Enable Supabase Realtime on stp_operations
-- =============================================================================
-- The dashboard STP "Treatment Overview" chart and the STP module page both
-- open a realtime subscription on `stp_operations` (see hooks/useDashboardData.ts
-- and app/stp/page.tsx). Without the table in the supabase_realtime publication,
-- Postgres never emits change events, so those views only refresh on a manual
-- reload — unlike the water tables (water_meters / water_monthly_consumption),
-- which ARE published and therefore update live.
--
-- This publishes stp_operations so new or edited daily operations propagate to
-- any open dashboard automatically, matching the water behaviour.
--
-- Idempotent + guarded, so it is safe to run repeatedly. (The older
-- enable_realtime.sql used a bare `ALTER PUBLICATION ... ADD TABLE`, which
-- aborts the whole script the moment any listed table is already a publication
-- member — which is why the stp_operations line there never actually took.)
--
-- stp_operations has a primary key (`id`), so REPLICA IDENTITY DEFAULT already
-- carries enough to emit UPDATE/DELETE events; no REPLICA IDENTITY FULL needed.
-- =============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public' AND tablename = 'stp_operations'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.stp_operations;
    END IF;
END $$;
