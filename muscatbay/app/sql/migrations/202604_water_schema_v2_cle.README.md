# Water Schema v2 (CLE / Clean) — Migration Guide

**Date:** 2026-04-12
**Scope:** Water section only — monthly + daily tables
**Source of truth:** `Water_Meter_Database_CLE.xlsx` (350 meters, 3 years of data)

## What this migration does

Replaces the ad-hoc wide `"Water System"` table with a normalized schema
aligned to the cleaned master registry, without breaking any existing app
code on day 1.

### New tables

| Table | Rows | Purpose |
|---|---|---|
| `water_meters` | 350 | Master meter registry — stable Meter IDs, clean naming |
| `water_monthly_consumption` | 9,448 | Long-format monthly values for 2024, 2025, 2026+ |

### Updated tables

- `water_daily_consumption` — new `meter_id` FK column, metadata columns
  (`meter_name`, `label`, `zone`, `parent_meter`, `type`) auto-backfilled
  from `water_meters` so the clean names propagate.

### New views

- `"Water System"` — replaces the old wide table. Reshapes
  `water_monthly_consumption` into the historical `jan_24..dec_26` column
  layout **and translates clean zone/type/parent names back to legacy
  strings** (`Zone_FM → Zone_01_(FM)`, `Building (Bulk) → D_Building_Bulk`,
  etc.) so existing app code keeps working unchanged.
- `water_meters_hierarchy` — recursive view exposing the L1→L2/DC→L3→L4
  ancestry of every meter. Useful for the Daily hierarchy panel and loss
  calculations.

## Key standardizations (from the CLE audit log)

| Category | Before | After | Rows affected |
|---|---|---|---|
| Zone | `Zone_01_(FM)` | `Zone_FM` | 54 |
| Zone | `Zone_03_(A)` | `Zone_03A` | 306 |
| Zone | `Zone_03_(B)` | `Zone_03B` | 444 |
| Zone | `Direct Connection` | `Direct_Connection` | 31 |
| Zone | `Main Bulk` | `Main_Bulk` | 3 |
| Type | `D_Building_Bulk` | `Building (Bulk)` | 63 |
| Type | `D_Building_Common` | `Building (Common)` | 63 |
| Type | `IRR_Servies` (typo) | `Irrigation (Services)` | 22 |
| Type | `MB_Common` | `Common Area (MB)` | 23 |
| Type | `Main BULK` | `Main Bulk` | 3 |
| Type | `Residential (Apart)` | `Residential (Apartment)` | 484 |
| Name | `D 44-…` through `D 56-…` | `D-44 …` through `D-56 …` | 13 × 2 |
| Parent | `BULK ZONE 8` | `Zone 8 (Bulk)` | 66 |
| Parent | `ZONE 3A (BULK ZONE 3A)` | `Zone 3A (Bulk)` | 93 |
| Parent | `ZONE 3B (BULK ZONE 3B)` | `Zone 3B (Bulk)` | 102 |
| Parent | `ZONE 5 (Bulk Zone 5)` | `Zone 5 (Bulk)` | 102 |
| Structure | — | `Meter ID = MB-{Label}-{NNN}` | 350 |
| Structure | Unsorted | `Label → Zone → Parent → Name` | 350 |

Full audit log (125 entries) lives in the original workbook's
*Audit & Change Log* tab.

## Hierarchy (canonical)

```
L1  Main Bulk (NAMA)  C43659              1 meter
 ├── L2  Zone 3A (Bulk)   4300343          │
 ├── L2  Zone 3B (Bulk)   4300344          │
 ├── L2  Zone 5 (Bulk)    4300345          │  6 zone bulks
 ├── L2  Zone 8 (Bulk)    4300342          │
 ├── L2  Zone FM (Bulk)   4300346          │
 ├── L2  Village Square   4300335          ┘
 │         └── L3 villas / shops / building bulks (146 meters)
 │                  └── L4 apartments + common meters (183 meters)
 └── DC  10 direct connections off L1 (Hotel, STP, ROP, Al Adrak, …)
```

## How to apply

Run in **Supabase SQL Editor** in this order:

```sql
-- 1. DDL: tables, indexes, views, RLS
\i sql/migrations/202604_water_schema_v2_cle.sql

-- 2. Meter registry (350 rows)
\i sql/data/water_meters_seed.sql

-- 3. Monthly consumption (9,448 rows, 2024–2026)
\i sql/data/water_monthly_consumption_seed.sql
```

Or copy/paste each file into the editor. All three are **idempotent** —
safe to re-run. The daily table's metadata backfill happens automatically
inside the first migration file, after the meter registry is seeded.

> **Order matters:** the schema file's UPDATE statements against
> `water_daily_consumption` depend on `water_meters` being populated, so
> run the meter seed **before** re-running the schema migration if you
> ever want to refresh the daily backfill.

