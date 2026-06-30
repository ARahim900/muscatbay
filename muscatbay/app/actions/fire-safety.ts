'use server'

import {
    getFireEquipmentFromSupabase,
    getFirePpmActivitiesFromSupabase,
    getFireIssuesFromSupabase,
    getFirePpmContactsFromSupabase,
} from '@/functions/api/fire-safety';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import type {
    FireSafetyEquipment,
    FirePpmActivity,
    FireIssue,
    FirePpmContact,
} from '@/entities/fire-safety';

export interface FireSafetyData {
    equipment: FireSafetyEquipment[];
    activities: FirePpmActivity[];
    issues: FireIssue[];
    contacts: FirePpmContact[];
    error?: string;
}

/**
 * Server Action — fetches all live fire-safety data in one round-trip.
 * Runs on the server so it works under RLS with the user's session and
 * avoids browser CORS/adblock issues.
 */
export async function fetchFireSafetyDataAction(): Promise<FireSafetyData> {
    try {
        const supabase = await getSupabaseServerClient();
        const [equipment, activities, issues, contacts] = await Promise.all([
            getFireEquipmentFromSupabase(supabase),
            getFirePpmActivitiesFromSupabase(supabase),
            getFireIssuesFromSupabase(supabase),
            getFirePpmContactsFromSupabase(supabase),
        ]);
        return { equipment, activities, issues, contacts };
    } catch (err) {
        console.error('Fire Safety Action Error:', err);
        return {
            equipment: [],
            activities: [],
            issues: [],
            contacts: [],
            error: err instanceof Error ? err.message : 'Server-side fire-safety fetch failed',
        };
    }
}
