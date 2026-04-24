/**
 * @fileoverview Water Meters DB — Supabase queries for the 3D network map
 * @module lib/water-meters-db
 *
 * Uses the existing `getSupabaseClient()` helper from `@/functions/supabase-client`.
 * All functions fail gracefully (return empty array / false) when Supabase is not
 * configured, so the map can still be browsed in a read-only local mode.
 */

import { getSupabaseClient } from '@/functions/supabase-client';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type WaterMeterType = 'l1' | 'l2' | 'dc' | 'l3' | 'l4' | 'irr';
export type WaterMeterStatus = 'working' | 'faulty';

/** A single meter row as it lives in the `water_network_meters` table. */
export interface WaterMeterRow {
    id:           string;
    parent_id:    string | null;
    zone:         string;
    type:         WaterMeterType;
    status:       WaterMeterStatus;
    consumption:  number;
    lat:          number;
    lon:          number;
    height:       number | null;
    created_at?:  string;
    updated_at?:  string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Queries
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch every meter from the network. Returns [] if Supabase is not configured
 * or on any error (logged to the console).
 */
export async function fetchAllWaterMeters(): Promise<WaterMeterRow[]> {
    const supabase = getSupabaseClient();
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('water_network_meters')
        .select('id, parent_id, zone, type, status, consumption, lat, lon, height, updated_at');

    if (error) {
        console.error('[water-meters-db] fetchAllWaterMeters error:', error);
        return [];
    }
    return (data ?? []) as WaterMeterRow[];
}

/**
 * Insert or update a meter. Uses upsert so the same call works for both
 * new meters and edits.
 */
export async function upsertWaterMeter(meter: WaterMeterRow): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    const { error } = await supabase.from('water_network_meters').upsert({
        id:          meter.id,
        parent_id:   meter.parent_id,
        zone:        meter.zone,
        type:        meter.type,
        status:      meter.status,
        consumption: meter.consumption ?? 0,
        lat:         meter.lat,
        lon:         meter.lon,
        height:      meter.height ?? null,
    });

    if (error) {
        console.error('[water-meters-db] upsertWaterMeter error:', error);
        return false;
    }
    return true;
}

/** Delete a single meter by id. Cascades to `meter_readings` via FK. */
export async function deleteWaterMeter(id: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    const { error } = await supabase.from('water_network_meters').delete().eq('id', id);
    if (error) {
        console.error('[water-meters-db] deleteWaterMeter error:', error);
        return false;
    }
    return true;
}

/**
 * Update only the status of a meter (working ↔ faulty). Cheaper than a full
 * upsert when all we're doing is flagging a fault.
 */
export async function setMeterStatus(id: string, status: WaterMeterStatus): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    const { error } = await supabase.from('water_network_meters').update({ status }).eq('id', id);
    if (error) {
        console.error('[water-meters-db] setMeterStatus error:', error);
        return false;
    }
    return true;
}
