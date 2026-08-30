# Load-Test Baseline — 2026-08-30

First executed run of the load-testing framework, recorded per the
baseline/regression workflow in `README.md`. Two tiers were measured through
different, honest paths — the run environment (a Claude Code cloud sandbox)
has an egress allowlist that blocks arbitrary HTTPS, so the deployed Vercel
edge could not be load-tested from it:

| Tier | What was executed | Where it ran | What the numbers mean |
|---|---|---|---|
| HTTP (pages) | Artillery, full 5-minute profile (1 m ramp / 3.5 m sustain / 30 s down) against the app's **production build** (`next build` + `next start`, commit `02afa5f`) | Local to the sandbox (4 vCPU, generator + server co-located, CPU ~95% idle throughout) | Application-server capacity under concurrency. **Not** Vercel-edge latency — absolute values will differ in production; flatness and error behaviour transfer |
| Database (api) | The exact PostgREST reads the pages issue (mirrored in this harness), profiled with role-scoped `EXPLAIN (ANALYZE, BUFFERS)`, `pg_stat_statements` history, index/policy/connection audit | **Production Supabase** (`utnlgeuqajmwibqmdmgt`, ap-northeast-1), via the sanctioned Supabase connector | Real production query cost and capacity ceilings |

Still unmeasured (needs a network-unrestricted client, one command — see
"Reproducing" below): full-path REST latency through Supavisor/PostgREST from
a real location, the Realtime WebSocket tier, and the auth token flow.

---

## 1. HTTP tier — 5-minute runs, pages journeys

Weighted journeys (Dashboard 35 / Water 30 / Electricity 20 / STP 15), REST
steps skipped (`ifTrue` guards) since Supabase egress is blocked in-sandbox.

| Run | Sustained load | Journeys | Errors | p50 | p95 | p99 | max |
|---|---|---|---|---|---|---|---|
| 1 — `results/artillery-local-pages-20260830.json` | 8 arrivals/s ≈ **30 concurrent** | 2,085 | **0** | 3 ms | 5 ms | 7 ms | 13 ms |
| 2 — `results/artillery-local-pages-50vu-20260830.json` | 14 arrivals/s ≈ **50 concurrent** (cap 50 never binding, 0 skipped) | 3,660 | **0** | 3 ms | 5 ms | 6 ms | 24 ms |

Timeline shape (both runs): p95 flat within a 4–6 ms band through the entire
ramp and sustain — no drift, no knee, no queueing signature. All three gates
(`p50 < 500 ms`, `p95 < 1500 ms`, error rate < 1%) passed.

**Reading:** the Next.js server itself has enormous headroom at 50 concurrent
users. Every module route is a pre-rendered client-component shell (~34 KB),
so serving it is static-file work; in production, Vercel's CDN makes this tier
even cheaper. The front door is not where this app's scalability risk lives.

## 2. Database tier — production query profile

Warm vs first-touch execution (role `authenticated`, RLS active; PostgREST's
persistent connections keep production on the warm path):

| Mirrored query (reader) | Rows | Warm exec | First-touch |
|---|---|---|---|
| `water_monthly_consumption` page, `LIMIT 1000 OFFSET 0` | 1,000 | **0.8 ms** | 59.6 ms |
| same, `OFFSET 10000` (the 11th parallel page `/water` requests) | 848 | **104.6 ms** | — |
| `water_daily_consumption` wide `day_1..day_31` page | 1,000 | **1.2 ms** | 106.2 ms |
| `stp_operations` `ORDER BY date DESC LIMIT 1500` | 741 | **6.6 ms** | — |
| `water_meters` full read | 431 | **7.8 ms** | — |
| `water_monthly_consumption` exact-count probe | 10,848 | **3.5 ms** | — |

Production history (`pg_stat_statements`): the single most expensive statement
in the database's recorded life is exactly the paged
`water_monthly_consumption` read — **157,658 calls, ~1,895 s total, mean
12 ms, max 790 ms** — invoked ~8× per `/water`/dashboard view by the parallel
page fan-out (compare `water_meters`: 20,022 calls). Means for all other hot
reads: 3–19 ms; maxima 0.1–1.0 s under real contention.

