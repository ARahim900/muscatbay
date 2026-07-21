# Electricity Data & Backup Audit — 2026-07-21

Investigation of reported database / data-backup irregularities, focused on the
electricity module and the live Supabase project `utnlgeuqajmwibqmdmgt`
(ap-northeast-1). Findings are ordered by severity. One live security hole was
closed during the audit; the data-quality items need the owner's true readings
before correction (scaffold in `sql/fixes/electricity_data_anomalies_20260721.sql`).

## Scope & method

Read the live database directly (no mock data): `electricity_meters` (60 meters),
`electricity_readings` (1,543 rows, months `Apr-24`→`Jun-26`, grand total
**3,319,702 kWh**), the four `v_electricity_*` / `v_meter_monthly_readings_unified`
views, every `*_backup_*` table, and the security advisors. Cross-checked against
the reader path (`functions/api/electricity.ts`) and the anomaly engine
(`components/electricity/electricity-analytics.ts`).

## Headline

- **No table corruption and no data loss.** No duplicate `(meter, month)` rows,
  no orphaned readings, no bad month formats. All 27 months load cleanly. The 77
  "missing" `(meter, month)` cells (1,543 of a possible 60×27=1,620) belong
  **entirely** to four Retail meters onboarded in late 2025 — no established
  meter has a hole in its history.
- **The real problems are (A) a live security regression in the backup tables and
  (B) a handful of bad electricity values that render silently in the charts.**

---

## A. Security — LIVE HOLE, now closed ✅ (was ERROR-level)

Three ad-hoc backup tables created **2026-07-20** — two days *after* the
2026-07-18 hardening that established "0 public tables lack RLS"
(`SECURITY_REMEDIATION.md`) — were left with **RLS disabled**. Sitting in the
`public` schema, they were exposed through PostgREST to the **anonymous public
API key**. Verified by simulating the `anon` role:

| Table (created 2026-07-20) | Rows anon could read (before) |
|---|---|
| `ge_ppm_findings_backup_20260720` | 295 |
| `ge_quotations_backup_20260720` | 12 |
| `gulf_expert_contracts_backup_20260720` | 4 |

This silently reopened the exact hole the hardening had closed. **Fixed live**
during this audit (`sql/migrations/20260721_secure_stale_backups.sql`): RLS
enabled with no policy → anon + authenticated denied, `service_role` still
bypasses. Re-verified: anon now reads **0 rows** from all three. Supabase security
advisor no longer reports `rls_disabled_in_public` for them.

## B. Backup hygiene — data-backup irregularity (the "data backup" concern)

"Backups" here are hand-rolled `*_backup_YYYYMMDD` **table copies inside the live
`public` schema**, not real backups. Six exist:

| Table | Created | RLS | Note |
|---|---|---|---|
| `Contractor_Tracker_backup_20260704` | 07-04 | on / no policy | stale copy |
| `contractor_contracts_backup_20260704` | 07-04 | on / no policy | stale copy |
| `contractor_yearly_costs_backup_20260704` | 07-04 | on / no policy | stale copy |
| `ge_ppm_findings_backup_20260720` | 07-20 | **now on** (was off) | stale: 295 rows vs live 361 |
| `ge_quotations_backup_20260720` | 07-20 | **now on** (was off) | — |
| `gulf_expert_contracts_backup_20260720` | 07-20 | **now on** (was off) | — |

Problems: they bypass the module RLS model unless every one is hardened by hand
(the 07-20 set proves that fails), they drift out of date, and they inflate the
schema. **Recommendation:** drop them once confirmed unneeded and rely on
Supabase's point-in-time / logical backups. Destructive, so left for owner sign-off.

## C. Electricity data-quality anomalies (what you saw "browsing the app")

These are individual bad values, not structural damage. They render **silently**
in the trend charts and heatmap because the Load Watch exceptions engine only
evaluates the **latest** month in the selected range (see item D) — so historical
bad points show as dips/zeros on the chart but never appear in the work-queue.

1. **Beachwell = 0 kWh in Jan-26** (account `R51903`) while the meter averages
   **~22,794 kWh/month** (max 46,800). Almost certainly a failed/missing read,
   not a true zero — it understates the whole-site Jan-26 total by ~one month of
   Beachwell load and is the single most visible chart anomaly.
2. **"Bank muscat" = −2 kWh in Sep-24** (Retail). A negative delivery is
   physically impossible — meter reset/fault or data-entry error.
3. **"OUA Store (BTU Meter)" = NULL in Feb-26** (account `R57668`). Genuinely
   missing; the only NULL in the table. The app coerces it to `0` (item D), so it
   currently masquerades as a real zero read.
