\set ON_ERROR_STOP on
\timing off

-- Two identities created the only way the migration permits: an invitation
-- naming the role, consumed by the auth.users insert. Acknowledgement is gated
-- on the profile role, so the role under test has to be the real one.
INSERT INTO public.auth_invitations (email, role) VALUES
    ('alerts-operator@example.test', 'operator'),
    ('alerts-viewer@example.test', 'viewer')
ON CONFLICT DO NOTHING;

INSERT INTO auth.users (id, email) VALUES
    ('11111111-1111-1111-1111-111111111111', 'alerts-operator@example.test'),
    ('11111111-1111-1111-1111-111111111112', 'alerts-viewer@example.test')
ON CONFLICT DO NOTHING;

SELECT set_config('test.uid', '11111111-1111-1111-1111-111111111111', false);

CREATE OR REPLACE FUNCTION pg_temp.assert(condition boolean, label text) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
    IF condition IS NOT TRUE THEN
        RAISE EXCEPTION 'FAIL: %', label;
    END IF;
    RAISE NOTICE 'pass: %', label;
END;
$$;

CREATE OR REPLACE FUNCTION pg_temp.alert(fingerprint text, module text, level text, category text)
RETURNS jsonb LANGUAGE sql AS $$
    SELECT jsonb_build_object(
        'id', fingerprint, 'module', module, 'level', level, 'category', category,
        'title', 'T ' || fingerprint, 'message', 'M ' || fingerprint, 'href', '/' || module
    );
$$;

TRUNCATE public.operational_alert_incidents;

/* 1 ─ A warning escalating to error keeps its acknowledgement and its row. */
SELECT public.reconcile_operational_alert_incidents(
    jsonb_build_array(pg_temp.alert('stp-recovery-below-target', 'stp', 'warning', 'process_performance')),
    ARRAY['stp'], ARRAY['stp']);

SELECT public.acknowledge_operational_alert_incident(id)
FROM public.operational_alert_incidents WHERE fingerprint = 'stp-recovery-below-target';

WITH before AS (SELECT id, acknowledged_at FROM public.operational_alert_incidents
                WHERE fingerprint = 'stp-recovery-below-target')
SELECT pg_temp.assert((SELECT acknowledged_at IS NOT NULL FROM before), 'acknowledgement recorded');

SELECT public.reconcile_operational_alert_incidents(
    jsonb_build_array(pg_temp.alert('stp-recovery-below-target', 'stp', 'error', 'process_performance')),
    ARRAY['stp'], ARRAY['stp']);

SELECT pg_temp.assert(count(*) = 1, 'escalation does not open a second episode')
FROM public.operational_alert_incidents WHERE fingerprint = 'stp-recovery-below-target' AND resolved_at IS NULL;

SELECT pg_temp.assert(level = 'error' AND acknowledged_at IS NOT NULL,
                      'escalation re-levels in place and keeps the acknowledgement')
FROM public.operational_alert_incidents WHERE fingerprint = 'stp-recovery-below-target';

/* 2 ─ A module read on incomplete evidence cannot close anything. */
SELECT public.reconcile_operational_alert_incidents('[]'::jsonb, ARRAY['stp'], ARRAY[]::text[]);
SELECT pg_temp.assert(resolved_at IS NULL, 'read-only module leaves the incident open')
FROM public.operational_alert_incidents WHERE fingerprint = 'stp-recovery-below-target';

/* 3 ─ NULL resolvable modules resolve nothing (safe default). */
SELECT public.reconcile_operational_alert_incidents('[]'::jsonb, ARRAY['stp'], NULL);
SELECT pg_temp.assert(resolved_at IS NULL, 'NULL resolution grant resolves nothing')
FROM public.operational_alert_incidents WHERE fingerprint = 'stp-recovery-below-target';

/* 4 ─ Complete evidence does close it. */
SELECT public.reconcile_operational_alert_incidents('[]'::jsonb, ARRAY['stp'], ARRAY['stp']);
SELECT pg_temp.assert(resolved_at IS NOT NULL, 'complete evidence resolves the absent condition')
FROM public.operational_alert_incidents WHERE fingerprint = 'stp-recovery-below-target';

/* 5 ─ A returning condition opens a NEW episode against the same fingerprint. */
SELECT public.reconcile_operational_alert_incidents(
    jsonb_build_array(pg_temp.alert('stp-recovery-below-target', 'stp', 'error', 'process_performance')),
    ARRAY['stp'], ARRAY['stp']);
SELECT pg_temp.assert(count(*) = 2, 'a returning condition opens a second, separate episode')
FROM public.operational_alert_incidents WHERE fingerprint = 'stp-recovery-below-target';
SELECT pg_temp.assert(count(*) = 1, 'exactly one episode is open at a time')
FROM public.operational_alert_incidents WHERE fingerprint = 'stp-recovery-below-target' AND resolved_at IS NULL;

/* 6 ─ Alerts are still PERSISTED for a module denied resolution authority. */
SELECT public.reconcile_operational_alert_incidents(
    jsonb_build_array(pg_temp.alert('stp-missing-readings', 'stp', 'warning', 'data_quality')),
    ARRAY['stp'], ARRAY[]::text[]);
