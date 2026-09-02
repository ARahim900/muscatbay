-- Role-based access tests for 20260901_invitation_only_security_and_rls.sql.
--
-- These run as the `authenticated` and `anon` database roles the Supabase REST
-- layer actually uses, with `auth.uid()` pointed at a seeded profile — so the
-- policies, grants and triggers under test are the real ones from the
-- migration, not a re-statement of them.
--
-- Read the two failure modes correctly:
--   * a missing GRANT raises "permission denied" (the statement is rejected);
--   * an RLS policy that does not match returns ZERO ROWS for a SELECT, and
--     raises "new row violates row-level security policy" for a write.
-- Both are asserted below, because a table that is merely empty to a viewer is
-- indistinguishable from one that is unprotected but unpopulated.

\set ON_ERROR_STOP on

-- ── seed identities THROUGH the invitation flow ─────────────────────────
-- Accounts are created the only way the migration allows: an invitation naming
-- the role and module scope, then a user row whose trigger consumes it. This
-- seeds the fixtures AND exercises the invitation gate, rather than writing
-- profiles behind it.
INSERT INTO public.auth_invitations (email, role, module_scope) VALUES
    ('admin@example.test', 'admin', '[]'::jsonb),
    ('manager@example.test', 'manager', '[]'::jsonb),
    ('operator@example.test', 'operator', '[]'::jsonb),
    ('viewer@example.test', 'viewer', '[]'::jsonb),
    -- A contractor is scoped to the STP module only.
    ('contractor@example.test', 'contractor', '["stp"]'::jsonb);

INSERT INTO auth.users (id, email) VALUES
    ('00000000-0000-0000-0000-0000000000a1', 'admin@example.test'),
    ('00000000-0000-0000-0000-0000000000a2', 'manager@example.test'),
    ('00000000-0000-0000-0000-0000000000a3', 'operator@example.test'),
    ('00000000-0000-0000-0000-0000000000a4', 'viewer@example.test'),
    ('00000000-0000-0000-0000-0000000000a5', 'contractor@example.test');

DO $$
BEGIN
    IF (SELECT count(*) FROM public.profiles) <> 5 THEN
        RAISE EXCEPTION 'FAIL: the invitation trigger did not create five profiles';
    END IF;
    IF (SELECT role FROM public.profiles WHERE email = 'contractor@example.test') <> 'contractor'
       OR (SELECT module_scope FROM public.profiles WHERE email = 'contractor@example.test') <> '["stp"]'::jsonb THEN
        RAISE EXCEPTION 'FAIL: the invitation role/scope was not applied to the profile';
    END IF;
    RAISE NOTICE 'pass: an invitation creates the profile with its role and module scope';
END $$;

DO $$
BEGIN
    IF (SELECT count(*) FROM public.auth_invitations WHERE accepted_at IS NULL) <> 0 THEN
        RAISE EXCEPTION 'FAIL: an accepted invitation was left reusable';
    END IF;
    RAISE NOTICE 'pass: accepting an invitation consumes it';
END $$;

-- The gate itself: an identity with no invitation cannot be created at all.
DO $$
BEGIN
    INSERT INTO auth.users (id, email)
        VALUES ('00000000-0000-0000-0000-0000000000a6', 'uninvited@example.test');
    RAISE EXCEPTION 'FAIL: an uninvited identity was created';
EXCEPTION WHEN others THEN
    IF SQLERRM LIKE 'FAIL:%' THEN RAISE; END IF;
    RAISE NOTICE 'pass: an uninvited identity is rejected (%)', left(SQLERRM, 40);
END $$;

-- The Before-User-Created hook must give Auth the same answer for OAuth, where
-- no row is inserted for the trigger to reject.
DO $$
BEGIN
    IF public.mb_before_user_created(
        jsonb_build_object('user', jsonb_build_object('email', 'uninvited@example.test'))
    ) -> 'error' ->> 'http_code' <> '403' THEN
        RAISE EXCEPTION 'FAIL: the hook admitted an uninvited email';
    END IF;
    RAISE NOTICE 'pass: the Before-User-Created hook returns 403 for an uninvited email';
END $$;

INSERT INTO public.auth_invitations (email, role) VALUES ('invited-oauth@example.test', 'viewer');
DO $$
BEGIN
    IF public.mb_before_user_created(
        jsonb_build_object('user', jsonb_build_object('email', 'Invited-OAuth@Example.test'))
    ) <> '{}'::jsonb THEN
        RAISE EXCEPTION 'FAIL: the hook rejected an invited email';
    END IF;
    RAISE NOTICE 'pass: the hook admits an invited email, case-insensitively';
