-- 20260721_restore_kone_hiessen.sql
-- APPLIED LIVE 2026-07-21 (Supabase MCP migration `restore_kone_hiessen_contractor`).
-- Follow-up to 20260721_restore_lost_contractors.sql after owner review of the 3
-- withheld ambiguous rows:
--   • KONE Hiessen LLC — owner confirmed it is a DISTINCT contract from the surviving
--     "KONE Assarain LLC" (withheld only because its End Date 2/28/2025 coincided with
--     COSMO's). RESTORED here. (Status='Active' with a past End Date 2/28/2025, so it
--     will raise an "expired-while-Active" alert — mark Expired if genuinely ended.)
--   • COSMO — owner confirmed the COMO/COSMO contract is EXPIRED, so the live "COMO"
--     (Expired) row is kept unchanged and the backup's Active 562k COSMO is NOT restored.
--   • "Future Cities S.A.O.C (Tadoom)" — exact duplicate of the live "Tadoom"; stays out.
-- Result: Contractor_Tracker 41 -> 42 rows.
INSERT INTO "Contractor_Tracker"
  ("Contractor","Service Provided","Status","Contract Type","Start Date","End Date",
   "Contract (OMR)/Month","Contract Total (OMR)/Year","Annual Value (OMR)","Renewal Plan","Note","contract_pdf_url")
SELECT DISTINCT
   b."Contractor", b."Service Provided", b."Status", b."Contract Type", b."Start Date", b."End Date",
   b."Contract (OMR)/Month", b."Contract Total (OMR)/Year", b."Annual Value (OMR)", b."Renewal Plan", b."Note", b."contract_pdf_url"
FROM "Contractor_Tracker_backup_20260704" b
WHERE btrim(lower(b."Contractor")) = 'kone hiessen llc'
  AND NOT EXISTS (
      SELECT 1 FROM "Contractor_Tracker" l WHERE btrim(lower(l."Contractor")) = 'kone hiessen llc'
  );
