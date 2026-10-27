-- =============================================================================
-- Bulk meters — hand readings only, from 1 Oct 2026 (owner ruling 2026-10-27)
-- =============================================================================
-- The incident. On the 20/21 Oct 2026 Grafana sync the NAMA Main Bulk
-- (C43659), Zone 8 (4300342) and Zone 3B (4300344) came back with nothing for
-- 1–19 Oct and the month-to-date total booked on 20 Oct (26,468 / 2,066 /
-- 1,814.9 m³ — each within 2 % of the Kalhat hand readings for 1–20 Oct added
-- up). The sync wrote those figures over the hand readings already in the day
-- cells, so the Daily report showed twenty days of supply in one.
--
-- Why it could happen.
--   1. Live `water_manual_meters.manual_owned` was false for every meter: the
--      20260908 seed used `on conflict do nothing` over rows that already
--      existed, so the intended true flags never landed.
--   2. Even an owned meter was only protected at the moment a hand reading was
--      saved. Nothing stopped a LATER write to `water_daily_consumption` from
--      replacing the cell — and the sync is that later write.
--
-- The rule from now on. From `water_manual_meters.manual_only_from` onward the
-- hand reading is the only source for that meter's day cells. Any other
-- writer — the Grafana sync, a CSV upload, a manual SQL fix — has its day
-- values replaced by the hand reading for that date, or by NULL where none was
-- recorded (missing stays missing, never a Grafana figure, never 0). The
-- guard sits on the table itself, so it holds whatever job does the writing.
--
-- Scope (owner, 2026-10-27): Main Bulk, Zone 3A, 3B, 5, 8 and Village Square,
-- from 2026-10-01. Zone FM stays on Grafana — its hand figure (1 m³/day) does
-- not match the meter (35–65 m³/day) and is being checked with Kalhat. ZEN
-- Project has no hand reading. Central Park is not a zone bulk and is left as
-- it was. Months before October are not touched.
--
-- Data repair. Every Oct-26 day cell of the six meters is rewritten from the
-- hand readings, which fixes the three 20-Oct cells above; days with a Grafana
-- value but no hand reading become NULL by the same rule.
-- =============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. Registry: the date from which a meter is hand-read only
-- ---------------------------------------------------------------------------
alter table public.water_manual_meters
    add column if not exists manual_only_from date;

comment on column public.water_manual_meters.manual_only_from is
    'From this date the hand reading is the ONLY source for the meter''s day cells in water_daily_consumption; '
    'other writers are overridden (hand figure, or NULL when none). NULL = old rules (manual_owned / fill-empty).';

update public.water_manual_meters
   set manual_only_from = date '2026-10-01'
 where account_number in ('C43659', '4300343', '4300344', '4300345', '4300342', '4300335');

-- ---------------------------------------------------------------------------
-- 2. Guard on the daily table
-- ---------------------------------------------------------------------------
-- Rewrites every day of the row's month that falls on or after the cutover
-- from water_manual_readings. Runs for every writer, including the hand-reading
-- fill itself, which therefore always lands the same figure it computed.
--
-- SECURITY DEFINER: the writer may be a role that cannot read
-- water_manual_readings under RLS; search_path is pinned.
create or replace function public.water_manual_only_guard()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_from  date;
    v_start date;
    v_end   date;
    v_patch jsonb;
begin
    select manual_only_from into v_from
    from public.water_manual_meters
    where account_number = new.account_number
      and is_active;

    if v_from is null or new.month !~ '^[A-Z][a-z]{2}-[0-9]{2}$' then
        return new;
    end if;

    v_start := to_date(new.month, 'Mon-YY');
    v_end   := (v_start + interval '1 month - 1 day')::date;

    if v_end < v_from then
        return new;  -- whole month before the cutover: not ours
    end if;

    select jsonb_object_agg('day_' || extract(day from d.dt)::integer, r.consumption)
      into v_patch
      from generate_series(greatest(v_start, v_from), v_end, interval '1 day') as d(dt)
      left join public.water_manual_readings as r
             on r.account_number = new.account_number
            and r.reading_date = d.dt::date;

    return jsonb_populate_record(new, v_patch);
end;
$$;

revoke all on function public.water_manual_only_guard() from public, anon, authenticated;

drop trigger if exists water_manual_only_guard on public.water_daily_consumption;
create trigger water_manual_only_guard
    before insert or update on public.water_daily_consumption
    for each row
    execute function public.water_manual_only_guard();

-- ---------------------------------------------------------------------------
-- 3. The hand-reading fill treats the meter as owned from the cutover
-- ---------------------------------------------------------------------------
-- Same function as 20260908b; only the ownership test changes, so a hand
-- reading on or after `manual_only_from` always replaces the cell and its
-- `applied_consumption` bookkeeping stays true.
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
    select manual_owned or coalesce(p_date >= manual_only_from, false) into v_owned
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

revoke all on function public.water_manual_apply_day(text, date, numeric, boolean)
    from public, anon, authenticated;
grant execute on function public.water_manual_apply_day(text, date, numeric, boolean)
    to service_role;

-- ---------------------------------------------------------------------------
-- 4. Repair: rewrite the cut-over months from the hand readings
-- ---------------------------------------------------------------------------
-- Touching the rows fires the guard, which replaces every day cell on or after
-- the cutover with the hand reading (or NULL). Only rows whose month reaches
-- the cutover are touched.
update public.water_daily_consumption as w
   set updated_at = now()
  from public.water_manual_meters as m
 where m.account_number = w.account_number
   and m.manual_only_from is not null
   and w.month ~ '^[A-Z][a-z]{2}-[0-9]{2}$'
   and (to_date(w.month, 'Mon-YY') + interval '1 month - 1 day')::date >= m.manual_only_from;

-- Bookkeeping: every hand reading from the cutover is now what its cell holds.
-- Written directly, with the readings-table triggers paused, so the repair
-- neither re-runs the fill nor stamps a new updated_at on readings nobody edited.
alter table public.water_manual_readings disable trigger water_manual_readings_apply;
alter table public.water_manual_readings disable trigger water_manual_readings_set_updated_at;

update public.water_manual_readings as r
   set applied_consumption = r.consumption
  from public.water_manual_meters as m
 where m.account_number = r.account_number
   and m.manual_only_from is not null
   and r.reading_date >= m.manual_only_from
   and r.applied_consumption is distinct from r.consumption;

alter table public.water_manual_readings enable trigger water_manual_readings_set_updated_at;
alter table public.water_manual_readings enable trigger water_manual_readings_apply;

commit;
