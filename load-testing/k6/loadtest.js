/**
 * Muscat Bay — k6 load test
 *
 * Simulates realistic operator traffic against the deployed app:
 *   tier "page" — Next.js page shells served by Vercel
 *   tier "api"  — the exact Supabase PostgREST reads each page issues on mount,
 *                 mirrored from `muscatbay/app/functions/api/*` (same tables,
 *                 same column lists, same ordering/paging)
 *
 * The two tiers are tagged and thresholded separately so a slow run can be
 * attributed to the front door (Vercel/Next) or the data layer (Supabase)
 * straight from the summary — see load-testing/README.md §"Interpreting
 * results".
 *
 * ── Configuration (all via environment / -e flags; no secrets in this file) ──
 *   BASE_URL          REQUIRED. App origin under test, e.g. a Vercel preview
 *                     URL or http://localhost:3000. There is deliberately no
 *                     default: a bare `k6 run` must never hammer production
 *                     by accident.
 *   SUPABASE_URL      Optional. Supabase project URL. Together with
 *   SUPABASE_ANON_KEY   enables the "api" tier. Omit both to test pages only.
 *   AUTH_TOKEN        Optional. A Supabase USER access token (JWT) sent as
 *                     `Authorization: Bearer …` on every REST request, so
 *                     queries run under RLS as a real signed-in user.
 *                     Obtain one with `npm run -s token` (scripts/get-token.mjs).
 *                     Falls back to the anon key when unset (RLS-protected
 *                     tables will then 401 or return empty sets).
 *   SESSION_COOKIE    Optional. Raw Cookie header value attached to page
 *                     requests (the `sb-<ref>-auth-token*` chunks from a
 *                     signed-in browser session) so the proxy-side session
 *                     refresh path is exercised too.
 *   PROFILE           smoke | load (default) | stress
 *   P50_MS            p50 threshold, ms (default 500)
 *   P95_MS            p95 threshold, ms (default 1500)
 *   MAX_ERROR_RATE    error-rate threshold, 0–1 (default 0.01 = 1%)
 *   THINK_MIN_S / THINK_MAX_S   per-iteration think time (default 2–6 s)
 *
 * ── Run (from load-testing/) ──
 *   set -a; . ./.env; set +a          # export the env file, never committed
 *   npm run k6:smoke                  # 2 VUs / ~45 s sanity pass first
 *   npm run k6:load                   # 50 VUs / 5 min (1 min ramp-up)
 *
 * Secrets hygiene: AUTH_TOKEN / SESSION_COOKIE reach this script only through
 * the environment; they are never logged (setup() prints lengths, not values)
 * and never written into the results JSON by k6.
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';

// ─────────────────────────────────────────────────────────────── configuration

const BASE_URL = (__ENV.BASE_URL || '').replace(/\/$/, '');
if (!BASE_URL) {
  throw new Error(
    'BASE_URL is required (refusing to guess a target). ' +
      'Example: k6 run -e BASE_URL=https://<preview>.vercel.app k6/loadtest.js'
  );
}

const SUPABASE_URL = (__ENV.SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY || '';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || '';
const SESSION_COOKIE = __ENV.SESSION_COOKIE || '';

// The api tier only runs when the Supabase project details are provided.
const REST_ENABLED = SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;

const PROFILE = __ENV.PROFILE || 'load';
const P50_MS = Number(__ENV.P50_MS || 500);
const P95_MS = Number(__ENV.P95_MS || 1500);
const MAX_ERROR_RATE = Number(__ENV.MAX_ERROR_RATE || 0.01);
const THINK_MIN_S = Number(__ENV.THINK_MIN_S || 2);
const THINK_MAX_S = Number(__ENV.THINK_MAX_S || 6);

// Closed-model profiles: a fixed pool of virtual users, each looping
// journey → think → journey, which is how "50 concurrent users" is defined.
const PROFILES = {
  // Harness sanity check — always run this first against a new target.
  smoke: [
    { duration: '10s', target: 2 },
    { duration: '30s', target: 2 },
    { duration: '5s', target: 0 },
  ],
  // The required exercise: ramp to 50 concurrent users over 1 minute,
  // sustain for 3.5 minutes, ramp down — 5 minutes end to end.
  load: [
    { duration: '1m', target: 50 },
    { duration: '3m30s', target: 50 },
    { duration: '30s', target: 0 },
  ],
  // Headroom probe: past the 50-VU requirement up to 100 VUs, to see WHERE
  // the latency/error curve bends (see README on reading the knee).
  stress: [
    { duration: '1m', target: 25 },
    { duration: '1m', target: 50 },
    { duration: '1m', target: 50 },
    { duration: '1m', target: 100 },
    { duration: '1m', target: 0 },
  ],
};
if (!PROFILES[PROFILE]) {
  throw new Error(`Unknown PROFILE "${PROFILE}" — valid: ${Object.keys(PROFILES).join(', ')}`);
}

export const options = {
  scenarios: {
    operators: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: PROFILES[PROFILE],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    // Overall SLOs — med is p50 in k6's threshold vocabulary.
    http_req_failed: [`rate<${MAX_ERROR_RATE}`],
    http_req_duration: [`med<${P50_MS}`, `p(95)<${P95_MS}`],
    // Per-tier SLOs: declaring these also makes the tier sub-metrics appear
    // in the end-of-test summary, which is what the triage in the README
    // reads first.
    'http_req_duration{tier:page}': [`med<${P50_MS}`, `p(95)<${P95_MS}`],
    'http_req_duration{tier:api}': [`med<${P50_MS}`, `p(95)<${P95_MS}`],
  },
  // med = p50; p(95) is the other headline number required by the exercise.
  summaryTrendStats: ['avg', 'min', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
  // Bodies are read (so timings and data_received stay accurate) but not
  // retained — no check needs response content, and this keeps 50 VUs cheap.
  discardResponseBodies: true,
  userAgent: 'MuscatBay-LoadTest/1.0 (k6; load-testing/k6/loadtest.js)',
};

// ─────────────────────────────────────────────── per-endpoint latency trends
// One Trend per logical endpoint so the summary shows WHICH request is slow,
// not just that something is. Metric names must be [a-zA-Z0-9_].

const ENDPOINTS = [
  ['ep_page_dashboard', 'page  GET /'],
  ['ep_page_water', 'page  GET /water'],
  ['ep_page_electricity', 'page  GET /electricity'],
  ['ep_page_stp', 'page  GET /stp'],
  ['ep_rest_water_meters', 'api   water_meters'],
  ['ep_rest_water_monthly_count', 'api   water_monthly_consumption (count)'],
  ['ep_rest_water_monthly', 'api   water_monthly_consumption (page)'],
  ['ep_rest_water_daily', 'api   water_daily_consumption (wide page)'],
  ['ep_rest_water_loss_summary', 'api   water_loss_summary'],
  ['ep_rest_water_loss_daily', 'api   water_loss_daily'],
  ['ep_rest_elec_meters', 'api   electricity_meters'],
  ['ep_rest_elec_readings', 'api   electricity_readings (page)'],
  ['ep_rest_stp_operations', 'api   stp_operations'],
];
const trends = {};
const endpointLabels = {};
for (const [name, label] of ENDPOINTS) {
  trends[name] = new Trend(name, true);
  endpointLabels[name] = label;
}

// ───────────────────────────────────────────────────────────── request helpers

const pageHeaders = {
  Accept: 'text/html,application/xhtml+xml',
};
if (SESSION_COOKIE) {
  // Cookie auth for the page tier: the Supabase SSR session cookie(s), exactly
  // as a signed-in browser would send them. Kept out of source and logs.
  pageHeaders.Cookie = SESSION_COOKIE;
}

// Bearer auth for the api tier: PostgREST expects the project anon key in
// `apikey` plus a JWT in `Authorization`. With AUTH_TOKEN set the JWT is a
// real user session token, so row-level security evaluates as that user.
const restHeaders = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${AUTH_TOKEN || SUPABASE_ANON_KEY}`,
  Accept: 'application/json',
};

function pageReq(path, trendName) {
  return {
    method: 'GET',
    url: `${BASE_URL}${path}`,
    trend: trendName,
    params: {
      headers: pageHeaders,
      tags: { tier: 'page', name: `page ${path}` },
    },
  };
}

function restReq(table, query, trendName, extra) {
  const headers = Object.assign({}, restHeaders, (extra && extra.headers) || {});
  return {
    method: (extra && extra.method) || 'GET',
    url: `${SUPABASE_URL}/rest/v1/${table}?${query}`,
    trend: trendName,
    params: {
      headers,
      tags: { tier: 'api', name: `rest ${table}${(extra && extra.nameSuffix) || ''}` },
    },
  };
}

/** Fire a set of requests in parallel (as the browser does on mount) and
 *  record per-endpoint latency + status checks. */
