-- ---------------------------------------------------------------------------
-- Hand readings — September 2026, days 1 to 7
--
-- Source: Muscat_Bay_Water_Consumption_Restructured_6.xlsx, supplied by the
-- owner on 2026-09-08. That workbook is the previous one (…_5) carried forward
-- by six days: January–August was compared meter-month by meter-month against
-- what is already stored and is identical, and 1 September already matched on
-- all 17 meters. So the only new facts here are 2–7 September.
--
-- Written as an upsert keyed on (meter, reading_date), so running it twice is
-- safe and re-running it after a correction in the sheet updates in place.
--
-- A day Kalhat did not record has NO ROW here — it must stay "not recorded",
-- never 0. Every 0 below is a real reading of zero taken from the sheet.
--
-- Inserting a potable row fires water_manual_readings_apply, which copies the
-- day into water_daily_consumption.day_N: always for the hand-read-only meters
-- (C43659, 4300342, 4300320) and only into an empty cell for the shared zone
-- bulks, so a Grafana figure is never overwritten. Nothing to run by hand.
-- ---------------------------------------------------------------------------

begin;

-- ── Potable (56 rows: 8 meters × 7 days) ─────────────────────────────────
insert into public.water_manual_readings (account_number, reading_date, consumption) values
    -- Central Park (4300320)
    ('4300320', '2026-09-01', 6),
    ('4300320', '2026-09-02', 12),
    ('4300320', '2026-09-03', 15),
    ('4300320', '2026-09-04', 0),
    ('4300320', '2026-09-05', 6),
    ('4300320', '2026-09-06', 4),
    ('4300320', '2026-09-07', 11),
    -- Village Square (4300335)
    ('4300335', '2026-09-01', 0),
    ('4300335', '2026-09-02', 0),
    ('4300335', '2026-09-03', 0),
    ('4300335', '2026-09-04', 0),
    ('4300335', '2026-09-05', 0),
    ('4300335', '2026-09-06', 0),
    ('4300335', '2026-09-07', 0),
    -- Zone 8 (4300342)
    ('4300342', '2026-09-01', 180),
    ('4300342', '2026-09-02', 158),
    ('4300342', '2026-09-03', 190),
    ('4300342', '2026-09-04', 121),
    ('4300342', '2026-09-05', 156),
    ('4300342', '2026-09-06', 192),
    ('4300342', '2026-09-07', 131),
    -- Zone 3A (4300343)
    ('4300343', '2026-09-01', 160),
    ('4300343', '2026-09-02', 149),
    ('4300343', '2026-09-03', 155),
    ('4300343', '2026-09-04', 166),
    ('4300343', '2026-09-05', 148),
    ('4300343', '2026-09-06', 211),
    ('4300343', '2026-09-07', 145),
    -- Zone 3B (4300344)
    ('4300344', '2026-09-01', 80),
    ('4300344', '2026-09-02', 80),
    ('4300344', '2026-09-03', 93),
    ('4300344', '2026-09-04', 70),
    ('4300344', '2026-09-05', 85),
    ('4300344', '2026-09-06', 99),
    ('4300344', '2026-09-07', 88),
    -- Zone 5 (4300345)
    ('4300345', '2026-09-01', 132),
    ('4300345', '2026-09-02', 132),
    ('4300345', '2026-09-03', 120),
    ('4300345', '2026-09-04', 107),
    ('4300345', '2026-09-05', 132),
    ('4300345', '2026-09-06', 145),
    ('4300345', '2026-09-07', 113),
    -- FM Building (4300346)
    ('4300346', '2026-09-01', 0),
    ('4300346', '2026-09-02', 1),
    ('4300346', '2026-09-03', 1),
    ('4300346', '2026-09-04', 0),
    ('4300346', '2026-09-05', 0),
    ('4300346', '2026-09-06', 3),
    ('4300346', '2026-09-07', 1),
    -- Main Meter (C43659)
    ('C43659', '2026-09-01', 1186),
    ('C43659', '2026-09-02', 1134),
    ('C43659', '2026-09-03', 1216),
    ('C43659', '2026-09-04', 1262),
    ('C43659', '2026-09-05', 1071),
    ('C43659', '2026-09-06', 1389),
    ('C43659', '2026-09-07', 1331)
on conflict (account_number, reading_date) do update
    set consumption = excluded.consumption,
        updated_at  = now();

