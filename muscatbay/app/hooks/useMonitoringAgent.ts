"use client";

/**
 * @fileoverview Monitoring agent — the watcher behind `/monitoring`.
 *
 * Gathers the five sources the completeness rules need, composes the daily and
 * monthly reports from them, and keeps both current: re-fetching when any
 * source table changes, and again on a clock tick so day- and month-based rules
 * roll over without a reload.
 *
 * The fetch is deliberately **scoped**: daily water rows are limited to the
 * months the due-day window touches, and electricity readings to the trend
 * months. Both queries are therefore bounded by the report's shape, not by how
 * old the database is.
 *
 * That scoping is why the reports are composed with `gathered.at` — the clock
 * the fetch itself used — rather than with a fresh `new Date()`. Evaluating
 * newer-calendar rules over the rows an older window asked for is how a monitor
 * ends up confirming that an upload "never landed" for a month it never
 * queried.
 *
 * Nothing here substitutes for a source it could not read. Each reader returns
 * a `SourceStatus`, those statuses ride into the report, and every surface says
 * "unknown" for a blind section rather than counting it as clean.
 *
 * @module hooks/useMonitoringAgent
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    getMonitoringContractors,
    getMonitoringElectricity,
    getMonitoringStpLog,
    getMonitoringWaterDaily,
    getMonitoringWaterMonthly,
} from "@/functions/api/monitoring";
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";
import {
    DAILY_WINDOW_DAYS,
    MONTHLY_TREND_MONTHS,
    composeDailyReport,
    composeMonthlyReport,
    consumptionKey,
    dueDayWindow,
    dueMonthWindow,
    type DailyMeterMonth,
    type DailyMonitoringReport,
    type ElectricityMeterRef,
    type ElectricityReadingRef,
    type MonthlyMonitoringReport,
    type SourceStatus,
    type StpDayRecord,
    type WaterMeterRef,
} from "@/lib/monitoring";
import type { ContractorTracker } from "@/entities/contractor";

/** Tables whose changes can move a completeness figure. */
const MONITORING_REALTIME_TABLES = [
    "water_daily_consumption",
    "water_monthly_consumption",
    "water_meters",
    "stp_operations",
    "electricity_readings",
    "electricity_meters",
    "Contractor_Tracker",
];

/**
 * Re-read the sources on a clock so day/month rollovers happen without a
 * reload.
 *
 * It has to re-**fetch**, not merely re-evaluate: both month-filtered queries
 * are scoped to the window the clock produced, so re-running the rules against
 * a newer calendar over the same rows would report a month that was never
 * queried as an upload that never landed.
 */
const REFRESH_MS = 30 * 60 * 1000;

export type MonitoringStatus = "loading" | "ready";

interface Gathered {
    /** The clock the fetch was scoped with — the only clock the rules may use. */
    at: Date;
    waterDaily: DailyMeterMonth[] | null;
    stp: StpDayRecord[] | null;
    electricityMeters: ElectricityMeterRef[] | null;
    electricityReadings: ElectricityReadingRef[] | null;
    waterMeters: WaterMeterRef[] | null;
    derivedMonths: string[];
    contractors: ContractorTracker[] | null;
    sources: SourceStatus[];
}

export interface UseMonitoringAgentReturn {
    status: MonitoringStatus;
    daily: DailyMonitoringReport | null;
    monthly: MonthlyMonitoringReport | null;
    /** When the sources were last read (null before the first pass). */
    fetchedAt: Date | null;
    /** True while a background refresh is in flight over data already shown. */
    refreshing: boolean;
    refresh: () => void;
}

/** The `Mon-YY` keys a due-day window spans — one or two months, never more. */
function monthsForWindow(now: Date, windowDays: number): string[] {
    const keys = new Set<string>();
    for (const day of dueDayWindow(now, windowDays)) {
        keys.add(consumptionKey(day.getUTCFullYear(), day.getUTCMonth()));
    }
    return [...keys];
}

