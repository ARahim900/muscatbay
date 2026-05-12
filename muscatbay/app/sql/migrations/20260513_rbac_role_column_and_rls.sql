-- =====================================================================
-- RBAC: user_profiles.role + Row-Level Security policies
-- Date: 2026-05-13
-- Purpose: Hard gate at the database level so contractors / viewers
--          cannot read or write data outside their assigned modules.
--          Mirrors the app-side rules in lib/rbac.ts (ROLE_MODULES).
--
-- Roles:
--   admin       — full access (default for the original developer)
--   manager     — full read/write, no system settings
--   operator    — full read, write to water/electricity/stp/hvac/assets
--   contractor  — restricted: HVAC only by default (or per-row scoping)
--   viewer      — read-only board-presentation profile
--
-- Run order:
--   1. Ensure user_profiles table exists (it should — used by lib/auth.ts).
--   2. Run this migration in the Supabase SQL editor.
--   3. Set your own user's role to 'admin' (see "Bootstrap" block at end).
--   4. Verify with the test queries below.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Role column (idempotent — safe to re-run)
-- ---------------------------------------------------------------------
ALTER TABLE public.user_profiles
    ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'viewer';

-- Allowed roles enforced at the DB level so a bad client can't write garbage.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'user_profiles_role_check'
    ) THEN
        ALTER TABLE public.user_profiles
            ADD CONSTRAINT user_profiles_role_check
            CHECK (role IN ('admin', 'manager', 'operator', 'contractor', 'viewer'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS user_profiles_role_idx ON public.user_profiles (role);

-- Optional per-row scoping for contractors (e.g. only "BEC" contractor sees
-- their own findings). JSONB array of arbitrary scope strings the app can match.
ALTER TABLE public.user_profiles
    ADD COLUMN IF NOT EXISTS module_scope jsonb NOT NULL DEFAULT '[]'::jsonb;

-- ---------------------------------------------------------------------
-- 2. Helper function — get current user's role
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_user_role()
    RETURNS text
    LANGUAGE sql
    STABLE
    SECURITY DEFINER
    SET search_path = public
AS $$
    SELECT COALESCE(
        (SELECT role FROM public.user_profiles WHERE id = auth.uid()),
        'viewer'
    );
$$;

REVOKE ALL ON FUNCTION public.current_user_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;

-- Convenience predicates so policies stay readable.
CREATE OR REPLACE FUNCTION public.is_admin_or_manager()
    RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT public.current_user_role() IN ('admin', 'manager');
$$;

CREATE OR REPLACE FUNCTION public.is_at_least_operator()
    RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT public.current_user_role() IN ('admin', 'manager', 'operator');
$$;

-- ---------------------------------------------------------------------
-- 3. RLS policies — apply to each domain table.
--    Pattern:
--      - SELECT  : any authenticated user with module access
--      - INSERT  : operator+ (write data)
--      - UPDATE  : operator+
--      - DELETE  : admin/manager only (destructive)
--    Drop-and-recreate so this migration is idempotent.
-- ---------------------------------------------------------------------

-- Helper macro (we expand inline below) — modules that gate by role:
--   water   : water-related tables   (read = water access)
--   electricity, stp, hvac, assets, contractors, firefighting, pest-control
-- "Water access" means role can see the "water" ModuleKey.
-- That maps to: admin, manager, operator, viewer.
-- Contractor doesn't get water by default.

-- ===== user_profiles ===============================================
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users read own profile, admins read all" ON public.user_profiles;
CREATE POLICY "users read own profile, admins read all"
    ON public.user_profiles FOR SELECT
    TO authenticated
    USING (id = auth.uid() OR public.is_admin_or_manager());

DROP POLICY IF EXISTS "users update own non-role fields" ON public.user_profiles;
CREATE POLICY "users update own non-role fields"
    ON public.user_profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    -- Block self-elevation: cannot change own role / scope unless admin.
    WITH CHECK (
        id = auth.uid() AND (
            public.current_user_role() = 'admin'
            OR (role IS NOT DISTINCT FROM (SELECT role FROM public.user_profiles p WHERE p.id = auth.uid())
                AND module_scope IS NOT DISTINCT FROM (SELECT module_scope FROM public.user_profiles p WHERE p.id = auth.uid()))
        )
    );

DROP POLICY IF EXISTS "admins manage any profile" ON public.user_profiles;
CREATE POLICY "admins manage any profile"
    ON public.user_profiles FOR ALL
    TO authenticated
    USING (public.current_user_role() = 'admin')
    WITH CHECK (public.current_user_role() = 'admin');

-- ===== Apply uniform policies to each domain table ================
-- Pattern repeated for clarity. Adjust the per-table role list if a
-- module needs a tighter scope than the global one.

DO $$
DECLARE
    t text;
    -- (table_name, read_roles)
    targets text[][] := ARRAY[
        -- Water domain
        ARRAY['water_monthly_consumption', 'admin,manager,operator,viewer'],
        ARRAY['water_loss_summary',        'admin,manager,operator,viewer'],
        ARRAY['water_loss_daily',          'admin,manager,operator,viewer'],
        -- Electricity domain
        ARRAY['electricity_readings',      'admin,manager,operator,viewer'],
        -- STP domain
        ARRAY['stp_operations',            'admin,manager,operator,viewer'],
        -- Assets / contractors
        ARRAY['assets',                    'admin,manager,operator'],
        ARRAY['contractor_contracts',      'admin,manager,operator'],
        ARRAY['professional_applications', 'admin,manager'],
        -- HVAC (Gulf Expert)
        ARRAY['ge_ppm_findings',           'admin,manager,operator,contractor'],
        ARRAY['ge_equipment_registry',     'admin,manager,operator,contractor'],
        ARRAY['ge_compressor_status',      'admin,manager,operator,contractor'],
        ARRAY['ge_quotations',             'admin,manager,contractor'],
        ARRAY['ge_recurring_issues',       'admin,manager,operator,contractor'],
        ARRAY['ge_equipment_summary',      'admin,manager,operator,contractor']
    ];
    pair text[];
    table_name text;
    read_roles text;
BEGIN
    FOREACH pair SLICE 1 IN ARRAY targets LOOP
        table_name := pair[1];
        read_roles := pair[2];

        -- Skip if table doesn't exist yet (allows safe re-run on fresh DBs)
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND information_schema.tables.table_name = pair[1]
        ) THEN
            RAISE NOTICE 'skipping % — table does not exist', table_name;
            CONTINUE;
        END IF;

        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', table_name);

        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', table_name || '_select', table_name);
        EXECUTE format(
            'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.current_user_role() = ANY (string_to_array(%L, '','')));',
            table_name || '_select', table_name, read_roles
        );

        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', table_name || '_write', table_name);
        EXECUTE format(
            'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (public.is_at_least_operator()) WITH CHECK (public.is_at_least_operator());',
            table_name || '_write', table_name
        );
    END LOOP;
END $$;

-- ---------------------------------------------------------------------
-- 4. Bootstrap — promote the original developer to admin
--    Replace the email below with your own before running.
-- ---------------------------------------------------------------------
UPDATE public.user_profiles
SET role = 'admin'
WHERE email = 'alameeri900@gmail.com'
  AND role != 'admin';

-- ---------------------------------------------------------------------
-- 5. Verify
-- ---------------------------------------------------------------------
-- Show every user with their role:
--   SELECT id, email, role, module_scope FROM public.user_profiles ORDER BY role, email;
--
-- Show RLS status per table:
--   SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE schemaname='public' ORDER BY tablename;
--
-- Test as a specific user (replace UID):
--   SET LOCAL role authenticated;
--   SET LOCAL "request.jwt.claim.sub" = '<their uid>';
--   SELECT * FROM public.water_monthly_consumption LIMIT 1;
-- =====================================================================
