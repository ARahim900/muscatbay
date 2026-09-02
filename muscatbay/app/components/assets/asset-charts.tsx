"use client";

/**
 * Assets — Overview visualisations.
 *
 * Two surfaces, both fed exclusively by real register queries:
 *
 *  1. `AssetAttention`   — the "what needs attention" row, rendered from the
 *     shared inspection toolkit so Assets speaks the same severity language as
 *     Water / STP / Electricity. Severity is derived from the SHARE of the
 *     register affected (thresholds documented below), never invented.
 *  2. `AssetRegisterProfile` — three distribution charts (criticality,
 *     condition, remaining life) built on the shared `LiquidBarChart`, coloured
 *     from the design-system palette only.
 */

import { AlertTriangle, ClipboardCheck, Layers, ShieldAlert, Timer } from "lucide-react";
import { LiquidBarChart } from "@/components/charts/liquid-bar-chart";
import { ChartSkeleton } from "@/components/shared/skeleton";
import { HealthCard, worstFirst, type HealthMetric, type Severity } from "@/components/shared/inspection";
import { CHART_PALETTE } from "@/lib/tokens";
import type { AssetBucket, AssetDistributions, AssetSummary } from "@/functions/api/assets";

// ─── Attention row ───────────────────────────────────────────────────────────

/**
 * Share-of-register → severity. A single stray row in a 3,000-asset register is
 * not an alarm; 10% of it is. Thresholds are deliberately coarse and shared by
 * every attention metric so the row reads consistently.
 */
function severityFromShare(count: number, total: number): Severity {
    if (total === 0) return "nodata";
    if (count === 0) return "good";
    const share = count / total;
    if (share >= 0.1) return "critical";
    if (share >= 0.05) return "high";
    return "watch";
}

function pct(count: number, total: number): string {
    if (total === 0) return "—";
    return `${((count / total) * 100).toFixed(1)}%`;
}

export function AssetAttention({ summary }: { summary: AssetSummary }) {
    const total = summary.total;

    const metrics: HealthMetric[] = [
        {
            key: "end-of-life",
            title: "Remaining life ≤ 2 years",
            subtitle: "erl_years recorded as 2 or less",
            severity: severityFromShare(summary.endOfLifeSoon, total),
            headline: summary.endOfLifeSoon.toLocaleString(),
            headlineNote: "assets at or near end of expected life",
            facts: [{ label: "Of register", value: pct(summary.endOfLifeSoon, total) }],
        },
        {
            key: "critical-uncovered",
            title: "High criticality, no AMC",
            subtitle: "criticality = High with no contractor recorded",
            severity: severityFromShare(summary.highCriticalityNoAmc, total),
            headline: summary.highCriticalityNoAmc.toLocaleString(),
            headlineNote: "high-criticality assets without contracted maintenance",
            facts: [
                { label: "High crit.", value: summary.highCriticality.toLocaleString() },
                { label: "Of register", value: pct(summary.highCriticalityNoAmc, total) },
            ],
        },
        {
            key: "to-verify",
            title: "Awaiting verification",
            subtitle: "status = TO VERIFY",
            severity: severityFromShare(summary.toVerify, total),
            headline: summary.toVerify.toLocaleString(),
            headlineNote: "register entries not yet confirmed on site",
            facts: [{ label: "Of register", value: pct(summary.toVerify, total) }],
        },
    ];

    return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
            {worstFirst(metrics).map((m) => (
                <HealthCard key={m.key} metric={m} />
            ))}
        </div>
    );
}

// ─── Distribution charts ─────────────────────────────────────────────────────

function toChartData(buckets: AssetBucket[]): Record<string, string | number>[] {
    return buckets.map((b) => ({ label: b.label, Assets: b.count }));
}

function DistributionCard({
    title,
    note,
    icon: Icon,
    buckets,
    color,
}: {
    title: string;
    note: string;
    icon: typeof Layers;
    buckets: AssetBucket[];
    color: string;
}) {
    return (
        <div className="rounded-[10.5px] border border-border bg-card p-4 shadow-card-standard sm:p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Icon className="h-4 w-4 text-mb-secondary-text" aria-hidden="true" />
                {title}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">{note}</p>
            {buckets.length === 0 ? (
                <p className="py-10 text-center text-xs text-muted-foreground">
                    No values recorded for this field.
                </p>
            ) : (
                <LiquidBarChart
                    data={toChartData(buckets)}
                    categories={["Assets"]}
                    index="label"
                    colors={[color]}
                    height={240}
                    showGrid
                    showLegend={false}
                />
            )}
        </div>
    );
}

export function AssetRegisterProfile({
    distributions,
    loading,
    total,
}: {
    distributions: AssetDistributions | null;
    loading: boolean;
    total: number;
}) {
    if (loading || !distributions) {
        return (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3 sm:gap-4">
                {[0, 1, 2].map((i) => (
                    <div key={i} className="rounded-[10.5px] border border-border bg-card p-4 sm:p-5">
                        <ChartSkeleton height="h-[240px]" />
                    </div>
                ))}
            </div>
        );
    }

    const incomplete = total > 0 && distributions.rowsScanned < total;

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3 sm:gap-4">
                <DistributionCard
                    title="Criticality"
                    note="How many assets sit in each criticality band."
                    icon={ShieldAlert}
                    buckets={distributions.criticality}
                    color={CHART_PALETTE[0]}
                />
                <DistributionCard
                    title="Condition"
                    note="Condition exactly as recorded in the register (top 8 values)."
                    icon={ClipboardCheck}
                    buckets={distributions.condition}
                    color={CHART_PALETTE[4]}
                />
                <DistributionCard
                    title="Remaining life"
                    note="Estimated remaining life (ERL) banded in years."
                    icon={Timer}
                    buckets={distributions.lifecycle}
                    color={CHART_PALETTE[2]}
                />
            </div>
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                <span>
                    Based on {distributions.rowsScanned.toLocaleString()} register rows across{" "}
                    {distributions.disciplines} disciplines.
                </span>
                {incomplete && (
                    <span className="inline-flex items-center gap-1 text-[var(--mb-warning-text)]">
                        <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                        Partial scan — {total.toLocaleString()} assets exist; charts cover the rows read.
                    </span>
                )}
            </p>
        </div>
    );
}
