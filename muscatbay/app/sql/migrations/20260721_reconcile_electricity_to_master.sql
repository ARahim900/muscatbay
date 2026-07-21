-- 20260721_reconcile_electricity_to_master.sql
-- APPLIED LIVE 2026-07-21 (Supabase MCP migration `reconcile_electricity_to_master_may26`).
--
-- Reconciles electricity_readings to the authoritative master spreadsheet
-- `Muscat_Bay_Coast_Electricity_Master_Apr24Apr26.xlsx` (owner-supplied,
-- maintained by Abdulrahim AlBalushi — the single source of truth for all 60
-- Muscat Bay Coast electricity meters).
--
-- A full row + column checksum comparison (per-meter totals AND per-month totals,
-- plus non-empty counts, across Apr-24..May-26) proved the DB ALREADY equals the
-- master: identical grand total 3,137,845.2 kWh, identical 60-meter roster,
-- identical every-month totals. The ONLY divergence was three meters that the
-- master intentionally leaves EMPTY for May-26 — its rule is: "If a meter is
-- closed/not in service, leave the cell empty. Do not enter 0 unless the actual
-- consumption was zero." — but which the DB had stored as 0:
--   • Helipad (R52334)
--   • Lifting Station 02 (R52328)
--   • Zone-3 landscape light 17 (R54872)
-- Set those three May-26 cells to NULL so the DB faithfully mirrors the master's
-- "not in service" state (distinct from a genuine 0 kWh). Guarded on `= 0` so it
-- is a no-op if already reconciled. Months beyond the master's range (Jun-26,
-- which post-dates this master file) are deliberately left untouched.

UPDATE electricity_readings r
SET consumption = NULL
FROM electricity_meters m
WHERE r.meter_id = m.id
  AND r.month = 'May-26'
  AND m.name IN ('Helipad','Lifting Station 02','Zone-3 landscape light 17')
  AND r.consumption = 0;