function runBatch(reqs) {
  if (reqs.length === 0) return;
  const responses = http.batch(reqs.map((r) => [r.method, r.url, null, r.params]));
  for (let i = 0; i < responses.length; i++) {
    const res = responses[i];
    const req = reqs[i];
    trends[req.trend].add(res.timings.duration);
    if (req.params.tags.tier === 'page') {
      check(res, { 'page status is 200': (r) => r.status === 200 });
    } else {
      // PostgREST answers 200, or 206 Partial Content for ranged reads.
      check(res, { 'api status is 200/206': (r) => r.status === 200 || r.status === 206 });
    }
  }
}

// ───────────────────────────────────────────────────────────────── journeys
// Each journey = one page shell + the REST reads that page performs on mount,
// mirrored from functions/api/*.ts (table, columns, order, paging — kept in
// sync by hand; update here when a reader changes).

// functions/api/water.ts fetchWaterMeters()
const WATER_METERS_SELECT =
  'select=meter_id,account_number,meter_name,meter_name_original,level:label,zone,parent_meter,type,sort_order';
const WATER_MONTHLY_SELECT =
  'select=account_number,period,consumption&period=gte.2024-01&order=account_number.asc,period.asc';
const DAY_COLUMNS = Array.from({ length: 31 }, (_, i) => `day_${i + 1}`).join(',');
// functions/api/electricity.ts
const ELEC_METERS_SELECT = 'select=id,name,account_number,meter_type&order=name.asc';
const ELEC_READINGS_SELECT = 'select=id,meter_id,month,consumption';
// functions/api/stp.ts
const STP_OPERATIONS_SELECT =
  'select=id,date,inlet_sewage,tse_for_irrigation,tanker_trips,generated_income,water_savings,' +
  'total_impact,monthly_volume_input,monthly_volume_output,monthly_income,monthly_savings,original_id' +
  '&order=date.desc&limit=1500';

