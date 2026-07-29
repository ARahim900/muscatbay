-- =============================================================================
-- RLS regression fixes — 2026-07-29
-- =============================================================================
-- Found by the full front-end/back-end/Supabase audit on branch
-- `claude/app-audit-frontend-backend-2p3m0e`, by reading the LIVE state of
-- project `utnlgeuqajmwibqmdmgt` (not the migration files).
--
-- IMPORTANT — READ BEFORE APPLYING:
--   * This file is NOT auto-applied. Review it, then run it in the Supabase SQL
--     editor (or via `apply_migration`).
--   * It touches NO automation path. Every sync writes via `service_role` or a
--     SECURITY DEFINER function, both of which bypass RLS entirely.
--   * Nothing here removes access the app actually uses. Section 1 is the only
--     behavioural change for end users, and it only blocks an action the UI
--     never performs (a user editing their own `role`).
--
-- Context: `20260718_security_hardening.sql` was applied by hand, in part. The
-- anon-write policies it drops are gone and the avatar/bucket work landed, but
-- three things did not stick, and one new table has since regressed.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1. PRIVILEGE ESCALATION — `profiles`
-- -----------------------------------------------------------------------------
-- Live state:
--   "Users can update own profile"  UPDATE  authenticated
--        USING (auth.uid() = id)
--        WITH CHECK (auth.uid() = id AND role = (select p.role from profiles p
--                                                 where p.id = auth.uid()))
--   "mb_authenticated_all"          ALL     authenticated  USING true WITH CHECK true
--
-- Postgres OR's permissive policies together, so `mb_authenticated_all` fully
-- defeats the careful anti-self-elevation WITH CHECK above it. Today ANY
-- logged-in account can run
--     update profiles set role = 'admin' where id = auth.uid();
-- and become an administrator — and can rewrite every other user's row too.
-- That makes lib/rbac.ts's `viewer` default, and the whole ROLE_MODULES gate,
-- unenforceable.
--
-- Dropping the blanket policy leaves the three scoped policies, which are what
-- the app actually uses: read all profiles, insert your own, update your own
-- (minus `role`). Role changes move to service_role / the Supabase dashboard,
-- which is already how they are performed.
drop policy if exists "mb_authenticated_all" on public.profiles;

