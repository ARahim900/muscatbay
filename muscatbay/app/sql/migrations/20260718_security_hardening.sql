-- =============================================================================
-- Security hardening — 2026-07-18
-- =============================================================================
-- Companion to the audit on branch `claude/app-performance-storage-audit-jnqqv7`.
--
-- IMPORTANT — READ BEFORE APPLYING:
--   * This file is NOT auto-applied. Review it, then run it in the Supabase SQL
--     editor (or via `apply_migration`) once you are ready.
--   * It closes the access-control holes the audit found WITHOUT affecting any
--     automation: every sync writes via `service_role` or a SECURITY DEFINER
--     function, both of which bypass RLS. Nothing here touches those paths.
--   * The daily/monthly crons, edge functions and the writable "Water System"
--     view continue to work unchanged.
--   * Deploy the matching app code (lib/rbac.ts role default) together with
--     Section 3 so existing users keep access with no lockout.
--
-- What it does:
--   1. Removes ANONYMOUS write/delete access to the water tables.
--   2. Locks down the 5 tables that currently have RLS disabled.
--   3. Restricts `profiles` reads to signed-in users and blocks role
--      self-elevation; grandfathers existing users to admin.
--   4. Scopes avatar uploads to each user's own folder + adds bucket limits.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1. Remove anonymous write/delete on water tables
--    (the app's logged-in operators write as `authenticated`; the Grafana/STP
--     syncs write as `service_role` — neither uses these anon policies).
-- -----------------------------------------------------------------------------
drop policy if exists "Allow anonymous insert"  on public.water_daily_consumption;
drop policy if exists "Allow anonymous update"  on public.water_daily_consumption;
drop policy if exists "Allow anonymous delete"  on public.water_daily_consumption;

drop policy if exists "Allow anonymous insert"  on public.water_loss_daily;
drop policy if exists "Allow anonymous update"  on public.water_loss_daily;
drop policy if exists "Allow anonymous delete"  on public.water_loss_daily;

drop policy if exists "anon_insert" on public.water_grafana_readings;
drop policy if exists "anon_update" on public.water_grafana_readings;

-- water_network_meters / water_network_readings currently grant ALL to `public`.
-- Replace the write side with authenticated-only; keep public read.
drop policy if exists "wnm_public_write" on public.water_network_meters;
drop policy if exists "wnr_public_write" on public.water_network_readings;

create policy "wnm_authed_write" on public.water_network_meters
    for all to authenticated using (true) with check (true);
create policy "wnr_authed_write" on public.water_network_readings
    for all to authenticated using (true) with check (true);

-- -----------------------------------------------------------------------------
-- 2. Lock down tables that currently have RLS DISABLED
--    Enabling RLS with NO policy denies anon/authenticated entirely; the daily
--    STP sync uses `service_role`, which still bypasses RLS, so it is unaffected.
--    (Alternatively, DROP the three dated backup tables if no longer needed —
--     see the commented block at the end.)
-- -----------------------------------------------------------------------------
alter table public._stp_sync_queue                         enable row level security;
alter table public.mom_tasks                               enable row level security;
alter table public."Contractor_Tracker_backup_20260704"   enable row level security;
alter table public.contractor_contracts_backup_20260704    enable row level security;
alter table public.contractor_yearly_costs_backup_20260704 enable row level security;

-- -----------------------------------------------------------------------------
-- 3. profiles — stop exposing all users publicly + block role self-elevation
-- -----------------------------------------------------------------------------
-- 3a. Grandfather existing accounts to admin so NO ONE loses access on deploy.
update public.profiles set role = 'admin' where role is null or role = 'user';

-- 3b. New sign-ups default to the least-privileged role.
alter table public.profiles alter column role set default 'viewer';

-- 3c. Only signed-in users can read profiles (was: viewable by everyone/anon).
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
drop policy if exists "Users can view own profile"               on public.profiles;
create policy "Authenticated can read profiles" on public.profiles
    for select to authenticated using (true);

-- 3d. Users may edit their own profile but may NOT change their own role.
--     (Role changes are performed by an admin via service_role / the dashboard.)
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
    for update to authenticated
    using (auth.uid() = id)
    with check (
        auth.uid() = id
        and role = (select p.role from public.profiles p where p.id = auth.uid())
    );

-- -----------------------------------------------------------------------------
-- 4. Avatar storage — scope writes to each user's own folder + bucket limits
-- -----------------------------------------------------------------------------
update storage.buckets
   set file_size_limit   = 2097152,  -- 2 MB
       allowed_mime_types = array['image/png','image/jpeg','image/webp','image/gif']
 where id = 'avatars';

drop policy if exists "Allow authenticated uploads to avatars" on storage.objects;
drop policy if exists "Allow authenticated updates to avatars" on storage.objects;

create policy "Avatar upload to own folder" on storage.objects
    for insert to authenticated
    with check (
        bucket_id = 'avatars'
        and (storage.foldername(name))[1] = auth.uid()::text
    );

create policy "Avatar update own folder" on storage.objects
    for update to authenticated
    using (
        bucket_id = 'avatars'
        and (storage.foldername(name))[1] = auth.uid()::text
    );

create policy "Avatar delete own folder" on storage.objects
    for delete to authenticated
    using (
        bucket_id = 'avatars'
        and (storage.foldername(name))[1] = auth.uid()::text
    );
-- Public SELECT on avatars is intentionally kept (avatars are public images).

commit;

-- =============================================================================
-- OPTIONAL — apply only after confirming the app still reads correctly in a
-- staging/preview environment. These tighten ANONYMOUS *read* access on the
-- business tables. Logged-in operators read as `authenticated`, so the app is
-- expected to keep working; test first because some pages may fetch before the
-- session hydrates.
-- =============================================================================
-- Example (repeat per table as desired):
--   drop policy if exists "Allow anonymous read access" on public.stp_operations;
--   -- keep/ensure an authenticated read policy exists:
--   -- create policy "authed read" on public.stp_operations
--   --   for select to authenticated using (true);

-- OPTIONAL — remove the dated backup tables entirely instead of just enabling
-- RLS on them (Section 2). Confirm they are not needed first:
--   drop table if exists public."Contractor_Tracker_backup_20260704";
--   drop table if exists public.contractor_contracts_backup_20260704;
--   drop table if exists public.contractor_yearly_costs_backup_20260704;
