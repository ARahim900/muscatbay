"use client";

import { AlertTriangle, CheckCircle2, Droplets, Gauge, TrendingDown } from "lucide-react";

import { OperationalBriefing, type OperationalBriefingItem } from "@/components/shared/operational-briefing";
import type { BriefingMetrics } from "./briefing-metrics";
import { n } from "./inline-shared";

const shortZone = (zone: string) => zone.replace(/^Zone\s+/i, "");

function changeVsYesterday(value: number | null): string {
    if (value === null) return "No comparable reading";
    const magnitude = Math.abs(value).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    if (Math.abs(value) < 0.05) return "Same as yesterday";
    return value > 0 ? `${magnitude}% more used` : `${magnitude}% less used`;
}

/** Standard daily water briefing using the same component as Electricity and STP. */
export function DailyBriefing({
    metrics,
    month,
    day,
}: {
    metrics: BriefingMetrics;
    month: string;
    day: number;
}) {
    const items: OperationalBriefingItem[] = [
        {
            icon: Droplets,
            label: "Water supplied",
            value: <>{n(metrics.totalSupply)} <span className="text-sm text-muted-foreground">m³</span></>,
            description: "Zone bulk meters plus direct connections",
        },
        {
            icon: Gauge,
            label: "Recorded at meters",
            value: <>{n(metrics.l3Total)} <span className="text-sm text-muted-foreground">of {n(metrics.l2Total)} m³</span></>,
            description: "Individual property meters against zone bulk",
        },
        {
            icon: TrendingDown,
            label: "Unaccounted water",
            value: metrics.lossPct === null
                ? `${n(metrics.lossM3)} m³`
                : `${n(metrics.lossM3)} m³ · ${metrics.lossPct.toFixed(1)}%`,
            severity: metrics.status === "warning" ? "warning" : "default",
            description: changeVsYesterday(metrics.vsYesterdayPct),
        },
        {
            icon: metrics.alarmCount > 0 ? AlertTriangle : CheckCircle2,
            label: "Zones needing attention",
            value: metrics.alarmCount > 0
                ? `${metrics.alarmCount} of ${metrics.zoneCount}`
                : metrics.zoneCount > 0 ? "None" : "No zone data",
            severity: metrics.alarmCount > 0 ? "danger" : metrics.zoneCount > 0 ? "success" : "default",
            description: metrics.alarmCount > 0
                ? metrics.alarmZones.map(shortZone).join(", ")
                : metrics.zoneCount > 0 ? `All ${metrics.zoneCount} zones normal` : undefined,
        },
    ];

    return (
        <OperationalBriefing
            title="Water briefing"
            periodLabel={`${month} · Day ${day}`}
            items={items}
        />
    );
}