function journeyDashboard() {
  runBatch([pageReq('/', 'ep_page_dashboard')]);
  if (!REST_ENABLED) return;
  // The command deck aggregates the module tables client-side on mount.
  runBatch([
    restReq('water_meters', WATER_METERS_SELECT, 'ep_rest_water_meters'),
    restReq('electricity_meters', ELEC_METERS_SELECT, 'ep_rest_elec_meters'),
    restReq('electricity_readings', `${ELEC_READINGS_SELECT}&limit=1000&offset=0`, 'ep_rest_elec_readings'),
    restReq('stp_operations', STP_OPERATIONS_SELECT, 'ep_rest_stp_operations'),
  ]);
}

function journeyWater() {
  runBatch([pageReq('/water', 'ep_page_water')]);
  if (!REST_ENABLED) return;
  runBatch([
    restReq('water_meters', WATER_METERS_SELECT, 'ep_rest_water_meters'),
    // Exact-count HEAD probe the reader issues before parallel paging.
    restReq('water_monthly_consumption', 'select=account_number&period=gte.2024-01', 'ep_rest_water_monthly_count', {
      method: 'HEAD',
      headers: { Prefer: 'count=exact' },
      nameSuffix: ' count',
    }),
    // Two of the parallel 1,000-row pages (the table is ~10k rows in prod).
    restReq('water_monthly_consumption', `${WATER_MONTHLY_SELECT}&limit=1000&offset=0`, 'ep_rest_water_monthly'),
    restReq('water_monthly_consumption', `${WATER_MONTHLY_SELECT}&limit=1000&offset=1000`, 'ep_rest_water_monthly'),
    // Month-to-date rollup reads the wide day_1..day_31 rows (page 1; the real
    // reader adds a dynamic not-in month filter — superset read here).
    restReq(
      'water_daily_consumption',
      `select=account_number,month,${DAY_COLUMNS}&order=account_number.asc&limit=1000&offset=0`,
      'ep_rest_water_daily'
    ),
    restReq(
      'water_loss_summary',
      'select=id,zone,l2_bulk_account,l3_meters_count,l2_total_m3,l3_total_m3,loss_m3,loss_percent,status,month,year,generated_at&order=zone.asc',
      'ep_rest_water_loss_summary'
    ),
    restReq(
      'water_loss_daily',
      'select=id,zone,day,date,l2_total_m3,l3_total_m3,loss_m3,loss_percent,month,year&order=date.asc',
      'ep_rest_water_loss_daily'
    ),
  ]);
}