END $$;

-- A revoked invitation must not admit anyone.
INSERT INTO public.auth_invitations (email, role, revoked_at)
    VALUES ('revoked@example.test', 'admin', now());
DO $$
BEGIN
    IF public.mb_before_user_created(
        jsonb_build_object('user', jsonb_build_object('email', 'revoked@example.test'))
    ) -> 'error' ->> 'http_code' <> '403' THEN
        RAISE EXCEPTION 'FAIL: a revoked invitation still admitted a user';
    END IF;
    RAISE NOTICE 'pass: a revoked invitation admits nobody';
END $$;

-- An expired invitation must not admit anyone either.
INSERT INTO public.auth_invitations (email, role, expires_at)
    VALUES ('expired@example.test', 'admin', now() - interval '1 day');
DO $$
BEGIN
    IF public.mb_before_user_created(
        jsonb_build_object('user', jsonb_build_object('email', 'expired@example.test'))
    ) -> 'error' ->> 'http_code' <> '403' THEN
        RAISE EXCEPTION 'FAIL: an expired invitation still admitted a user';
    END IF;
    RAISE NOTICE 'pass: an expired invitation admits nobody';
END $$;

-- A profile-less authenticated session (a1..a5 all have profiles, so use an id
-- that was never created) must see nothing. This models a JWT that outlived its
-- profile row.

INSERT INTO public.water_meters (label, account_number) VALUES ('Zone 5 Bulk', '4300345');
INSERT INTO public.stp_operations (date, inlet_sewage, tse_for_irrigation, tanker_trips)
    VALUES ('2026-07-12', 500, 450, 2);
INSERT INTO public.amc_register (agreement_id, contractor, service_system, end_date)
    VALUES ('AMC-1', 'Test Co', 'Testing', '2026-12-31');

-- An unlisted table: not in the reviewed inventory, so it must be fail-closed.
CREATE TABLE IF NOT EXISTS public.internal_scratch (id int PRIMARY KEY, secret text);
INSERT INTO public.internal_scratch VALUES (1, 'not for clients') ON CONFLICT DO NOTHING;

/* ═══ viewer: read everything, write nothing ═══════════════════════════ */
SELECT set_config('test.uid', '00000000-0000-0000-0000-0000000000a4', false);
SET ROLE authenticated;

DO $$
BEGIN
    IF (SELECT count(*) FROM public.water_meters) <> 1 THEN
        RAISE EXCEPTION 'FAIL: a viewer must be able to read water_meters';
    END IF;
    RAISE NOTICE 'pass: viewer reads water_meters';
END $$;

DO $$
BEGIN
    INSERT INTO public.water_meters (label) VALUES ('viewer insert');
    RAISE EXCEPTION 'FAIL: a viewer inserted into water_meters';
EXCEPTION WHEN others THEN
    IF SQLERRM LIKE 'FAIL:%' THEN RAISE; END IF;
    RAISE NOTICE 'pass: viewer cannot insert (%)', left(SQLERRM, 60);
END $$;

-- UPDATE and DELETE do NOT raise when the policy's USING clause excludes every
-- row: no row is selected to modify, so the statement succeeds having changed
-- nothing. Asserting an exception here would pass for the wrong reason, so the
-- assertion is on the row count AND on the data still being intact.
DO $$
DECLARE touched int;
BEGIN
    UPDATE public.water_meters SET label = 'viewer update';
    GET DIAGNOSTICS touched = ROW_COUNT;
    IF touched <> 0 THEN
        RAISE EXCEPTION 'FAIL: a viewer updated % row(s) of water_meters', touched;
    END IF;
    IF (SELECT count(*) FROM public.water_meters WHERE label = 'Zone 5 Bulk') <> 1 THEN
        RAISE EXCEPTION 'FAIL: the water_meters row was modified by a viewer';
    END IF;
    RAISE NOTICE 'pass: a viewer update changes nothing';
END $$;

DO $$
DECLARE touched int;
BEGIN
    DELETE FROM public.water_meters;
    GET DIAGNOSTICS touched = ROW_COUNT;
    IF touched <> 0 OR (SELECT count(*) FROM public.water_meters) <> 1 THEN
        RAISE EXCEPTION 'FAIL: a viewer deleted from water_meters';
    END IF;
    RAISE NOTICE 'pass: a viewer delete removes nothing';
