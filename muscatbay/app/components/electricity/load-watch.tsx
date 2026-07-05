"use client";

/**
 * Load Watch — the Electricity section's inspection-first landing, modelled on
 * the Water Zone Watch. It answers "which system is drawing abnormally, and
 * which meters do I check?" from one screen: a briefing strip, severity-first
 * category cards (worst first, tap to drill into that type), a category×month
 * heatmap that shows when a category's draw spiked, and the auto-generated
 * Exceptions & Actions register of flagged meters (spike / dip / zero /
 * negative / missing).
 */

import { useMemo } from "react";
import { Zap, Gauge, Activity } from "lucide-react";
import type { MeterReading } from "@/lib/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import {
    HealthCard, MetricHeatmap, ExceptionsRegister, worstFirst,
} from "@/components/shared/inspection";
import {
    buildElectricityModel, buildCategoryMetrics, buildCategoryHeatmap, buildElectricityExceptions,
} from "./electricity-analytics";

const num = (x: number, frac = 0) => x.toLocaleString("en-US", { maximumFractionDigits: frac });

function BriefFigure({ label, value, sub }: { label: string; value: string; sub?: string }) {
    return (
        <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">{value}</p>
            {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
        </div>
    );
}

export function LoadWatch({
    meters, allMonths, startMonth, endMonth, onInspectType,
}: {
    meters: MeterReading[];
    allMonths: string[];
    startMonth: string;
    endMonth: string;
    onInspectType: (type: string) => void;
}) {
    const model = useMemo(
        () => buildElectricityModel(meters, allMonths, startMonth, endMonth),
        [meters, allMonths, startMonth, endMonth],
    );
    const metrics = useMemo(() => worstFirst(buildCategoryMetrics(model)), [model]);
    const heat = useMemo(() => buildCategoryHeatmap(model), [model]);
    const exceptions = useMemo(() => buildElectricityExceptions(model), [model]);

    if (model.categories.length === 0 || model.currentMonth === null) {
        return (
            <Card className="card-elevated">
                <CardContent className="flex flex-col items-center gap-2 py-14 text-center">
                    <Activity className="h-8 w-8 text-muted-foreground/70" aria-hidden="true" />
                    <p className="text-sm font-semibold text-foreground">No meter readings in the selected range</p>
                    <p className="max-w-md text-xs text-muted-foreground">Widen the year / date range above to load meter data.</p>
                </CardContent>
            </Card>
        );
    }

    const { summary, currentMonth } = model;
    const trendStr = summary.trendPct === null ? "—" : `${summary.trendPct > 0 ? "+" : ""}${summary.trendPct.toFixed(1)}% vs prev month`;

    return (
        <div className="space-y-6">
            {/* Briefing strip */}
            <Card className="card-elevated">
                <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary/15 text-secondary">
                                <Zap className="h-5 w-5" aria-hidden="true" />
                            </span>
                            <div>
                                <p className="text-sm font-semibold text-foreground">Load briefing · {currentMonth}</p>
                                <p className="text-xs text-muted-foreground">
                                    {summary.meterCount} meters · {summary.flaggedCount} flagged · {exceptions.length} open exception{exceptions.length !== 1 ? "s" : ""}
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:flex sm:items-center sm:gap-6">
                            <BriefFigure label="Consumption" value={`${num(summary.grandTotal / 1000, 1)} MWh`} sub={trendStr} />
                            <BriefFigure label="Cost" value={`${num(summary.cost)} OMR`} sub="at 0.025 OMR/kWh" />
                            <BriefFigure label="Categories" value={String(model.categories.length)} sub="meter types" />
                            <BriefFigure label="Flagged" value={String(summary.flaggedCount)} sub="meters need a look" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Category cards — worst first, tap to inspect that type */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {metrics.map((m) => <HealthCard key={m.key} metric={m} onInspect={onInspectType} />)}
            </div>

            {/* Category × month heatmap */}
            <MetricHeatmap
                title="Category Load Heatmap"
                note="Each cell is one month's total draw for that category (in MWh). Redder = further above the category's own baseline — a cell turning red pinpoints the month a system's consumption jumped."
                icon={Gauge}
                columns={heat.columns}
                rows={heat.rows}
            />

            {/* Exceptions & Actions */}
            <ExceptionsRegister
                rows={exceptions}
                title={`Exceptions & Actions — ${currentMonth}`}
                subtitle="Auto-generated from this month's readings: consumption spikes, dips, zero-consumption, negative reads and missing reads, each against the meter's own baseline."
                filename={`electricity-exceptions-${currentMonth}`}
                emptyHint="Every meter is within tolerance of its own baseline this month — no spikes, dips, zeros, negatives or missing reads."
                showDate={false}
            />
        </div>
    );
}
