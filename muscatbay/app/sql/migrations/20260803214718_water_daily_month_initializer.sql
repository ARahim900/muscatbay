-- =============================================================================
-- Water daily month initializer — 2026-08-04
-- =============================================================================
-- Records the rollover safeguard already applied to the live Supabase project.
-- This migration changes no RLS policy and inserts no operational readings by
-- itself. The postgres-only initializer is called by the governed daily sync
-- only after its Grafana completeness and coverage guards pass.
-- =============================================================================

begin;

-- A missing reading must stay NULL. New monthly target rows must never acquire
-- placeholder zero consumption from a column default.
alter table public.water_daily_consumption
    alter column day_1 drop default,
    alter column day_2 drop default,
    alter column day_3 drop default,
    alter column day_4 drop default,
    alter column day_5 drop default,
    alter column day_6 drop default,
    alter column day_7 drop default,
    alter column day_8 drop default,
    alter column day_9 drop default,
    alter column day_10 drop default,
    alter column day_11 drop default,
    alter column day_12 drop default,
    alter column day_13 drop default,
    alter column day_14 drop default,
    alter column day_15 drop default,
    alter column day_16 drop default,
    alter column day_17 drop default,
    alter column day_18 drop default,
    alter column day_19 drop default,
    alter column day_20 drop default,
    alter column day_21 drop default,
    alter column day_22 drop default,
    alter column day_23 drop default,
    alter column day_24 drop default,
    alter column day_25 drop default,
    alter column day_26 drop default,
    alter column day_27 drop default,
    alter column day_28 drop default,
    alter column day_29 drop default,
    alter column day_30 drop default,
    alter column day_31 drop default;

create schema if not exists private authorization postgres;
alter schema private owner to postgres;
revoke all on schema private from public, anon, authenticated, service_role;
grant usage, create on schema private to postgres;

create or replace function private.ensure_water_daily_month(p_target_date date)
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog
as $function$
declare
    v_month_label text;
    v_year integer;
    v_meter_rows integer;
    v_unique_accounts integer;
    v_invalid_accounts integer;
    v_inserted_rows integer;
    v_target_rows integer;
    v_email_owned_rows integer;
begin
    if p_target_date is null then
        raise exception 'target date must not be NULL';
    end if;

    v_month_label := to_char(p_target_date, 'Mon-YY');
    v_year := extract(year from p_target_date)::integer;

    select
        count(*)::integer,
        count(distinct btrim(m.account_number))::integer,
        count(*) filter (
            where m.account_number is null or btrim(m.account_number) = ''
        )::integer
    into v_meter_rows, v_unique_accounts, v_invalid_accounts
    from public.water_meters as m;

    if v_meter_rows < 300
       or v_unique_accounts <> v_meter_rows
       or v_invalid_accounts <> 0 then
        raise exception
            'water_meters validation failed: rows=%, unique=%, invalid=%',
            v_meter_rows, v_unique_accounts, v_invalid_accounts;
    end if;

    if (
        select count(*)
        from public.water_meters as m
        where btrim(m.account_number) in ('C43659', '4300342', '4300320')
    ) <> 3 then
        raise exception 'EMAIL_OWNED accounts are incomplete in water_meters';
    end if;

    insert into public.water_daily_consumption (
        meter_id,
        meter_name,
        account_number,
        label,
        zone,
        parent_meter,
        type,
        month,
        year,
        day_1,
        day_2,
        day_3,
        day_4,
        day_5,
        day_6,
        day_7,
        day_8,
        day_9,
        day_10,
        day_11,
        day_12,
        day_13,
        day_14,
        day_15,
        day_16,
        day_17,
        day_18,
        day_19,
        day_20,
        day_21,
        day_22,
        day_23,
        day_24,
        day_25,
        day_26,
        day_27,
        day_28,
        day_29,
        day_30,
        day_31
    )
    select
        m.meter_id,
        m.meter_name,
        btrim(m.account_number),
        m.label,
        m.zone,
        m.parent_meter,
        m.type,
        v_month_label,
        v_year,
        null::numeric,
        null::numeric,
        null::numeric,
        null::numeric,
        null::numeric,
        null::numeric,
        null::numeric,
        null::numeric,
        null::numeric,
        null::numeric,
        null::numeric,
        null::numeric,
        null::numeric,
        null::numeric,
        null::numeric,
        null::numeric,
        null::numeric,
        null::numeric,
        null::numeric,
        null::numeric,
        null::numeric,
        null::numeric,
        null::numeric,
        null::numeric,
        null::numeric,
        null::numeric,
        null::numeric,
        null::numeric,
        null::numeric,
        null::numeric,
        null::numeric
    from public.water_meters as m
    on conflict on constraint water_daily_consumption_account_number_month_year_key
    do nothing;

    get diagnostics v_inserted_rows = row_count;

    select count(*)::integer
    into v_target_rows
    from public.water_daily_consumption as d
    where d.month = v_month_label
      and d.year = v_year;

    if v_target_rows <> v_meter_rows then
        raise exception
            'target row count mismatch for %/%: targets=%, meters=%',
            v_month_label, v_year, v_target_rows, v_meter_rows;
    end if;

    if exists (
        (
            select d.account_number
            from public.water_daily_consumption as d
            where d.month = v_month_label
              and d.year = v_year
            except
            select btrim(m.account_number)
            from public.water_meters as m
        )
        union all
        (
            select btrim(m.account_number)
            from public.water_meters as m
            except
            select d.account_number
            from public.water_daily_consumption as d
            where d.month = v_month_label
              and d.year = v_year
        )
    ) then
        raise exception 'target account set mismatch for %/%', v_month_label, v_year;
    end if;

    select count(*)::integer
    into v_email_owned_rows
    from public.water_daily_consumption as d
    where d.month = v_month_label
      and d.year = v_year
      and d.account_number in ('C43659', '4300342', '4300320');

    if v_email_owned_rows <> 3 then
        raise exception
            'EMAIL_OWNED target count mismatch for %/%: %',
            v_month_label, v_year, v_email_owned_rows;
    end if;

    return jsonb_build_object(
        'month', v_month_label,
        'year', v_year,
        'meter_rows', v_meter_rows,
        'inserted_rows', v_inserted_rows,
        'target_rows', v_target_rows,
        'email_owned_rows', v_email_owned_rows
    );
end;
$function$;

alter function private.ensure_water_daily_month(date) owner to postgres;
revoke all on function private.ensure_water_daily_month(date)
    from public, anon, authenticated, service_role;
grant execute on function private.ensure_water_daily_month(date) to postgres;

commit;