END $$;

DO $$
BEGIN
    PERFORM 1 FROM public.internal_scratch;
    RAISE EXCEPTION 'FAIL: an unlisted table was readable';
EXCEPTION WHEN others THEN
    IF SQLERRM LIKE 'FAIL:%' THEN RAISE; END IF;
    RAISE NOTICE 'pass: an unlisted table is fail-closed';
END $$;

RESET ROLE;

/* ═══ contractor: only the modules in module_scope ═════════════════════ */
SELECT set_config('test.uid', '00000000-0000-0000-0000-0000000000a5', false);
SET ROLE authenticated;

DO $$
BEGIN
    IF (SELECT count(*) FROM public.stp_operations) <> 1 THEN
        RAISE EXCEPTION 'FAIL: a contractor scoped to stp must read stp_operations';
    END IF;
    RAISE NOTICE 'pass: contractor reads its scoped module (stp)';
END $$;

DO $$
BEGIN
    -- Out of scope: the policy does not match, so the table reads as EMPTY
    -- rather than raising. Zero rows is the denial.
    IF (SELECT count(*) FROM public.water_meters) <> 0 THEN
        RAISE EXCEPTION 'FAIL: a contractor read a module outside its scope';
    END IF;
    RAISE NOTICE 'pass: contractor sees nothing outside its scope (water)';
END $$;

DO $$
BEGIN
    IF (SELECT count(*) FROM public.amc_register) <> 0 THEN
        RAISE EXCEPTION 'FAIL: a contractor read the contractors register';
    END IF;
    RAISE NOTICE 'pass: contractor cannot read the contractor register';
END $$;

RESET ROLE;

/* ═══ operator: write operational data, never delete ═══════════════════ */
SELECT set_config('test.uid', '00000000-0000-0000-0000-0000000000a3', false);
SET ROLE authenticated;

DO $$
BEGIN
    INSERT INTO public.stp_operations (date, inlet_sewage, tse_for_irrigation, tanker_trips)
        VALUES ('2026-07-13', 510, 460, 3);
    RAISE NOTICE 'pass: operator inserts operational data';
END $$;

DO $$
BEGIN
    UPDATE public.stp_operations SET tanker_trips = 4 WHERE date = '2026-07-13';
    RAISE NOTICE 'pass: operator updates operational data';
END $$;

DO $$
DECLARE touched int;
BEGIN
    DELETE FROM public.stp_operations WHERE date = '2026-07-13';
    GET DIAGNOSTICS touched = ROW_COUNT;
    IF touched <> 0 THEN
        RAISE EXCEPTION 'FAIL: an operator deleted % row(s) of operational data', touched;
    END IF;
    RAISE NOTICE 'pass: an operator delete removes nothing (admin-only)';
END $$;

RESET ROLE;

/* ═══ admin: delete is admin-only ══════════════════════════════════════ */
SELECT set_config('test.uid', '00000000-0000-0000-0000-0000000000a1', false);
SET ROLE authenticated;

DO $$
BEGIN
    DELETE FROM public.stp_operations WHERE date = '2026-07-13';
    IF NOT FOUND THEN
        RAISE EXCEPTION 'FAIL: the admin delete matched no row (setup problem)';
    END IF;
    RAISE NOTICE 'pass: admin deletes operational data';
END $$;

RESET ROLE;

/* ═══ an authenticated session that was never invited sees nothing ═════ */
SELECT set_config('test.uid', '00000000-0000-0000-0000-0000000000a6', false);
SET ROLE authenticated;

DO $$
BEGIN
    IF (SELECT count(*) FROM public.water_meters) <> 0
       OR (SELECT count(*) FROM public.stp_operations) <> 0 THEN
        RAISE EXCEPTION 'FAIL: an uninvited authenticated user read operational data';
    END IF;
    RAISE NOTICE 'pass: an authenticated user with no profile sees nothing';
END $$;

RESET ROLE;

/* ═══ anon: the REST anonymous role holds nothing ══════════════════════ */
SET ROLE anon;

DO $$
BEGIN
    PERFORM 1 FROM public.water_meters;
    RAISE EXCEPTION 'FAIL: anon read water_meters';