-- ── Irrigation (63 rows: 9 meters × 7 days) ──────────────────────────────
insert into public.irrigation_daily_readings (meter_key, reading_date, consumption) values
    -- IRR-CTRL-09
    ('IRR-CTRL-09', '2026-09-01', 6),
    ('IRR-CTRL-09', '2026-09-02', 6),
    ('IRR-CTRL-09', '2026-09-03', 16),
    ('IRR-CTRL-09', '2026-09-04', 15),
    ('IRR-CTRL-09', '2026-09-05', 8),
    ('IRR-CTRL-09', '2026-09-06', 0),
    ('IRR-CTRL-09', '2026-09-07', 0),
    -- IRR-MAIN-BW
    ('IRR-MAIN-BW', '2026-09-01', 0),
    ('IRR-MAIN-BW', '2026-09-02', 0),
    ('IRR-MAIN-BW', '2026-09-03', 0),
    ('IRR-MAIN-BW', '2026-09-04', 0),
    ('IRR-MAIN-BW', '2026-09-05', 0),
    ('IRR-MAIN-BW', '2026-09-06', 0),
    ('IRR-MAIN-BW', '2026-09-07', 0),
    -- IRR-MAIN-OUT
    ('IRR-MAIN-OUT', '2026-09-01', 751),
    ('IRR-MAIN-OUT', '2026-09-02', 875),
    ('IRR-MAIN-OUT', '2026-09-03', 792),
    ('IRR-MAIN-OUT', '2026-09-04', 702),
    ('IRR-MAIN-OUT', '2026-09-05', 638),
    ('IRR-MAIN-OUT', '2026-09-06', 548),
    ('IRR-MAIN-OUT', '2026-09-07', 840),
    -- IRR-MAIN-TSE
    ('IRR-MAIN-TSE', '2026-09-01', 688),
    ('IRR-MAIN-TSE', '2026-09-02', 691),
    ('IRR-MAIN-TSE', '2026-09-03', 608),
    ('IRR-MAIN-TSE', '2026-09-04', 803),
    ('IRR-MAIN-TSE', '2026-09-05', 584),
    ('IRR-MAIN-TSE', '2026-09-06', 751),
    ('IRR-MAIN-TSE', '2026-09-07', 718),
    -- IRR-SA-TSE
    ('IRR-SA-TSE', '2026-09-01', 0),
    ('IRR-SA-TSE', '2026-09-02', 0),
    ('IRR-SA-TSE', '2026-09-03', 0),
    ('IRR-SA-TSE', '2026-09-04', 0),
    ('IRR-SA-TSE', '2026-09-05', 0),
    ('IRR-SA-TSE', '2026-09-06', 0),
    ('IRR-SA-TSE', '2026-09-07', 0),
    -- IRR-TANK-03
    ('IRR-TANK-03', '2026-09-01', 25),
    ('IRR-TANK-03', '2026-09-02', 23),
    ('IRR-TANK-03', '2026-09-03', 22),
    ('IRR-TANK-03', '2026-09-04', 18),
    ('IRR-TANK-03', '2026-09-05', 27),
    ('IRR-TANK-03', '2026-09-06', 9),
    ('IRR-TANK-03', '2026-09-07', 0),
    -- IRR-TANK-04
    ('IRR-TANK-04', '2026-09-01', 119),
    ('IRR-TANK-04', '2026-09-02', 74),
    ('IRR-TANK-04', '2026-09-03', 86),
    ('IRR-TANK-04', '2026-09-04', 48),
    ('IRR-TANK-04', '2026-09-05', 33),
    ('IRR-TANK-04', '2026-09-06', 9),
    ('IRR-TANK-04', '2026-09-07', 14),
    -- IRR-TANK-06
    ('IRR-TANK-06', '2026-09-01', 35),
    ('IRR-TANK-06', '2026-09-02', 43),
    ('IRR-TANK-06', '2026-09-03', 37),
    ('IRR-TANK-06', '2026-09-04', 22),
    ('IRR-TANK-06', '2026-09-05', 29),
    ('IRR-TANK-06', '2026-09-06', 21),
    ('IRR-TANK-06', '2026-09-07', 39),
    -- IRR-TANK-JMB
    ('IRR-TANK-JMB', '2026-09-01', 142),
    ('IRR-TANK-JMB', '2026-09-02', 137),
    ('IRR-TANK-JMB', '2026-09-03', 149),
    ('IRR-TANK-JMB', '2026-09-04', 155),
    ('IRR-TANK-JMB', '2026-09-05', 136),
    ('IRR-TANK-JMB', '2026-09-06', 113),
    ('IRR-TANK-JMB', '2026-09-07', 257)
on conflict (meter_key, reading_date) do update
    set consumption = excluded.consumption,
        updated_at  = now();

commit;

-- ── Check ────────────────────────────────────────────────────────────────
-- Expect 8 potable meters × 7 days = 56, and 9 irrigation × 7 = 63.
select 'potable' as system, count(*) as rows_1_to_7_sep, count(distinct account_number) as meters
from public.water_manual_readings
where reading_date between '2026-09-01' and '2026-09-07'
union all
select 'irrigation', count(*), count(distinct meter_key)
from public.irrigation_daily_readings
where reading_date between '2026-09-01' and '2026-09-07';
