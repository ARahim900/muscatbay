/**
 * @fileoverview Supabase Client Configuration
 * Provides Supabase client initialization and configuration utilities
 * @module functions/supabase-client
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

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
        supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    }
    return supabaseClient;
}
