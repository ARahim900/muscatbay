-- Production security boundary: invitation-only authentication + explicit RLS.
-- REVIEW AND APPLY TO STAGING FIRST. This migration contains no operational
-- data corrections and must not be applied from a browser client.
--
-- After applying, configure Auth > Hooks > Before User Created to call:
--   public.mb_before_user_created
-- This hook is the server-side gate for both password and OAuth identities.
-- Do not place a service_role key in this application.

begin;

-- ---------------------------------------------------------------------------
-- 1. Preconditions and the single profile/role source of truth
-- ---------------------------------------------------------------------------
do $preflight$
begin
    if to_regclass('public.profiles') is null then
        raise exception 'Security migration aborted: public.profiles is missing';
    end if;
    if not exists (
        select 1 from information_schema.columns
        where table_schema = 'public' and table_name = 'profiles' and column_name = 'role'
    ) then
        raise exception 'Security migration aborted: public.profiles.role is missing';
    end if;
end
$preflight$;

alter table public.profiles alter column role set default 'viewer';
alter table public.profiles
    add column if not exists module_scope jsonb not null default '[]'::jsonb;

do $constraint$
begin
    if not exists (
        select 1 from pg_constraint
        where conrelid = 'public.profiles'::regclass
          and conname = 'profiles_role_allowed'
    ) then
        alter table public.profiles
            add constraint profiles_role_allowed
            check (role is not null and role in ('admin', 'manager', 'operator', 'contractor', 'viewer'))
            not valid;
    end if;
    if not exists (
        select 1 from pg_constraint
        where conrelid = 'public.profiles'::regclass
          and conname = 'profiles_module_scope_array'
    ) then
        alter table public.profiles
            add constraint profiles_module_scope_array
            check (jsonb_typeof(module_scope) = 'array')
            not valid;
    end if;
end
$constraint$;

create or replace function public.mb_current_user_role()
returns text
language sql
stable
security definer
set search_path = ''
as $function$
    select p.role
    from public.profiles p
    where p.id = (select auth.uid())
$function$;

