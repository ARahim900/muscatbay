-- Minimal stand-in for the Supabase primitives the alert-incident migration
-- depends on. Enough to apply the migration verbatim and exercise the
-- reconciler; NOT a substitute for a full staging apply.

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon NOLOGIN; END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN CREATE ROLE service_role NOLOGIN BYPASSRLS; END IF;
END $$;

CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE IF NOT EXISTS auth.users (id uuid PRIMARY KEY);

-- Session-settable identity, so a test can act as a given user/role.
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid
LANGUAGE sql STABLE AS $$
    SELECT NULLIF(current_setting('test.uid', true), '')::uuid;
$$;

CREATE OR REPLACE FUNCTION public.mb_current_user_role() RETURNS text
LANGUAGE sql STABLE AS $$
    SELECT NULLIF(current_setting('test.role', true), '');
$$;

CREATE OR REPLACE FUNCTION public.mb_has_any_role(allowed_roles text[]) RETURNS boolean
LANGUAGE sql STABLE AS $$
    SELECT public.mb_current_user_role() = ANY (allowed_roles);
$$;

CREATE OR REPLACE FUNCTION public.mb_can_read_module(requested_module text) RETURNS boolean
LANGUAGE sql STABLE AS $$
    SELECT public.mb_current_user_role() IS NOT NULL;
$$;
