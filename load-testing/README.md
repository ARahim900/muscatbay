# Load Testing — Muscat Bay Utility App

A structured load-testing framework for scalability assessment of the deployed
app: **k6** (primary) and **Artillery** (equivalent config), simulating
realistic operator traffic, capturing **p50 / p95 latency** and **error rate**,
with a repeatable method for deciding whether a bottleneck lives in the **API
design** or in the **database queries**.

| Requirement | Where it is met |
|---|---|
| 50 concurrent users against a specified URL | `k6/loadtest.js` `PROFILE=load` (50 fixed VUs, closed model); `artillery/loadtest.yml` (~50 concurrent via arrival rate + `maxVusers: 50`) |
| 5-minute run with ramp-up | Both: 1 min ramp → 3.5 min sustain → 30 s ramp-down |
| p50 / p95 latency + error rate | k6 `summaryTrendStats` (`med` = p50) + thresholds; Artillery summary percentiles + `ensure` gates |
| Secure Bearer / Cookie auth per simulated user | Environment-only injection — see [Authentication](#authentication-injecting-a-bearer-token-or-cookie-securely) |
| Interpretation guidance (API vs DB) | [Interpreting results](#interpreting-results-api-design-vs-database-queries) |

---

## Why two tools, and which to use

- **k6 (primary).** Its `ramping-vus` executor is a **closed** workload model:
  a fixed pool of virtual users looping *journey → think → journey*. That is
  the literal meaning of "50 concurrent users", so the k6 script is the
  reference workload here. It also gives per-endpoint latency Trends and
  scriptable thresholds.
- **Artillery (equivalent).** An **open** model: it *injects new arrivals at a
  rate* regardless of whether earlier users finished — closer to how public
  traffic behaves, and useful to confirm findings with a second tool. The
  config approximates 50 concurrent users via Little's law
  (`concurrency ≈ arrival rate × mean journey duration` → `8/s × ~6.5 s ≈ 50`),
  hard-capped by `maxVusers: 50`.

The difference matters when interpreting results: a closed model self-throttles
when the server slows down (users wait, so offered load drops); an open model
keeps arriving and makes queueing collapse visible sooner. Seeing both is a
feature, not duplication.

## Layout

```
load-testing/
├── k6/loadtest.js          # PRIMARY: 50-VU closed-model test, per-endpoint trends, thresholds
├── artillery/loadtest.yml  # open-model equivalent (ensure gates, per-endpoint metrics)
├── artillery/processor.cjs # builds REST URLs + injects auth from env only
├── scripts/get-token.mjs   # mints a Supabase user JWT for Bearer auth (stdout only)
├── scripts/mock-target.mjs # local mock so the HARNESS can be validated offline
├── results/                # run artifacts land here (gitignored)
├── .env.example            # copy to .env (gitignored) and fill in
└── package.json            # npm run mock | token | k6:* | artillery:*
```

## Setup

```bash
# 1. k6 — single static binary (https://grafana.com/docs/k6/latest/set-up/install-k6/)
brew install k6                # macOS
# or: download the release tarball and put `k6` on PATH (Linux/CI)

# 2. Artillery — installed locally by npm
cd load-testing
npm install

# 3. Environment
cp .env.example .env           # fill in; .env is gitignored
set -a; . ./.env; set +a       # export into the current shell (k6 and
                               # Artillery both read process env only)
```

## Authentication: injecting a Bearer token or Cookie, securely

The app has no API routes of its own — every data read goes from the browser
straight to Supabase PostgREST with two headers. The simulated users do exactly
the same:

```
apikey:        <SUPABASE_ANON_KEY>            # project publishable key
Authorization: Bearer <user access token JWT> # the simulated user's session
```

**Bearer token (recommended path):**

1. Create a **dedicated load-test user** in Supabase Auth (Dashboard →
   Authentication → Users). Never use a real operator's account: the test must
   run with *representative, least-privilege* access, and load-test traffic
   should be attributable in the auth logs.
2. Put its credentials in `load-testing/.env` (`LOADTEST_EMAIL` /
   `LOADTEST_PASSWORD`) — the file is gitignored.
3. Mint a token **into the shell, not onto disk**, immediately before a run:

   ```bash
   export AUTH_TOKEN="$(npm run -s token)"
   ```

   `scripts/get-token.mjs` performs the same password grant the login form
   performs and prints only the JWT to stdout (diagnostics go to stderr), so
   the secret never lands in a file, a CLI argument (visible in `ps`/history),
   or a log line. Both test scripts then attach it to every REST request.
4. Tokens **expire after ~1 hour** — re-mint before each session of runs.

**Cookie (page-tier alternative):** the Next.js proxy refreshes the Supabase
session cookie on page requests. To exercise that path, copy the
`sb-<project-ref>-auth-token*` cookie value(s) from a signed-in browser
(DevTools → Application → Cookies) into `SESSION_COOKIE`. It is attached only
to page requests. Treat it exactly like a password; it is usually unnecessary,
because route protection is client-side and page shells serve anonymously.

**Rules that keep this secure** (enforced by how the scripts are written):

- Secrets reach the tools **only through environment variables**; nothing
  secret exists in `k6/loadtest.js`, `loadtest.yml`, the repo, or the results
  JSON. `setup()` logs value *lengths*, never values.
- `.env` is gitignored; `.env.example` carries no real values.
- **Never** use the `service_role` key: it bypasses row-level security, which
  both leaks an admin credential into a test rig *and falsifies the
  measurement* — production queries pay RLS evaluation cost, so the test must
  too. `get-token.mjs` refuses keys that don't look like anon/publishable keys.
- Without `AUTH_TOKEN`, REST calls fall back to the anon key: RLS-protected
  tables will 401 or return empty sets. The run degrades visibly (check
  failures), never silently.

## Choosing the target (and testing responsibly)

`BASE_URL` is **required** — the scripts refuse to run without it, so a bare
`k6 run` can never hammer production by accident.

| Target | When |
|---|---|
| `http://localhost:3000` (`npm run dev`/`start` in `muscatbay/app`) | Script development; relative numbers only |
| **Vercel preview deployment** (best default) | Real Vercel+Supabase path without competing with operators — note previews share the production Supabase project, so data-tier load is still real |
| `https://muscatbay.work` (production) | Deliberate, announced capacity test in an agreed window |

Checklist before any run against shared infrastructure:

- [ ] You are authorized for this environment and teammates know the window.
- [ ] Off-peak for control-room usage; someone watches the Supabase dashboard
      (Database → Reports) and Vercel analytics during the run.
- [ ] Plan limits reviewed (Supabase egress/connection caps, Vercel
      bandwidth): a 5-minute 50-VU run of these journeys moves roughly
      2–4 GB, dominated by the 1,000-row REST pages.
- [ ] Traffic is identifiable: both tools send
      `User-Agent: MuscatBay-LoadTest/1.0 (...)` so it can be filtered in logs
      — and, if needed, blocked.
- [ ] 50 VUs is the agreed scope; do not scale past `PROFILE=stress` (100 VUs)
      without redoing this checklist.

## Running

```bash
cd load-testing
set -a; . ./.env; set +a
export AUTH_TOKEN="$(npm run -s token)"

npm run k6:smoke        # ALWAYS first: 2 VUs / 45 s — validates target, auth, checks
npm run k6:load         # the exercise: 50 VUs, 5 min (1 m ramp / 3.5 m hold / 30 s down)
npm run k6:stress       # optional headroom probe: steps 25 → 50 → 100 VUs

npm run artillery:smoke # second-tool confirmation
npm run artillery:load
```

Every k6 run prints the summary below **and** writes the full metrics JSON to
`results/k6-<profile>-<timestamp>.json`; Artillery's `--output` JSON lands
next to it. Keep them — the framework's value compounds when runs are compared
over time (see [Baselines](#establishing-the-framework-baselines--regression)).

**Validating the harness without touching anything real** (also handy in CI):

```bash
npm run mock                                    # terminal 1: localhost:9000
BASE_URL=http://localhost:9000 \
SUPABASE_URL=http://localhost:9000 SUPABASE_ANON_KEY=mock \
npm run k6:smoke                                # terminal 2
```

`MOCK_ERROR_RATE=0.05 npm run mock` makes the error-rate threshold fail on
purpose — useful for proving the gates actually gate.

## What the test simulates

Each virtual user loops a weighted journey — **page shell from Vercel, then the
exact PostgREST reads that page issues on mount** (tables, column lists,
ordering and 1,000-row paging mirrored from `muscatbay/app/functions/api/*`),
then 2–6 s think time:

| Journey | Weight | Page | REST reads (mirrors) |
|---|---|---|---|
| Dashboard | 35% | `/` | `water_meters`, `electricity_meters`, `electricity_readings` (page), `stp_operations` (1,500 newest) |
| Water | 30% | `/water` | `water_meters`; `water_monthly_consumption` exact-count HEAD + 2 parallel 1,000-row pages; `water_daily_consumption` wide `day_1..day_31` page; `water_loss_summary`; `water_loss_daily` |
| Electricity | 20% | `/electricity` | `electricity_meters`, `electricity_readings` ×2 pages |
| STP | 15% | `/stp` | `stp_operations` |

Every request is tagged `tier:page` (Vercel/Next) or `tier:api` (Supabase),
and each logical endpoint has its own latency Trend — this two-level split is
what makes the interpretation section below mechanical rather than guesswork.

> Keep it in sync: if a reader in `functions/api/` changes its columns or
> paging, update the mirrored query in `k6/loadtest.js` **and**
> `artillery/processor.cjs` in the same PR.

## Reading the metrics

k6 (custom end-of-run summary):

```
ALL requests            n=  9124  p50=   212ms  p95=   987ms  max=  3210ms
  tier: page …          n=  1520  p50=    95ms  p95=   310ms
  tier: api  …          n=  7604  p50=   240ms  p95=  1105ms
error rate: 0.13%  (12 failed / 9124 requests, threshold <1.0%)
per endpoint:
  api water_monthly_consumption (page)   n=912  p50=610ms  p95=1830ms ...
```

- **p50 (`med`)** — the typical operator's experience.
- **p95** — the slow tail; control-room tablets live here. The gap between
  p50 and p95 is itself a signal (see below).
- **error rate** — `http_req_failed` (any 4xx/5xx/network failure), gated by
  `MAX_ERROR_RATE` (default 1%).

Default gates — `p50 < 500 ms`, `p95 < 1500 ms`, `errors < 1%` — are starting
SLOs for a dashboard whose users sit ~150 ms RTT from the ap-northeast-1
Supabase region; tune per environment with `P50_MS` / `P95_MS` /
`MAX_ERROR_RATE` (k6) or the `ensure` block (Artillery). A failed gate makes
the process exit non-zero, so either tool can act as a CI performance gate.

## Interpreting results: API design vs database queries

Work down this ladder in order; each step either localizes the problem or
rules a layer out. (In this stack, "API design" means *the shape of the
PostgREST reads the pages make* — request fan-out, payload width, paging —
since there is no bespoke API server; "database" means the Postgres side —
query plans, indexes, RLS, connections.)

**Step 1 — split by tier.** Compare `tier:page` vs `tier:api` in the summary.

- Pages slow, API fine → front door: Vercel cold starts, middleware/proxy
  session refresh, CDN misses. The database is exonerated.
- API slow, pages fine (the common case here) → data layer; continue.
- Both slow together → look outside the app first: test-runner machine
  saturation (k6 CPU), local uplink, or regional RTT. Re-run from a second
  location before blaming the stack.

**Step 2 — split by endpoint.** The per-endpoint table names the offender.

- **One endpoint slow** → that query. Prime suspects by shape:
  `water_monthly_consumption` pages (range scan + double ORDER BY),
  `water_daily_consumption` (33-column wide rows), `stp_operations`
  (1,500-row ORDER BY date DESC — needs the date index),
  `electricity_readings` (unfiltered OFFSET paging — OFFSET cost grows with
  depth). → Go to Step 5 (database confirmation).
- **All API endpoints uniformly slow** → shared bottleneck, not any single
  query: connection pool exhaustion (Supavisor), Postgres CPU/IO saturation,
  or per-project rate limiting. The load-curve shape (Step 3) separates these.

**Step 3 — shape of the curve during ramp-up.** Watch p95 against the VU count
over the run's timeline (the results JSON keeps full distributions per run;
run `k6:stress` for an explicit 25→50→100 staircase).

| Signature | Meaning |
|---|---|
| Latency flat as VUs climb, throughput scales | Headroom at 50 users — record the baseline and stop |
| p95 grows *smoothly* with VUs, few errors | Queueing on a saturated resource (DB CPU, pool slots). Closed model self-throttles, so even a gentle slope means real users would feel it |
| Latency fine then a *knee* — p95 and errors jump together | A hard limit was hit: pool size, connection cap, rate limiter. Find the ceiling's owner, don't tune queries yet |
| Throughput plateaus while VUs keep climbing | The plateau *is* current capacity; note requests/s at the knee |
| p50 steady but p95 exploding | Contention affecting some requests only: lock waits, pool wait time, GC/cold starts — check `http_req_waiting` next |

**Step 4 — split each request's time.** k6's JSON breaks every request into
phases; the tour: `http_req_waiting` (TTFB — server compute + DB time) vs
`http_req_receiving` (payload transfer).

- **Waiting dominates** → server side: the query itself, RLS evaluation, pool
  wait. → Step 5.
- **Receiving dominates** → *API design, not the database*: the response is
  too big. In this app that means the 1,000-row pages and the wide
  `day_1..day_31` rows — fixes are narrower selects, server-side aggregation
  (a view or RPC that returns the rollup instead of raw rows), or smaller
  pages, not indexes.
- Also compare **requests per journey** (`http_reqs / iterations`, ~4–8
  here): a high count is the chatty-API signature. `/water` already issues a
  count probe + N parallel pages + a daily rollup — sequential-turned-parallel
  helped wall time, but each request still pays RLS + pool occupancy;
  collapsing them into one RPC/view is an API-design fix that no index can
  match.

**Step 5 — confirm on the database side.** (Supabase Dashboard, or the
Supabase MCP tools from a Claude session.)

1. **Query performance / `pg_stat_statements`** — sort by total + mean time
   during the run window; the slow endpoint's query should be right there.
   Match it by the column list in the mirrored select.
2. **`EXPLAIN (ANALYZE, BUFFERS)`** the offender with the same filters. Seq
   scans on `water_monthly_consumption(period)` / ORDER BY without a matching
   index (`account_number, period`) / `stp_operations(date DESC)` are cheap,
   high-yield index fixes.
3. **RLS cost** — if the plan shows the policy re-evaluating `auth.uid()` per
   row, wrap it as `(select auth.uid())` so it evaluates once; on 1,000-row
   pages this alone can be the whole regression. Supabase's performance
   advisors flag this pattern.
4. **Connections** — Reports → Database: if connections flatline at the pool
   cap while latency climbs, the fix is pooling configuration (or fewer
   requests per page — back to API design), not query tuning.
5. Re-run the *same profile* and compare against the saved baseline JSON —
   a fix isn't real until the p95 moves in a like-for-like run.

**Quick attribution table**

| Symptom | Likely origin | First diagnostic |
|---|---|---|
| One endpoint's p95 high, waiting-dominated | Database query | `EXPLAIN ANALYZE`, index on filter/sort columns |
| One endpoint's p95 high, receiving-dominated | API design (payload) | Narrow the select / aggregate server-side |
| All API endpoints degrade together past N VUs | Pool / DB saturation | Supabase connections + CPU during run |
| Sharp knee + 429/`XX000` errors | Rate/connection ceiling | Supabase logs; raise limit or shed requests |
| Pages slow, API fine | Vercel/Next layer | Vercel function logs, cold starts, proxy cost |
| p95 fine at 2 VUs (smoke), bad at 50 | Concurrency contention, not query speed | Steps 3–5; locks and pool waits |
| High journey request count amplifying everything | API design (chattiness) | Collapse reads into a view/RPC |

## Establishing the framework: baselines & regression

1. `npm run k6:smoke` against the chosen environment → sanity.
2. `npm run k6:load` twice, same window → confirm run-to-run variance is
   small (<10% on p95) before trusting any comparison.
3. Commit to memory (or the perf log): date, commit SHA, environment,
   requests/s, p50/p95 per tier, error rate. The JSON in `results/` is the
   durable record.
4. Re-run after every meaningful data-layer change (new module, reader
   rewrite, RLS change, Supabase tier change) and diff against baseline.
5. Thresholds are the contract: once a baseline is agreed, set `P50_MS` /
   `P95_MS` to it (+ margin) so drift fails loudly.

## Known limitations (deliberate scope)

- **Reads only.** Journeys mirror dashboards' read traffic; CSV-upload writes
  are out of scope (they're operator-rare and mutate production data).
- **No Realtime.** The app also holds Supabase Realtime WebSockets
  (`useSupabaseRealtime`); connection-count limits are not exercised here.
- **No service-worker cache.** The PWA serves repeat visits from cache; this
  test models the worst case (cold fetches), so real repeat-visit UX is
  *better* than these numbers.
- **Mirrored, not instrumented.** The REST queries are hand-mirrored from
  `functions/api/*` — keep them in sync when readers change.
