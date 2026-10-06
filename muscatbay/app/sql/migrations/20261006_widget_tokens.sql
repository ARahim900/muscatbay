-- Home Screen widget feed (iOS app) — per-device read-only keys.
--
-- The widget runs outside the app's web view, so it cannot use the signed-in
-- session. When the app pairs, the signed-in page calls create_widget_token()
-- and hands the key to the app, which keeps it in its App Group for the widget.
-- The widget sends the key to /api/widget/water, which calls
-- widget_water_latest() with the anon key. Only the SHA-256 of a key is stored.
--
-- Spec: docs/superpowers/specs/2026-10-06-ios-home-widget-design.md

create table if not exists public.widget_tokens (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users (id) on delete cascade,
    token_hash text not null unique,
    label text not null check (char_length(label) between 1 and 60),
    created_at timestamptz not null default now(),
    last_used_at timestamptz,
    revoked_at timestamptz
);

create index if not exists widget_tokens_user_id_idx on public.widget_tokens (user_id);

alter table public.widget_tokens enable row level security;

-- Owners may see and revoke their own keys. Keys are created only through
-- create_widget_token(), never inserted directly.
drop policy if exists widget_tokens_select_own on public.widget_tokens;
create policy widget_tokens_select_own on public.widget_tokens
    for select to authenticated
    using (user_id = (select auth.uid()));

drop policy if exists widget_tokens_update_own on public.widget_tokens;
create policy widget_tokens_update_own on public.widget_tokens
    for update to authenticated
    using (user_id = (select auth.uid()))
    with check (user_id = (select auth.uid()));

revoke all on public.widget_tokens from anon;
grant select, update (revoked_at) on public.widget_tokens to authenticated;

-- Water read access for a given user — the rule mb_can_read_module('water')
-- applies to the signed-in user, evaluated here for a key's owner.
create or replace function public.widget_owner_can_read_water(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path to ''
as $$
    select coalesce((
        select case p.role
            when 'admin' then true
            when 'manager' then true
            when 'operator' then true
            when 'viewer' then true
            when 'contractor' then coalesce(p.module_scope ? 'water', false)
            else false
        end
        from public.profiles p
        where p.id = p_user_id
    ), false)
$$;

revoke all on function public.widget_owner_can_read_water(uuid) from public, anon, authenticated;

-- Issue a new key for the signed-in user. A previous live key with the same
-- label (one per device type) is revoked, so re-pairing never piles up keys.
create or replace function public.create_widget_token(p_label text)
returns text
language plpgsql
volatile
security definer
set search_path to ''
as $$
declare
    v_user uuid := (select auth.uid());
    v_label text := btrim(coalesce(p_label, ''));
    v_token text;
begin
    if v_user is null then
        raise exception 'Sign in before connecting the widget.' using errcode = '42501';
    end if;
    if not public.widget_owner_can_read_water(v_user) then
        raise exception 'This account cannot read water data.' using errcode = '42501';
    end if;
    if char_length(v_label) not between 1 and 60 then
        raise exception 'Widget label must be 1 to 60 characters.' using errcode = '22023';
    end if;

    update public.widget_tokens
       set revoked_at = now()
     where user_id = v_user and label = v_label and revoked_at is null;

    v_token := encode(extensions.gen_random_bytes(32), 'hex');
    insert into public.widget_tokens (user_id, token_hash, label)
    values (v_user, encode(extensions.digest(v_token, 'sha256'), 'hex'), v_label);
    return v_token;
end;
$$;

revoke all on function public.create_widget_token(text) from public, anon;
grant execute on function public.create_widget_token(text) to authenticated;

-- The widget feed: the latest month that holds any daily reading, as raw rows.
-- Returns null for an unknown, revoked or malformed key, or when the key's
-- owner has lost water access. The figures are computed by the website from
-- these rows with the Daily page's own functions.
create or replace function public.widget_water_latest(p_token text)
returns jsonb
language plpgsql
volatile
security definer
set search_path to ''
as $$
declare
    v_token_id uuid;
    v_user uuid;
    v_last_used timestamptz;
    v_month text;
    v_year integer;
begin
    if p_token is null or p_token !~ '^[0-9a-f]{64}$' then
        return null;
    end if;

    select t.id, t.user_id, t.last_used_at
      into v_token_id, v_user, v_last_used
      from public.widget_tokens t
     where t.token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
       and t.revoked_at is null;
    if v_token_id is null or not public.widget_owner_can_read_water(v_user) then
        return null;
    end if;

    -- Record use at most every 10 minutes: the widget polls, and a write per
    -- poll would only churn the table.
    if v_last_used is null or v_last_used < now() - interval '10 minutes' then
        update public.widget_tokens set last_used_at = now() where id = v_token_id;
    end if;

    select w.month, w.year
      into v_month, v_year
      from public.water_daily_consumption w
     where num_nonnulls(
             w.day_1, w.day_2, w.day_3, w.day_4, w.day_5, w.day_6, w.day_7, w.day_8,
             w.day_9, w.day_10, w.day_11, w.day_12, w.day_13, w.day_14, w.day_15,
             w.day_16, w.day_17, w.day_18, w.day_19, w.day_20, w.day_21, w.day_22,
             w.day_23, w.day_24, w.day_25, w.day_26, w.day_27, w.day_28, w.day_29,
             w.day_30, w.day_31) > 0
     order by w.year desc,
              array_position(
                  array['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
                  split_part(w.month, '-', 1)) desc nulls last
     limit 1;

    if v_month is null then
        return jsonb_build_object('month', null, 'year', null, 'rows', '[]'::jsonb);
    end if;

    return jsonb_build_object(
        'month', v_month,
        'year', v_year,
        'rows', coalesce((
            select jsonb_agg(jsonb_build_object(
                'account_number', w.account_number,
                'day_1', w.day_1, 'day_2', w.day_2, 'day_3', w.day_3, 'day_4', w.day_4,
                'day_5', w.day_5, 'day_6', w.day_6, 'day_7', w.day_7, 'day_8', w.day_8,
                'day_9', w.day_9, 'day_10', w.day_10, 'day_11', w.day_11, 'day_12', w.day_12,
                'day_13', w.day_13, 'day_14', w.day_14, 'day_15', w.day_15, 'day_16', w.day_16,
                'day_17', w.day_17, 'day_18', w.day_18, 'day_19', w.day_19, 'day_20', w.day_20,
                'day_21', w.day_21, 'day_22', w.day_22, 'day_23', w.day_23, 'day_24', w.day_24,
                'day_25', w.day_25, 'day_26', w.day_26, 'day_27', w.day_27, 'day_28', w.day_28,
                'day_29', w.day_29, 'day_30', w.day_30, 'day_31', w.day_31))
              from public.water_daily_consumption w
             where w.month = v_month and w.year = v_year
        ), '[]'::jsonb));
end;
$$;

revoke all on function public.widget_water_latest(text) from public;
grant execute on function public.widget_water_latest(text) to anon, authenticated;
