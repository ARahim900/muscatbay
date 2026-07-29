/**
 * @fileoverview Supabase Client Configuration
 * Provides Supabase client initialization and configuration utilities
 * @module functions/supabase-client
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

// =============================================================================
// CLIENT CONFIGURATION
// =============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * Validate that the anon key looks like a valid Supabase JWT (they start with "eyJ")
 */
export function isValidSupabaseKey(key: string): boolean {
    return key.length > 0 && key.startsWith('eyJ');
}

/**
 * Check if Supabase is properly configured
 */
export function isSupabaseConfigured(): boolean {
    const urlValid = supabaseUrl.length > 0 && supabaseUrl.startsWith('https://') && supabaseUrl.includes('.supabase.co');
    const keyValid = isValidSupabaseKey(supabaseAnonKey);
    return urlValid && keyValid;
}

// Lazy-initialized client to prevent build-time errors
let supabaseClient: SupabaseClient | null = null;

/**
 * Get the Supabase client instance
 * Returns null if Supabase is not configured
 */
export function getSupabaseClient(): SupabaseClient | null {
    if (!isSupabaseConfigured()) {
        // Supabase not configured - will use mock data fallback
        return null;
    }
    if (!supabaseClient) {
        supabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey, {
            // Global fetch options for better performance
            global: {
                fetch: (url, options = {}) => {
                    // Build a combined signal: respect Supabase's own internal signal
                    // AND add a 30-second hard timeout.
                    // We must NOT replace Supabase's signal — dropping it causes
                    // "signal is aborted without reason" AbortErrors when Supabase
                    // internally cancels auth requests (e.g. lock refresh conflicts).
                    //
                    // Both APIs are feature-detected. `AbortSignal.any` landed in
                    // Safari 17.4 (Mar 2024) and `AbortSignal.timeout` in Safari 16,
                    // so on an older iPhone the unguarded calls threw a TypeError
                    // inside EVERY Supabase request — auth included. The failure
                    // surfaced as modules that never render on one colleague's
                    // device while working everywhere else. Losing the timeout on
                    // an old browser is a far better outcome than losing the app.
                    const timeoutSignal =
                        typeof AbortSignal.timeout === "function"
                            ? AbortSignal.timeout(30_000)
                            : null;

                    let signal = options.signal ?? undefined;
                    if (timeoutSignal) {
                        if (!options.signal) {
                            signal = timeoutSignal;
                        } else if (typeof AbortSignal.any === "function") {
                            signal = AbortSignal.any([options.signal, timeoutSignal]);
                        }
                        // else: keep Supabase's own signal — combining is
                        // unsupported here, and its signal is the critical one.
                    }

                    return fetch(url, { ...options, signal });
                },
            },
            // Database configuration
            db: {
                schema: 'public',
            },
            // Realtime configuration (disabled if not needed for performance)
            realtime: {
                params: {
                    eventsPerSecond: 2,
                },
            },
        }) as SupabaseClient;
    }
    return supabaseClient;
}