-- -----------------------------------------------------------------------------
-- 2. RLS DISABLED — `water_monthly_consumption_backup_20260727`
-- -----------------------------------------------------------------------------
-- Created by migration 20260727061805, after the 2026-07-18 hardening pass, and
-- so missed by it. It is the only table in `public` with RLS off, which means
-- it is readable AND writable by `anon` — i.e. by anyone holding the public
-- anon key, which ships in the client bundle. It carries `account_number`
-- (Supabase's advisor flags this as `sensitive_columns_exposed`).
--
-- Enabling RLS with no policy denies anon and authenticated outright while
-- leaving service_role (restore-from-backup) working, which matches how the
-- other dated backup tables were already secured in 20260721_secure_stale_backups.sql.
alter table public.water_monthly_consumption_backup_20260727 enable row level security;

-- -----------------------------------------------------------------------------
-- 3. SECURITY DEFINER FUNCTIONS EXECUTABLE BY `anon`
-- -----------------------------------------------------------------------------
-- These run with the definer's rights and are reachable unauthenticated at
-- /rest/v1/rpc/<name> using the public anon key. The write-capable ones let an
-- anonymous caller mutate operational data; `reload_schema_cache` is a free
-- availability lever. None of them is called from the browser — the syncs run
-- as service_role (edge functions / cron), which is unaffected by these revokes.
revoke execute on function public.aggregate_daily_to_monthly(text, integer)      from anon;
revoke execute on function public.bulk_upsert_stp_daily_reports(jsonb)           from anon;
revoke execute on function public.calculate_daily_water_loss(text, integer)      from anon;
revoke execute on function public.compute_water_loss_summary(text, integer)      from anon;
revoke execute on function public.handle_new_user()                              from anon;
revoke execute on function public.null_water_daily_placeholder_zeros()           from anon;
revoke execute on function public.reload_schema_cache()                          from anon;
revoke execute on function public.stp_upsert_daily_reports(jsonb)                from anon;
revoke execute on function public.stp_upsert_operations(jsonb)                   from anon;
revoke execute on function public.sync_grafana_water_consumption(text, text)     from anon;
revoke execute on function public.temp_sync_upsert_stp_ops(jsonb)                from anon;
revoke execute on function public.temp_sync_upsert_stp_reports(jsonb)            from anon;
revoke execute on function public.get_available_months()                         from anon;

-- -----------------------------------------------------------------------------
-- 4. AVATAR BUCKET — stop anonymous enumeration of every avatar
-- -----------------------------------------------------------------------------
-- `avatars` is a public bucket, so object URLs resolve without this policy. The
-- broad SELECT grant on storage.objects adds nothing except the ability to LIST
-- the bucket, i.e. enumerate every user's file. The three scoped write policies
-- (upload/update/delete own folder) are already correct and are left alone.
drop policy if exists "Give public access to avatars" on storage.objects;

-- -----------------------------------------------------------------------------
-- 5. Pin `search_path` on SECURITY DEFINER functions
-- -----------------------------------------------------------------------------
-- A mutable search_path on a definer-rights function is a privilege-escalation
-- primitive: a caller who can create objects in an earlier schema can shadow a
-- name the function body resolves. Pinning it is behaviour-neutral for these
-- functions, which all reference `public` objects unqualified.
alter function public.update_modified_column()                        set search_path = public, pg_temp;
alter function public.update_mar_timestamp()                          set search_path = public, pg_temp;
alter function public.update_updated_at_column()                      set search_path = public, pg_temp;
alter function public.handle_new_user()                               set search_path = public, pg_temp;
alter function public.update_professional_applications_updated_at()   set search_path = public, pg_temp;
alter function public.reload_schema_cache()                           set search_path = public, pg_temp;
alter function public.calculate_daily_water_loss(text, integer)       set search_path = public, pg_temp;
alter function public.sync_grafana_water_consumption(text, text)      set search_path = public, pg_temp;
alter function public.get_available_months()                          set search_path = public, pg_temp;
alter function public.aggregate_daily_to_monthly(text, integer)       set search_path = public, pg_temp;
alter function public.compute_water_loss_summary(text, integer)       set search_path = public, pg_temp;
alter function public.stp_upsert_operations(jsonb)                    set search_path = public, pg_temp;
alter function public.water_network_meters_touch_updated_at()         set search_path = public, pg_temp;
alter function public.water_meters_set_updated_at()                   set search_path = public, pg_temp;
alter function public.sync_upsert_stp_operations(jsonb)               set search_path = public, pg_temp;
alter function public.sync_stp_missing_dates(integer)                 set search_path = public, pg_temp;
alter function public.sync_upsert_stp_daily_reports(jsonb)            set search_path = public, pg_temp;
alter function public.stp_upsert_daily_reports(jsonb)                 set search_path = public, pg_temp;
alter function public.set_updated_at()                                set search_path = public, pg_temp;
alter function public._upsert_water_daily_consumption_tsv(text, text, integer)
                                                                      set search_path = public, pg_temp;

-- These three already pin `public` but omit `pg_temp`, which still leaves a
-- temp-schema shadowing window on a SECURITY DEFINER body.
alter function public.bulk_upsert_stp_daily_reports(jsonb)            set search_path = public, pg_temp;
alter function public.temp_sync_upsert_stp_ops(jsonb)                 set search_path = public, pg_temp;
alter function public.temp_sync_upsert_stp_reports(jsonb)             set search_path = public, pg_temp;

commit;

-- =============================================================================
-- NOT included here — deliberate, needs a product decision first
-- =============================================================================
-- Every module table currently grants `authenticated` a blanket ALL / USING true
-- / WITH CHECK true (68 `rls_policy_always_true` advisor hits). So the RBAC in
-- lib/rbac.ts is presentation-only: a `viewer` or `contractor` account is
-- blocked in the sidebar but can still read AND write every table through the
-- REST API with its own session token.
--
-- Closing that means deciding, per module, what each role may write — e.g.
--
--   create policy "electricity_read" on public.electricity_readings
--       for select to authenticated using (true);
--   create policy "electricity_write" on public.electricity_readings
--       for all to authenticated
--       using      ((select role from public.profiles where id = auth.uid())
--                       in ('admin','manager','operator'))
--       with check ((select role from public.profiles where id = auth.uid())
--                       in ('admin','manager','operator'));
--
-- That is a real behavioural change (a demoted account loses write access), so
-- it belongs in its own reviewed migration rather than bundled in with fixes
-- that take nothing away from anyone.
--
-- Also outstanding, dashboard-only (cannot be done in SQL):
--   * Auth → enable "Leaked password protection" (HaveIBeenPwned check).
--   * Auth → confirm signup restrictions so strangers cannot self-register.
-- =============================================================================
