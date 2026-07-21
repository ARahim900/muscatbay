-- 20260721_secure_stale_backups.sql
-- APPLIED LIVE 2026-07-21 (via Supabase MCP migration `secure_stale_gulf_expert_backups`).
--
-- Context: the database/backup investigation on 2026-07-21 found that three
-- ad-hoc backup tables created 2026-07-20 — i.e. AFTER the 2026-07-18 hardening
-- that established "0 public tables lack RLS" (see 20260718_security_hardening*.sql
-- and SECURITY_REMEDIATION.md) — had been left with RLS DISABLED. Because they
-- live in the `public` schema they are exposed through PostgREST, so the
-- anonymous public API key could read them. This was verified by simulating the
-- `anon` role: it could SELECT 295 / 12 / 4 rows respectively before this change.
--
-- These snapshots contain Gulf Expert (HVAC) business data — PPM findings,
-- quotations and contracts — that the live tables (ge_ppm_findings, ge_quotations,
-- gulf_expert_contracts) correctly protect with RLS + policies. The backups
-- silently reopened the exact hole the hardening had closed.
--
-- Fix: enable RLS with NO policy. That denies anon + authenticated entirely,
-- while the service_role (used by data syncs and by any restore-from-backup
-- workflow) still bypasses RLS. Non-destructive — the snapshot rows are retained.
-- This matches the posture of the older 2026-07-04 contractor backups, which were
-- already RLS-enabled/no-policy.
--
-- RECOMMENDED FOLLOW-UP (owner decision, intentionally NOT done here because it
-- is destructive): once confirmed no longer needed, DROP these snapshots and the
-- three 2026-07-04 contractor snapshots rather than leaving backup copies of
-- production data sitting in the live `public` schema. Prefer Supabase's own
-- point-in-time / logical backups over hand-rolled `*_backup_YYYYMMDD` tables.

ALTER TABLE public.ge_ppm_findings_backup_20260720       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ge_quotations_backup_20260720         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gulf_expert_contracts_backup_20260720 ENABLE ROW LEVEL SECURITY;