Structural facts:

- **RLS**: enabled on all 8 read tables; every policy is `TO authenticated
  USING (true)` — constant-time, no per-row `auth.uid()` re-evaluation (the
  advisor's `auth_rls_initplan` warnings touch only `profiles`). **`anon` has
  no read policies** → the REST tier of any load test requires a real user
  JWT (`npm run -s token`), or every read returns an empty set.
- **Indexes**: every read path is covered, including the exact composite
  `idx_wmc_account (account_number, period)` the double ORDER BY needs, and
  `(date)` for STP. No missing-index findings on the hot paths.
- **Connections**: `max_connections = 60` (12 in use at rest, 1 active).
  This — not query speed — is the data-tier ceiling: 50 users × 4–7 parallel
  REST calls per page view queue on PostgREST's slice of those 60.
- **Hygiene (advisor-confirmed)**: `water_daily_consumption` carries **4
  duplicate index pairs** (write amplification; drop one of each);
  `contractor_contracts` has doubled SELECT policies; several `*_backup_*`
  tables lack primary keys.

## 3. Verdict — API design vs database queries

**The database engine is exonerated** at current scale: plans are correct,
indexes fit, RLS is constant-time, warm execution is single-digit
milliseconds. The measurable costs are *shape* problems in how the API is
called — i.e., API design:

1. **OFFSET-pagination decay (the one real query-side cost).** Page 1 of the
   monthly table costs 0.8 ms; page 11 costs 104.6 ms — the index scan walks
   and discards all 10,000 skipped entries (2,189 buffers vs 206). `/water`
   requests *all 11 pages in parallel on every view*, so the tail pages
   dominate its DB time today, and total work grows **quadratically** as
   months accrue. Fix in `functions/api/water.ts`: keyset pagination
   (filter `account_number/period > last-seen` instead of `OFFSET`), or
   better, one RPC/view returning the aggregate the page actually renders.
2. **Fan-out chattiness.** One `/water` view ≈ 15+ REST round-trips (meters,
   count probe, 11 monthly pages, daily rollup, loss tables). Each pays
   Supavisor/PostgREST/TLS overhead and occupies pool slots; production
   evidence is the 157k-call top statement. A single consolidated view/RPC
   per page would cut both latency and the connection-ceiling exposure.
3. **Connection ceiling before CPU.** With `max_connections = 60`, the
   "all endpoints degrade together" signature (README §Interpreting, step 2)
   is the expected first failure mode at higher concurrency — address via
   fewer requests per view (above) before any instance upsize.

Projected end-user REST latency (Oman → ap-northeast-1, ~150–200 ms RTT):
network RTT + payload transfer dominates the healthy queries; the OFFSET tail
pages and request count are the app-controlled share. Both fixes are
client/API-side; no schema surgery is indicated.

## 4. Recommended actions (ranked)

1. Replace OFFSET paging in `fetchWaterMeters()` with keyset pagination — or
   collapse the monthly fan-out into one RPC/view (removes findings 1 & 2
   together and no-ops the count probe).
2. Drop the 4 duplicate indexes on `water_daily_consumption` (advisor lint
   `duplicate_index`) and the doubled `contractor_contracts` SELECT policy.
3. When network-unrestricted, run the full two-tier profile against a Vercel
   preview with a user token to baseline true end-user REST latency
   (commands below); keep the JSON beside these runs.
4. Re-run this baseline after each data-layer change; compare like-for-like.

## 5. Reproducing / extending this baseline

```bash
cd load-testing && npm install
set -a; . ./.env; set +a                    # BASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY
export AUTH_TOKEN="$(npm run -s token)"     # requires LOADTEST_* creds; see README §Authentication
npm run k6:smoke && npm run k6:load         # strict 50-VU closed model, both tiers
npm run artillery:load                      # open-model confirmation
```

The k6 binary could not run in the sandbox (its release download is outside
the egress allowlist), so the k6 script was validated by dry-run only — run
`k6:smoke` on first local use as the README instructs.
