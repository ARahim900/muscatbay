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
// can't accidentally inflate the response. There is deliberately NO ceiling:
// deriving one from the device clock hid legitimate months from users whose
// tablet date was set in the past (the dashboard capped at the device's
// month), and the write path now guards against garbage periods anyway.
const PERIOD_FLOOR = '2024-01';

// Supabase / PostgREST caps every response at 1000 rows regardless of the
// `range()` value the client passes, so we page through `consumption` rows
// in fixed-size windows until a short page signals the end.
const CONSUMPTION_PAGE_SIZE = 1000;

// Mirror the legacy-name translations baked into the "Water System" SQL view
// so downstream code (lib/water-data.ts, the monthly adapter, etc.) keeps
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

/** A monthly reading the source data reported as negative (physically impossible). */
export interface NegativeReading {
    /** Meter display label. */
    label: string;
    /** Meter account number. */
    account: string;
    /** Consumption key, e.g. `"Mar-26"`. */
    month: string;
    /** The value exactly as stored — never rewritten. */
    value: number;
}

/**
 * Outcome of a water-meter fetch.
 *
 * `error` is non-null when the read genuinely failed, so callers can show an
 * honest error state instead of silently rendering an empty (or fabricated)
 * dashboard. `negatives` lists source rows whose consumption is negative — the
 * values are passed through untouched so the UI can flag them, rather than
 * being rewritten to 0 behind the operator's back.
 */
export interface WaterMetersResult {
    meters: WaterMeter[];
    error: string | null;
    negatives: NegativeReading[];
}

/**
 * Fetch water meters from Supabase, reporting failures and data-quality
 * problems instead of swallowing them.
 *
 * Reads the long-format `water_monthly_consumption` + `water_meters` tables
 * directly (not the legacy `"Water System"` wide view) so the response
 * payload is bounded by an explicit column list per row. New months appear
 * as new rows, not new columns, so dynamic months are still supported
 * automatically without any schema-shaped payload growth per row.
 *
 * Data honesty: a missing reading stays `null` and a negative reading keeps its
 * negative value. Neither is coerced to `0` — downstream flagging depends on
 * being able to tell "no reading", "genuinely zero" and "impossible reading"
 * apart.
 */
export async function fetchWaterMeters(): Promise<WaterMetersResult> {
    const client = getSupabaseClient();
    if (!client) {
        return { meters: [], error: 'Supabase is not configured.', negatives: [] };
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
            return { meters: [], error: `Could not read water meters: ${metersResult.error.message}`, negatives: [] };
        }

        const meters = metersResult.data ?? [];
        if (meters.length === 0) {
            return { meters: [], error: null, negatives: [] };
        }

        // The consumption table is ~10k rows and PostgREST caps responses at
        // 1000, so this used to walk 11 pages SEQUENTIALLY — ~11 round-trips
        // back-to-back was most of /water's first-paint delay on a tablet far
        // from the ap-northeast-1 region. Ask for the exact count first (a
        // HEAD request, no rows), then fetch every page in parallel: the wall
        // time becomes ~2 round-trips regardless of how many months accrue.
        const countResult = await client
            .from('water_monthly_consumption')
            .select('account_number', { count: 'exact', head: true })
            .gte('period', PERIOD_FLOOR);
        if (countResult.error) {
            console.error('Error counting water monthly consumption:', countResult.error.message);
            return { meters: [], error: `Could not read monthly consumption: ${countResult.error.message}`, negatives: [] };
        }
        const totalRows = countResult.count ?? 0;

        const pageCount = Math.ceil(totalRows / CONSUMPTION_PAGE_SIZE);
        const pages = await Promise.all(
            Array.from({ length: pageCount }, (_, page) => {
                const from = page * CONSUMPTION_PAGE_SIZE;
                return client
                    .from('water_monthly_consumption')
                    .select('account_number, period, consumption')
                    .gte('period', PERIOD_FLOOR)
                    .order('account_number')
                    .order('period')
                    .range(from, from + CONSUMPTION_PAGE_SIZE - 1)
                    .returns<MonthlyConsumptionRow[]>();
            })
        );

        const consumptionRows: MonthlyConsumptionRow[] = [];
        for (const { data, error } of pages) {
            if (error) {
                console.error('Error fetching water monthly consumption:', error.message);
                return { meters: [], error: `Could not read monthly consumption: ${error.message}`, negatives: [] };
            }
            consumptionRows.push(...(data ?? []));
        }

        const byAccount = new Map<string, MonthlyConsumptionRow[]>();
        for (const row of consumptionRows) {
            const list = byAccount.get(row.account_number);
            if (list) list.push(row);
            else byAccount.set(row.account_number, [row]);
        }

        const negatives: NegativeReading[] = [];

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
                    // Record it for the caller, but keep the value as reported.
                    // Rewriting it to 0 here used to hide an impossible reading
                    // behind a plausible-looking one and quietly deflated the
                    // A1/A2/A3 balance.
                    negatives.push({ label: displayLabel, account: m.account_number, month: key, value });
                }
                consumption[key] = value;
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

        return { meters: result, error: null, negatives };
    } catch (err) {
        console.error('Error in fetchWaterMeters:', err);
        return {
            meters: [],
            error: err instanceof Error ? err.message : String(err),
            negatives: [],
        };
    }
}

/**
 * Backwards-compatible wrapper returning just the meters.
 *
 * Prefer {@link fetchWaterMeters} in new code — it surfaces the failure reason
 * and the negative-reading register, both of which this signature discards.
 */
export async function getWaterMetersFromSupabase(): Promise<WaterMeter[]> {
    const { meters } = await fetchWaterMeters();
    return meters;
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
