"use client";

/**
 * Satellite View — hosts the field-verified water-network map engine
 * (public/satellite/index.html) inside the Water page.
 *
 * The engine is the standalone viewer built against the COO87 as-built DWGs:
 * 13.7 km of surveyed pipework, 119 plot-joined meters and the Zone 5
 * irrigation tank, rendered over satellite imagery with per-zone loss gauges.
 * It stays a self-contained page (its own maplibre build and vanilla engine)
 * and this component feeds it: the SAME `waterMeters` array the Monthly tab
 * renders is projected through `buildSatellitePayload` and posted in — so the
 * map can never disagree with the Monthly figures. No readings are baked into
 * the iframe document.
 *
 * Handshake: the iframe posts `satviz:ready`, we reply with `satviz:data`.
 * When the data identity changes (realtime refresh, new month), the iframe is
 * remounted via `key` and the handshake re-runs with the fresh payload — the
 * engine is boot-once by design, and reloading it is cheaper and safer than
 * mutating a booted map in place.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";

import type { WaterMeter } from "@/lib/water-data";
import type { DailyWaterConsumption } from "@/entities";
import { getDailyWaterConsumptionFromSupabase, type DerivedMonth } from "@/functions/api/water";
import { Skeleton } from "@/components/shared/skeleton";
import { buildSatellitePayload, type SatellitePayload } from "./satellite-model";

const ENGINE_URL = "/satellite/index.html?embed=1";

interface SatelliteViewProps {
    waterMeters: WaterMeter[];
    derivedMonths: DerivedMonth[];
}

/** Stable short identity for a payload — remounts the engine when it changes. */
function payloadKey(p: SatellitePayload): string {
    const c = p.consumption;
    return [
        c.months.join(""),
        c.l1.total,
        c.zones.map((z) => `${z.l2}:${z.l3}`).join("|"),
        p.daily.map((d) => `${d.key}:${d.total}:${d.logged}`).join("|"),
    ].join("~");
}

export function SatelliteView({ waterMeters, derivedMonths }: SatelliteViewProps) {
    // Daily series for the timeline drawer — fetched through the same tier-2
    // reader the Daily tab uses. `null` = still loading, `[]` = none exist.
    const [dailyRows, setDailyRows] = useState<DailyWaterConsumption[] | null>(null);
    useEffect(() => {
        let live = true;
        getDailyWaterConsumptionFromSupabase().then((rows) => {
            if (live) setDailyRows(rows);
        });
        return () => {
            live = false;
        };
    }, []);

    const payload = useMemo(
        () => (dailyRows === null ? null : buildSatellitePayload(waterMeters, derivedMonths, dailyRows)),
        [waterMeters, derivedMonths, dailyRows],
    );
    const frameKey = payload ? payloadKey(payload) : "loading";

    // Data-integrity anomalies are surfaced, never swallowed: the chip below
    // states the count, the console carries the specifics.
    useEffect(() => {
        if (payload && payload.unparented.length > 0) {
            console.warn("[satellite-view] L4 meters with no matching L3 parent:", payload.unparented);
        }
    }, [payload]);

    // Latest payload in a ref so the message handler always answers a
    // `satviz:ready` with current data, regardless of when the iframe loads.
    const payloadRef = useRef<SatellitePayload | null>(null);
    useEffect(() => {
        payloadRef.current = payload;
    }, [payload]);
    const frameRef = useRef<HTMLIFrameElement | null>(null);

    useEffect(() => {
        const onMessage = (ev: MessageEvent) => {
            if (ev.origin !== window.location.origin) return;
            if (ev.source !== frameRef.current?.contentWindow) return;
            const data: unknown = ev.data;
            if (!data || typeof data !== "object" || (data as { type?: string }).type !== "satviz:ready") return;
            const current = payloadRef.current;
            if (!current) return;
            frameRef.current?.contentWindow?.postMessage(
                { type: "satviz:data", consumption: current.consumption, daily: current.daily },
                window.location.origin,
            );
        };
        window.addEventListener("message", onMessage);
        return () => window.removeEventListener("message", onMessage);
    }, []);

    if (!payload) {
        return (
            <div role="status" aria-busy="true" aria-label="Loading satellite view">
                <Skeleton className="h-embed w-full rounded-card" />
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {payload.unparented.length > 0 && (
                <p className="flex items-center gap-2 rounded-card bg-warning-tint px-3 py-2 text-caption text-warning">
                    <AlertTriangle size={16} strokeWidth={2} className="shrink-0" aria-hidden="true" />
                    {payload.unparented.length} apartment meter{payload.unparented.length === 1 ? "" : "s"} reference a
                    building bulk that is not in the register — excluded from building roll-ups, listed in the console.
                </p>
            )}
            <iframe
                key={frameKey}
                ref={frameRef}
                src={ENGINE_URL}
                title="Muscat Bay water network — satellite view"
                // Fixed 720 px — the EmbedFrame height for external tools (DESIGN_SYSTEM.md §6).
                className="h-embed w-full rounded-card border border-line bg-component"
            />
        </div>
    );
}
