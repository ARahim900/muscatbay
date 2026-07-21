-- 20260721_harden_electricity_views_drop_ge_backups.sql
-- APPLIED LIVE 2026-07-21 (Supabase MCP migration
-- `harden_electricity_views_and_drop_ge_backups`).
--
-- (1) SECURITY — close a live anon leak through the electricity views.
-- The four public electricity/unified views were SECURITY DEFINER, so the
-- anonymous public API key could read electricity consumption THROUGH them even
-- though the base tables' RLS blocks anon. Verified by simulating the `anon`
-- role BEFORE this change: v_electricity_summary 270 rows, v_electricity_grand_totals
-- 27, v_electricity_monthly_pivot 60 (the full per-meter monthly pivot). After
-- switching to security_invoker, anon reads 0 from all of them; authenticated
-- users are unaffected and the app reads the base tables directly, not these views.
ALTER VIEW public.v_electricity_summary            SET (security_invoker = true);
ALTER VIEW public.v_electricity_grand_totals       SET (security_invoker = true);
ALTER VIEW public.v_electricity_monthly_pivot      SET (security_invoker = true);
ALTER VIEW public.v_meter_monthly_readings_unified SET (security_invoker = true);

-- (2) CLEANUP — drop the three stale 2026-07-20 Gulf Expert backup snapshots.
-- They are SUBSETS of their live tables (live >= backup: ge_ppm_findings 361>=295,
-- ge_quotations 14>=12, gulf_expert_contracts 6>=4), so the live data supersedes
-- them and no rollback value remains. (They had been RLS-secured earlier the same
-- day in 20260721_secure_stale_backups.sql as an immediate stop-gap; this removes
-- them outright.)
DROP TABLE IF EXISTS public.ge_ppm_findings_backup_20260720;
DROP TABLE IF EXISTS public.ge_quotations_backup_20260720;
DROP TABLE IF EXISTS public.gulf_expert_contracts_backup_20260720;

-- NOT DROPPED — the three 2026-07-04 contractor backups are deliberately KEPT.
-- Contractor_Tracker_backup_20260704 holds 47 rows (42 distinct contractors) while
-- the live Contractor_Tracker has only 18 rows (17 distinct): 26 distinct
-- contractors present in the backup are ABSENT from live, and only 3 names are
-- duplicated — so this is not de-duplication but a probable data-loss event that
-- must be investigated before the backup can be removed. See
-- ELECTRICITY_DATA_AUDIT.md §B.
