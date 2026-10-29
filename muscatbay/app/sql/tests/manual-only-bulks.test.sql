-- Tests for 20261027_water_bulk_manual_only.sql.
--
-- Runs after manual-readings.test.sql (same cluster, same identities). From
-- the cutover date the hand reading is the ONLY source for the Main Bulk and
-- the zone bulks in scope: whatever another writer (the Grafana sync, a CSV
-- upload) puts in a day cell is replaced by the hand figure, or by NULL when
-- no hand figure exists. Before the cutover, and for meters outside the scope,
-- nothing changes.

\set ON_ERROR_STOP on

-- ── registry: cutover set on the six agreed meters only ─────────────────
DO $$
BEGIN
    IF (SELECT count(*) FROM public.water_manual_meters WHERE manual_only_from = DATE '2026-10-01') <> 6 THEN
        RAISE EXCEPTION 'FAIL: expected 6 meters manual-only from 2026-10-01, got %',
            (SELECT count(*) FROM public.water_manual_meters WHERE manual_only_from = DATE '2026-10-01');
    END IF;
    IF EXISTS (SELECT 1 FROM public.water_manual_meters
               WHERE account_number IN ('4300346', '4300320') AND manual_only_from IS NOT NULL) THEN
        RAISE EXCEPTION 'FAIL: Zone FM and Central Park must stay outside the manual-only scope';
    END IF;
END $$;

-- ── the 20-Oct incident: hand reading in, then a Grafana catch-up lands ──
SET ROLE authenticated;
SET test.uid = '00000000-0000-0000-0000-0000000000b3';  -- operator
INSERT INTO public.water_manual_readings (account_number, reading_date, consumption) VALUES
    ('C43659',  '2026-10-19', 1040),
    ('C43659',  '2026-10-20', 1312),
    ('4300344', '2026-10-20', 91);
RESET ROLE;

-- The sync writes the 20-day total into day 20, and a value into day 21 that
-- has no hand reading.
UPDATE public.water_daily_consumption SET day_20 = 26468, day_21 = 500
 WHERE account_number = 'C43659' AND month = 'Oct-26' AND year = 2026;
UPDATE public.water_daily_consumption SET day_20 = 1814.9
 WHERE account_number = '4300344' AND month = 'Oct-26' AND year = 2026;

DO $$
DECLARE d19 numeric; d20 numeric; d21 numeric; z20 numeric;
BEGIN
    SELECT day_19, day_20, day_21 INTO d19, d20, d21 FROM public.water_daily_consumption
     WHERE account_number = 'C43659' AND month = 'Oct-26' AND year = 2026;
    IF d20 IS DISTINCT FROM 1312 THEN RAISE EXCEPTION 'FAIL: Grafana overwrote Main Bulk day_20 (got %, want 1312)', d20; END IF;
    IF d19 IS DISTINCT FROM 1040 THEN RAISE EXCEPTION 'FAIL: Main Bulk day_19 changed (got %, want 1040)', d19; END IF;
    IF d21 IS NOT NULL THEN RAISE EXCEPTION 'FAIL: a Grafana value with no hand reading must be ignored (day_21 = %)', d21; END IF;
    SELECT day_20 INTO z20 FROM public.water_daily_consumption
     WHERE account_number = '4300344' AND month = 'Oct-26' AND year = 2026;
    IF z20 IS DISTINCT FROM 91 THEN RAISE EXCEPTION 'FAIL: Grafana overwrote Zone 3B day_20 (got %, want 91)', z20; END IF;
END $$;

-- A new month row created by the sync carries no Grafana figures either.
INSERT INTO public.water_daily_consumption (meter_id, meter_name, account_number, label, zone, parent_meter, type, month, year, day_1, day_2)
VALUES ('MB-L2-005', 'ZONE 8 (Bulk Zone 8)', '4300342', 'L2', 'Zone_08', 'Main Bulk (NAMA)', 'Zone_Bulk', 'Nov-26', 2026, 2066, 99);
DO $$
DECLARE v1 numeric; v2 numeric;
BEGIN
    SELECT day_1, day_2 INTO v1, v2 FROM public.water_daily_consumption
     WHERE account_number = '4300342' AND month = 'Nov-26' AND year = 2026;
    IF v1 IS NOT NULL OR v2 IS NOT NULL THEN
        RAISE EXCEPTION 'FAIL: an inserted month row kept Grafana figures (day_1 %, day_2 %)', v1, v2;
    END IF;
END $$;

-- ── hand readings on a formerly "fills gaps" bulk now always win ─────────
-- Zone 3A holds a Grafana value written before the guard existed (simulated by
-- switching the guard off for the write); the hand figure replaces it and the
-- bookkeeping records that the cell is ours.
ALTER TABLE public.water_daily_consumption DISABLE TRIGGER water_manual_only_guard;
INSERT INTO public.water_daily_consumption (meter_id, meter_name, account_number, label, zone, parent_meter, type, month, year, day_18)
VALUES ('MB-L2-001', 'ZONE 3A (BULK ZONE 3A)', '4300343', 'L2', 'Zone_03_(A)', 'Main Bulk (NAMA)', 'Zone_Bulk', 'Oct-26', 2026, 202);
ALTER TABLE public.water_daily_consumption ENABLE TRIGGER water_manual_only_guard;

