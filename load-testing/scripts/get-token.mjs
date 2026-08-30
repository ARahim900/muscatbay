#!/usr/bin/env node
/**
 * Obtain a Supabase USER access token for the load-test's Bearer auth.
 *
 * Performs the same password grant the app's login form performs
 * (`POST {SUPABASE_URL}/auth/v1/token?grant_type=password`) for a dedicated
 * least-privilege load-test user, and prints ONLY the access token to stdout
 * so it can be captured without ever touching disk or shell history:
 *
 *   export AUTH_TOKEN="$(npm run -s token)"
 *
 * Inputs — environment only (a local ./.env is read as a fallback; that file
 * is gitignored and must never be committed):
 *   SUPABASE_URL        e.g. https://<project-ref>.supabase.co
 *   SUPABASE_ANON_KEY   the publishable anon key (NOT service_role — a load
 *                       test must run under row-level security like a real
 *                       user; service_role would both falsify the results and
 *                       expose an admin credential)
 *   LOADTEST_EMAIL      credentials of a dedicated test account — never a
 *   LOADTEST_PASSWORD   real operator's account
 *
 * Handling rules for the token this prints:
 *   - it is a real session JWT: treat it like a password while it lives
 *   - it expires (default ~1 hour) — re-run this right before long tests
 *   - never commit it, never echo it into logs/CI output, never pass it as a
 *     CLI argument (arguments are visible in `ps` and shell history)
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

// Minimal .env fallback (KEY=VALUE lines; real env always wins) so the helper
// works standalone without extra dependencies.
const envFile = resolve(process.cwd(), '.env');
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split('\n')) {
    const m = /^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (!m || line.trim().startsWith('#')) continue;
    const key = m[1];
    let value = m[2];
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

function need(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing ${name} — set it in the environment or load-testing/.env (see .env.example).`);
    process.exit(1);
  }
  return value;
}

const supabaseUrl = need('SUPABASE_URL').replace(/\/$/, '');
const anonKey = need('SUPABASE_ANON_KEY');
const email = need('LOADTEST_EMAIL');
const password = need('LOADTEST_PASSWORD');

if (!anonKey.startsWith('eyJ') && !anonKey.startsWith('sb_publishable_')) {
  console.error('SUPABASE_ANON_KEY does not look like an anon/publishable key. Never use service_role here.');
  process.exit(1);
}

const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', apikey: anonKey },
  body: JSON.stringify({ email, password }),
});

const body = await res.json().catch(() => ({}));
if (!res.ok || !body.access_token) {
  console.error(
    `Token request failed (HTTP ${res.status}): ${body.error_description || body.msg || body.error || 'no access_token in response'}`
  );
  process.exit(1);
}

// Diagnostics to stderr; the secret alone to stdout for $(...) capture.
const minutes = Math.round((body.expires_in || 3600) / 60);
console.error(`Signed in as ${email} — token expires in ~${minutes} min. Re-run before long test sessions.`);
process.stdout.write(`${body.access_token}\n`);
