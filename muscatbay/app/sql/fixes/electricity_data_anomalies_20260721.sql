-- electricity_data_anomalies_20260721.sql
-- Remediation scaffold for the electricity data-quality anomalies found in the
-- 2026-07-21 investigation (see ELECTRICITY_DATA_AUDIT.md for the full analysis).
--
-- ⚠️  NOT APPLIED. Each statement needs the TRUE meter value, which requires the
--     NAMA bill / physical meter read — do not run these until the real figures
--     are confirmed. Every UPDATE is scoped by meter NAME + MONTH and is a no-op
--     if the anomaly has already been corrected. Run inside a transaction and
--     eyeball the row counts before COMMIT.
--
-- Schema recap: electricity_readings(meter_id uuid -> electricity_meters.id,
--   month text 'Mon-YY', consumption numeric). Meters are matched by name here
--   for readability; swap to account_number if a name is ambiguous.

BEGIN;

-- 1) NEGATIVE READING — "Bank muscat" (Retail), Sep-24 = -2 kWh.
--    A negative kWh delivery is physically impossible (no net-metering here).
--    Replace with the real reading, or 0 if the meter was genuinely inactive
--    (its Apr/May/Jun-24 reads are already 0). NULL is also valid to mark it
--    "unknown/missing" rather than assert a fake zero.
-- UPDATE electricity_readings r SET consumption = <REAL_VALUE>   -- e.g. 0 or NULL
--   FROM electricity_meters m
--  WHERE r.meter_id = m.id AND m.name = 'Bank muscat' AND r.month = 'Sep-24'
--    AND r.consumption = -2;

-- 2) MISSING READING shown as blank — "OUA Store (BTU Meter)" (R57668), Feb-26 = NULL.
--    Enter the real Feb-26 reading. (Note: the app currently coerces NULL -> 0,
--    so today this row renders as a genuine 0 kWh — see audit doc item D.)
-- UPDATE electricity_readings r SET consumption = <REAL_VALUE>
--   FROM electricity_meters m
--  WHERE r.meter_id = m.id AND m.account_number = 'R57668' AND r.month = 'Feb-26'
--    AND r.consumption IS NULL;

-- 3) IMPLAUSIBLE ZERO on a major consumer — "Beachwell" (R51903), Jan-26 = 0 kWh
--    while the meter averages ~22,794 kWh/month (range 0..46,800). Almost
--    certainly a failed/missing read, not a true zero; it understates the
--    Jan-26 site total by ~one month of Beachwell load. Enter the real value.
-- UPDATE electricity_readings r SET consumption = <REAL_VALUE>
--   FROM electricity_meters m
--  WHERE r.meter_id = m.id AND m.account_number = 'R51903' AND r.month = 'Jan-26'
--    AND r.consumption = 0;

-- 4) DEC-25 DOUBLE-COUNT / meter split — "Bank muscat" and "Bank Muscat ATM"
--    BOTH read exactly 744 in Dec-25, then diverge completely from Jan-26
--    (Bank muscat 51 vs ATM 720). The ATM's first month was seeded from the
--    main meter, so Dec-25 Retail is inflated by 744 kWh. Decide which meter
--    the 744 belongs to and correct (or NULL) the other. Example — clear the
--    duplicate on the ATM if 744 belongs to the main meter:
-- UPDATE electricity_readings r SET consumption = <REAL_ATM_VALUE_OR_NULL>
--   FROM electricity_meters m
--  WHERE r.meter_id = m.id AND m.name = 'Bank Muscat ATM' AND r.month = 'Dec-25'
--    AND r.consumption = 744;
--    Also confirm the two near-identically named meters are genuinely distinct
--    physical meters and rename them so operators can tell them apart.

-- Review before committing:
SELECT m.name, m.account_number, r.month, r.consumption
FROM electricity_readings r JOIN electricity_meters m ON m.id = r.meter_id
WHERE (m.name = 'Bank muscat'            AND r.month IN ('Sep-24','Dec-25'))
   OR (m.account_number = 'R57668'       AND r.month = 'Feb-26')
   OR (m.account_number = 'R51903'       AND r.month = 'Jan-26')
   OR (m.name = 'Bank Muscat ATM'        AND r.month = 'Dec-25')
ORDER BY m.name, r.month;

-- COMMIT;   -- uncomment once the values above are filled in and verified
ROLLBACK;    -- default: make no changes
