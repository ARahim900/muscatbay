-- ============================================================================
-- WATER NETWORK METERS — 3D Network Map schema
--
-- Backs the /water-network route. Uses a distinct table name
-- (`water_network_meters`) so it doesn't collide with the existing
-- `water_meters` table used by the /water feature.
--
-- Run once in Supabase SQL Editor. Safe to re-run (idempotent).
-- ============================================================================

-- Core meter registry -------------------------------------------------------
create table if not exists water_network_meters (
    id           text primary key,
    parent_id    text references water_network_meters(id) on delete set null,
    zone         text not null,
    type         text not null check (type in ('l1','l2','dc','l3','l4','irr')),
    status       text not null default 'working' check (status in ('working','faulty')),
    consumption  numeric default 0,                -- current-period consumption in m³
    lat          double precision not null,
    lon          double precision not null,
    height       double precision,                 -- terrain elevation (m above ellipsoid)
    created_at   timestamptz default now(),
    updated_at   timestamptz default now()
);

create index if not exists idx_wnm_parent on water_network_meters(parent_id);
create index if not exists idx_wnm_type   on water_network_meters(type);
create index if not exists idx_wnm_status on water_network_meters(status);

-- Keep updated_at fresh on every update
create or replace function water_network_meters_touch_updated_at() returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

drop trigger if exists trg_water_network_meters_updated_at on water_network_meters;
create trigger trg_water_network_meters_updated_at
    before update on water_network_meters
    for each row execute function water_network_meters_touch_updated_at();

-- Historical readings (optional — used for trends / month-over-month) -------
create table if not exists water_network_readings (
    id           uuid primary key default gen_random_uuid(),
    meter_id     text references water_network_meters(id) on delete cascade,
    reading_date date not null,
    reading_m3   numeric not null,
    consumption  numeric,          -- this-period usage = reading_m3 − previous_reading
    created_at   timestamptz default now()
);

create index if not exists idx_wnr_meter_date on water_network_readings(meter_id, reading_date desc);

-- Row-level security --------------------------------------------------------
-- DEV MODE: anyone can read and write. Tighten before prod.
alter table water_network_meters   enable row level security;
alter table water_network_readings enable row level security;

drop policy if exists "wnm_public_read"  on water_network_meters;
drop policy if exists "wnm_public_write" on water_network_meters;
create policy "wnm_public_read"  on water_network_meters for select using (true);
create policy "wnm_public_write" on water_network_meters for all    using (true);

drop policy if exists "wnr_public_read"  on water_network_readings;
drop policy if exists "wnr_public_write" on water_network_readings;
create policy "wnr_public_read"  on water_network_readings for select using (true);
create policy "wnr_public_write" on water_network_readings for all    using (true);

-- ============================================================================
-- Done. Verify:
--   select count(*) from water_network_meters;    -- should be 0 initially
-- ============================================================================
