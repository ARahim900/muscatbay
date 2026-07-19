-- ============================================================================
-- Fix: daily "missing-as-zero" placeholders -> NULL  (Water → Daily report)
-- Migration: 20260719_daily_missing_zero_to_null
-- Project:   utnlgeuqajmwibqmdmgt
-- ============================================================================
-- WHY
--   `water_daily_consumption` rows are seeded at the start of every month with
--   EVERY day cell = 0. The daily sync (Supabase edge function
--   `sync-grafana-water`, run by pg_cron `sync-grafana-water-daily` at 02:00
--   UTC) then only `.update()`s the ~153 meters in its hard-coded
--   TRACKED_ACCOUNTS set, and only for days the Grafana snapshot actually
--   returns. Any meter that is NOT on the Grafana feed -- every direct
--   connection except Sales Center (4300295): the camps, hotel, security, ROP,
--   community/STP, main entrance and the TSE irrigation controllers -- plus any
--   tracked meter missing from a given snapshot (e.g. the Zone 8 bulk) is never
--   overwritten, so it keeps the 0-seed for the whole month.
--
--   The Daily report cannot tell "not read yet" (should be NULL) from
--   "measured zero" (a real 0). Result on the Direct Connections tab: 11 of 12
--   DC meters show 0.00 every day, the "Active (Day N)" KPI counts them all as
--   reporting, and the trend line draws a flat zero out to day 31. Storing a
--   missing reading as NULL -- which the report already renders as "—",
--   excludes from "Active", and stops the period at the last real day -- is the
--   fix. Same reasoning as sql/fix-daily-consumption-corrupt-cells.sql.
--
-- WHAT (every statement is guarded: it only ever turns a 0/placeholder into
--       NULL. It never changes a positive reading and never invents data.)
--   1. Zone-bulk (L2) + direct-connection (DC) meters whose ENTIRE month reads
--      0 -> all day cells NULL. A whole zone bulk or a mains direct connection
--      cannot truly consume 0 m3 for an entire month, so an all-zero month is
--      always missing data, never a real measurement. (Apartments/L3 are left
--      alone: a vacant unit can legitimately read 0.)
--   2. Current in-progress month (Jul-26): day cells AFTER the last day that has
--      any real reading network-wide (day 18) that are still 0 -> NULL, because
--      no readings exist yet for those future days. This makes the whole Daily
--      view (not just DC) end at the real latest day instead of flat-lining to
--      day 31.
--
-- SAFETY / REVERSIBILITY
--   The pre-image of every touched cell is 0, so the change is trivially
--   reversible (set the same cells back to 0). Wrapped in a transaction; run the
--   preview SELECTs, confirm the counts, then COMMIT.
-- ============================================================================

BEGIN;

-- ── Accounts that cannot legitimately read 0 for a whole month ──────────────
--   6 zone bulks (L2) + 12 direct connections (DC). Kept inline (stable IDs)
--   rather than relying on the `label` column, which has a few 'N/A' rows.
--   Mirrors ZONE_BULK_CONFIG.l2Account + DC_METERS in lib/water-accounts.ts.

-- ── 0. PREVIEW: rows that will be fully nulled by step 1 ────────────────────
--   Scoped to the current month (Jul-26). The same rule is safe to re-run for
--   historical months (Jan/Feb/Mar/May-26 also carry all-zero bulk/DC rows) by
--   dropping the month filter — left out here by choice to keep blast radius to
--   the reported month.
SELECT month, year, account_number, meter_name
FROM   water_daily_consumption w
WHERE  w.month = 'Jul-26' AND w.year = 2026
  AND  w.account_number IN (
         -- L2 zone bulks
         '4300346','4300343','4300344','4300345','4300342','4300335',
         -- DC meters
         '4300294','4300297','4300299','4300323','4300334','4300336',
         '4300338','4300340','4300341','4300348','4300349','4300295'
       )
  AND  NOT EXISTS (
         SELECT 1
         FROM   jsonb_each_text(to_jsonb(w)) e
         WHERE  e.key ~ '^day_[0-9]+$'
           AND  (e.value IS NULL OR e.value = ''
                 OR NOT (e.value ~ '^-?[0-9.]+$')
                 OR e.value::numeric <> 0)
       )