create or replace function public.mb_has_any_role(allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
    select public.mb_current_user_role() = any(allowed_roles)
$function$;

create or replace function public.mb_can_read_module(requested_module text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
    select case public.mb_current_user_role()
        when 'admin' then true
        when 'manager' then true
        when 'operator' then true
        when 'viewer' then true
        when 'contractor' then coalesce((
            select p.module_scope ? requested_module
            from public.profiles p
            where p.id = (select auth.uid())
        ), false)
        else false
    end
$function$;

revoke all on function public.mb_current_user_role() from public, anon;
revoke all on function public.mb_has_any_role(text[]) from public, anon;
revoke all on function public.mb_can_read_module(text) from public, anon;
grant execute on function public.mb_current_user_role() to authenticated;
grant execute on function public.mb_has_any_role(text[]) to authenticated;
grant execute on function public.mb_can_read_module(text) to authenticated;

-- A row policy alone cannot reliably compare OLD and NEW values. This trigger
-- prevents clients from changing identity/authorization columns while still
-- allowing ordinary profile edits and administrator management.
create or replace function public.mb_protect_profile_security_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
    if (select auth.uid()) is not null
       and public.mb_current_user_role() is distinct from 'admin'
       and (
           new.id is distinct from old.id
           or new.email is distinct from old.email
           or new.role is distinct from old.role
           or new.module_scope is distinct from old.module_scope
       ) then
        raise exception 'Profile identity and role fields are administrator-managed'
            using errcode = '42501';
    end if;
    return new;
end
$function$;

revoke all on function public.mb_protect_profile_security_fields() from public, anon, authenticated;
drop trigger if exists mb_protect_profile_security_fields on public.profiles;
create trigger mb_protect_profile_security_fields
before update on public.profiles
for each row execute function public.mb_protect_profile_security_fields();

-- Retire user_profiles as an authorization source without deleting it. If the
-- legacy table exists it becomes service-role/postgres only.
do $legacy_profiles$
declare policy_row record;
begin
    if to_regclass('public.user_profiles') is not null then
        alter table public.user_profiles enable row level security;
        revoke all on table public.user_profiles from anon, authenticated;
        for policy_row in
            select policyname from pg_policies
            where schemaname = 'public' and tablename = 'user_profiles'
        loop
            execute format('drop policy %I on public.user_profiles', policy_row.policyname);
        end loop;
    end if;
end
$legacy_profiles$;

-- ---------------------------------------------------------------------------
-- 2. Invitation-only identity creation (password + OAuth)
-- ---------------------------------------------------------------------------
create table if not exists public.auth_invitations (
    id uuid primary key default gen_random_uuid(),
    email text not null,
    invited_by uuid references auth.users(id) on delete set null,
    invited_at timestamptz not null default now(),
    expires_at timestamptz,
    accepted_at timestamptz,
    revoked_at timestamptz,
    role text not null default 'viewer',
    module_scope jsonb not null default '[]'::jsonb,
    constraint auth_invitations_email_normalized check (email = lower(btrim(email))),
    constraint auth_invitations_email_shape check (position('@' in email) > 1),
    constraint auth_invitations_role_allowed check (role in ('admin', 'manager', 'operator', 'contractor', 'viewer')),
    constraint auth_invitations_module_scope_array check (jsonb_typeof(module_scope) = 'array')
);
alter table public.auth_invitations add column if not exists role text not null default 'viewer';
alter table public.auth_invitations add column if not exists module_scope jsonb not null default '[]'::jsonb;
do $invitation_constraints$
begin
    if not exists (
        select 1 from pg_constraint
        where conrelid = 'public.auth_invitations'::regclass
          and conname = 'auth_invitations_role_allowed'
    ) then
        alter table public.auth_invitations
            add constraint auth_invitations_role_allowed
            check (role in ('admin', 'manager', 'operator', 'contractor', 'viewer')) not valid;
    end if;
    if not exists (
        select 1 from pg_constraint
        where conrelid = 'public.auth_invitations'::regclass
          and conname = 'auth_invitations_module_scope_array'
    ) then
        alter table public.auth_invitations
            add constraint auth_invitations_module_scope_array
            check (jsonb_typeof(module_scope) = 'array') not valid;
    end if;
end
$invitation_constraints$;
create unique index if not exists auth_invitations_active_email_idx
    on public.auth_invitations (lower(email))
    where accepted_at is null and revoked_at is null;
alter table public.auth_invitations enable row level security;
revoke all on table public.auth_invitations from public, anon, authenticated;

create or replace function public.mb_before_user_created(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
    candidate_email text := lower(btrim(event->'user'->>'email'));
begin
    if candidate_email is null or candidate_email = '' or not exists (
        select 1
        from public.auth_invitations invitation
        where invitation.email = candidate_email
          and invitation.accepted_at is null
          and invitation.revoked_at is null
          and (invitation.expires_at is null or invitation.expires_at > now())
    ) then
        return jsonb_build_object(
            'error',
            jsonb_build_object(
                'http_code', 403,
                'message', 'Dashboard access is invitation only.'
            )
        );
    end if;
    return '{}'::jsonb;
end
$function$;

revoke all on function public.mb_before_user_created(jsonb) from public, anon, authenticated;
grant usage on schema public to supabase_auth_admin;
grant execute on function public.mb_before_user_created(jsonb) to supabase_auth_admin;

-- Profile creation is server-owned. Consuming the invitation here means a
-- failed user creation cannot be mistaken for a successful acceptance.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare invitation_row public.auth_invitations%rowtype;
begin
    select invitation.*
      into invitation_row
      from public.auth_invitations invitation
     where invitation.email = lower(new.email)
       and invitation.accepted_at is null
       and invitation.revoked_at is null
       and (invitation.expires_at is null or invitation.expires_at > now())
     order by invitation.invited_at desc
     limit 1
     for update;

    if not found then
        raise exception 'Dashboard access is invitation only'
            using errcode = '42501';
    end if;

    insert into public.profiles (id, email, full_name, avatar_url, role, module_scope)
    values (
        new.id,
        lower(new.email),
        nullif(new.raw_user_meta_data->>'full_name', ''),
        nullif(new.raw_user_meta_data->>'avatar_url', ''),
        invitation_row.role,
        invitation_row.module_scope
    )
    on conflict (id) do nothing;

    update public.auth_invitations
       set accepted_at = coalesce(accepted_at, now())
     where id = invitation_row.id;
    return new;
end
$function$;

revoke all on function public.handle_new_user() from public, anon, authenticated;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 3. Explicit profile policies
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
revoke all on table public.profiles from anon;
grant select, insert, update, delete on table public.profiles to authenticated;

do $drop_profile_policies$
declare policy_row record;
begin
    for policy_row in
        select policyname from pg_policies
        where schemaname = 'public' and tablename = 'profiles'
    loop
        execute format('drop policy %I on public.profiles', policy_row.policyname);
    end loop;
end
$drop_profile_policies$;

create policy mb_profiles_select on public.profiles
for select to authenticated
using (
    id = (select auth.uid())
    or (select public.mb_has_any_role(array['admin', 'manager']::text[]))
);
create policy mb_profiles_insert_admin on public.profiles
for insert to authenticated
with check ((select public.mb_has_any_role(array['admin']::text[])));
create policy mb_profiles_update_self on public.profiles
for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));
create policy mb_profiles_update_admin on public.profiles
for update to authenticated
using ((select public.mb_has_any_role(array['admin']::text[])))
with check ((select public.mb_has_any_role(array['admin']::text[])));
create policy mb_profiles_delete_admin on public.profiles
for delete to authenticated
using ((select public.mb_has_any_role(array['admin']::text[])));

-- ---------------------------------------------------------------------------
-- 4. App relation inventory and role/action matrix
--    viewer/contractor: SELECT only
--    operator/manager/admin: INSERT + UPDATE
--    admin: DELETE
-- ---------------------------------------------------------------------------
create temporary table mb_security_inventory (
    table_name text primary key,
    access_class text not null check (access_class in ('operational', 'server_owned')),
    module_key text not null
) on commit drop;

insert into mb_security_inventory (table_name, access_class, module_key) values
    ('water_meters', 'operational', 'water'),
    ('water_monthly_consumption', 'operational', 'water'),
    ('water_daily_consumption', 'operational', 'water'),
    ('water_loss_summary', 'operational', 'water'),
    ('water_loss_daily', 'operational', 'water'),
    ('water_network_meters', 'operational', 'water'),
    ('water_network_readings', 'operational', 'water'),
    ('water_grafana_readings', 'operational', 'water'),
    ('electricity_meters', 'operational', 'electricity'),
    ('electricity_readings', 'operational', 'electricity'),
    ('stp_operations', 'operational', 'stp'),
    ('stp_daily_reports', 'operational', 'stp'),
    ('master_assets_register', 'operational', 'assets'),
    ('Assets_Register_Database', 'operational', 'assets'),
    ('mb_assets', 'operational', 'assets'),
    ('assets', 'operational', 'assets'),
    ('Contractor_Tracker', 'operational', 'contractors'),
    ('contractor_contracts', 'operational', 'contractors'),
    ('contractor_yearly_costs', 'operational', 'contractors'),
    ('amc_register', 'operational', 'contractors'),
    ('amc_contracts', 'operational', 'contractors'),
    ('amc_expiry', 'operational', 'contractors'),
    ('amc_contacts', 'operational', 'contractors'),
    ('amc_pricing', 'operational', 'contractors'),
    ('amc_contractor_summary', 'operational', 'contractors'),
    ('amc_contractor_details', 'operational', 'contractors'),
    ('amc_contractor_expiry', 'operational', 'contractors'),
    ('amc_contractor_pricing', 'operational', 'contractors'),
    ('fire_safety_equipment', 'operational', 'firefighting'),
    ('fire_ppm_activities', 'operational', 'firefighting'),
    ('fire_issues_register', 'operational', 'firefighting'),
    ('fire_ppm_contacts', 'operational', 'firefighting'),
    ('ge_ppm_findings', 'operational', 'hvac'),
    ('ge_recurring_issues', 'operational', 'hvac'),
    ('ge_equipment_registry', 'operational', 'hvac'),
    ('ge_compressor_status', 'operational', 'hvac'),
    ('ge_quotations', 'operational', 'hvac'),
    ('ge_equipment_summary', 'operational', 'hvac'),
    ('gulf_expert_contracts', 'operational', 'hvac'),
    ('gulf_expert_communications', 'operational', 'hvac'),
    ('operational_alert_incidents', 'server_owned', 'alerts');

do $inventory_preflight$
declare missing_core text[];
begin
    select array_agg(expected.name order by expected.name)
      into missing_core
      from (values
          ('water_meters'), ('water_monthly_consumption'),
          ('electricity_meters'), ('electricity_readings'), ('stp_operations')
      ) as expected(name)
     where to_regclass(format('public.%I', expected.name)) is null;

    if missing_core is not null then
        raise exception 'Security migration aborted: core inventory missing: %', missing_core;
    end if;
end
$inventory_preflight$;

do $replace_inventory_policies$
declare relation_row record;
declare policy_row record;
begin
    for relation_row in
        select inventory.table_name, inventory.access_class, inventory.module_key
        from mb_security_inventory inventory
        join pg_class relation on relation.oid = to_regclass(format('public.%I', inventory.table_name))
        where relation.relkind in ('r', 'p')
    loop
        execute format('alter table public.%I enable row level security', relation_row.table_name);
        execute format('revoke all on table public.%I from public, anon', relation_row.table_name);
        if relation_row.access_class = 'operational' then
            execute format(
                'grant select, insert, update, delete on table public.%I to authenticated',
                relation_row.table_name
            );
        else
            execute format('grant select on table public.%I to authenticated', relation_row.table_name);
            execute format(
                'revoke insert, update, delete on table public.%I from authenticated',
                relation_row.table_name
            );
        end if;

        for policy_row in
            select policyname from pg_policies
            where schemaname = 'public' and tablename = relation_row.table_name
        loop
            execute format('drop policy %I on public.%I', policy_row.policyname, relation_row.table_name);
        end loop;

        execute format(
            'create policy mb_select on public.%I for select to authenticated using ((select public.mb_can_read_module(%L)))',
            relation_row.table_name, relation_row.module_key
        );

        if relation_row.access_class = 'operational' then
            execute format(
                'create policy mb_insert on public.%I for insert to authenticated with check ((select public.mb_has_any_role(array[''admin'',''manager'',''operator'']::text[])))',
                relation_row.table_name
            );
            execute format(
                'create policy mb_update on public.%I for update to authenticated using ((select public.mb_has_any_role(array[''admin'',''manager'',''operator'']::text[]))) with check ((select public.mb_has_any_role(array[''admin'',''manager'',''operator'']::text[])))',
                relation_row.table_name
            );
            execute format(
                'create policy mb_delete on public.%I for delete to authenticated using ((select public.mb_has_any_role(array[''admin'']::text[])))',
                relation_row.table_name
            );
        end if;
    end loop;
end
$replace_inventory_policies$;

-- Public professional applications are intake, not dashboard account creation.
-- Anonymous callers can submit pending records but can never read or review them.
do $professional_intake$
declare policy_row record;
begin
    if to_regclass('public.professional_applications') is not null then
        alter table public.professional_applications enable row level security;
        revoke all on table public.professional_applications from public, anon, authenticated;
        grant insert on table public.professional_applications to anon;
        grant select, update, delete on table public.professional_applications to authenticated;
        for policy_row in
            select policyname from pg_policies
            where schemaname = 'public' and tablename = 'professional_applications'
        loop
            execute format('drop policy %I on public.professional_applications', policy_row.policyname);
        end loop;
        create policy mb_professional_intake_insert on public.professional_applications
            for insert to anon
            with check (
                status = 'pending'
                and reviewer_notes is null
                and reviewed_by is null
                and reviewed_at is null
            );
        create policy mb_professional_intake_select on public.professional_applications
            for select to authenticated
            using ((select public.mb_has_any_role(array['admin', 'manager']::text[])));
        create policy mb_professional_intake_update on public.professional_applications
            for update to authenticated
            using ((select public.mb_has_any_role(array['admin', 'manager']::text[])))
            with check ((select public.mb_has_any_role(array['admin', 'manager']::text[])));
        create policy mb_professional_intake_delete on public.professional_applications
            for delete to authenticated
            using ((select public.mb_has_any_role(array['admin']::text[])));
    end if;
end
$professional_intake$;

-- Contract document links are rendered in a privileged dashboard. Enforce the
-- same Google Drive allowlist at the database boundary so direct REST writes
-- cannot persist a javascript/data URL or an unapproved host. NOT VALID keeps
-- legacy rows visible for controlled cleanup while protecting every new write.
do $contract_pdf_allowlist$
begin
    if to_regclass('public.contractor_contracts') is not null
       and exists (
           select 1 from information_schema.columns
           where table_schema = 'public'
             and table_name = 'contractor_contracts'
             and column_name = 'contract_pdf_url'
       )
       and not exists (
           select 1 from pg_constraint
           where conrelid = 'public.contractor_contracts'::regclass
             and conname = 'contractor_contract_pdf_url_approved'
       ) then
        alter table public.contractor_contracts
            add constraint contractor_contract_pdf_url_approved
            check (
                contract_pdf_url is null
                or contract_pdf_url ~ '^https://drive[.]google[.]com/file/d/[A-Za-z0-9_-]{10,200}/preview([?]resourcekey=[A-Za-z0-9_-]{1,200})?$'
            ) not valid;
    end if;
end
$contract_pdf_allowlist$;

-- Any base/partitioned table outside the reviewed inventory is internal,
-- evidence or backup data. Remove anon/auth policies and leave it fail-closed.
do $fail_closed_unlisted$
declare relation_row record;
declare policy_row record;
begin
    for relation_row in
        select relation.relname as table_name
        from pg_class relation
        join pg_namespace namespace on namespace.oid = relation.relnamespace
        where namespace.nspname = 'public'
          and relation.relkind in ('r', 'p')
          and relation.relname not in ('profiles', 'professional_applications', 'auth_invitations')
          and not exists (
              select 1 from mb_security_inventory inventory
              where inventory.table_name = relation.relname
          )
    loop
        execute format('alter table public.%I enable row level security', relation_row.table_name);
        execute format('revoke all on table public.%I from public, anon, authenticated', relation_row.table_name);
        for policy_row in
            select policyname
            from pg_policies
            where schemaname = 'public'
              and tablename = relation_row.table_name
              and roles && array['public', 'anon', 'authenticated']::name[]
        loop
            execute format('drop policy %I on public.%I', policy_row.policyname, relation_row.table_name);
        end loop;
    end loop;
end
$fail_closed_unlisted$;

-- Foreign tables cannot use ordinary RLS. The verified assets_register foreign
-- relation and any future foreign relation are removed from the public API.
do $foreign_tables$
declare relation_row record;
begin
    for relation_row in
        select relation.relname
        from pg_class relation
        join pg_namespace namespace on namespace.oid = relation.relnamespace
        where namespace.nspname = 'public' and relation.relkind = 'f'
    loop
        execute format('revoke all on table public.%I from public, anon, authenticated', relation_row.relname);
    end loop;
end
$foreign_tables$;

-- Views are deny-by-default. Only reviewed operational views are re-granted,
-- and ordinary views execute as the caller so base-table RLS still applies.
do $views$
declare view_row record;
declare approved_views constant text[] := array[
    'Water System', 'water_meters_hierarchy',
    'electricity_current_month', 'electricity_monthly_totals',
    'electricity_readings_with_meters', 'unified_electricity_data'
];
begin
    for view_row in
        select relation.relname, relation.relkind
        from pg_class relation
        join pg_namespace namespace on namespace.oid = relation.relnamespace
        where namespace.nspname = 'public' and relation.relkind in ('v', 'm')
    loop
        execute format('revoke all on table public.%I from public, anon, authenticated', view_row.relname);
        if view_row.relname = any(approved_views) then
            if view_row.relkind = 'v' then
                execute format('alter view public.%I set (security_invoker = true)', view_row.relname);
            end if;
            execute format('grant select on table public.%I to authenticated', view_row.relname);
        end if;
    end loop;
end
$views$;

-- ---------------------------------------------------------------------------
-- 5. Storage policy replacement
-- ---------------------------------------------------------------------------
do $storage_policies$
declare policy_row record;
begin
    for policy_row in
        select policyname from pg_policies
        where schemaname = 'storage' and tablename = 'objects'
    loop
        execute format('drop policy %I on storage.objects', policy_row.policyname);
    end loop;
end
$storage_policies$;

update storage.buckets set public = false where id = 'grafana-uploads';

create policy mb_avatar_select_own on storage.objects
for select to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy mb_avatar_insert_own on storage.objects
for insert to authenticated
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy mb_avatar_update_own on storage.objects
for update to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy mb_avatar_delete_own on storage.objects
for delete to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy mb_grafana_select on storage.objects
for select to authenticated
using (
    bucket_id = 'grafana-uploads'
    and (select public.mb_has_any_role(array['admin', 'manager', 'operator']::text[]))
);
create policy mb_grafana_insert on storage.objects
for insert to authenticated
with check (
    bucket_id = 'grafana-uploads'
    and (select public.mb_has_any_role(array['admin', 'manager', 'operator']::text[]))
);
create policy mb_grafana_delete on storage.objects
for delete to authenticated
using (
    bucket_id = 'grafana-uploads'
    and (select public.mb_has_any_role(array['admin']::text[]))
);

-- ---------------------------------------------------------------------------
-- 6. SECURITY DEFINER RPC allowlist
-- ---------------------------------------------------------------------------
do $revoke_definer_rpc$
declare function_row record;
begin
    for function_row in
        select procedure.oid::regprocedure::text as signature
        from pg_proc procedure
        join pg_namespace namespace on namespace.oid = procedure.pronamespace
        where namespace.nspname = 'public' and procedure.prosecdef
    loop
        execute format(
            'revoke execute on function %s from public, anon, authenticated',
            function_row.signature
        );
    end loop;
end
$revoke_definer_rpc$;

grant execute on function public.mb_current_user_role() to authenticated;
grant execute on function public.mb_has_any_role(text[]) to authenticated;
grant execute on function public.mb_can_read_module(text) to authenticated;
grant execute on function public.mb_before_user_created(jsonb) to supabase_auth_admin;

do $approved_rpc$
begin
    if to_regprocedure('public.acknowledge_operational_alert_incident(uuid)') is not null then
        grant execute on function public.acknowledge_operational_alert_incident(uuid) to authenticated;
    end if;
end
$approved_rpc$;

commit;