function journeyElectricity() {
  runBatch([pageReq('/electricity', 'ep_page_electricity')]);
  if (!REST_ENABLED) return;
  runBatch([
    restReq('electricity_meters', ELEC_METERS_SELECT, 'ep_rest_elec_meters'),
    restReq('electricity_readings', `${ELEC_READINGS_SELECT}&limit=1000&offset=0`, 'ep_rest_elec_readings'),
    restReq('electricity_readings', `${ELEC_READINGS_SELECT}&limit=1000&offset=1000`, 'ep_rest_elec_readings'),
  ]);
}

function journeyStp() {
  runBatch([pageReq('/stp', 'ep_page_stp')]);
  if (!REST_ENABLED) return;
  runBatch([restReq('stp_operations', STP_OPERATIONS_SELECT, 'ep_rest_stp_operations')]);
}

// Traffic mix, weighted by how operators actually use the app (dashboard is
// the landing page; water is the heaviest module).
const JOURNEYS = [
  { weight: 35, run: journeyDashboard },
  { weight: 30, run: journeyWater },
  { weight: 20, run: journeyElectricity },
  { weight: 15, run: journeyStp },
];
const TOTAL_WEIGHT = JOURNEYS.reduce((sum, j) => sum + j.weight, 0);

function pickJourney() {
  let roll = Math.random() * TOTAL_WEIGHT;
  for (const j of JOURNEYS) {
    roll -= j.weight;
    if (roll < 0) return j;
  }
  return JOURNEYS[0];
}

// ──────────────────────────────────────────────────────────────── lifecycle

export function setup() {
  // Fail fast on an unreachable target instead of producing 5 minutes of
  // connection errors. Never prints secret values — lengths only.
  console.log(`target: ${BASE_URL}  profile: ${PROFILE}`);
  console.log(
    REST_ENABLED
      ? `api tier: ON (${SUPABASE_URL}) — auth: ${AUTH_TOKEN ? `user token (${AUTH_TOKEN.length} chars)` : 'anon key only (RLS-protected tables may 401/return empty)'}`
      : 'api tier: OFF — set SUPABASE_URL + SUPABASE_ANON_KEY to simulate the data layer'
  );
  if (SESSION_COOKIE) console.log(`page tier: sending session cookie (${SESSION_COOKIE.length} chars)`);
  const ping = http.get(BASE_URL, { headers: pageHeaders, tags: { tier: 'setup', name: 'setup ping' } });
  if (ping.status === 0) {
    throw new Error(`Cannot reach ${BASE_URL} (${ping.error || 'connection failed'}) — aborting.`);
  }
  console.log(`setup ping: HTTP ${ping.status} in ${Math.round(ping.timings.duration)}ms`);
}