export function useMonitoringAgent(): UseMonitoringAgentReturn {
    const [gathered, setGathered] = useState<Gathered | null>(null);
    const [status, setStatus] = useState<MonitoringStatus>("loading");
    const [refreshing, setRefreshing] = useState(false);
    const [fetchedAt, setFetchedAt] = useState<Date | null>(null);

    const gather = useCallback(async (silent = false) => {
        if (silent) setRefreshing(true);
        // The clock the fetch is scoped against — read once so the daily and
        // monthly windows below cannot straddle a midnight rollover.
        const at = new Date();

        const dailyMonths = monthsForWindow(at, DAILY_WINDOW_DAYS);
        const trendMonths = dueMonthWindow(at, MONTHLY_TREND_MONTHS).map((m) => m.key);

        const [waterDaily, stp, electricity, waterMonthly, contractors] = await Promise.all([
            getMonitoringWaterDaily(dailyMonths),
            getMonitoringStpLog(),
            getMonitoringElectricity(trendMonths),
            getMonitoringWaterMonthly(),
            getMonitoringContractors(),
        ]);

        setGathered({
            at,
            waterDaily: waterDaily.data,
            stp: stp.data,
            electricityMeters: electricity.data?.meters ?? null,
            electricityReadings: electricity.data?.readings ?? null,
            waterMeters: waterMonthly.data?.meters ?? null,
            derivedMonths: waterMonthly.data?.derivedMonths ?? [],
            contractors: contractors.data,
            sources: [
                waterDaily.status,
                stp.status,
                electricity.status,
                waterMonthly.status,
                contractors.status,
            ],
        });
        setFetchedAt(at);
        setStatus("ready");
        setRefreshing(false);
    }, []);

    useEffect(() => {
        // State lands after the awaits inside `gather`, so this is an async
        // kick-off rather than a synchronous set-state-in-effect.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        gather();
    }, [gather]);

    // Debounced silent refetch on realtime changes — the pattern the other
    // module pages use, so a busy sync cannot thrash the query.
    const refetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const triggerRefetch = useCallback(() => {
        if (refetchTimer.current) clearTimeout(refetchTimer.current);
        refetchTimer.current = setTimeout(() => gather(true), 2500);
    }, [gather]);
    useEffect(() => () => {
        if (refetchTimer.current) clearTimeout(refetchTimer.current);
    }, []);

    useSupabaseRealtime({
        table: MONITORING_REALTIME_TABLES,
        channelName: "monitoring-agent-rt",
        onChanged: triggerRefetch,
    });

    // Clock tick — "due" moves with the calendar even when nothing was written.
    useEffect(() => {
        const timer = setInterval(() => { gather(true); }, REFRESH_MS);
        return () => clearInterval(timer);
    }, [gather]);

    // Both reports are evaluated against `gathered.at`, never against a fresh
    // clock: the rules must not assess a period the fetch beside them never
    // asked for, or they report never-queried rows as a missing upload.
    const daily = useMemo<DailyMonitoringReport | null>(() => {
        if (!gathered) return null;
        return composeDailyReport({
            waterRows: gathered.waterDaily,
            stpRows: gathered.stp,
            contractors: gathered.contractors,
            sources: gathered.sources,
            now: gathered.at,
        });
    }, [gathered]);

    const monthly = useMemo<MonthlyMonitoringReport | null>(() => {
        if (!gathered) return null;
        return composeMonthlyReport({
            electricityMeters: gathered.electricityMeters,
            electricityReadings: gathered.electricityReadings,
            waterMeters: gathered.waterMeters,
            derivedMonths: gathered.derivedMonths,
            contractors: gathered.contractors,
            sources: gathered.sources,
            now: gathered.at,
        });
    }, [gathered]);

    const refresh = useCallback(() => { gather(true); }, [gather]);

    return { status, daily, monthly, fetchedAt, refreshing, refresh };
}