EXCEPTION WHEN others THEN
    IF SQLERRM LIKE 'FAIL:%' THEN RAISE; END IF;
    RAISE NOTICE 'pass: anon cannot read operational data';
END $$;

DO $$
BEGIN
    PERFORM 1 FROM public.profiles;
    RAISE EXCEPTION 'FAIL: anon read profiles';
EXCEPTION WHEN others THEN
    IF SQLERRM LIKE 'FAIL:%' THEN RAISE; END IF;
    RAISE NOTICE 'pass: anon cannot read profiles';
END $$;

-- Public intake is the ONE thing anon may do, and only as a pending record.
DO $$
BEGIN
    INSERT INTO public.professional_applications (email, status) VALUES ('applicant@example.test', 'pending');
    RAISE NOTICE 'pass: anon may submit a pending professional application';
END $$;

DO $$
BEGIN
    INSERT INTO public.professional_applications (email, status) VALUES ('sneaky@example.test', 'approved');
    RAISE EXCEPTION 'FAIL: anon self-approved a professional application';
EXCEPTION WHEN others THEN
    IF SQLERRM LIKE 'FAIL:%' THEN RAISE; END IF;
    RAISE NOTICE 'pass: anon cannot submit a pre-approved application';
END $$;

DO $$
BEGIN
    PERFORM 1 FROM public.professional_applications;
    RAISE EXCEPTION 'FAIL: anon read the applications it submitted';
EXCEPTION WHEN others THEN
    IF SQLERRM LIKE 'FAIL:%' THEN RAISE; END IF;
    RAISE NOTICE 'pass: anon cannot read applications back';
END $$;

RESET ROLE;

/* ═══ privilege escalation through the profile row ═════════════════════ */
SELECT set_config('test.uid', '00000000-0000-0000-0000-0000000000a4', false);
SET ROLE authenticated;

DO $$
BEGIN
    UPDATE public.profiles SET full_name = 'Viewer Renamed'
    WHERE id = '00000000-0000-0000-0000-0000000000a4';
    RAISE NOTICE 'pass: a user may edit their own profile';
END $$;

DO $$
BEGIN
    UPDATE public.profiles SET role = 'admin'
    WHERE id = '00000000-0000-0000-0000-0000000000a4';
    RAISE EXCEPTION 'FAIL: a viewer promoted itself to admin';
EXCEPTION WHEN others THEN
    IF SQLERRM LIKE 'FAIL:%' THEN RAISE; END IF;
    RAISE NOTICE 'pass: a user cannot change their own role';
END $$;

DO $$
BEGIN
    UPDATE public.profiles SET module_scope = '["water","stp"]'::jsonb
    WHERE id = '00000000-0000-0000-0000-0000000000a4';
    RAISE EXCEPTION 'FAIL: a viewer widened its own module scope';
EXCEPTION WHEN others THEN
    IF SQLERRM LIKE 'FAIL:%' THEN RAISE; END IF;
    RAISE NOTICE 'pass: a user cannot widen their own module scope';
END $$;

RESET ROLE;

/* ═══ server-owned alert incidents are read-only to clients ════════════ */
SELECT set_config('test.uid', '00000000-0000-0000-0000-0000000000a3', false);
SET ROLE authenticated;

DO $$
BEGIN
    PERFORM 1 FROM public.operational_alert_incidents;
    RAISE NOTICE 'pass: an operator may read alert incidents';
END $$;

DO $$
BEGIN
    INSERT INTO public.operational_alert_incidents (fingerprint, module, category, level, title, message, href)
        VALUES ('forged', 'stp', 'data_quality', 'error', 'x', 'y', '/stp');
    RAISE EXCEPTION 'FAIL: a client wrote directly to operational_alert_incidents';
EXCEPTION WHEN others THEN
    IF SQLERRM LIKE 'FAIL:%' THEN RAISE; END IF;
    RAISE NOTICE 'pass: clients cannot write alert incidents directly';
END $$;

DO $$
BEGIN
    PERFORM public.reconcile_operational_alert_incidents('[]'::jsonb, ARRAY['stp'], ARRAY['stp']);
    RAISE EXCEPTION 'FAIL: a client executed the server-only reconciler';
EXCEPTION WHEN others THEN
    IF SQLERRM LIKE 'FAIL:%' THEN RAISE; END IF;
    RAISE NOTICE 'pass: the reconciler is service_role only';
END $$;

RESET ROLE;

SELECT 'ALL RLS ROLE TESTS PASSED' AS result;
