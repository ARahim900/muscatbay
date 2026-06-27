"use client";

import { Droplets, TrendingDown, AlertTriangle, CheckCircle2, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { HierarchyStatCard, n } from "./inline-shared";
import type { BriefingMetrics } from "./briefing-metrics";

/** Format a signed percentage, or em dash when null. */
function pct(v: number | null): string {
    if (v === null) return "—";
    const sign = v > 0 ? "+" : "";
    return `${sign}${v.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
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
    const verdictColor = isWarning ? "var(--status-warning)" : "var(--status-normal)";
    const VerdictIcon = isWarning ? AlertTriangle : CheckCircle2;
    const verdictText = isWarning
        ? `${alarmCount} zone${alarmCount === 1 ? "" : "s"} above tolerance: ${alarmZones.join(", ")}`
        : "All zones within tolerance.";

    const TrendIcon = vsYesterdayPct === null ? null : vsYesterdayPct >= 0 ? ArrowUp : ArrowDown;

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

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <HierarchyStatCard
                    label="Total Supply"
                    value={`${n(totalSupply)} m³`}
                    icon={<Droplets className="h-5 w-5" />}
                    color="var(--module-water, #6B9AC4)"
                />
                <HierarchyStatCard
                    label="Distribution Loss"
                    value={lossPct === null ? `${n(lossM3)} m³` : `${n(lossM3)} m³ · ${lossPct.toFixed(1)}%`}
                    icon={<TrendingDown className="h-5 w-5" />}
                    // Calm by default: amber only when a zone is actually in alarm,
                    // otherwise an informational water accent (no urgency on a clean day).
                    color={isWarning ? "var(--status-warning)" : "var(--module-water, #6B9AC4)"}
                />
                <HierarchyStatCard
                    label="Zones in Alarm"
                    value={String(alarmCount)}
                    icon={<AlertTriangle className="h-5 w-5" />}
                    color={alarmCount > 0 ? "var(--status-danger)" : "var(--status-normal)"}
                    valueColor={alarmCount > 0 ? "var(--status-danger)" : undefined}
                />
                <HierarchyStatCard
                    label="vs. Yesterday"
                    value={
                        TrendIcon === null
                            ? "—"
                            : pct(vsYesterdayPct)
                    }
                    icon={TrendIcon ? <TrendIcon className="h-5 w-5" /> : <ArrowUp className="h-5 w-5 opacity-30" />}
                    color="var(--status-info)"
                />
            </div>

            <div
                className={cn(
                    "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium",
                )}
                style={{
                    color: verdictColor,
                    borderColor: verdictColor,
                    backgroundColor: isWarning ? "var(--status-warning-bg)" : "var(--status-normal-bg)",
                }}
            >
                <VerdictIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{verdictText}</span>
            </div>
        </section>
    );
}