## App impact

**Zero code changes required on day 1.** The backward-compat view
translates clean names back to the legacy strings that
`lib/water-data.ts`, `app/water/page.tsx`, and
`components/water/*` currently expect:

```ts
// This still works — zones/types/parents look identical to today:
const { data } = await supabase.from('Water System').select('*');
data.forEach(m => {
    m.zone;           // 'Zone_01_(FM)'   ← translated from 'Zone_FM'
    m.type;           // 'D_Building_Bulk'← translated from 'Building (Bulk)'
    m.parent_meter;   // 'ZONE 3A (BULK ZONE 3A)' ← translated
});
```

### Bonus: immediately usable

- Monthly view now has **2024, 2025, and 2026** month columns available
  from a single query (`jan_24..dec_26`) — the `transformWaterMeter`
  helper in `entities/water.ts:165` already auto-detects every
  `mmm_yy` column via its index signature, so no type changes either.
- Daily view's `water_daily_consumption` rows now carry clean metadata
  (the backfill runs inside the migration), so the Daily tab's rendered
  zone / type / parent strings will match the master registry the first
  time a user reloads.

### Follow-up (optional, at your own pace)

When you're ready to drop the legacy translation layer:

1. Switch `lib/water-data.ts`' `ZONE_CONFIG` codes from `Zone_01_(FM)` →
   `Zone_FM`, etc.
2. Update `components/water/type-filter-pills.tsx` and
   `components/water/water-database-table.tsx` to match the clean type
   names.
3. Update `app/water/page.tsx` to read from `water_meters` +
   `water_monthly_consumption` directly (or just keep using the view).
4. Drop the `"Water System"` backward-compat view once no code references it.

## Sync scripts

⚠️ **Existing `UPDATE "Water System" SET jan_25=…`-style sync scripts
(e.g. `full_water_25_sync.sql`, `update_water_feb_mar_26.sql`) will stop
working** because `"Water System"` is now a grouping view, not a table.
Postgres can't apply simple UPDATEs to an aggregated view.

Replace them with upserts against the long table:

```sql
-- Example: sync Apr-26 for meter 4300343
INSERT INTO water_monthly_consumption (meter_id, account_number, period, consumption)
SELECT meter_id, '4300343', '2026-04', 5120
FROM   water_meters WHERE account_number = '4300343'
ON CONFLICT (meter_id, period) DO UPDATE SET
    consumption = EXCLUDED.consumption,
    updated_at  = NOW();
```

If you're syncing many meters at once, the same pattern scales:

```sql
INSERT INTO water_monthly_consumption (meter_id, account_number, period, consumption)
SELECT m.meter_id, m.account_number, '2026-04', v.value
FROM   water_meters m
JOIN   (VALUES
    ('4300343', 5120::numeric),
    ('4300344', 4230),
    ('4300345', 3890)
    -- … one row per meter
) AS v(acct, value) ON v.acct = m.account_number
ON CONFLICT (meter_id, period) DO UPDATE SET
    consumption = EXCLUDED.consumption,
    updated_at  = NOW();
```

## Rollback

If something goes wrong, rollback is straightforward because the old
table was dropped *inside* the migration transaction:

```sql
BEGIN;
DROP VIEW  IF EXISTS "Water System";
DROP VIEW  IF EXISTS water_meters_hierarchy;
DROP TABLE IF EXISTS water_monthly_consumption;
DROP TABLE IF EXISTS water_meters CASCADE;
ALTER TABLE water_daily_consumption DROP COLUMN IF EXISTS meter_id;
-- Then re-run the original sql/schema/water_system_table.sql to restore
-- the old wide table and its historic seed data.
COMMIT;
```

## Sanity checks

After running all three files:

```sql
-- 1. Meter counts by label
SELECT label, COUNT(*) FROM water_meters GROUP BY label ORDER BY label;
-- Expected: L1=1, L2=6, DC=10, L3=146, L4=183, N/A=4  (total 350)

-- 2. Monthly rows by year
SELECT substr(period, 1, 4) AS year, COUNT(*)
FROM   water_monthly_consumption GROUP BY 1 ORDER BY 1;
-- Expected approx: 2024=4200, 2025=4200, 2026=1048

-- 3. Backward-compat view roundtrip
SELECT zone, COUNT(*) FROM "Water System" GROUP BY zone ORDER BY 2 DESC;
-- Expected: zones appear with OLD strings (Zone_01_(FM), Zone_03_(A), etc.)

-- 4. Hierarchy integrity
SELECT depth, label, COUNT(*) FROM water_meters_hierarchy
GROUP BY depth, label ORDER BY depth, label;
-- Expected: depth 1 = L1×1, depth 2 = L2×6 + DC×10, depth 3 = L3×146, depth 4 = L4×183
```
