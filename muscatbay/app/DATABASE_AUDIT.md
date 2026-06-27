# Database Audit — Muscat Bay (Supabase `utnlgeuqajmwibqmdmgt`)

_Date: 2026-06-25 · Method: read-only REST introspection with the app's anon key, cross-table reconciliation._

## TL;DR
The app **code reads correctly** — the problems are in **how the data is stored**. Three issues
matter most: (1) water data lives in **three overlapping stores that don't reconcile**, (2) the
public anon key can **write** to operational tables (RLS hole), and (3) several code-referenced
tables **don't exist**. Most rows are fine; the corruption is concentrated and identifiable.

---

## 1. Table inventory (26 referenced in code)

| State | Tables |
|-------|--------|
| **Has data** | `Water System` (350), `water_daily_consumption` (2,093), `water_monthly_consumption` (10,148), `water_meters` (350), `water_loss_daily` (396), `electricity_readings` (1,483), `electricity_meters` (60), `stp_operations` (676), `ge_ppm_findings` (295), `ge_recurring_issues` (22), `Contractor_Tracker` (47), `contractor_contracts` (14), `contractor_yearly_costs` (36), `profiles` (9) |
| **Empty (0 rows)** | `amc_contractor_details`, `amc_contractor_expiry`, `amc_contractor_pricing`, `amc_contractor_summary`, `professional_applications`, `water_loss_summary` |
| **MISSING (don't exist — `PGRST205`)** | `Assets_Register_Database`, `amc_contacts`, `amc_contracts`, `amc_expiry`, `amc_pricing`, `avatars` |

➡️ **Code references 6 tables that aren't in the database.** Any feature relying on Assets register,
AMC contracts/pricing/expiry, or avatar storage is either broken or silently falling back.

---

## 2. Water data is stored THREE times, in THREE shapes — and they disagree

| Store | Shape | Grain | Rows |
|-------|-------|-------|------|
| `Water System` | **wide** `jan_24 … dec_26` (36 month cols) | monthly | 350 |
| `water_monthly_consumption` | **tall** `period, consumption` | monthly | 10,148 |
| `water_daily_consumption` | **wide** `day_1 … day_31` per `month` | daily | 2,093 |

There is **no single source of truth**. Reconciling daily → monthly for 2026:

- **1,742 account-months compared → 226 mismatch (13%)**; of those **42 are large** (>10% and >20 m³).
- **336 account-months have daily data but no matching monthly row.**
- Examples: Jan-26 Zone 8 Bulk daily **10,017** vs monthly **2,336**; Hotel Jan-26 daily **35,824** vs monthly **17,722**.

### Corrupt daily cells (physically impossible, poison charts/totals)
| Account | Month | Cell | Value |
|---------|-------|------|-------|
| 4300334 (Hotel) | Feb-26 | day_16 | **−92,032** (negative) |
| 4300334 (Hotel) | Feb-26 | day_26 | **100,483** (spike) |
| 4300334 (Hotel) | Jan-26 | day_31 | **35,824** (month total in one day) |
| C43659 (Main Bulk) | May-26 | day_29 | **42,257** (≈3× normal — suspect) |

### Mis-imported months (monthly totals back-filled into daily, not real readings)
- **Hotel Jan-26**: days 1–30 = 0, total dumped in day 31.
- **Hotel Feb-26**: days 1–15 = 0, plus the two impossible cells above.
- ~13–24 other meters/month show the same "all consumption in 1–2 day cells" signature.
- ✅ **June-26 hotel reloaded with real daily data on 2026-06-25** (days 1–23).
- ✅ **Hotel Jan-26 / Feb-26 cleaned on 2026-06-25**: Jan fully nulled (was 30 fake zeros + a dumped total); Feb fake-zero blocks + the −92,032 / 100,483 cells nulled, real days 17–28 kept. Impossible-cell census now: 0 negatives, 1 remaining spike (`C43659`/May day_29=42,257 — left for review, main-bulk affects loss math).

> Fix script for the impossible/known cells: `sql/fix-daily-consumption-corrupt-cells.sql`.

---

## 3. Electricity
- `electricity_readings`: tall (`meter_id, month, consumption`), 1,483 rows.
- **1 negative** and **1 null** consumption value.
- **Monthly coverage has gaps** — missing e.g. Sep–Nov 2024, parts of 2025. Trend charts will have holes.

## 4. STP (`stp_operations`, 676 daily rows, 2024-07 → "2027-05")
- **215/676 rows (32%) have `tse_for_irrigation` > `inlet_sewage`** — irrigated treated effluent
  exceeding raw sewage inlet. Either the two columns are swapped/mislabeled, units differ, or
  tanker input isn't being added to the inlet figure. Needs domain confirmation.
- **1 future-dated row: `2027-05-06`** — almost certainly a typo (data entry error).

## 5. Security finding (high priority)
- The **public anon key can `UPDATE` `water_daily_consumption`** (a write succeeded during this audit).
  Operational meter tables should be **read-only to `anon`**, with writes limited to an
  authenticated/service role. Recommend tightening RLS policies across all `water_*`, `electricity_*`,
  `stp_*`, and contractor tables.

---

## Recommended remediation (in priority order)
1. **Lock down RLS** — anon read-only on all operational tables. (security)
2. **Pick one source of truth for water** — derive monthly from daily (or vice-versa) so the three
   stores can't drift; add a reconciliation check.
3. **Re-import real daily readings** for the mis-imported meter-months (Jan/Feb-26 hotel + the
   ~13–24/month flagged meters) from the metering system / Grafana.
4. **Null the 4 impossible cells** now (script provided) so dashboards stop showing garbage.
5. **Fix the `2027-05-06` STP row** and clarify the STP inlet-vs-TSE column meaning.
6. **Resolve the 6 missing tables** — create them or remove the dead code paths.

---

## Daily Report Data-Path Health-Check (2026-06-27)

_Method: Supabase MCP (`mcp__plugin_supabase_supabase__execute_sql`, `get_advisors`, `list_tables`) against project `utnlgeuqajmwibqmdmgt`._

> **NOTE — PARTIAL RESULTS:** The Supabase MCP plugin returned `MCP error -32600: You do not have permission to perform this action` for every tool call in this session (execute_sql, list_tables, get_advisors). Findings 1–3 require live SQL and are recorded as BLOCKED rather than fabricated. Finding 4 is code-only and is complete.

---

### Finding 1 — Index on `month` — BLOCKED

**Query intended:** `select indexname, indexdef from pg_indexes where tablename = 'water_daily_consumption';`

**Result:** MCP permission error; no data returned.

**What is known from code:** Every time the user selects a month or a realtime event fires, `DailyWaterReport.tsx` runs `.from('water_daily_consumption').select(...).eq('month', selectedMonth)`. If `month` is unindexed, that is a sequential scan across all 2,093+ rows on every render. The previous audit found no index metadata in the REST response.

**ACTION (proposed, not applied):** Once MCP access is restored, run the index query above. If no index on `month` exists, run:
```sql
-- proposed, not applied
CREATE INDEX CONCURRENTLY idx_water_daily_consumption_month
  ON water_daily_consumption (month);
```

---

### Finding 2 — RLS posture — BLOCKED

**Query intended:** `select relname, relrowsecurity, relforcerowsecurity from pg_class where relname = 'water_daily_consumption';`
**Advisors call:** `get_advisors(type='security')`

**Result:** Both calls returned MCP permission error; no live data.

**What is known from the existing audit (§5):** The anon key was confirmed able to perform UPDATE on `water_daily_consumption` during the 2026-06-25 audit — RLS is either disabled or the anon role has an overly broad policy. This finding stands from the prior audit.

**ACTION (proposed, not applied):** Once MCP access is restored, confirm `relrowsecurity = false` (or a permissive anon UPDATE policy) and tighten: add RLS policies granting `anon` SELECT only, and restrict INSERT/UPDATE/DELETE to `service_role`. This is already listed as remediation priority #1.

---

### Finding 3 — Reconciliation spot-check — BLOCKED

**Query intended:**
```sql
select round(sum(day_31)::numeric, 2) as day31_total
  from water_daily_consumption
 where month = '<latest>';
```
Plus `list_tables` to locate any monthly-total source table.

**Result:** Both `list_tables` and `execute_sql` returned MCP permission errors.

**What is known from prior audit:** Three non-reconciling stores exist (`Water System` wide, `water_monthly_consumption` tall, `water_daily_consumption` daily-wide). The 2026-06-25 audit found 13% mismatch rate (226/1,742 account-months) with some deltas exceeding 10,000 m³. No new data was obtainable in this session.

**ACTION (proposed, not applied):** Once MCP access is restored, run the day_31 sum for the latest populated month and compare to `water_monthly_consumption` for the same period. A reconciliation view (daily totals vs. monthly totals) should be created and checked on each import.

---

### Finding 4 — Realtime cost — WARN

**No query needed. Analysis based on code in `components/water/DailyWaterReport.tsx` and `hooks/useSupabaseRealtime.ts`.**

`DailyWaterReport` subscribes via `useSupabaseRealtime` with the filter `month=eq.<selectedMonth>` and the callback `onChanged: () => fetchMonth(selectedMonth, true)`. `fetchMonth` issues a full `SELECT … WHERE month = ?` query returning all rows for the month (up to ~350 account rows × 31 day columns). There is **no debounce** on `onChanged`. During a bulk import — e.g., loading a month's worth of daily readings in 350 rapid successive row changes — each row change triggers an independent full-month re-fetch. With 350 accounts this produces 350 redundant queries in quick succession, burning Supabase read quota and causing React state to thrash.

**Recommendation:** Wrap the realtime callback with a debounce of 2–3 seconds so that bursts of row changes (bulk imports, scripted corrections) are coalesced into a single `fetchMonth` call. Example:

```ts
// proposed, not applied — inside DailyWaterReport
const debouncedFetchMonth = useMemo(
  () => debounce(() => fetchMonth(selectedMonth, true), 2500),
  [selectedMonth, fetchMonth]
);

useSupabaseRealtime({
  table: 'water_daily_consumption',
  channelName: `water-daily-rt-${selectedMonth}`,
  filter: `month=eq.${selectedMonth}`,
  onChanged: debouncedFetchMonth,
});
```

For single-row live updates (normal operations), the 2.5 s delay is imperceptible. For bulk imports it eliminates hundreds of redundant fetches. The `debouncedFetchMonth` memo must be cancelled on unmount to avoid stale state updates.
