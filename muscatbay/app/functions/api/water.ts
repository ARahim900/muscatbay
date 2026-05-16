/**
 * @fileoverview Water API Functions
 * Data fetching functions for water meters from Supabase
 * @module functions/api/water
 */

import { getSupabaseClient } from '../supabase-client';
import {
    SupabaseDailyWaterConsumption,
    transformDailyWaterConsumption,
    DailyWaterConsumption,
    SupabaseWaterLossSummary,
    transformWaterLossSummary,
    WaterLossSummary,
    SupabaseWaterLossDaily,
    transformWaterLossDaily,
    WaterLossDaily,
    DAILY_WATER_CONSUMPTION_SELECT_COLUMNS
} from '@/entities/water';
import type { WaterMeter } from '@/lib/water-data';

// Earliest period in the seeded dataset. Acts as a floor so old backfills
// can't accidentally inflate the response. The ceiling is derived from the
// current month so accidental future-dated rows can't leak through.
const PERIOD_FLOOR = '2024-01';

// Supabase / PostgREST caps every response at 1000 rows regardless of the
// `range()` value the client passes, so we page through `consumption` rows
// in fixed-size windows until a short page signals the end.
const CONSUMPTION_PAGE_SIZE = 1000;

function currentPeriod(): string {
    const now = new Date();
    return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

// Mirror the legacy-name translations baked into the "Water System" SQL view
// so downstream code (lib/water-data.ts, water-database-table, etc.) keeps
// seeing the same strings it does today. Drop these once that code migrates
// to the clean codes from water_meters.
const ZONE_TO_LEGACY: Record<string, string> = {
    Zone_FM: 'Zone_01_(FM)',
    Zone_03A: 'Zone_03_(A)',
    Zone_03B: 'Zone_03_(B)',
    Direct_Connection: 'Direct Connection',
    Main_Bulk: 'Main Bulk',
};
const PARENT_TO_LEGACY: Record<string, string> = {
    'Zone 3A (Bulk)': 'ZONE 3A (BULK ZONE 3A)',
    'Zone 3B (Bulk)': 'ZONE 3B (BULK ZONE 3B)',
    'Zone 5 (Bulk)': 'ZONE 5 (Bulk Zone 5)',
    'Zone 8 (Bulk)': 'BULK ZONE 8',
    'Zone FM (Bulk)': 'ZONE FM ( BULK ZONE FM )',
    'Village Square (Bulk)': 'Village Square (Zone Bulk)',
};
const TYPE_TO_LEGACY: Record<string, string> = {
    'Building (Bulk)': 'D_Building_Bulk',
    'Building (Common)': 'D_Building_Common',
    'Irrigation (Services)': 'IRR_Servies',
    'Common Area (MB)': 'MB_Common',
    'Main Bulk': 'Main BULK',
    'Residential (Apartment)': 'Residential (Apart)',
};

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const PERIOD_REGEX = /^(\d{4})-(0[1-9]|1[0-2])$/;

function periodToConsumptionKey(period: string): string | null {
    const match = PERIOD_REGEX.exec(period);
    if (!match) return null;
    const monthIdx = Number(match[2]) - 1;
    return `${MONTH_ABBR[monthIdx]}-${match[1].slice(2)}`;
}

const METER_LEVELS = new Set<WaterMeter['level']>(['L1', 'L2', 'L3', 'L4', 'DC', 'N/A']);

interface WaterMeterRow {
    meter_id: string;
    account_number: string;
    meter_name: string;
    meter_name_original: string | null;
    level: string;
    zone: string;
    parent_meter: string | null;
    type: string;
    sort_order: number | null;
}

interface MonthlyConsumptionRow {
    account_number: string;
    period: string;
    consumption: number | string | null;
}

/**
 * Fetch water meters from Supabase.
 *
 * Reads the long-format `water_monthly_consumption` + `water_meters` tables
 * directly (not the legacy `"Water System"` wide view) so the response
 * payload is bounded by an explicit column list per row. New months appear
 * as new rows, not new columns, so dynamic months are still supported
 * automatically without any schema-shaped payload growth per row.
 */
export async function getWaterMetersFromSupabase(): Promise<WaterMeter[]> {
    const client = getSupabaseClient();
    if (!client) {
        return [];
    }

    try {
        const metersResult = await client
            .from('water_meters')
            .select(
                'meter_id, account_number, meter_name, meter_name_original, level:label, zone, parent_meter, type, sort_order'
            )
            .returns<WaterMeterRow[]>();

        if (metersResult.error) {
            console.error('Error fetching water meters:', metersResult.error.message);
            return [];
        }

        const meters = metersResult.data ?? [];
        if (meters.length === 0) {
            return [];
        }

        const periodCeiling = currentPeriod();
        const consumptionRows: MonthlyConsumptionRow[] = [];
        for (let from = 0; ; from += CONSUMPTION_PAGE_SIZE) {
            const { data, error } = await client
                .from('water_monthly_consumption')
                .select('account_number, period, consumption')
                .gte('period', PERIOD_FLOOR)
                .lte('period', periodCeiling)
                .order('account_number')
                .order('period')
                .range(from, from + CONSUMPTION_PAGE_SIZE - 1)
                .returns<MonthlyConsumptionRow[]>();
            if (error) {
                console.error('Error fetching water monthly consumption:', error.message);
                return [];
            }
            if (!data || data.length === 0) break;
            consumptionRows.push(...data);
            if (data.length < CONSUMPTION_PAGE_SIZE) break;
        }

        const byAccount = new Map<string, MonthlyConsumptionRow[]>();
        for (const row of consumptionRows) {
            const list = byAccount.get(row.account_number);
            if (list) list.push(row);
            else byAccount.set(row.account_number, [row]);
        }

        const negativeMeters: { label: string; account: string; month: string; value: number }[] = [];

        const result: WaterMeter[] = meters.map((m) => {
            const displayLabel = (m.meter_name_original ?? m.meter_name) || 'Unknown Meter';
            const level = METER_LEVELS.has(m.level as WaterMeter['level']) ? (m.level as WaterMeter['level']) : 'N/A';
            const parent = m.parent_meter ?? '';

            const consumption: Record<string, number | null> = {};
            for (const row of byAccount.get(m.account_number) ?? []) {
                const key = periodToConsumptionKey(row.period);
                if (!key) continue;
                const raw = row.consumption;
                const value = raw === null || raw === undefined ? null : Number(raw);
                if (value !== null && Number.isNaN(value)) {
                    consumption[key] = null;
                    continue;
                }
                if (value !== null && value < 0) {
                    negativeMeters.push({ label: displayLabel, account: m.account_number, month: key, value });
                    consumption[key] = 0;
                } else {
                    consumption[key] = value;
                }
            }

            return {
                id: m.meter_id || m.account_number || undefined,
                label: displayLabel,
                accountNumber: m.account_number || '',
                level,
                zone: ZONE_TO_LEGACY[m.zone] ?? m.zone ?? '',
                parentMeter: PARENT_TO_LEGACY[parent] ?? parent,
                type: TYPE_TO_LEGACY[m.type] ?? m.type ?? '',
                consumption,
            };
        });

        if (negativeMeters.length > 0) {
            console.warn(`[Water Data] Found ${negativeMeters.length} negative consumption values in Supabase:`);
            console.table(negativeMeters);
        }

        return result;
    } catch (err) {
        console.error('Error in getWaterMetersFromSupabase:', err);
        return [];
    }
}

/**
 * Fetch daily water consumption data from Supabase
 * @param month - Optional month filter as string (e.g., "Feb-26")
 * @param year - Optional year filter (e.g., 2026)
 */
export async function getDailyWaterConsumptionFromSupabase(
    month?: string,
    year?: number
): Promise<DailyWaterConsumption[]> {
    const client = getSupabaseClient();
    if (!client) {
        return [];
    }

    try {
        let query = client
            .from('water_daily_consumption')
            .select(DAILY_WATER_CONSUMPTION_SELECT_COLUMNS);

        if (month) {
            query = query.eq('month', month);
        }
        if (year) {
            query = query.eq('year', year);
        }

        const { data, error } = await query.returns<SupabaseDailyWaterConsumption[]>();

        if (error) {
            console.error('Error fetching daily water consumption:', error.message);
            return [];
        }

        if (!data || data.length === 0) {
            return [];
        }

        return data.map((record) => transformDailyWaterConsumption(record));
    } catch (err) {
        console.error('Error in getDailyWaterConsumptionFromSupabase:', err);
        return [];
    }
}

/**
 * Fetch water loss summary data from Supabase
 * @param month - Optional month filter (e.g., "Feb-26")
 * @param year - Optional year filter (e.g., 2026)
 */
export async function getWaterLossSummaryFromSupabase(
    month?: string,
    year?: number
): Promise<WaterLossSummary[]> {
    const client = getSupabaseClient();
    if (!client) {
        return [];
    }

    try {
        let query = client
            .from('water_loss_summary')
            .select('id, zone, l2_bulk_account, l3_meters_count, l2_total_m3, l3_total_m3, loss_m3, loss_percent, status, month, year, generated_at');

        if (month) {
            query = query.eq('month', month);
        }
        if (year) {
            query = query.eq('year', year);
        }

        const { data, error } = await query.order('zone');

        if (error) {
            console.error('Error fetching water loss summary:', error.message);
            return [];
        }

        if (!data || data.length === 0) {
            return [];
        }

        return data.map((record: SupabaseWaterLossSummary) => transformWaterLossSummary(record));
    } catch (err) {
        console.error('Error in getWaterLossSummaryFromSupabase:', err);
        return [];
    }
}

/**
 * Fetch water loss daily data from Supabase
 * @param zone - Optional zone filter (e.g., "Zone FM")
 * @param month - Optional month filter (e.g., "Feb-26")
 * @param year - Optional year filter (e.g., 2026)
 */
export async function getWaterLossDailyFromSupabase(
    zone?: string,
    month?: string,
    year?: number
): Promise<WaterLossDaily[]> {
    const client = getSupabaseClient();
    if (!client) {
        return [];
    }

    try {
        let query = client
            .from('water_loss_daily')
            .select('id, zone, day, date, l2_total_m3, l3_total_m3, loss_m3, loss_percent, month, year');

        if (zone) {
            query = query.eq('zone', zone);
        }
        if (month) {
            query = query.eq('month', month);
        }
        if (year) {
            query = query.eq('year', year);
        }

        const { data, error } = await query.order('date');

        if (error) {
            console.error('Error fetching water loss daily:', error.message);
            return [];
        }

        if (!data || data.length === 0) {
            return [];
        }

        return data.map((record: SupabaseWaterLossDaily) => transformWaterLossDaily(record));
    } catch (err) {
        console.error('Error in getWaterLossDailyFromSupabase:', err);
        return [];
    }
}
