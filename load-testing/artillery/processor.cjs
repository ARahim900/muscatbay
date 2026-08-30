/**
 * Artillery processor — builds the Supabase PostgREST request set and injects
 * authentication, exclusively from environment variables at runtime.
 *
 * Security contract (mirrors the k6 script):
 *  - No secret is ever written into loadtest.yml, this file, or the repo.
 *  - AUTH_TOKEN (a Supabase USER access token) and SESSION_COOKIE are read
 *    from the environment per run and only ever placed into request headers.
 *  - Secrets are never logged; the startup notice prints presence, not values.
 *  - The anon key is a publishable client key (it ships in the web bundle),
 *    but it is still kept in the untracked .env, never hardcoded.
 *  - NEVER use the service_role key here: it bypasses row-level security and
 *    a load test must run with the same privileges as a real user.
 *
 * The REST URLs mirror muscatbay/app/functions/api/*.ts (same tables, column
 * lists, ordering and paging) — update both together when a reader changes.
 */

'use strict';

const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const AUTH_TOKEN = process.env.AUTH_TOKEN || '';
const SESSION_COOKIE = process.env.SESSION_COOKIE || '';

const REST_ENABLED = SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;

// functions/api/water.ts
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

const rest = (table, query) => `${SUPABASE_URL}/rest/v1/${table}?${query}`;

let warned = false;

/** Scenario hook: seed every REST URL + auth header value into scenario vars.
 *  When Supabase env is absent the url vars stay unset and every REST step is
 *  skipped via its `ifTrue` guard (pages-only mode). */
function prepRest(context, events, done) {
  if (!REST_ENABLED) {
    if (!warned) {
      warned = true;
      console.error(
        '[processor] api tier OFF — set SUPABASE_URL + SUPABASE_ANON_KEY to simulate the data layer'
      );
    }
    return done();
  }
  if (!warned) {
    warned = true;
    console.error(
      `[processor] api tier ON (${SUPABASE_URL}) — auth: ${
        AUTH_TOKEN ? 'user token (Bearer)' : 'anon key only (RLS-protected tables may 401/return empty)'
      }`
    );
  }

  context.vars.restApikey = SUPABASE_ANON_KEY;
  context.vars.restAuthz = `Bearer ${AUTH_TOKEN || SUPABASE_ANON_KEY}`;

  context.vars.urlWaterMeters = rest('water_meters', WATER_METERS_SELECT);
  context.vars.urlWaterMonthlyP1 = rest('water_monthly_consumption', `${WATER_MONTHLY_SELECT}&limit=1000&offset=0`);
  context.vars.urlWaterMonthlyP2 = rest('water_monthly_consumption', `${WATER_MONTHLY_SELECT}&limit=1000&offset=1000`);
  context.vars.urlWaterDaily = rest(
    'water_daily_consumption',
    `select=account_number,month,${DAY_COLUMNS}&order=account_number.asc&limit=1000&offset=0`
  );
  context.vars.urlWaterLossSummary = rest(
    'water_loss_summary',
    'select=id,zone,l2_bulk_account,l3_meters_count,l2_total_m3,l3_total_m3,loss_m3,loss_percent,status,month,year,generated_at&order=zone.asc'
  );
  context.vars.urlWaterLossDaily = rest(
    'water_loss_daily',
    'select=id,zone,day,date,l2_total_m3,l3_total_m3,loss_m3,loss_percent,month,year&order=date.asc'
  );
  context.vars.urlElecMeters = rest('electricity_meters', ELEC_METERS_SELECT);
  context.vars.urlElecReadingsP1 = rest('electricity_readings', `${ELEC_READINGS_SELECT}&limit=1000&offset=0`);
  context.vars.urlElecReadingsP2 = rest('electricity_readings', `${ELEC_READINGS_SELECT}&limit=1000&offset=1000`);
  context.vars.urlStpOperations = rest('stp_operations', STP_OPERATIONS_SELECT);

  return done();
}

/** Request hook for page-tier requests: attach the browser session cookie
 *  (Supabase SSR `sb-<ref>-auth-token*` chunks) when one is provided. */
function setPageAuth(requestParams, context, ee, next) {
  if (SESSION_COOKIE) {
    requestParams.headers = Object.assign({}, requestParams.headers, { cookie: SESSION_COOKIE });
  }
  return next();
}

module.exports = { prepRest, setPageAuth };
