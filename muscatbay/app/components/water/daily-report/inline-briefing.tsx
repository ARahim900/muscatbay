"use client";

import { Droplets, TrendingDown, AlertTriangle, ArrowUp, ArrowDown, type LucideIcon } from "lucide-react";
import { n } from "./inline-shared";
import type { BriefingMetrics } from "./briefing-metrics";

/** Format a signed percentage, or em dash when null. */
function pct(v: number | null): string {
    if (v === null) return "—";
    const sign = v > 0 ? "+" : "";
    return `${sign}${v.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

type Tone = "water" | "warning" | "danger" | "success" | "info";

// Colored icon-tile palette mirrors the monthly section's Kpi tiles (the
// reference): a soft chart-bg tint behind a domain/status-colored icon.
const TONE: Record<Tone, { bg: string; ic: string }> = {
    water: { bg: "var(--chart-bg-blue)", ic: "var(--module-water)" },
    warning: { bg: "var(--chart-bg-orange)", ic: "var(--status-warning)" },
    danger: { bg: "var(--chart-bg-red)", ic: "var(--status-danger)" },
    success: { bg: "var(--chart-bg-green)", ic: "var(--status-normal)" },
    info: { bg: "var(--chart-bg-blue)", ic: "var(--status-info)" },
};

/**
 * KPI tile styled to match the monthly section's Kpi card (the standard
 * reference): white card with a soft shadow, a colored icon tile on the left,
 * an 11px uppercase muted label, and a text-xl value with a small unit.
 */
function BriefingCard({
    label, value, unit, sub, icon: Icon, tone,
}: {
    label: string; value: string; unit?: string; sub?: string; icon: LucideIcon; tone: Tone;
}) {
    const { bg, ic } = TONE[tone];
    return (
        <div className="rounded-[10.5px] border border-border bg-card p-4 shadow-card-standard transition-shadow">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[7px]" style={{ background: bg }}>
                    <Icon className="h-5 w-5" style={{ color: ic }} />
                </div>
                <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
                    <p className="truncate text-xl font-semibold leading-tight tracking-tight tabular-nums text-foreground">
                        {value}{unit && <span className="ml-1 text-xs font-medium text-muted-foreground">{unit}</span>}
                    </p>
                </div>
            </div>
            {sub && <p className="mt-2 truncate text-[11px] text-muted-foreground">{sub}</p>}
        </div>
    );
}

export function DailyBriefing({
    metrics, month, day,
}: {
    metrics: BriefingMetrics;
    month: string;
    day: number;
}) {
    const { totalSupply, lossM3, lossPct, alarmCount, alarmZones, vsYesterdayPct, status } = metrics;

    const isWarning = status === "warning";
    // null → neutral up arrow placeholder; otherwise points with the movement.
    const TrendIcon = vsYesterdayPct !== null && vsYesterdayPct < 0 ? ArrowDown : ArrowUp;

    return (
        <section aria-label="Daily briefing" className="space-y-3">
            <div className="flex items-baseline justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Daily Briefing
                </h2>
                <span className="text-xs text-muted-foreground tabular-nums">
                    {month} · Day {day}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                <BriefingCard
                    label="Total Supply"
                    value={n(totalSupply)}
                    unit="m³"
                    sub="Total entering the network"
                    icon={Droplets}
                    tone="water"
                />
                <BriefingCard
                    label="Distribution Loss"
                    value={lossPct === null ? n(lossM3) : `${n(lossM3)} m³ · ${lossPct.toFixed(1)}%`}
                    unit={lossPct === null ? "m³" : undefined}
                    // Calm by default: amber only when a zone is actually in alarm.
                    sub="Zone bulk (L2) − sub-meters (L3)"
                    icon={TrendingDown}
                    tone={isWarning ? "warning" : "water"}
                />
                <BriefingCard
                    label="Zones in Alarm"
                    value={String(alarmCount)}
                    sub={alarmCount > 0 ? alarmZones.join(", ") : "All zones within tolerance"}
                    icon={AlertTriangle}
                    tone={alarmCount > 0 ? "danger" : "success"}
                />
                <BriefingCard
                    label="vs. Yesterday"
                    value={pct(vsYesterdayPct)}
                    sub="Day-over-day supply"
                    icon={TrendIcon}
                    tone="info"
                />
            </div>
        </section>
    );
}
