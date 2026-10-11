/**
 * @fileoverview STP electricity reader — `stp_electricity_monthly`.
 * @module functions/api/stp-electricity
 */

import { getSupabaseClient } from '../supabase-client';
import type { StpElectricityMonth, SupabaseStpElectricityMonth } from '@/entities/stp-electricity';

const COLUMNS =
    'report_month, period_start, period_end, owatco_kwh, owatco_status, owatco_note, nama_kwh, billed_omr, billed_status, billed_note';

/** numeric columns arrive as strings from PostgREST; null stays null. */
function toNumber(value: number | string | null): number | null {
    if (value === null || value === '') return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
}

export function transformStpElectricityMonth(row: SupabaseStpElectricityMonth): StpElectricityMonth {
    return {
        reportMonth: row.report_month,
        periodStart: row.period_start,
        periodEnd: row.period_end,
        owatcoKwh: toNumber(row.owatco_kwh),
        owatcoStatus: row.owatco_status,
        owatcoNote: row.owatco_note,
        namaKwh: toNumber(row.nama_kwh),
        billedOmr: toNumber(row.billed_omr),
        billedStatus: row.billed_status,
        billedNote: row.billed_note,
    };
}

/**
 * Every recorded month, oldest first. Returns [] only when Supabase is not
 * configured; a failed read THROWS so the panel shows an error, never an
 * empty chart that reads as "no consumption".
 */
export async function getStpElectricityMonths(): Promise<StpElectricityMonth[]> {
    const client = getSupabaseClient();
    if (!client) return [];

    const { data, error } = await client
        .from('stp_electricity_monthly')
        .select(COLUMNS)
        .order('report_month', { ascending: true });

    if (error) throw new Error(`Unable to load STP electricity: ${error.message}`);
    return (data ?? []).map((row) => transformStpElectricityMonth(row as SupabaseStpElectricityMonth));
}
