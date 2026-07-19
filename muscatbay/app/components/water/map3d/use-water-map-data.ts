"use client";

/**
 * @fileoverview Water 3D Map — data provider hook.
 *
 * Owns the map's data lifecycle: monthly comes from the `meters` the page
 * already fetched (no duplicate request); daily rows are fetched per selected
 * month with stale-request guarding and cancelled when the month changes. The
 * `MapSnapshot` is derived (memoised) from the current mode + period via the
 * pure adapter.
 *
 * @module components/water/map3d/use-water-map-data
 */

import { useEffect, useMemo, useRef, useState } from "react";
import type { WaterMeter } from "@/lib/water-data";
import type { SupabaseDailyWaterConsumption } from "@/entities/water";
import {
    buildMonthlyMapSnapshot,
    buildDailyMapSnapshot,
    monthlyPeriodsFromMeters,
    type MapSnapshot,
    type MapMode,
    type MonthlyPeriodOption,
} from "@/lib/water-map-data";
import {
    fetchDailyWaterRows,
    fetchDailyWaterMonths,
    type DailyMonthOption,
} from "@/functions/api/water-map";

export interface WaterMapQuery {
    mode: MapMode;
    /** "YYYY-MM" for monthly; null = use latest available. */
    monthlyKey: string | null;
    /** Raw "Mon-YY" for daily. */
    dailyMonth: string | null;
    dailyYear: number | null;
    /** 1-based day of month. */
    dailyDay: number;
}

export interface UseWaterMapDataResult {
    snapshot: MapSnapshot | null;
    monthlyPeriods: MonthlyPeriodOption[];
    dailyMonths: DailyMonthOption[];
    /** Max day-of-month with a reading in the currently loaded daily rows. */
    latestDailyDay: number;
    loadingDaily: boolean;
    error: string | null;
}

/** Highest day-of-month index that carries any reading across the rows. */
function computeLatestDay(rows: SupabaseDailyWaterConsumption[]): number {
    let latest = 1;
    for (const r of rows) {
        for (let d = 31; d > latest; d--) {
            if (r[`day_${d}` as keyof SupabaseDailyWaterConsumption] != null) {
                latest = d;
                break;
            }
        }
    }
    return latest;
}

export function useWaterMapData(meters: WaterMeter[], query: WaterMapQuery): UseWaterMapDataResult {
    const monthlyPeriods = useMemo(() => monthlyPeriodsFromMeters(meters), [meters]);

    const [dailyMonths, setDailyMonths] = useState<DailyMonthOption[]>([]);
    const [dailyRows, setDailyRows] = useState<SupabaseDailyWaterConsumption[]>([]);
    const [loadedMonthKey, setLoadedMonthKey] = useState<string | null>(null);
    const [errorState, setErrorState] = useState<{ key: string; message: string } | null>(null);
    const reqId = useRef(0);

    // Month list — fetched once.
    useEffect(() => {
        let active = true;
        fetchDailyWaterMonths()
            .then((m) => {
                if (active) setDailyMonths(m);
            })
            .catch(() => {
                /* non-fatal: daily control just shows no months */
            });
        return () => {
            active = false;
        };
    }, []);

    // Daily rows — fetched per selected month, only while in daily mode. State is
    // set only inside the async callbacks (never synchronously in the effect
    // body); loading/error are derived below.
    const wantMonth = query.mode === "daily" ? query.dailyMonth : null;
    const wantYear = query.mode === "daily" ? query.dailyYear : null;
    const wantKey = wantMonth && wantYear ? `${wantYear}-${wantMonth}` : null;
    useEffect(() => {
        if (!wantMonth || !wantYear || !wantKey || wantKey === loadedMonthKey) return;
        const id = ++reqId.current;
        fetchDailyWaterRows(wantMonth, wantYear)
            .then((rows) => {
                if (id !== reqId.current) return; // superseded by a newer month
                setDailyRows(rows);
                setLoadedMonthKey(wantKey);
                setErrorState(null);
            })
            .catch((e) => {
                if (id !== reqId.current) return;
                setErrorState({ key: wantKey, message: e instanceof Error ? e.message : "Failed to load daily data" });
            });
    }, [wantMonth, wantYear, wantKey, loadedMonthKey]);

    const loadingDaily = wantKey != null && wantKey !== loadedMonthKey && errorState?.key !== wantKey;
    const error = errorState && errorState.key === wantKey ? errorState.message : null;

    const latestDailyDay = useMemo(() => computeLatestDay(dailyRows), [dailyRows]);

    const snapshot = useMemo<MapSnapshot | null>(() => {
        if (query.mode === "monthly") {
            const period = query.monthlyKey
                ? monthlyPeriods.find((p) => p.periodKey === query.monthlyKey)
                : monthlyPeriods[monthlyPeriods.length - 1];
            if (!period) return null;
            return buildMonthlyMapSnapshot(meters, period.year, period.monthIndex);
        }
        if (!query.dailyMonth || !query.dailyYear) return null;
        if (loadedMonthKey !== `${query.dailyYear}-${query.dailyMonth}`) return null;
        if (dailyRows.length === 0) return null;
        // dailyDay === 0 means "auto" → newest day with a reading.
        const day = query.dailyDay > 0 ? Math.min(query.dailyDay, latestDailyDay) : latestDailyDay;
        return buildDailyMapSnapshot(dailyRows, query.dailyMonth, query.dailyYear, day);
    }, [
        query.mode,
        query.monthlyKey,
        query.dailyMonth,
        query.dailyYear,
        query.dailyDay,
        meters,
        monthlyPeriods,
        dailyRows,
        loadedMonthKey,
        latestDailyDay,
    ]);

    return { snapshot, monthlyPeriods, dailyMonths, latestDailyDay, loadingDaily, error };
}