SELECT pg_temp.assert(count(*) = 1, 'incomplete evidence still records the data-quality alert')
FROM public.operational_alert_incidents WHERE fingerprint = 'stp-missing-readings' AND resolved_at IS NULL;
SELECT pg_temp.assert(resolved_at IS NULL, 'and does not close the unrelated open incident')
FROM public.operational_alert_incidents
WHERE fingerprint = 'stp-recovery-below-target' AND detected_at = (
    SELECT max(detected_at) FROM public.operational_alert_incidents WHERE fingerprint = 'stp-recovery-below-target');

/* 7 ─ Resolution authority must be a subset of what was read. */
DO $$
BEGIN
    PERFORM public.reconcile_operational_alert_incidents('[]'::jsonb, ARRAY['stp'], ARRAY['water']);
    RAISE EXCEPTION 'FAIL: resolvable-not-subset was accepted';
EXCEPTION WHEN others THEN
    IF SQLERRM LIKE 'FAIL:%' THEN RAISE; END IF;
    RAISE NOTICE 'pass: resolvable modules must be a subset of evaluated modules';
END;
$$;

/* 8 ─ An alert for a module that was never read is rejected. */
DO $$
BEGIN
    PERFORM public.reconcile_operational_alert_incidents(
        jsonb_build_array(pg_temp.alert('water-loss:Mar-26', 'water', 'error', 'water_balance')),
        ARRAY['stp'], ARRAY['stp']);
    RAISE EXCEPTION 'FAIL: alert for an unevaluated module was accepted';
EXCEPTION WHEN others THEN
    IF SQLERRM LIKE 'FAIL:%' THEN RAISE; END IF;
    RAISE NOTICE 'pass: an alert for an unevaluated module is rejected';
END;
$$;

/* 9 ─ Resolving one module never touches another module's incidents. */
SELECT public.reconcile_operational_alert_incidents(
    jsonb_build_array(pg_temp.alert('contract-expiry:AMC-1', 'contractors', 'warning', 'contract_compliance')),
    ARRAY['contractors'], ARRAY['contractors']);
SELECT public.reconcile_operational_alert_incidents('[]'::jsonb, ARRAY['stp'], ARRAY['stp']);
SELECT pg_temp.assert(resolved_at IS NULL, 'resolving stp leaves a contractors incident open')
FROM public.operational_alert_incidents WHERE fingerprint = 'contract-expiry:AMC-1';

/* 10 ─ Per-agreement keying: one renewal resolves one incident. */
SELECT public.reconcile_operational_alert_incidents(
    jsonb_build_array(
        pg_temp.alert('contract-expiry:AMC-1', 'contractors', 'warning', 'contract_compliance'),
        pg_temp.alert('contract-expiry:AMC-2', 'contractors', 'error', 'contract_compliance')),
    ARRAY['contractors'], ARRAY['contractors']);
SELECT public.acknowledge_operational_alert_incident(id)
FROM public.operational_alert_incidents
WHERE fingerprint = 'contract-expiry:AMC-1' AND resolved_at IS NULL;

-- AMC-2 renewed; AMC-1 still expiring.
SELECT public.reconcile_operational_alert_incidents(
    jsonb_build_array(pg_temp.alert('contract-expiry:AMC-1', 'contractors', 'warning', 'contract_compliance')),
    ARRAY['contractors'], ARRAY['contractors']);
SELECT pg_temp.assert(resolved_at IS NOT NULL, 'the renewed agreement resolves')
FROM public.operational_alert_incidents WHERE fingerprint = 'contract-expiry:AMC-2';
SELECT pg_temp.assert(resolved_at IS NULL AND acknowledged_at IS NOT NULL,
                      'the other agreement keeps its open, acknowledged incident')
FROM public.operational_alert_incidents WHERE fingerprint = 'contract-expiry:AMC-1';

/* 11 ─ Acknowledgement is refused without an operator role. */
SELECT set_config('test.uid', '11111111-1111-1111-1111-111111111112', false);
DO $$
DECLARE target uuid;
BEGIN
    SELECT id INTO target FROM public.operational_alert_incidents WHERE resolved_at IS NULL LIMIT 1;
    PERFORM public.acknowledge_operational_alert_incident(target);
    RAISE EXCEPTION 'FAIL: a viewer acknowledged an incident';
EXCEPTION WHEN others THEN
    IF SQLERRM LIKE 'FAIL:%' THEN RAISE; END IF;
    RAISE NOTICE 'pass: acknowledgement requires an operator role';
END;
$$;

/* 12 ─ Anonymous callers hold no grant on the reconciler. */
SELECT pg_temp.assert(NOT has_function_privilege('anon',
    'public.reconcile_operational_alert_incidents(jsonb, text[], text[])', 'EXECUTE'),
    'anon cannot execute the reconciler');
SELECT pg_temp.assert(NOT has_function_privilege('authenticated',
    'public.reconcile_operational_alert_incidents(jsonb, text[], text[])', 'EXECUTE'),
    'authenticated cannot execute the reconciler');
SELECT pg_temp.assert(has_function_privilege('service_role',
    'public.reconcile_operational_alert_incidents(jsonb, text[], text[])', 'EXECUTE'),
    'service_role can execute the reconciler');
SELECT pg_temp.assert(NOT has_table_privilege('authenticated', 'public.operational_alert_incidents', 'UPDATE'),
    'authenticated cannot write incidents directly');

/* 13 ─ Only one 2-argument overload should remain (no stale signature). */
SELECT pg_temp.assert(count(*) = 1, 'exactly one reconciler signature exists')
FROM pg_proc WHERE proname = 'reconcile_operational_alert_incidents';

SELECT 'ALL RECONCILER TESTS PASSED' AS result;
