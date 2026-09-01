"use client";

// ─── Analysis-tab view — extracted verbatim from app/electricity/page.tsx.
//     Pure relocation; no behavior changes. Renders the analysis stats grid,
//     trend chart, top consumers, comparison chart, and monthly breakdown
//     table. State management remains in the page; this component only renders.

import type { LucideIcon } from "lucide-react";
import type { MeterReading } from "@/lib/mock-data";
import type { StatVariant } from "@/components/shared/stats-grid";
import { Badge } from "@/components/ui/badge";
import { LiquidTooltip } from "@/components/charts/liquid-tooltip";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, BarChart, Bar, Cell, Legend, ReferenceLine,
    LineChart as RechartsLineChart, Line,
} from "recharts";
import { CHART_COLORS, meterColors } from "./electricity-shared";
import { useChartMotion } from "@/hooks/useReducedMotion";
import { ChartContainer, ChartShell } from "@/components/charts/chart-container";

// Cap the number of meter bars drawn so the ranking chart stays readable; the
// full per-meter list lives in the unified table below it.
const CHART_METER_CAP = 25;

// ─── Structural shape of `analysisData` produced by the page's `useMemo`.
//     Kept in this file so we don't have to export the type from the page —
//     this is a pure render component, not a data contract.
interface AnalysisStat {
    label: string;
    value: string;
    subtitle: string;
    icon: LucideIcon;
    variant: StatVariant;
    trend: 'up' | 'down' | 'neutral';
    trendValue: string;
    invertTrend?: boolean;
}

interface AnalysisMonthlyPoint {
    month: string;
    consumption: number;
}

interface AnalysisComparisonPoint {
    id: string;
    name: string;
    fullName: string;
    consumption: number;
    cost: number;
    color: string;
    isAboveAvg: boolean;
}

export interface AnalysisData {
    stats: AnalysisStat[];
    chartData: AnalysisMonthlyPoint[];
    perMeterChartData: Record<string, string | number>[];
    comparisonData: AnalysisComparisonPoint[];
    selectedMonths: string[];
    typeAverage: number;
    dateRangeLabel: string;
    selectedMeterName: string | null;
}

interface AnalysisViewProps {
    analysisData: AnalysisData;
    analysisType: string;
    selectedMeter: string;
    metersOfSelectedType: MeterReading[];
}