SET ROLE authenticated;
SET test.uid = '00000000-0000-0000-0000-0000000000b3';
INSERT INTO public.water_manual_readings (account_number, reading_date, consumption)
VALUES ('4300343', '2026-10-18', 211);
RESET ROLE;

DO $$
DECLARE v numeric; a numeric;
BEGIN
    SELECT day_18 INTO v FROM public.water_daily_consumption
     WHERE account_number = '4300343' AND month = 'Oct-26' AND year = 2026;
    IF v IS DISTINCT FROM 211 THEN RAISE EXCEPTION 'FAIL: Zone 3A hand reading did not replace Grafana (got %, want 211)', v; END IF;
    SELECT applied_consumption INTO a FROM public.water_manual_readings
     WHERE account_number = '4300343' AND reading_date = '2026-10-18';
    IF a IS DISTINCT FROM 211 THEN RAISE EXCEPTION 'FAIL: applied_consumption should record 211, got %', a; END IF;
END $$;

-- Withdrawing that hand reading leaves the day empty, not the old Grafana figure.
SET ROLE authenticated;
SET test.uid = '00000000-0000-0000-0000-0000000000b3';
DELETE FROM public.water_manual_readings WHERE account_number = '4300343' AND reading_date = '2026-10-18';
RESET ROLE;
DO $$
BEGIN
    IF (SELECT day_18 FROM public.water_daily_consumption
        WHERE account_number = '4300343' AND month = 'Oct-26' AND year = 2026) IS NOT NULL THEN
        RAISE EXCEPTION 'FAIL: withdrawn hand reading must leave the day empty';
    END IF;
END $$;

-- ── before the cutover nothing changes ──────────────────────────────────
-- Zone 3A Jul-26 day_20 holds Grafana 999 (set in manual-readings.test.sql);
-- a later sync write before 1 Oct is still accepted as-is.
UPDATE public.water_daily_consumption SET day_21 = 321
 WHERE account_number = '4300343' AND month = 'Jul-26' AND year = 2026;
DO $$
DECLARE v20 numeric; v21 numeric;
BEGIN
    SELECT day_20, day_21 INTO v20, v21 FROM public.water_daily_consumption
     WHERE account_number = '4300343' AND month = 'Jul-26' AND year = 2026;
    IF v20 IS DISTINCT FROM 999 OR v21 IS DISTINCT FROM 321 THEN
        RAISE EXCEPTION 'FAIL: pre-cutover Grafana values must be left alone (day_20 %, day_21 %)', v20, v21;
    END IF;
END $$;

-- ── meters outside the scope keep the old rules ─────────────────────────
-- Zone FM: Grafana stays the source; a hand figure only fills an empty day.
INSERT INTO public.water_daily_consumption (meter_id, meter_name, account_number, label, zone, parent_meter, type, month, year, day_5)
VALUES ('MB-L2-002', 'ZONE FM ( BULK ZONE FM )', '4300346', 'L2', 'Zone_01_(FM)', 'Main Bulk (NAMA)', 'Zone_Bulk', 'Oct-26', 2026, 41);
SET ROLE authenticated;
SET test.uid = '00000000-0000-0000-0000-0000000000b3';
INSERT INTO public.water_manual_readings (account_number, reading_date, consumption)
VALUES ('4300346', '2026-10-05', 1);
RESET ROLE;
DO $$
BEGIN
    IF (SELECT day_5 FROM public.water_daily_consumption
        WHERE account_number = '4300346' AND month = 'Oct-26' AND year = 2026) IS DISTINCT FROM 41 THEN
        RAISE EXCEPTION 'FAIL: Zone FM Grafana value must survive a hand reading';
    END IF;
END $$;

-- A meter not in the hand-read registry at all is untouched.
INSERT INTO public.water_daily_consumption (meter_name, account_number, month, year, day_20)
VALUES ('Some L3 meter', '4300001', 'Oct-26', 2026, 3.9);
DO $$
BEGIN
    IF (SELECT day_20 FROM public.water_daily_consumption
        WHERE account_number = '4300001' AND month = 'Oct-26' AND year = 2026) IS DISTINCT FROM 3.9 THEN
        RAISE EXCEPTION 'FAIL: a non-registry meter was altered by the guard';
    END IF;
END $$;

-- ── clients cannot reach the guard function ─────────────────────────────
SET ROLE authenticated;
SET test.uid = '00000000-0000-0000-0000-0000000000b4';  -- viewer
DO $$
BEGIN
    IF has_function_privilege('authenticated', 'public.water_manual_only_guard()', 'EXECUTE') THEN
        RAISE EXCEPTION 'FAIL: authenticated must not hold EXECUTE on the guard function';
    END IF;
END $$;
RESET ROLE;

SELECT 'manual-only-bulks.test.sql: all assertions passed' AS result;
