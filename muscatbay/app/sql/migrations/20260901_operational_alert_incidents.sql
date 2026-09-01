-- Durable operational-alert lifecycle. This migration is schema-only and
-- intentionally does not import or rewrite any existing operational data.

begin;

CREATE TABLE IF NOT EXISTS public.operational_alert_incidents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    fingerprint text NOT NULL,
    module text NOT NULL CHECK (module IN ('water', 'contractors', 'stp')),
    category text NOT NULL CHECK (category IN ('data_quality', 'process_performance', 'contract_compliance', 'water_balance')),
    level text NOT NULL CHECK (level IN ('error', 'warning', 'info')),
    title text NOT NULL,
    message text NOT NULL,
    href text NOT NULL,
    detected_at timestamptz NOT NULL DEFAULT now(),
    last_seen_at timestamptz NOT NULL DEFAULT now(),
    acknowledged_at timestamptz,
    acknowledged_by uuid REFERENCES auth.users(id),
    resolved_at timestamptz,
    resolution_reason text,
    CHECK ((acknowledged_at IS NULL) = (acknowledged_by IS NULL))
);

CREATE UNIQUE INDEX IF NOT EXISTS operational_alert_one_open_episode
    ON public.operational_alert_incidents (fingerprint)
    WHERE resolved_at IS NULL;

CREATE INDEX IF NOT EXISTS operational_alert_active_order
    ON public.operational_alert_incidents (resolved_at, level, detected_at DESC);

ALTER TABLE public.operational_alert_incidents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS operational_alert_incidents_read ON public.operational_alert_incidents;
CREATE POLICY operational_alert_incidents_read
    ON public.operational_alert_incidents
    FOR SELECT
    TO authenticated
    USING ((SELECT public.mb_can_read_module('alerts')));

REVOKE INSERT, UPDATE, DELETE ON public.operational_alert_incidents FROM anon, authenticated;
GRANT SELECT ON public.operational_alert_incidents TO authenticated;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
       AND NOT EXISTS (
           SELECT 1 FROM pg_publication_tables
           WHERE pubname = 'supabase_realtime'
             AND schemaname = 'public'
             AND tablename = 'operational_alert_incidents'
       ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.operational_alert_incidents;
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.acknowledge_operational_alert_incident(p_incident_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF (SELECT auth.uid()) IS NULL
       OR NOT public.mb_has_any_role(ARRAY['admin', 'manager', 'operator']::text[]) THEN
        RAISE EXCEPTION 'Operator role required' USING ERRCODE = '42501';
    END IF;

    UPDATE public.operational_alert_incidents
    SET acknowledged_at = COALESCE(acknowledged_at, now()),
        acknowledged_by = COALESCE(acknowledged_by, (SELECT auth.uid()))
    WHERE id = p_incident_id
      AND resolved_at IS NULL;

    RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.acknowledge_operational_alert_incident(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.acknowledge_operational_alert_incident(uuid) TO authenticated;

-- Called only by a trusted server-side evaluator after it has successfully
-- read the named modules. Modules omitted from p_evaluated_modules are never
-- auto-resolved, so a source outage cannot make a critical incident disappear.
CREATE OR REPLACE FUNCTION public.reconcile_operational_alert_incidents(
    p_alerts jsonb,
    p_evaluated_modules text[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    alert jsonb;
    active_fingerprints text[] := ARRAY[]::text[];
BEGIN
    IF p_alerts IS NULL OR jsonb_typeof(p_alerts) <> 'array' THEN
        RAISE EXCEPTION 'p_alerts must be a JSON array';
    END IF;

    FOR alert IN SELECT value FROM jsonb_array_elements(p_alerts)
    LOOP
        IF NOT ((alert->>'module') = ANY (p_evaluated_modules)) THEN
            RAISE EXCEPTION 'Alert module was not evaluated: %', alert->>'module';
        END IF;

        active_fingerprints := array_append(active_fingerprints, alert->>'id');

        UPDATE public.operational_alert_incidents
        SET last_seen_at = now(),
            level = alert->>'level',
            category = alert->>'category',
            title = alert->>'title',
            message = alert->>'message',
            href = alert->>'href'
        WHERE fingerprint = alert->>'id'
          AND resolved_at IS NULL;

        IF NOT FOUND THEN
            INSERT INTO public.operational_alert_incidents (
                fingerprint, module, category, level, title, message, href
            ) VALUES (
                alert->>'id', alert->>'module', alert->>'category', alert->>'level',
                alert->>'title', alert->>'message', alert->>'href'
            );
        END IF;
    END LOOP;

    UPDATE public.operational_alert_incidents
    SET resolved_at = now(),
        resolution_reason = 'Condition absent after successful source evaluation'
    WHERE resolved_at IS NULL
      AND module = ANY (p_evaluated_modules)
      AND NOT (fingerprint = ANY (active_fingerprints));
END;
$$;

REVOKE ALL ON FUNCTION public.reconcile_operational_alert_incidents(jsonb, text[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reconcile_operational_alert_incidents(jsonb, text[]) TO service_role;

commit;
