/**
 * React Native Supabase client — the ONE adapter the shared data layer needs.
 *
 * `muscatbay/app/functions/api/*.ts` are consumed by this app verbatim. They
 * all import `getSupabaseClient` from `functions/supabase-client.ts`, which
 * builds a `@supabase/ssr` browser client backed by `document.cookie` and
 * `process.env.NEXT_PUBLIC_*` — neither of which exists on a phone.
 *
 * `metro.config.js` therefore resolves that one module to THIS file for every
 * import that originates inside the web app. The exported surface is identical
 * (`getSupabaseClient`, `isSupabaseConfigured`, `isValidSupabaseKey`), so the
 * web modules type-check against the real file and run against this one — and
 * not a single line of the API layer had to be forked.
 *
 * Session handling follows the official Supabase React Native guidance:
 * AsyncStorage persistence, auto refresh driven by an AppState listener
 * (installed in src/app/_layout.tsx), and `detectSessionInUrl: false` because
 * there is no browser URL to parse.
 */
import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from '~/adapters/env';

/** Matches the web helper of the same name. */
export function isValidSupabaseKey(key: string): boolean {
  return key.length > 0 && key.startsWith('eyJ');
}

export { isSupabaseConfigured };

let client: SupabaseClient | null = null;

/**
 * Returns the shared client, or `null` when the app is not configured.
 *
 * Returning `null` (rather than throwing) is deliberate: it is exactly what the
 * web module does, so every shared API function's existing `if (!client)` guard
 * keeps working and surfaces an honest empty/error state instead of sample data.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;

  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        // No browser URL on a device — parsing one would hang sign-in.
        detectSessionInUrl: false,
        flowType: 'pkce',
      },
      db: { schema: 'public' },
      global: { fetch: fetchWithTimeout },
      realtime: { params: { eventsPerSecond: 2 } },
    });
  }

  return client;
}
