import { type SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '../supabase-client';
import type {
    FireSafetyEquipment,
    FirePpmActivity,
    FireIssue,
    FirePpmContact,
} from '@/entities/fire-safety';

/**
 * Data-access helpers for the BEC fire-safety AMC.
 * Each function selects explicit columns, handles errors, and returns an
 * empty array when Supabase is not configured so the page degrades cleanly.
 */

const EQUIPMENT_COLS =
    'id, name, location, status, priority, battery, signal, next_maintenance, inspector, type, zone';
const ACTIVITY_COLS =
    'id, ppm_period, start_date, end_date, activity_type, scope, bec_contact, bec_email, status, thread_ref, notes';
const ISSUE_COLS =
    'id, date_reported, issue_description, location, reported_by, quote_ref, status, resolution';
const CONTACT_COLS = 'id, name, role, email, phone, active_period';

export async function getFireEquipmentFromSupabase(
    clientOverride?: SupabaseClient,
): Promise<FireSafetyEquipment[]> {
    const client = clientOverride ?? getSupabaseClient();
    if (!client) return [];

    const { data, error } = await client
        .from('fire_safety_equipment')
        .select(EQUIPMENT_COLS)
        .order('zone', { ascending: true })
        .order('id', { ascending: true });

    if (error) throw new Error(`Supabase error (fire_safety_equipment): ${error.message}`);
    return (data as unknown as FireSafetyEquipment[]) ?? [];
}

export async function getFirePpmActivitiesFromSupabase(
    clientOverride?: SupabaseClient,
): Promise<FirePpmActivity[]> {
    const client = clientOverride ?? getSupabaseClient();
    if (!client) return [];

    const { data, error } = await client
        .from('fire_ppm_activities')
        .select(ACTIVITY_COLS)
        .order('start_date', { ascending: false, nullsFirst: false });

    if (error) throw new Error(`Supabase error (fire_ppm_activities): ${error.message}`);
    return (data as unknown as FirePpmActivity[]) ?? [];
}

export async function getFireIssuesFromSupabase(
    clientOverride?: SupabaseClient,
): Promise<FireIssue[]> {
    const client = clientOverride ?? getSupabaseClient();
    if (!client) return [];

    const { data, error } = await client
        .from('fire_issues_register')
        .select(ISSUE_COLS)
        .order('date_reported', { ascending: false, nullsFirst: false });

    if (error) throw new Error(`Supabase error (fire_issues_register): ${error.message}`);
    return (data as unknown as FireIssue[]) ?? [];
}

export async function getFirePpmContactsFromSupabase(
    clientOverride?: SupabaseClient,
): Promise<FirePpmContact[]> {
    const client = clientOverride ?? getSupabaseClient();
    if (!client) return [];

    const { data, error } = await client
        .from('fire_ppm_contacts')
        .select(CONTACT_COLS)
        .order('id', { ascending: true });

    if (error) throw new Error(`Supabase error (fire_ppm_contacts): ${error.message}`);
    return (data as unknown as FirePpmContact[]) ?? [];
}
