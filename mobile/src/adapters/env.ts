/**
 * Environment access for the mobile app.
 *
 * Expo inlines `process.env.EXPO_PUBLIC_*` at bundle time; anything else is
 * `undefined` on a device. `expo-constants` is checked as a fallback so the
 * values can also come from `app.config.ts` → `extra` (used by EAS builds
 * where `.env` is not present on the build machine).
 *
 * Nothing here has a default value. A missing key surfaces as an honest
 * "not configured" state — the app never falls back to sample data.
 */
import Constants from 'expo-constants';

interface ExtraConfig {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  eas?: { projectId?: string };
}

const extra = (Constants.expoConfig?.extra ?? {}) as ExtraConfig;

function read(inlined: string | undefined, fromExtra: string | undefined): string {
  const value = inlined ?? fromExtra ?? '';
  return value.trim();
}

export const SUPABASE_URL = read(process.env.EXPO_PUBLIC_SUPABASE_URL, extra.supabaseUrl);
export const SUPABASE_ANON_KEY = read(
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  extra.supabaseAnonKey,
);

/** EAS project id — required for Expo push tokens. Empty until `eas init` runs. */
export const EAS_PROJECT_ID = read(process.env.EAS_PROJECT_ID, extra.eas?.projectId);

/**
 * Mirrors the web app's `isSupabaseConfigured()` check in
 * `functions/supabase-client.ts` so both platforms reject the same bad values.
 */
export function isSupabaseConfigured(): boolean {
  const urlValid =
    SUPABASE_URL.length > 0 &&
    SUPABASE_URL.startsWith('https://') &&
    SUPABASE_URL.includes('.supabase.co');
  const keyValid = SUPABASE_ANON_KEY.length > 0 && SUPABASE_ANON_KEY.startsWith('eyJ');
  return urlValid && keyValid;
}

/** Human-readable reason configuration failed — shown on the sign-in screen. */
export function supabaseConfigError(): string | null {
  if (isSupabaseConfigured()) return null;
  if (!SUPABASE_URL) return 'EXPO_PUBLIC_SUPABASE_URL is not set. Copy mobile/.env.example to mobile/.env and restart Expo.';
  if (!SUPABASE_ANON_KEY) return 'EXPO_PUBLIC_SUPABASE_ANON_KEY is not set. Copy mobile/.env.example to mobile/.env and restart Expo.';
  return 'The Supabase URL or anon key in mobile/.env does not look valid.';
}

/** Origin of the web app, used by the embedded analytical views. */
export const WEB_APP_ORIGIN = (
  process.env.EXPO_PUBLIC_WEB_APP_ORIGIN ?? 'https://muscatbay.live'
).replace(/\/$/, '');
