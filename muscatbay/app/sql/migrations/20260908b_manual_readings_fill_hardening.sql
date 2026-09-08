-- ---------------------------------------------------------------------------
-- Hand readings — two defects in the fill path from 20260908_manual_meter_readings
-- Raised by the Codex review of PR #81 on 2026-09-08, both confirmed against
-- the applied schema. This migration is idempotent and replaces objects in
-- place; no data is moved.
--
-- 1. `water_manual_apply_day` is SECURITY DEFINER and was granted to the whole
--    `authenticated` role, so it was reachable over PostgREST RPC. Any signed-in
--    account — a viewer or a contractor, who may not write readings at all —
--    could call it for a hand-read-only meter and date. With no reading row for
--    that date the function computes a NULL value, the `manual_owned` branch
--    rewrites unconditionally, and the day cell in `water_daily_consumption` is
--    blanked. That is silent destruction of live data by a read-only user.
--
--    Fix: the trigger function becomes SECURITY DEFINER itself, so the fill no
--    longer needs an EXECUTE grant for the calling operator, and EXECUTE on the
--    fill is revoked from `authenticated`. A trigger's function does not need
--    EXECUTE privileges at fire time — Postgres checks them when the trigger is
--    created — so the writer path is unaffected.
--
-- 2. The cleanup for a removed row ran AFTER DELETE, by which time the row
--    holding `applied_consumption` was gone. `v_previous` read back NULL, so for
--    a SHARED meter the "did we write this cell?" guard failed and the value we
--    had put in `water_daily_consumption` was left behind with nothing backing
--    it. Clearing a wrong hand reading left the wrong figure in Zone Watch, the
--    loss balance, Monthly, Satellite and the dashboard. The same held for an
--    UPDATE that moved a reading to another date.
--
--    Fix: the trigger passes the vanishing row's own `applied_consumption` into
--    the fill, along with a flag saying the key is now empty, so the guard has
--    the bookkeeping it needs. Owned meters were already correct (their branch
--    rewrites regardless); this repairs the shared-meter case.
-- ---------------------------------------------------------------------------

-- The signature gains two defaulted parameters, which would otherwise leave the
-- old two-argument function in place and make every call ambiguous.
drop function if exists public.water_manual_apply_day(text, date);

-- Applies the recorded value for ONE account/date into the wide daily table,
-- honouring the overwrite rules, and records what was written.
--
-- p_row_removed says the (account, date) key no longer holds a reading — a
-- DELETE, or an UPDATE that moved the row to another key. In that case the
-- value to write is NULL by definition, and p_removed_applied carries the
-- `applied_consumption` of the row as it was, because it can no longer be read
-- back from the table.
create or replace function public.water_manual_apply_day(
    p_account         text,
    p_date            date,
    p_removed_applied numeric default null,
    p_row_removed     boolean default false
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_month     text    := to_char(p_date, 'Mon-YY');
    v_year      integer := extract(year from p_date)::integer;
    v_col       text    := 'day_' || extract(day from p_date)::integer;
    v_value     numeric := case
                               when p_row_removed then null
                               else public.water_manual_daily_consumption(p_account, p_date)
                           end;
    v_owned     boolean;
    v_previous  numeric;   -- what we wrote for this date last time
    v_cell      numeric;   -- what the day cell holds right now
begin
    select manual_owned into v_owned
    from public.water_manual_meters
    where account_number = p_account;

    if v_owned is null then
        -- Not a hand-read meter: nothing to apply.
        return;
    end if;

    if p_row_removed then
        v_previous := p_removed_applied;
    else
        select applied_consumption into v_previous
        from public.water_manual_readings
        where account_number = p_account and reading_date = p_date;
    end if;

    -- Make sure the month row exists (metadata copied from the registry, all
    -- day cells NULL — a missing day must stay NULL, never 0).
    insert into public.water_daily_consumption
        (meter_id, meter_name, account_number, label, zone, parent_meter, type, month, year)
    select m.meter_id, m.meter_name, btrim(m.account_number), m.label, m.zone, m.parent_meter, m.type, v_month, v_year
    from public.water_meters as m
    where btrim(m.account_number) = p_account
    on conflict (account_number, month, year) do nothing;

    execute format(
        'select %I from public.water_daily_consumption where account_number = $1 and month = $2 and year = $3',
        v_col
    ) into v_cell using p_account, v_month, v_year;

    if v_owned
       or v_cell is null
       or (v_previous is not null and v_cell is not distinct from v_previous) then
        execute format(
            'update public.water_daily_consumption set %I = $1, updated_at = now() where account_number = $2 and month = $3 and year = $4',
            v_col
        ) using v_value, p_account, v_month, v_year;

        -- Nothing to book against a key whose row has gone.
        if not p_row_removed then
            update public.water_manual_readings
               set applied_consumption = v_value
             where account_number = p_account and reading_date = p_date;
        end if;
    elsif not p_row_removed then
        -- Cell holds an instrumented value we did not write: leave it, and
        -- record that nothing of ours is in there.
        update public.water_manual_readings
           set applied_consumption = null
         where account_number = p_account and reading_date = p_date;
    end if;
end;
$$;

-- A row for date D fills cell D. A DELETE, or an UPDATE that moves the row to
-- another key, also clears the cell the old key was filling — carrying that
-- row's own bookkeeping across, because it is about to be unreadable.
--
-- SECURITY DEFINER so the fill above needs no EXECUTE grant for the operator.
-- RLS on water_manual_readings still decides who may reach this trigger at all.
create or replace function public.water_manual_readings_apply()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
    if tg_op = 'DELETE'
       or (tg_op = 'UPDATE'
           and (old.account_number, old.reading_date)
               is distinct from (new.account_number, new.reading_date)) then
        perform public.water_manual_apply_day(
            old.account_number, old.reading_date, old.applied_consumption, true);
    end if;

    if tg_op in ('INSERT', 'UPDATE') then
        perform public.water_manual_apply_day(new.account_number, new.reading_date);
    end if;

    return null;
end;
$$;

-- pg_trigger_depth() = 0 keeps the `applied_consumption` bookkeeping update
-- inside water_manual_apply_day from re-firing this trigger.
drop trigger if exists water_manual_readings_apply on public.water_manual_readings;
create trigger water_manual_readings_apply
    after insert or update or delete on public.water_manual_readings
    for each row
    when (pg_trigger_depth() = 0)
    execute function public.water_manual_readings_apply();

-- The fill is reachable only through the trigger (and service_role for backfills).
revoke all on function public.water_manual_apply_day(text, date, numeric, boolean)
    from public, anon, authenticated;
grant execute on function public.water_manual_apply_day(text, date, numeric, boolean)
    to service_role;