export function ElectricityAnalysisView({
    analysisData,
    analysisType,
    selectedMeter,
    metersOfSelectedType,
}: AnalysisViewProps) {
    const chartMotion = useChartMotion();
    const trendTitle = selectedMeter !== "All"
        ? `Monthly Trend — ${analysisData.selectedMeterName}`
        : analysisType !== "All" && metersOfSelectedType.length <= 10
            ? `Per-Meter Breakdown — ${analysisType}`
            : `Monthly Trend — ${analysisType === "All" ? "All Types" : analysisType}`;
    const trendHasData = analysisType !== "All" && selectedMeter === "All" && metersOfSelectedType.length <= 10
        ? analysisData.perMeterChartData.length > 0
        : analysisData.chartData.length > 0;
    return (
        <div id="panel-analysis" role="tabpanel" aria-labelledby="tab-analysis" tabIndex={0} className="space-y-6 motion-safe:animate-in motion-safe:fade-in duration-200">
            {/* Monthly Trend Chart */}
            <ChartShell
                title={trendTitle}
                description="Selected-period electricity consumption, shown as a total trend or per-meter comparison."
                controls={analysisType !== "All" && selectedMeter === "All" && metersOfSelectedType.length <= 10 ? (
                            <Badge variant="outline" className="text-xs font-normal px-2.5 py-1">
                                {metersOfSelectedType.length} meters
                            </Badge>
                        ) : undefined}
                state={trendHasData ? "ready" : "empty"}
                interpretation="Investigate material changes against the selected period and confirm them at meter level before action."
            >
                    <div role="img" aria-label={`Electricity consumption trend for ${analysisType === 'All' ? 'all meter types' : analysisType}: chart showing kilowatt-hour usage over time per meter or aggregate`} className="h-[280px] sm:h-[340px] md:h-[380px] min-h-[260px]">
                        <ChartContainer minHeight={260}>
                            {/* Multi-line chart for type aggregate with ≤10 meters */}
                            {analysisType !== "All" && selectedMeter === "All" && metersOfSelectedType.length <= 10 ? (
                                <RechartsLineChart data={analysisData.perMeterChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--chart-axis)" }} axisLine={false} tickLine={false} dy={10} />
                                    <YAxis tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--chart-axis)" }} />
                                    <Tooltip
                                        content={({ active, payload, label }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="card-elevated px-4 py-3 border border-border/40 shadow-xl !rounded-xl !bg-card max-w-[280px]">
                                                        <p className="text-sm font-semibold text-foreground mb-2">{label}</p>
                                                        {[...payload].sort((a, b) => (Number(b.value) || 0) - (Number(a.value) || 0)).map((entry) => (
                                                            <div key={entry.name} className="flex items-center gap-2 text-xs mb-0.5">
                                                                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                                                                <span className="text-muted-foreground truncate">{entry.name}:</span>
                                                                <span className="font-mono font-medium text-foreground ml-auto">
                                                                    {(Number(entry.value) || 0).toLocaleString('en-US', { maximumFractionDigits: 1 })} kWh
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Legend iconType="circle" wrapperStyle={{ paddingTop: 10, fontSize: 11 }} />
                                    {metersOfSelectedType.map((meter, idx) => (
                                        <Line
                                            key={meter.id}
                                            type="monotone"
                                            dataKey={meter.name}
                                            stroke={meterColors[idx % meterColors.length]}
                                            strokeWidth={2.5}
                                            dot={{ r: 3, strokeWidth: 1, fill: 'var(--card)' }}
                                            activeDot={{ r: 5, stroke: 'var(--card)', strokeWidth: 2 }}
                                            {...chartMotion}
                                        />
                                    ))}
                                </RechartsLineChart>
                            ) : (
                                /* Single aggregate area chart */
                                <AreaChart data={analysisData.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="anlGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={CHART_COLORS.secondary} stopOpacity={0.4} />
                                            <stop offset="95%" stopColor={CHART_COLORS.secondary} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--chart-axis)" }} axisLine={false} tickLine={false} dy={10} />
                                    <YAxis tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--chart-axis)" }} />
                                    <Tooltip content={<LiquidTooltip />} cursor={{ stroke: 'var(--chart-cursor-stroke)', strokeWidth: 2 }} />
                                    <Legend iconType="circle" wrapperStyle={{ paddingTop: 10 }} />
                                    <Area type="monotone" dataKey="consumption" name="Consumption" stroke={CHART_COLORS.secondary} fill="url(#anlGrad)" strokeWidth={3} activeDot={{ r: 6, stroke: 'var(--card)', strokeWidth: 2 }} {...chartMotion}/>
                                </AreaChart>
                            )}
                        </ChartContainer>
                    </div>
            </ChartShell>

            {/* Meters ranked by consumption, measured against the group average —
                merges the former "Top Consumers" ranking and "Meter vs Average"
                distribution into one chart: bars are sorted high → low (the
                ranking), colored above / below the average, and the dashed line
                marks the average itself (the benchmark). The meter selected in
                the filter above is outlined so you can see where it sits. */}
            {(() => {
                const ranked = analysisData.comparisonData;
                const shown = ranked.slice(0, CHART_METER_CAP);
                const chartHeight = Math.min(720, Math.max(300, shown.length * 30 + 56));
                return (
                    <ChartShell
                        title={`Meters by Consumption — ${analysisType === "All" ? "All Types" : analysisType}`}
                        description="Meters ranked high to low, benchmarked against the selected group average."
                        controls={analysisData.typeAverage > 0 ? (
                                    <Badge variant="outline" className="text-xs font-normal px-2.5 py-1">
                                        Avg: {(analysisData.typeAverage / 1000).toFixed(1)} MWh
                                    </Badge>
                                ) : undefined}
                        state={shown.length > 0 ? "ready" : "empty"}
                        emptyMessage="No meters are available in the selected range."
                        interpretation="Review the highest consumers and above-average meters first, then confirm whether the variance is operational or data-related."
                    >
                            {shown.length > 0 ? (
                                <>
                                    <div
                                        role="img"
                                        aria-label={`Meters ranked by electricity consumption for ${analysisType === 'All' ? 'all types' : analysisType}, each bar colored above or below the group average, with a reference line at the average`}
                                        style={{ height: chartHeight }}
                                        className="min-h-[260px]"
                                    >
                                        <ChartContainer minHeight={260}>
                                            <BarChart data={shown} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--chart-grid)" />
                                                <XAxis
                                                    type="number"
                                                    tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`}
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fontSize: 11, fill: "var(--chart-axis)" }}
                                                />
                                                <YAxis
                                                    type="category"
                                                    dataKey="name"
                                                    width={160}
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fontSize: 11, fill: "var(--chart-axis)" }}
                                                />
                                                <ReferenceLine
                                                    x={analysisData.typeAverage}
                                                    stroke={CHART_COLORS.amber}
                                                    strokeWidth={2}
                                                    strokeDasharray="6 4"
                                                    label={{ value: 'Avg', position: 'top', fill: CHART_COLORS.amber, fontSize: 11, fontWeight: 600 }}
                                                />
                                                <Tooltip
                                                    content={({ active, payload }) => {
                                                        if (active && payload && payload.length) {
                                                            const data = payload[0].payload as AnalysisComparisonPoint;
                                                            const diff = data.consumption - analysisData.typeAverage;
                                                            const pct = analysisData.typeAverage > 0 ? ((diff / analysisData.typeAverage) * 100).toFixed(1) : '0';
                                                            return (
                                                                <div className="card-elevated px-4 py-3 border border-border/40 shadow-xl !rounded-xl !bg-card">
                                                                    <p className="text-sm font-semibold text-foreground mb-2">{data.fullName}</p>
                                                                    <div className="flex items-center gap-2 text-xs mb-1">
                                                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: data.isAboveAvg ? CHART_COLORS.loss : CHART_COLORS.success }} />
                                                                        <span className="text-muted-foreground">Consumption:</span>
                                                                        <span className="font-mono font-medium text-foreground">{data.consumption.toLocaleString('en-US', { maximumFractionDigits: 1 })} kWh</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 text-xs mb-1">
                                                                        <div className="w-2 h-2 rounded-full bg-mb-success" />
                                                                        <span className="text-muted-foreground">Cost:</span>
                                                                        <span className="font-mono font-medium text-[var(--mb-success-text)]">{data.cost.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} OMR</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 text-xs">
                                                                        <div className="w-2 h-2 rounded-full bg-mb-warning" />
                                                                        <span className="text-muted-foreground">vs Avg:</span>
                                                                        <span className={`font-mono font-medium ${diff > 0 ? 'text-mb-danger-text' : 'text-mb-success-text'}`}>{diff > 0 ? '+' : ''}{pct}%</span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    }}
                                                    cursor={{ fill: 'var(--chart-cursor-fill)', radius: 6 }}
                                                />
                                                <Bar dataKey="consumption" radius={[0, 8, 8, 0]} barSize={22} {...chartMotion}>
                                                    {shown.map((entry) => (
                                                        <Cell
                                                            key={entry.id}
                                                            fill={entry.isAboveAvg ? CHART_COLORS.loss : CHART_COLORS.success}
                                                            stroke={entry.id === selectedMeter ? 'var(--foreground)' : undefined}
                                                            strokeWidth={entry.id === selectedMeter ? 2 : 0}
                                                        />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ChartContainer>
                                    </div>
                                    <div className="mt-3 flex items-center justify-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground flex-wrap">
                                        <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: CHART_COLORS.loss }} />Above average</span>
                                        <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: CHART_COLORS.success }} />Below average</span>
                                        {ranked.length > CHART_METER_CAP && (
                                            <span>· Showing the top {CHART_METER_CAP} of {ranked.length} meters — full list in the table below</span>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
                                    <p className="text-sm font-semibold text-foreground">No meters in the selected range</p>
                                    <p className="text-xs text-muted-foreground">Adjust the year or date range above to load meter data.</p>
                                </div>
                            )}
                    </ChartShell>
                );
            })()}

        </div>
    );
}
