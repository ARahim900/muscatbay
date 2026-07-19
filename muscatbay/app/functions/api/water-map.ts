/**
 * @fileoverview Water 3D Map — async data fetchers.
 *
 * Thin, typed wrappers used only by the 3D Map subsection. Monthly data reuses
 * `getWaterMetersFromSupabase` (passed in as a prop by the page), so the only
 * fetches here are the RAW daily rows (the daily engine needs the wide
 * `day_1..31` shape) and the list of months that actually have daily data.
 *
 * @module functions/api/water-map
 */

import { getSupabaseClient } from "../supabase-client";
import {
    DAILY_WATER_CONSUMPTION_SELECT_COLUMNS,
    type SupabaseDailyWaterConsumption,
} from "@/entities/water";

const MONTH_INDEX: Record<string, number> = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

/** A month that has daily readings, e.g. `{ month: "Jun-26", year: 2026 }`. */
export interface DailyMonthOption {
    /** Raw `water_daily_consumption.month` value, e.g. "Jun-26". */
    month: string;
    year: number;
    /** Display label, e.g. "Jun 2026". */
    label: string;
}

/** Full four-digit year for a "Mon-YY" month string. */
function fullYear(month: string, year: number): number {
    return year || Number(`20${month.split("-")[1] ?? ""}`) || 0;
}

/**
 * Fetch the RAW daily rows for one month (explicit column list, error-handled).
 * Returns `[]` on any failure so the caller can show an empty state.
 */
export async function fetchDailyWaterRows(
    month: string,
    year: number,
): Promise<SupabaseDailyWaterConsumption[]> {
    const client = getSupabaseClient();
    if (!client) return [];
    try {
        const { data, error } = await client
            .from("water_daily_consumption")
            .select(DAILY_WATER_CONSUMPTION_SELECT_COLUMNS)
            .eq("month", month)
            .eq("year", year)
            .returns<SupabaseDailyWaterConsumption[]>();
        if (error) {
            console.error("[water-map] daily rows:", error.message);
            return [];
        }
        return data ?? [];
    } catch (err) {
        console.error("[water-map] daily rows:", err);
        return [];
    }
}

/**
 * List the months that have any daily data, most-recent first. Dedupes a small
 * `month,year` projection client-side (PostgREST has no cheap DISTINCT).
 */
export async function fetchDailyWaterMonths(): Promise<DailyMonthOption[]> {
    const client = getSupabaseClient();
    if (!client) return [];
    try {
        const { data, error } = await client
            .from("water_daily_consumption")
            .select("month, year")
            .returns<{ month: string; year: number }[]>();
        if (error) {
            console.error("[water-map] daily months:", error.message);
            return [];
        }
        const seen = new Map<string, DailyMonthOption>();
        for (const r of data ?? []) {
            if (!r.month) continue;
            const y = fullYear(r.month, r.year);
            const key = `${y}-${r.month}`;
            if (!seen.has(key)) {
                const abbr = r.month.split("-")[0] ?? r.month;
                seen.set(key, { month: r.month, year: r.year, label: `${abbr} ${y}` });
            }
        }
        return [...seen.values()].sort((a, b) => {
            const ay = fullYear(a.month, a.year);
            const by = fullYear(b.month, b.year);
            if (ay !== by) return by - ay;
            return (MONTH_INDEX[b.month.split("-")[0]] ?? 0) - (MONTH_INDEX[a.month.split("-")[0]] ?? 0);
        });
    } catch (err) {
        console.error("[water-map] daily months:", err);
        return [];
    }
}