ORDER  BY to_date('01-'||month,'DD-Mon-YY'), account_number;

-- ── 1. Null every day cell for bulk/DC meters whose whole month is 0 ────────
WITH targets AS (
  SELECT w.id
  FROM   water_daily_consumption w
  WHERE  w.month = 'Jul-26' AND w.year = 2026
    AND  w.account_number IN (
           '4300346','4300343','4300344','4300345','4300342','4300335',
           '4300294','4300297','4300299','4300323','4300334','4300336',
           '4300338','4300340','4300341','4300348','4300349','4300295'
         )
    AND  NOT EXISTS (
           SELECT 1
           FROM   jsonb_each_text(to_jsonb(w)) e
           WHERE  e.key ~ '^day_[0-9]+$'
             AND  (e.value IS NULL OR e.value = ''
                   OR NOT (e.value ~ '^-?[0-9.]+$')
                   OR e.value::numeric <> 0)
         )
)
UPDATE water_daily_consumption t SET
  day_1=NULL,  day_2=NULL,  day_3=NULL,  day_4=NULL,  day_5=NULL,  day_6=NULL,
  day_7=NULL,  day_8=NULL,  day_9=NULL,  day_10=NULL, day_11=NULL, day_12=NULL,
  day_13=NULL, day_14=NULL, day_15=NULL, day_16=NULL, day_17=NULL, day_18=NULL,
  day_19=NULL, day_20=NULL, day_21=NULL, day_22=NULL, day_23=NULL, day_24=NULL,
  day_25=NULL, day_26=NULL, day_27=NULL, day_28=NULL, day_29=NULL, day_30=NULL,
  day_31=NULL
FROM   targets
WHERE  t.id = targets.id;

-- ── 2. Current month: null the trailing future-day placeholder zeros ────────
--   Today is 2026-07-19; the last day with any real reading is day 18. Days
--   19-31 that still read 0 are un-read placeholders, not measurements.
--   Guard (`= 0`) means a positive reading, should one arrive, is never nulled.
--   (day_* are numeric columns, so a plain `= 0` guard is correct and never
--   touches a positive reading or an existing NULL.)
UPDATE water_daily_consumption SET
  day_19 = CASE WHEN day_19 = 0 THEN NULL ELSE day_19 END,
  day_20 = CASE WHEN day_20 = 0 THEN NULL ELSE day_20 END,
  day_21 = CASE WHEN day_21 = 0 THEN NULL ELSE day_21 END,
  day_22 = CASE WHEN day_22 = 0 THEN NULL ELSE day_22 END,
  day_23 = CASE WHEN day_23 = 0 THEN NULL ELSE day_23 END,
  day_24 = CASE WHEN day_24 = 0 THEN NULL ELSE day_24 END,
  day_25 = CASE WHEN day_25 = 0 THEN NULL ELSE day_25 END,
  day_26 = CASE WHEN day_26 = 0 THEN NULL ELSE day_26 END,
  day_27 = CASE WHEN day_27 = 0 THEN NULL ELSE day_27 END,
  day_28 = CASE WHEN day_28 = 0 THEN NULL ELSE day_28 END,
  day_29 = CASE WHEN day_29 = 0 THEN NULL ELSE day_29 END,
  day_30 = CASE WHEN day_30 = 0 THEN NULL ELSE day_30 END,
  day_31 = CASE WHEN day_31 = 0 THEN NULL ELSE day_31 END
WHERE  month = 'Jul-26' AND year = 2026;

-- ── 3. VERIFY: DC meters for Jul-26 should now be NULL (—), not 0 ───────────
SELECT account_number, meter_name,
       day_17, day_18, day_19, day_31
FROM   water_daily_consumption
WHERE  month = 'Jul-26' AND year = 2026
  AND  account_number IN (
         '4300294','4300297','4300299','4300323','4300334','4300336',
         '4300338','4300340','4300341','4300348','4300349','4300295'
       )
ORDER  BY account_number;

COMMIT;
-- ROLLBACK;  -- swap for COMMIT above to preview without persisting
