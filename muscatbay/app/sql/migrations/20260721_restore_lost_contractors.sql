-- 20260721_restore_lost_contractors.sql
-- APPLIED LIVE 2026-07-21 (Supabase MCP migration `restore_lost_contractors_safe_set`).
--
-- Recovers contractors accidentally deleted from Contractor_Tracker. The live table
-- had fallen from 47 rows (2026-07-04 backup) to 18, losing 26 distinct contractors.
-- This was NOT de-duplication (only 3 names were duplicated in the backup) and NOT
-- an expired-contract cull: 18 of the 26 were marked Active, including the three
-- largest contracts in the register — COSMO (562,584 OMR/yr), Nasco (389,468) and
-- Oman Water Treatment Company LLC / the STP operator (389,400). ~1.46M OMR/yr of
-- tracked contract value had been dropped.
--
-- Restores ONLY the 23 UNAMBIGUOUS deletions (missing rows that do not collide with
-- any surviving row on End Date or Annual Value). Three AMBIGUOUS rows are EXCLUDED
-- as probable in-place renames/edits of surviving rows (restoring them would
-- duplicate) — left for owner review:
--   • COSMO (Active, 562k, End 2/28/2025)         ~ live "COMO" (Expired, null, same End Date)
--   • KONE Hiessen LLC (Active, End 2/28/2025)     ~ live "KONE Assarain LLC"
--   • Future Cities S.A.O.C (Tadoom) (184.3, 9/23/2032) = live "Tadoom" (identical value+date)
--
-- Purely additive (no existing row changed). Result: 18 -> 41 live rows.
-- To REVERT: delete the restored names (they are exactly the backup contractors whose
-- normalized name was absent from live before this ran and are not in the 3 excluded).
INSERT INTO "Contractor_Tracker"
  ("Contractor","Service Provided","Status","Contract Type","Start Date","End Date",
   "Contract (OMR)/Month","Contract Total (OMR)/Year","Annual Value (OMR)","Renewal Plan","Note","contract_pdf_url")
SELECT DISTINCT
   b."Contractor", b."Service Provided", b."Status", b."Contract Type", b."Start Date", b."End Date",
   b."Contract (OMR)/Month", b."Contract Total (OMR)/Year", b."Annual Value (OMR)", b."Renewal Plan", b."Note", b."contract_pdf_url"
FROM "Contractor_Tracker_backup_20260704" b
WHERE b."Contractor" IS NOT NULL
  AND btrim(lower(b."Contractor")) NOT IN
      (SELECT DISTINCT btrim(lower("Contractor")) FROM "Contractor_Tracker" WHERE "Contractor" IS NOT NULL)
  AND NOT EXISTS (
      SELECT 1 FROM "Contractor_Tracker" l
      WHERE (l."End Date" IS NOT DISTINCT FROM b."End Date" AND b."End Date" IS NOT NULL)
         OR (l."Annual Value (OMR)" IS NOT DISTINCT FROM b."Annual Value (OMR)" AND b."Annual Value (OMR)" IS NOT NULL)
  );
