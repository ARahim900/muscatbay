"use client";

/**
 * @fileoverview Operational alert watcher — keeps the alert feed wired to
 * live data.
 *
 * Fetches the three alert sources (water meters, contractor tracker, STP
 * daily log), runs the pure rules in `lib/operational-alerts`, and maintains
 * the resulting alert list:
 *  - re-fetches when any source table changes (one realtime channel),
 *  - re-evaluates periodically so day-based rules (contract expiry, stale
 *    log) roll over without a reload,
 *  - persists acknowledgements per alert fingerprint,
 *  - fires ONE browser push per new warning/critical fingerprint (dedup
 *    survives reloads via localStorage), honouring the user's Settings
 *    preference.
 *
 * Mock data is deliberately never evaluated — fabricated alerts are worse
 * than none. When live data is unreachable the hook reports `unavailable`
 * so the UI says "monitoring offline" instead of pretending health.
 *
 * @module hooks/useOperationalAlerts
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    isSupabaseConfigured,
    getWaterMetersFromSupabase,
    getSTPOperationsFromSupabase,
    getContractorTrackerData,
} from "@/lib/supabase";
import type { WaterMeter } from "@/lib/water-data";
import type { ContractorTracker } from "@/entities/contractor";
import type { STPOperation } from "@/lib/mock-data";
import { evaluateOperationalAlerts, type OperationalAlert } from "@/lib/operational-alerts";
import {
    getAlertPreferences,
    getAcknowledgedAlertIds,
    acknowledgeAlertId,
    unacknowledgeAlertId,
    pruneAcknowledgedAlertIds,
    getSeenAlertIds,
    markAlertIdsSeen,
} from "@/lib/alert-preferences";
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";

/** Tables whose changes can move an alert condition. */
const ALERT_REALTIME_TABLES = [
    "water_meters",
    "water_monthly_consumption",
    "water_daily_consumption",
    "Contractor_Tracker",
    "stp_operations",
];

/** Re-evaluate (same data, new clock) so day-based rules roll over. */
const REEVALUATE_MS = 30 * 60 * 1000;

export type OperationalAlertStatus = "loading" | "ready" | "unavailable";

export interface AckableAlert extends OperationalAlert {
    acknowledged: boolean;
}

export interface UseOperationalAlertsReturn {
    /** Active alerts, most severe first, with acknowledgement state. */
    alerts: AckableAlert[];
    /** Count of active, un-acknowledged alerts — drives the bell badge. */
    unacknowledgedCount: number;
    /** loading = first fetch in flight; unavailable = no live source reachable. */
    status: OperationalAlertStatus;
    /** Sources that could not be evaluated this pass (empty = all live). */
    unavailableSources: string[];
    /** When the rules last ran (null before first evaluation). */
    evaluatedAt: Date | null;
    acknowledge: (id: string) => void;
    unacknowledge: (id: string) => void;
}

interface SourceData {
    waterMeters: WaterMeter[] | null;
    contractors: ContractorTracker[] | null;
    stpOperations: STPOperation[] | null;
}

/**
 * @param pushToOS Browser-push sender from `useNotifications` (list-free).
 */
