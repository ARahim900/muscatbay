-- electricity_source_review_20260721.sql
-- Source-data items to VERIFY IN THE MASTER SPREADSHEET (not DB fixes).
--
-- The 2026-07-21 audit proved electricity_readings already equals the master
-- `Muscat_Bay_Coast_Electricity_Master_Apr24Apr26.xlsx` (identical row+column
-- checksums, grand total 3,137,845.2 kWh). The values below are therefore present
-- in the MASTER itself — they are the team's recorded readings, not DB corruption.
-- Do NOT blindly overwrite them in Supabase: correct them at the master first
-- (so the source of truth is right), then re-send the master and the DB will pick
-- up the change on the next load. Only run a targeted UPDATE here if you have the
-- confirmed true value AND cannot re-load from the master.
--
-- Items flagged (see ELECTRICITY_DATA_AUDIT.md §C):
--   1. Beachwell (R51903): Mar-25 = 40 and Jan-26 = 0 vs ~23,671 baseline.
--      Confirm real outage vs failed read; enter the metered kWh if a read was missed.
--   2. Bank muscat: Sep-24 = -2. A negative kWh is impossible — correct at source.
--   3. Bank muscat vs Bank Muscat ATM: BOTH = 744 in Dec-25 (Retail double-count).
--      744 fits the ATM's ~700-750 profile and is a 3.8x spike for Bank muscat, so
--      744 is most likely the ATM's value duplicated onto the main meter. Decide
--      which meter owns Dec-25 = 744 and fix the other in the master.
--
-- Example (RUN ONLY with a confirmed value; matches by meter name + month):
-- UPDATE electricity_readings r SET consumption = <CONFIRMED_KWH>   -- or NULL if not in service
--   FROM electricity_meters m
--  WHERE r.meter_id = m.id AND m.name = 'Bank muscat' AND r.month = 'Sep-24';
--
-- Reference — current stored values for the flagged cells:
SELECT m.name, m.account_number, r.month, r.consumption
FROM electricity_readings r JOIN electricity_meters m ON m.id = r.meter_id
WHERE (m.account_number = 'R51903' AND r.month IN ('Mar-25','Jan-26'))
   OR (m.name IN ('Bank muscat','Bank Muscat ATM') AND r.month IN ('Sep-24','Dec-25'))
ORDER BY m.name, to_date(r.month,'Mon-YY');
