"use client";

/**
 * Plant Watch — the STP section's inspection-first landing, modelled on the
 * Water Zone Watch. One screen answers "is the plant healthy, and if not, what
 * do I do?": a briefing strip, severity-first process cards (worst first), a
 * consolidated load-vs-recovery chart, a metric×day heatmap that pinpoints the
 * day a problem started, and the auto-generated Exceptions & Actions register.
 */

import { useMemo } from "react";
import {
    ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine,
} from "recharts";
import { Activity, Gauge, Droplets, Recycle, Truck, DollarSign, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { STPOperation } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    HealthCard, MetricHeatmap, ExceptionsRegister, InspectionTicker, worstFirst, type TickerStat,
} from "@/components/shared/inspection";
import {
    buildSTPModel, buildHealthMetrics, buildHeatmap, buildSTPExceptions, effSeverity,
} from "./stp-analytics";

const TIP_STYLE = {
    fontSize: 12, borderRadius: 8,
    background: "var(--card)", color: "var(--foreground)", border: "1px solid var(--border)",
} as const;

type TipValue = number | string | ReadonlyArray<number | string> | undefined;

const num = (x: number, frac = 0) => x.toLocaleString("en-US", { maximumFractionDigits: frac });

export function PlantWatch({ operations }: { operations: STPOperation[] }) {
    const model = useMemo(() => buildSTPModel(operations), [operations]);
    const metrics = useMemo(() => worstFirst(buildHealthMetrics(model)), [model]);
    const heat = useMemo(() => buildHeatmap(model), [model]);
    const exceptions = useMemo(() => buildSTPExceptions(model), [model]);

    // Consolidated load-vs-recovery chart — last ≤30 days for readability.
    const chartData = useMemo(
        () => model.days.slice(-30).map((d) => ({ day: d.dayLabel, inlet: d.inlet, tse: d.tse, eff: d.eff })),
        [model.days],
    );

    if (model.days.length === 0) {
        return (
            <Card className="card-elevated">
                <CardContent className="flex flex-col items-center gap-2 py-14 text-center">
                    <Activity className="h-8 w-8 text-muted-foreground/70" aria-hidden="true" />
                    <p className="text-sm font-semibold text-foreground">No operations in the selected range</p>
                    <p className="max-w-md text-xs text-muted-foreground">Widen the date range above to load daily STP records.</p>
                </CardContent>
            </Card>
        );
    }

    const { summary } = model;
    const effSev = effSeverity(summary.avgEfficiency);
    const effTone: TickerStat["tone"] = effSev === "good" ? "success" : effSev === "watch" ? "warning" : effSev === "nodata" ? "default" : "danger";

    const tickerItems: TickerStat[] = [
        { icon: Gauge, label: "Efficiency", value: summary.avgEfficiency !== null ? `${summary.avgEfficiency.toFixed(1)}%` : "—", tone: effTone, title: "TSE ÷ inlet" },
        { icon: Droplets, label: "Inlet treated", value: <>{num(summary.totalInlet)} <span className="text-muted-foreground">m³</span></> },
        { icon: Recycle, label: "TSE reused", value: <>{num(summary.totalTSE)} <span className="text-muted-foreground">m³</span></> },
        { icon: Truck, label: "Tanker trips", value: num(summary.totalTrips) },
        { icon: DollarSign, label: "Economic impact", value: <>{num(summary.economicImpact)} <span className="text-muted-foreground">OMR</span></> },
        {
            icon: exceptions.length > 0 ? AlertTriangle : CheckCircle2,
            label: "Open exceptions",
            value: exceptions.length > 0 ? `${exceptions.length} to action` : "0 · all clear",
            tone: exceptions.length > 0 ? "danger" : "success",
        },
    ];

    return (
        <div className="space-y-6">
            {/* Briefing ticker — same idiom as the Water Daily strip */}
            <InspectionTicker caption={`Plant briefing · ${summary.periodLabel}`} items={tickerItems} />

            {/* Process-health cards — worst first (4 cards → 2×2 / 1×4, gap-free) */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {metrics.map((m) => <HealthCard key={m.key} metric={m} />)}
            </div>

            {/* Consolidated load vs recovery */}
            <Card className="card-elevated">
                <CardHeader className="card-elevated-header p-4 sm:p-5 md:p-6 pb-2">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <Gauge className="h-4 w-4 text-secondary" aria-hidden="true" />
                        Load vs Recovery — last {chartData.length} days
                    </CardTitle>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Bars = daily inlet (hydraulic load, left axis). Line = treatment efficiency (right axis); the dashed line is the {95}% target — dips below it are where recovery slipped.
                    </p>
                </CardHeader>
                <CardContent className="p-4 sm:p-5 md:p-6 pt-2">
                    <ResponsiveContainer width="100%" height={280}>
                        <ComposedChart data={chartData} margin={{ top: 6, right: 8, left: -8, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                            <XAxis dataKey="day" tick={{ fontSize: 10, fill: "var(--chart-axis)" }} interval="preserveStartEnd" minTickGap={16} />
                            <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "var(--chart-axis)" }} />
                            <YAxis yAxisId="right" orientation="right" domain={[0, 110]} tick={{ fontSize: 11, fill: "var(--chart-axis)" }} unit="%" />
                            <Tooltip
                                contentStyle={TIP_STYLE}
                                cursor={{ fill: "var(--chart-cursor-fill)" }}
                                formatter={(v: TipValue, name) => {
                                    if (name === "Efficiency") return [v != null ? `${Number(v).toFixed(1)}%` : "—", name];
                                    return [`${num(Number(v))} m³`, name];
                                }}
                            />
                            <Legend wrapperStyle={{ fontSize: 11, color: "var(--foreground)" }} />
                            <ReferenceLine yAxisId="right" y={95} stroke="var(--mb-success)" strokeDasharray="4 4" ifOverflow="extendDomain" />
                            <Bar yAxisId="left" dataKey="inlet" name="Inlet load" fill="var(--chart-brand)" radius={[3, 3, 0, 0]} maxBarSize={22} />
                            <Line yAxisId="right" dataKey="eff" name="Efficiency" stroke="var(--chart-stp-primary)" strokeWidth={2} dot={false} connectNulls />
                        </ComposedChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Metric × day heatmap */}
            <MetricHeatmap
                title={`Daily Process Heatmap — ${model.days[model.days.length - 1]?.date.toLocaleString("en-US", { month: "long", year: "numeric" })}`}
                note="Each cell is one day for that process dimension (efficiency %, inlet & TSE reuse in thousand m³, tanker trips). Redder = worse — a row turning red across days pinpoints when a problem began."
                icon={Droplets}
                columns={heat.columns}
                rows={heat.rows}
            />

            {/* Exceptions & Actions */}
            <ExceptionsRegister
                rows={exceptions}
                title={`Exceptions & Actions — ${summary.periodLabel}`}
                subtitle="Auto-generated from the range's daily readings: low recovery, stopped reuse, inlet surges, missing/zero days, high tanker discharge and sharp efficiency drops."
                filename={`stp-exceptions-${model.days[0]?.iso ?? "range"}`}
                emptyHint="Every logged day is within tolerance for efficiency, load, reuse and tanker activity across the selected range."
            />
        </div>
    );
}