export function useOperationalAlerts(
    pushToOS: (title: string, message?: string, level?: "success" | "error" | "warning" | "info") => void,
): UseOperationalAlertsReturn {
    const [data, setData] = useState<SourceData | null>(null);
    const [status, setStatus] = useState<OperationalAlertStatus>("loading");
    const [evaluatedAt, setEvaluatedAt] = useState<Date | null>(null);
    const [evalTick, setEvalTick] = useState(0);
    const [ackedIds, setAckedIds] = useState<string[]>([]);

    // Load persisted acks after mount (SSR-safe).
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setAckedIds(getAcknowledgedAlertIds());
    }, []);

    const fetchSources = useCallback(async () => {
        if (!isSupabaseConfigured()) {
            setData(null);
            setStatus("unavailable");
            setEvaluatedAt(new Date());
            return;
        }
        const [waterRes, trackerRes, stpRes] = await Promise.allSettled([
            getWaterMetersFromSupabase(),
            getContractorTrackerData(),
            getSTPOperationsFromSupabase(),
        ]);
        // The fetchers return [] on failure; a live deployment always has rows,
        // so [] means "source unavailable", never "all clear".
        const waterMeters = waterRes.status === "fulfilled" && waterRes.value.length > 0 ? waterRes.value : null;
        const contractors = trackerRes.status === "fulfilled" && trackerRes.value.length > 0 ? trackerRes.value : null;
        const stpOperations = stpRes.status === "fulfilled" && stpRes.value.length > 0 ? stpRes.value : null;

        setData({ waterMeters, contractors, stpOperations });
        setStatus(waterMeters || contractors || stpOperations ? "ready" : "unavailable");
        setEvaluatedAt(new Date());
    }, []);

    // Initial fetch (guarded against StrictMode double-invoke by idempotence —
    // a second concurrent fetch just resolves to the same state).
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- kick off the async source fetch; state lands after awaits
        fetchSources();
    }, [fetchSources]);

    // Debounced refetch on realtime changes — mirrors the dashboard's pattern.
    const refetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const triggerRefetch = useCallback(() => {
        if (refetchTimer.current) clearTimeout(refetchTimer.current);
        refetchTimer.current = setTimeout(() => fetchSources(), 2500);
    }, [fetchSources]);
    useEffect(() => () => {
        if (refetchTimer.current) clearTimeout(refetchTimer.current);
    }, []);

    useSupabaseRealtime({
        table: ALERT_REALTIME_TABLES,
        channelName: "operational-alerts-rt",
        onChanged: triggerRefetch,
    });

    // Clock-based re-evaluation (contract days & staleness move with time).
    useEffect(() => {
        const t = setInterval(() => setEvalTick((n) => n + 1), REEVALUATE_MS);
        return () => clearInterval(t);
    }, []);

    // Run the pure rules whenever data or the clock tick changes.
    const rawAlerts = useMemo<OperationalAlert[]>(() => {
        if (!data) return [];
        void evalTick; // re-run on periodic tick
        return evaluateOperationalAlerts({
            waterMeters: data.waterMeters,
            contractors: data.contractors,
            stpOperations: data.stpOperations,
            now: new Date(),
        });
    }, [data, evalTick]);

    const unavailableSources = useMemo(() => {
        if (!data) return ["water", "contractors", "stp"];
        const out: string[] = [];
        if (!data.waterMeters) out.push("water");
        if (!data.contractors) out.push("contractors");
        if (!data.stpOperations) out.push("stp");
        return out;
    }, [data]);

    // Push once per new warning/critical fingerprint; prune stale acks.
    useEffect(() => {
        if (rawAlerts.length === 0) return;
        const activeIds = rawAlerts.map((a) => a.id);
        // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing React state with the localStorage-backed ack store
        setAckedIds(pruneAcknowledgedAlertIds(activeIds));

        const seen = new Set(getSeenAlertIds());
        const fresh = rawAlerts.filter((a) => !seen.has(a.id));
        if (fresh.length === 0) return;
        markAlertIdsSeen(fresh.map((a) => a.id));

        if (getAlertPreferences().push) {
            for (const alert of fresh) {
                if (alert.level === "error" || alert.level === "warning") {
                    pushToOS(alert.title, alert.message, alert.level);
                }
            }
        }
    }, [rawAlerts, pushToOS]);

    const acknowledge = useCallback((id: string) => {
        setAckedIds(acknowledgeAlertId(id));
    }, []);

    const unacknowledge = useCallback((id: string) => {
        setAckedIds(unacknowledgeAlertId(id));
    }, []);

    const alerts = useMemo<AckableAlert[]>(
        () => rawAlerts.map((a) => ({ ...a, acknowledged: ackedIds.includes(a.id) })),
        [rawAlerts, ackedIds],
    );

    const unacknowledgedCount = useMemo(
        () => alerts.filter((a) => !a.acknowledged).length,
        [alerts],
    );

    return {
        alerts,
        unacknowledgedCount,
        status,
        unavailableSources,
        evaluatedAt,
        acknowledge,
        unacknowledge,
    };
}