export default function () {
  pickJourney().run();
  sleep(THINK_MIN_S + Math.random() * Math.max(0, THINK_MAX_S - THINK_MIN_S));
}

// ─────────────────────────────────────────────────────────────────── summary
// Custom end-of-test report: overall + per-tier + per-endpoint p50/p95, and
// the full metrics JSON under results/ for regression comparison across runs.

function fmt(n) {
  return n === undefined || n === null || Number.isNaN(n) ? '     —' : String(Math.round(n)).padStart(6);
}

function trendLine(label, m) {
  if (!m || !m.values || !(m.values.count > 0 || m.values.med !== undefined)) return null;
  const v = m.values;
  return `${label.padEnd(40)} n=${String(v.count ?? '—').padStart(6)}  p50=${fmt(v.med)}ms  p95=${fmt(v['p(95)'])}ms  max=${fmt(v.max)}ms`;
}

export function handleSummary(data) {
  const lines = [];
  lines.push('');
  lines.push('════════ Muscat Bay load test — summary ════════');
  lines.push(`profile: ${PROFILE}   target: ${BASE_URL}   api tier: ${REST_ENABLED ? 'on' : 'off'}`);
  lines.push('');

  const overall = data.metrics.http_req_duration;
  const failed = data.metrics.http_req_failed;
  const reqs = data.metrics.http_reqs;
  const iters = data.metrics.iterations;
  if (overall) lines.push(trendLine('ALL requests', overall));
  const pageTier = data.metrics['http_req_duration{tier:page}'];
  const apiTier = data.metrics['http_req_duration{tier:api}'];
  if (pageTier) lines.push(trendLine('  tier: page (Vercel / Next.js)', pageTier));
  if (apiTier) lines.push(trendLine('  tier: api  (Supabase PostgREST)', apiTier));
  lines.push('');
  if (failed) {
    const rate = failed.values.rate ?? 0;
    lines.push(
      `error rate: ${(rate * 100).toFixed(2)}%  (${failed.values.passes ?? 0} failed / ${
        (failed.values.passes ?? 0) + (failed.values.fails ?? 0)
      } requests, threshold <${(MAX_ERROR_RATE * 100).toFixed(1)}%)`
    );
  }
  if (reqs && iters) {
    lines.push(`throughput: ${reqs.values.count} requests (${(reqs.values.rate ?? 0).toFixed(1)}/s), ${iters.values.count} user journeys`);
  }
  lines.push('');
  lines.push('per endpoint:');
  for (const [name] of ENDPOINTS) {
    const line = trendLine(`  ${endpointLabels[name]}`, data.metrics[name]);
    if (line) lines.push(line);
  }
  lines.push('');

  // Threshold verdicts.
  let failedThresholds = 0;
  for (const [metricName, metric] of Object.entries(data.metrics)) {
    if (!metric.thresholds) continue;
    for (const [expr, result] of Object.entries(metric.thresholds)) {
      if (!result.ok) {
        failedThresholds++;
        lines.push(`✗ THRESHOLD FAILED  ${metricName}: ${expr}`);
      }
    }
  }
  lines.push(failedThresholds === 0 ? '✓ all thresholds passed' : `${failedThresholds} threshold(s) failed — see README "Interpreting results"`);
  lines.push('');

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return {
    stdout: lines.join('\n') + '\n',
    [`results/k6-${PROFILE}-${stamp}.json`]: JSON.stringify(data, null, 2),
  };
}
