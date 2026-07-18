-- =============================================================================
-- Security hardening — part 2 (applied live 2026-07-18 via MCP)
-- =============================================================================
-- Follows 20260718_security_hardening.sql. Both were APPLIED to the live project
-- (utnlgeuqajmwibqmdmgt) on 2026-07-18. This file records the additional changes
-- made beyond the first migration:
--   A. A future-date guard on the STP tables (so the erroneous AITable row can't
--      re-sync and stretch the charts into the future).
--   B. A schema-wide sweep removing ANONYMOUS write access from the remaining
--      business tables (the old "Allow all access" / "Allow all" policies), while
--      guaranteeing authenticated users keep full access.
--
-- Automation is unaffected: the daily/monthly syncs write via service_role or
-- SECURITY DEFINER functions, which bypass RLS. The public contractor-application
-- form (professional_applications) and the scoped own-profile insert are kept.
-- =============================================================================

-- A. STP future-date guard -----------------------------------------------------
create or replace function public.stp_reject_future_dates()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  -- Silently skip rows dated after "today" in Oman (GMT+4). Such rows are always
  -- erroneous source data; without this they re-appear via the daily AITable sync
  -- (as the 2027-05-06 row did) and stretch the STP charts into the future.
  if new.date > ((now() at time zone 'Asia/Muscat')::date) then
    return null;
  end if;
  return new;
end;
$$;

drop trigger if exists stp_operations_no_future on public.stp_operations;
create trigger stp_operations_no_future
  before insert or update on public.stp_operations
  for each row execute function public.stp_reject_future_dates();

drop trigger if exists stp_daily_reports_no_future on public.stp_daily_reports;
create trigger stp_daily_reports_no_future
  before insert or update on public.stp_daily_reports
  for each row execute function public.stp_reject_future_dates();

-- (the stray future rows were also deleted:
--    delete from public.stp_operations   where date > current_date;
--    delete from public.stp_daily_reports where date > current_date; )

-- B. Remove anonymous write access from remaining business tables ---------------
do $$
declare r record;
begin
  -- 1) Guarantee authenticated (logged-in operators) retain FULL access on every
  --    affected table BEFORE removing anything, so the app can never lose access.
  for r in
    select distinct tablename from pg_policies
    where schemaname='public'
      and (roles::text[] && array['anon','public'])
      and cmd in ('INSERT','UPDATE','DELETE','ALL')
      and tablename <> 'professional_applications'
  loop
    if not exists (select 1 from pg_policies
                   where schemaname='public' and tablename=r.tablename
                     and policyname='mb_authenticated_all') then
      execute format('create policy mb_authenticated_all on public.%I for all to authenticated using (true) with check (true)', r.tablename);
    end if;
  end loop;

  -- 2) Drop the wide-open anon/public WRITE policies. Keep the public contractor
  --    application form (professional_applications) and the scoped own-profile insert.
  for r in
    select policyname, tablename from pg_policies
    where schemaname='public'
      and (roles::text[] && array['anon','public'])
      and cmd in ('INSERT','UPDATE','DELETE','ALL')
      and tablename <> 'professional_applications'
      and policyname <> 'mb_authenticated_all'
      and not (tablename='profiles' and cmd='INSERT')
  loop
    execute format('drop policy %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- C. Remove anonymous READ access from remaining business tables --------------
--    App is login-gated (reads happen as authenticated); nothing legitimate reads
--    as anon except the public application form. Same safe pattern: ensure an
--    authenticated read exists first, then drop the anon/public SELECT policies.
do $$
declare r record;
begin
  for r in
    select distinct tablename from pg_policies
    where schemaname='public'
      and (roles::text[] && array['anon','public'])
      and cmd in ('SELECT','ALL')
      and tablename <> 'professional_applications'
  loop
    if not exists (select 1 from pg_policies where schemaname='public' and tablename=r.tablename
                     and 'authenticated'=any(roles::text[]) and cmd in ('SELECT','ALL')) then
      execute format('create policy mb_authenticated_read on public.%I for select to authenticated using (true)', r.tablename);
    end if;
  end loop;
  for r in
    select policyname, tablename from pg_policies
    where schemaname='public'
      and (roles::text[] && array['anon','public'])
      and cmd = 'SELECT'
      and tablename <> 'professional_applications'
  loop
    execute format('drop policy %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- Final result (verified 2026-07-18): the public anon key can no longer READ or
-- WRITE any business/PII table. Only two anon-accessible policies remain by design
-- — professional_applications INSERT (public contractor form) and profiles own-row
-- INSERT. Authenticated (logged-in) users retain full read/write; the service_role
-- syncs bypass RLS and are unaffected.
