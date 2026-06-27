-- ============================================================================
-- Fix: corrupt cells in water_daily_consumption (Daily Water Report)
-- ============================================================================
-- Context
--   The Daily report reads day_1..day_31 per account_number. The CODE is
--   correct (Mar-26 shows the expected ~417 m3/day for the hotel). The problem
--   is the STORED data for some meters in Jan-26 / Feb-26: a monthly total was
--   back-filled into the daily table instead of real daily readings.
--
--   Hotel "Hotel Main Building" (4300334) evidence:
--     Mar-26: 302..524 across all 31 days, sum 12,937  -> correct
--     Jan-26: days 1-30 = 0, day_31 = 35,824           -> month total dumped
--     Feb-26: days 1-15 = 0, day_16 = -92,032,
--             day_26 = 100,483, days 17-28 plausible   -> corrupt (impossible)
--
-- Run this in the Supabase SQL editor (project utnlgeuqajmwibqmdmgt).
-- Review each section; uncomment the UPDATEs you want to apply. Wrap in a
-- transaction so you can ROLLBACK if the verification looks wrong.
-- ============================================================================

BEGIN;

-- ── 0. Before/after snapshot of the hotel (run first, keep the output) ──────
SELECT account_number, month,
       day_15, day_16, day_25, day_26, day_30, day_31
FROM   water_daily_consumption
WHERE  account_number = '4300334'
  AND  month IN ('Jan-26', 'Feb-26', 'Mar-26')
ORDER  BY month;

-- ── 1. Null the 3 physically-impossible hotel cells ─────────────────────────
--    A daily water meter cannot read a negative delta, a 100k m3 single-day
--    spike, or a whole month's total in one day. These poison the gauges,
--    the DC trend chart, and the L2/L3-vs-DC difference. Nulling them makes
--    the UI render "—" (no reading) instead of a false number.
UPDATE water_daily_consumption
SET    day_31 = NULL                       -- 35,824 (Jan month-total in day 31)
WHERE  account_number = '4300334' AND month = 'Jan-26' AND day_31 = 35824;

UPDATE water_daily_consumption
SET    day_16 = NULL                       -- -92,032 (impossible negative)
WHERE  account_number = '4300334' AND month = 'Feb-26' AND day_16 = -92032;

UPDATE water_daily_consumption
SET    day_26 = NULL                       -- 100,483 (impossible spike)
WHERE  account_number = '4300334' AND month = 'Feb-26' AND day_26 = 100483;

-- ── 2. OPTIONAL: turn the hotel's fake leading-zero blocks into NULL ─────────
--    Jan days 1-30 and Feb days 1-15 are stored as 0.00 but the hotel never
--    has zero consumption — these are MISSING readings mis-stored as 0.
--    Converting them to NULL makes the report show "—" (honest "no data")
--    instead of a misleading 0, and they stop dragging the average to 0.
--    Uncomment only if you accept losing the (fake) zeros until a real
--    re-import. Leave commented if you plan to re-import Jan/Feb from source.
--
-- UPDATE water_daily_consumption
-- SET day_1=NULLIF(day_1,0),  day_2=NULLIF(day_2,0),  day_3=NULLIF(day_3,0),
--     day_4=NULLIF(day_4,0),  day_5=NULLIF(day_5,0),  day_6=NULLIF(day_6,0),
--     day_7=NULLIF(day_7,0),  day_8=NULLIF(day_8,0),  day_9=NULLIF(day_9,0),
--     day_10=NULLIF(day_10,0),day_11=NULLIF(day_11,0),day_12=NULLIF(day_12,0),
--     day_13=NULLIF(day_13,0),day_14=NULLIF(day_14,0),day_15=NULLIF(day_15,0)
-- WHERE account_number = '4300334' AND month IN ('Jan-26','Feb-26');
--
-- UPDATE water_daily_consumption
-- SET day_16=NULLIF(day_16,0),day_17=NULLIF(day_17,0),day_18=NULLIF(day_18,0),
--     day_19=NULLIF(day_19,0),day_20=NULLIF(day_20,0),day_21=NULLIF(day_21,0),
--     day_22=NULLIF(day_22,0),day_23=NULLIF(day_23,0),day_24=NULLIF(day_24,0),
--     day_25=NULLIF(day_25,0),day_26=NULLIF(day_26,0),day_27=NULLIF(day_27,0),
--     day_28=NULLIF(day_28,0),day_29=NULLIF(day_29,0),day_30=NULLIF(day_30,0),
--     day_31=NULLIF(day_31,0)
-- WHERE account_number = '4300334' AND month = 'Jan-26';

-- ── 3. DIAGNOSTIC: find every other meter with the same corruption ──────────
--    Lists rows whose entire month's non-zero consumption sits in <=2 day cells
--    (the "month-total dumped into a day" signature) so you can decide which
--    accounts/months also need a re-import. Read-only — change nothing here.
WITH unpivot AS (
  SELECT account_number, meter_name, month,
         unnest(ARRAY[day_1,day_2,day_3,day_4,day_5,day_6,day_7,day_8,day_9,day_10,
                      day_11,day_12,day_13,day_14,day_15,day_16,day_17,day_18,day_19,day_20,
                      day_21,day_22,day_23,day_24,day_25,day_26,day_27,day_28,day_29,day_30,day_31]) AS v
  FROM water_daily_consumption
)
SELECT account_number, meter_name, month,
       count(*) FILTER (WHERE v IS NOT NULL AND v <> 0)  AS active_days,
       round(sum(v) FILTER (WHERE v IS NOT NULL)::numeric, 0) AS month_sum,
       min(v) AS min_v, max(v) AS max_v
FROM   unpivot
GROUP  BY account_number, meter_name, month
HAVING count(*) FILTER (WHERE v IS NOT NULL AND v <> 0) BETWEEN 1 AND 2   -- dumped-total signature
    OR min(v) < -1                                                        -- impossible negative
    OR max(v) > 20000                                                     -- impossible spike
ORDER  BY month, account_number;

-- ── 4. Verify the hotel, then COMMIT or ROLLBACK ────────────────────────────
SELECT account_number, month, day_16, day_26, day_31
FROM   water_daily_consumption
WHERE  account_number = '4300334' AND month IN ('Jan-26','Feb-26');

-- COMMIT;    -- <- run this once the output looks right
ROLLBACK;     -- <- default: changes are previewed, not saved
