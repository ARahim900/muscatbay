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
import { Zap, Gauge, Activity, DollarSign, Layers, AlertTriangle, CheckCircle2, ArrowUp, ArrowDown } from "lucide-react";
import type { MeterReading } from "@/lib/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import {
    HealthCard, MetricHeatmap, ExceptionsRegister, InspectionTicker, worstFirst, type TickerStat,
} from "@/components/shared/inspection";
import {
    buildElectricityModel, buildCategoryMetrics, buildCategoryHeatmap, buildElectricityExceptions,
} from "./electricity-analytics";

const num = (x: number, frac = 0) => x.toLocaleString("en-US", { maximumFractionDigits: frac });

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
    const TrendIcon = summary.trendPct !== null && summary.trendPct < 0 ? ArrowDown : ArrowUp;

    const tickerItems: TickerStat[] = [
        { icon: Zap, label: "Consumption", value: <>{num(summary.grandTotal / 1000, 1)} <span className="text-muted-foreground">MWh</span></> },
        { icon: DollarSign, label: "Cost", value: <>{num(summary.cost)} <span className="text-muted-foreground">OMR</span></>, title: "at 0.025 OMR/kWh" },
        { icon: Layers, label: "Categories", value: String(model.categories.length), title: "meter types" },
        {
            icon: summary.flaggedCount > 0 ? AlertTriangle : CheckCircle2,
            label: "Flagged meters",
            value: summary.flaggedCount > 0 ? `${summary.flaggedCount} need a look` : "0 · all clear",
            tone: summary.flaggedCount > 0 ? "danger" : "success",
        },
        { icon: TrendIcon, label: "vs prev month", value: summary.trendPct === null ? "—" : `${summary.trendPct > 0 ? "+" : ""}${summary.trendPct.toFixed(1)}%`, tone: "info", title: "Consumption vs the previous month" },
    ];

    return (
        <div className="space-y-6">
            {/* Briefing ticker — same idiom as the Water Daily strip */}
            <InspectionTicker caption={`Load briefing · ${currentMonth}`} items={tickerItems} />

            {/* Category cards — worst first, tap to inspect (types → 2 or 5 cols, gap-free) */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
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
