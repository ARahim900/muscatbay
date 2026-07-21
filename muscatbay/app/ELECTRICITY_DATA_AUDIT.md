# Electricity Data & Backup Audit — 2026-07-21

Investigation of reported database / data-backup irregularities, focused on the
electricity module and the live Supabase project `utnlgeuqajmwibqmdmgt`
(ap-northeast-1), then reconciled against the owner-supplied master spreadsheet
`Muscat_Bay_Coast_Electricity_Master_Apr24Apr26.xlsx`.

## Bottom line

**The electricity database is sound — it faithfully mirrors your master
spreadsheet.** A full row + column checksum comparison (every per-meter total and
every per-month total, plus non-empty counts, across all 60 meters × 26 months
Apr-24→May-26) matched exactly: **grand total 3,137,845.2 kWh on both sides**. The
only differences were 3 trivial cells, now reconciled. So the odd electricity
values you noticed while browsing are **not** DB corruption or a backup mishap —
they are the values recorded in the master itself, i.e. source-data entries to
review (§C), not database drift.

The genuinely actionable problems this audit found are elsewhere: **three live
security holes** (all now closed) and a **probable contractor data-loss event**.

## What was changed live during this audit (all verified)

| # | Change | Status |
|---|---|---|
| 1 | **Enabled RLS** on 3 anon-readable `*_backup_20260720` Gulf Expert tables | ✅ applied → then dropped (see 4) |
| 2 | **Switched 4 electricity views to `security_invoker`** — they were SECURITY DEFINER and leaked consumption to the anon key | ✅ applied + verified (anon now 0 rows) |
| 3 | **Reconciled electricity to the master**: 3 May-26 cells `0 → NULL` (Helipad, Lifting Station 02, Zone-3 landscape light 17 — "not in service") | ✅ applied + verified |
| 4 | **Dropped 3 stale Gulf Expert backup tables** (subsets of live) | ✅ applied + verified |
| 5 | **Code:** `functions/api/electricity.ts` no longer coerces `NULL → 0` | ✅ in this PR (188 tests pass, tsc clean) |

Migrations: `sql/migrations/20260721_secure_stale_backups.sql`,
`…_reconcile_electricity_to_master.sql`, `…_harden_electricity_views_drop_ge_backups.sql`.

## A. Security — three live holes, all closed ✅

1. **Anon-readable backup tables.** Three `*_backup_20260720` Gulf Expert tables
   created **2026-07-20** — two days *after* the 2026-07-18 hardening that
   established "0 public tables lack RLS" — had **RLS disabled**, exposing 295 / 12
   / 4 rows to the **anonymous public API key** (verified by simulating `anon`).
   Fixed (RLS enabled, then the tables dropped as stale).
2. **SECURITY DEFINER electricity views.** `v_electricity_summary`,
   `v_electricity_grand_totals` and `v_electricity_monthly_pivot` let the anon key
   read electricity consumption (270 / 27 / 60 rows — including the full per-meter
   pivot) *through the views*, bypassing the base-table RLS. Switched all four
   electricity/unified views to `security_invoker`; anon now reads **0**.
3. Both of the above were the exact class of exposure the 2026-07-18 hardening
   closed — reintroduced by later ad-hoc objects. The advisor's 3
   `rls_disabled_in_public` ERRORs and (these) `security_definer_view` ERRORs are
   resolved.

## B. Data-backup hygiene — and a probable data-loss event ⚠️

