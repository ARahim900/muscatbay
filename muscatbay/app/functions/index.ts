/**
 * @fileoverview Functions Index — the single entry point to the read layer.
 *
 * Re-exports the Supabase browser client plus every per-module reader in
 * `functions/api/*`. Everything here is isomorphic (no `next/*`, no DOM
 * globals) because `mobile/` consumes these same files through Metro.
 *
 * Layering: entities/ (types) → functions/ (isomorphic readers)
 *           → actions/ (`'use server'` writers — a SEPARATE barrel, never
 *             merged into this one).
 *
 * @module functions
 */

// Supabase client configuration
export * from './supabase-client';

// API functions
export * from './api';