4. **Dec-25 double-count — "Bank muscat" vs "Bank Muscat ATM".** Both read
   **exactly 744** in Dec-25, then diverge completely (Jan-26: 51 vs 720; the ATM
   holds ~700/month thereafter, the main meter drops to 50–170). The ATM meter's
   first month was seeded from the main meter, so **Retail Dec-25 is inflated by
   744 kWh**, and the two near-identical names are easy to confuse. Confirm they
   are distinct physical meters, fix the Dec-25 duplicate, and rename for clarity.

Lower-priority / likely-legitimate (listed so they aren't re-flagged later):

5. **Always-zero meters (0 kWh in all 27 months):** `Helipad` (`R52334`) and
   `Zone-3 landscape light 17` (`R54872`). Either dead/unused meters or never
   metered — confirm, then either remove or annotate so they stop generating
   noise in the register.
6. **116 zero readings** overall. Most are plausible for low-duty assets
   (Lifting Station 02 avg 12 kWh, small landscape lights, standby pumps) and are
   **not** flagged here — only zeros on normally-nonzero meters (items 1, 3) matter.
7. **Onboarding gaps (not errors):** the four Retail meters — `Sales Center - Main
   Meter` (`R51574`), `Sales Center - Dry Kitchen`, `Sales Center - Tent`
   (from Nov-25) and `Bank Muscat ATM` (from Dec-25) — account for **all 77** empty
   cells. Expected, not data loss.
8. **Messy `meter_type` taxonomy.** Singleton/near-singleton categories
   (`Beach well` = 1 meter, `FP-Landscape Lights Z3` = 3, `DB` mixes actuators +
   Guard House + Helipad). Load Watch groups by `meter_type`, so these surface as
   categories of one. Cosmetic; consider consolidating.

Correction scaffold (values intentionally left blank — need the real readings):
`sql/fixes/electricity_data_anomalies_20260721.sql`.

## D. Code — NULL consumption is silently turned into 0

`functions/api/electricity.ts` builds each reading as
`Number(reading.consumption) || 0`, so a **NULL** consumption (a *missing* read)
becomes **0** (a *real* zero). But `electricity-analytics.ts` is deliberately
built to treat these differently — distinct flags and distinct operator actions:
`missing` → "schedule a manual read" vs `zero` → "check the breaker/supply". The
coercion erases that distinction (item C-3 is the live example). Additionally, the
anomaly engine only inspects the **current** month, so historical bad values
(C-1, C-2) never reach the exceptions register.

**Recommended (not applied — needs a small typed change + regression check):**
preserve NULL through the API (`MeterReading.readings: Record<string, number | null>`;
all summation sites already use `?? 0`), so the "missing read" flag works and
missing ≠ zero. Optionally let the exceptions register scan the whole selected
range, not just the last month.

## E. View / schema data debt

- `v_electricity_monthly_pivot` **hardcodes month columns** `Apr-24`…`Jun-26`. New
  months (Jul-26+) will be silently dropped until someone `ALTER`s the view — the
  same "dashboard stops at last month" class of bug the Water module structurally
  fixed in 2026-07-03.
- All four `v_electricity_*` views are **unused by the app** (it reads the base
  tables) and are **SECURITY DEFINER** (four `security_definer_view` advisor
  ERRORs) — they can expose electricity data past RLS. Either drop them or switch
  to `security_invoker = true`.

## F. Documentation drift

`PROJECT_STATUS.md` says electricity "Monthly readings through **Mar-26**", but
the DB holds through **Jun-26** (Apr/May/Jun-26 loaded 2026-05-08 → 2026-07-04).
Harmless, but a sign the electricity pipeline isn't being reconciled — its monthly
loads still arrive via hand-run SQL (`sql/migrations/update_electricity_*.sql`),
the same manual step Water eliminated. Status doc updated in this change.

## Supabase advisor snapshot (2026-07-21, post-fix)

129 lints. The 3 `rls_disabled_in_public` ERRORs (item A) are resolved. Residual
(mostly pre-existing, tracked in `SECURITY_REMEDIATION.md`): 4 `security_definer_view`
(item E), 68 `rls_policy_always_true`, 20 `function_search_path_mutable`,
5 `rls_enabled_no_policy`, 1 `public_bucket_allows_listing`,
`auth_leaked_password_protection` still off (owner action).

## What was changed vs. what needs owner sign-off

| Action | Status |
|---|---|
| Enable RLS on the 3 exposed 2026-07-20 backups | ✅ applied live + verified |
| Migration file committed | ✅ `sql/migrations/20260721_secure_stale_backups.sql` |
| Correct Beachwell Jan-26 / Bank muscat −2 / OUA Feb-26 / Bank Muscat Dec-25 dup | ⏳ needs true values (scaffold in `sql/fixes/`) |
| Drop the 6 in-schema backup tables | ⏳ destructive — owner confirm |
| Preserve NULL≠0 in the electricity API | ⏳ recommended code change |
| Fix / drop the 4 SECURITY DEFINER electricity views + de-hardcode the pivot | ⏳ recommended |