"Backups" here are hand-rolled `*_backup_YYYYMMDD` **table copies inside the live
`public` schema**, not real backups. That pattern is the root cause of the §A
leaks (each copy must be RLS-hardened by hand, and the 07-20 set wasn't).

- **Dropped** (safe — live supersedes): the three 2026-07-20 Gulf Expert snapshots.
- **KEPT for investigation — do not delete:** the three 2026-07-04 contractor
  snapshots. **`Contractor_Tracker` live = 18 rows (17 distinct contractors) but its
  backup = 47 rows (42 distinct).** 26 distinct contractors in the backup are
  **absent from the live table**, and only 3 names are duplicated — so this is *not*
  de-duplication but a **probable data-loss event** on the live contractor
  register. The backup is currently the only copy of those 26 records. Needs owner
  review (intentional cull vs accidental deletion) before any cleanup.
- **Recommendation:** stop making in-schema `*_backup_*` copies; rely on Supabase's
  point-in-time / logical backups. If snapshots are needed, put them in a dedicated
  non-`public` schema (not exposed by PostgREST) with RLS.

## C. Electricity values you noticed — they match the master (source-data items)

These render as chart dips/zeros, but the DB equals the master, so they are **source
entries to verify at the master**, not DB fixes. None were overwritten.

| Meter | Month(s) | Master = DB value | Note |
|---|---|---|---|
| Beachwell (`R51903`) | Mar-25 / Jan-26 | 40 / 0 | vs ~23,671 baseline — recurring near-zero reads; confirm real outage vs failed read. |
| Bank muscat | Sep-24 | −2 | Physically impossible kWh — a source data-entry artifact. |
| Bank muscat + Bank Muscat ATM | Dec-25 | 744 **and** 744 | Both meters carry 744; 744 fits the ATM's ~700–750 profile and is a 3.8× spike for Bank muscat → likely the ATM's value duplicated onto the main meter when the ATM row was added. Retail Dec-25 is double-counted by 744. |
| OUA Store (`R57668`) | Feb-26 | empty → NULL | Correctly "not in service" (the only NULL). |
| Lifting Station 02 / OUA Store | most of 2025 | 0 | Plausibly genuinely offline/vacant — confirm, then annotate. |

2025 was otherwise clean: **0 negatives, 0 NULLs** across the year; seasonal
dips/spikes (irrigation, street lights, actuators) and constant small loads
(Actuator DB 05 = 18) are normal, not errors.

**Fix these at the master**, then re-send it — the DB will pick up the corrections
on the next load. Convenience scaffold: `sql/fixes/electricity_source_review_20260721.sql`.

## D. Code — NULL now means "not in service", not 0 ✅

`functions/api/electricity.ts` used `Number(consumption) || 0`, turning a **NULL**
(missing / not-in-service) into a real **0**. That erased the master's empty-vs-0
distinction and defeated the Load Watch anomaly engine, which is explicitly built
to treat a missing read ("schedule a manual read") differently from a zero read
("check the breaker"). Fixed: NULL readings are now omitted from the meter's map,
so a missing month stays distinct from 0. No type/behaviour ripple — every
consumer already treats an absent month as 0 for sums via `?? 0` / `|| 0`
(verified across `page.tsx`, `electricity-analytics.ts`, `useDashboardData.ts`);
`entities/electricity.ts` `consumption` is now correctly `number | null`. 188 tests
pass, `tsc --noEmit` clean.

## E. View data debt (informational)

`v_electricity_monthly_pivot` still **hardcodes** its month columns
(`Apr-24`…`Jun-26`); new months are silently dropped until the view is `ALTER`ed —
the "dashboard stops at last month" class the Water module fixed structurally. All
four `v_electricity_*` views are **unused by the app** (it reads base tables). They
are now `security_invoker` (safe); consider dropping them if no external tool reads
them.

## F. Cross-module 2025 spot-check

Water monthly 2025: **0 negatives, 0 NULLs** (4,198 rows) — clean. STP 2025: **1
negative TSE-for-irrigation** reading (physically impossible) — flagged for the STP
owner; out of electricity scope.

## Still needs owner input

1. **Contractor data-loss (§B)** — confirm whether 26 contractors were intentionally
   removed from `Contractor_Tracker`; restore from the kept backup if not.
2. **Source-data items (§C)** — correct the master's Beachwell / −2 / Bank Muscat
   Dec-25 double-count entries (or confirm they're real), then re-send the master.
3. **STP negative TSE (§F)** and the leaked-password protection setting (pre-existing).
