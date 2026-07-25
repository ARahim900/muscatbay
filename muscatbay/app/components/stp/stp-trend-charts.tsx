"use client";

/**
 * STP trend charts — Recharts replacements for the three hand-rolled SVG charts
 * that used to live inline in app/stp/page.tsx.
 *
 * What was wrong with the SVG versions
 * ------------------------------------
 *  - no tooltips and no hover: you could see a spike but never read its value;
 *  - three y-ticks only (0 / 50% / 100% of max), so the axis was unreadable;
 *  - `sampleChartData` silently kept only every Nth point once the series went
 *    past 120 (daily) / 72 (monthly) points — a one-day spike could vanish with
 *    no indication that anything had been dropped.
 *
 * These render EVERY point (nothing is dropped), with proper axes, units, and
 * tooltips, using the same Recharts idiom as the other 17 chart files.
 */

import { memo } from "react";
import {
    ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { cn } from "@/lib/utils";
import { useChartMotion } from "@/hooks/useReducedMotion";

export type ChartView = "daily" | "monthly";

export interface STPChartDataPoint {
    month: string;
    sortKey: string;
    inlet: number;
    tse: number;
    income: number;
    savings: number;
    trips: number;
}

const CHART_COLORS = {
    primary: "var(--chart-stp-primary)",
    success: "var(--chart-success)",
    brand: "var(--chart-brand)",
    amber: "var(--chart-amber)",
    inlet: "var(--chart-inlet)",
} as const;

const TIP_STYLE = {
    fontSize: 12,
    borderRadius: 8,
    background: "var(--card)",
    color: "var(--foreground)",
    border: "1px solid var(--border)",
} as const;

const AXIS_TICK = { fontSize: 11, fill: "var(--chart-axis)" } as const;
const X_TICK = { fontSize: 10, fill: "var(--chart-axis)" } as const;

const compact = (v: number): string => {
    if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}m`;
    if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(1)}k`;
    return v % 1 !== 0 ? v.toFixed(1) : String(v);
};

const fmt = (v: number, unit: string) =>
    `${v.toLocaleString("en-US", { maximumFractionDigits: 1 })} ${unit}`;

type TipValue = number | string | ReadonlyArray<number | string> | undefined;

export function ChartViewToggle({ value, onChange }: { value: ChartView; onChange: (v: ChartView) => void }) {
    return (
        <div className="flex items-center gap-0.5 rounded-lg bg-muted p-0.5">
            {(["daily", "monthly"] as const).map((v) => (
                <button
                    key={v}
                    type="button"
                    onClick={() => onChange(v)}
                    aria-pressed={value === v}
                    className={cn(
                        "px-3 py-1 text-xs font-medium rounded-md transition-design capitalize",
                        value === v
                            ? "bg-card text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground",
                    )}
                >
                    {v}
                </button>
            ))}
        </div>
    );
}

/** Small honesty line under each chart: how many points are actually drawn. */
function PointCount({ count, view }: { count: number; view: ChartView }) {
    return (
        <p className="mt-1 text-center text-[10px] text-muted-foreground">
            All {count.toLocaleString("en-US")} {view === "daily" ? "day" : "month"}
            {count === 1 ? "" : "s"} in range plotted — no points sampled out.
        </p>
    );
}

export const STPVolumeChart = memo(function STPVolumeChart({ data, view }: { data: STPChartDataPoint[]; view: ChartView }) {
    const chartMotion = useChartMotion();
    return (
        <div className="w-full min-w-0">
            <div
                role="img"
                aria-label="Water treatment volumes area chart showing sewage inlet versus TSE reuse output in cubic meters over the selected period"
                className="h-[320px] min-h-[260px] w-full"
            >
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="stp-inlet-area" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={CHART_COLORS.brand} stopOpacity={0.28} />
                                <stop offset="100%" stopColor={CHART_COLORS.brand} stopOpacity={0.04} />
                            </linearGradient>
                            <linearGradient id="stp-tse-area" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={CHART_COLORS.primary} stopOpacity={0.24} />
                                <stop offset="100%" stopColor={CHART_COLORS.primary} stopOpacity={0.04} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="4 4" stroke="var(--chart-grid)" vertical={false} />
                        <XAxis dataKey="month" tick={X_TICK} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={24} dy={6} />
                        <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} tickFormatter={compact} width={56}
                            label={{ value: "m³", angle: -90, position: "insideLeft", style: { textAnchor: "middle", fill: "var(--chart-axis)", fontSize: 11 } }} />
                        <Tooltip
                            contentStyle={TIP_STYLE}
                            cursor={{ stroke: "var(--chart-cursor-stroke)", strokeWidth: 2 }}
                            formatter={(v: TipValue, name) => [fmt(Number(v), "m³"), name]}
                        />
                        <Legend iconType="circle" wrapperStyle={{ paddingTop: 8, fontSize: 11 }} />
                        <Area type="monotone" dataKey="inlet" name="Sewage Inlet" stroke={CHART_COLORS.brand} fill="url(#stp-inlet-area)" strokeWidth={view === "daily" ? 2 : 3} activeDot={{ r: 5, stroke: "var(--card)", strokeWidth: 2 }} {...chartMotion}/>
                        <Area type="monotone" dataKey="tse" name="TSE Output" stroke={CHART_COLORS.primary} fill="url(#stp-tse-area)" strokeWidth={view === "daily" ? 2 : 3} activeDot={{ r: 5, stroke: "var(--card)", strokeWidth: 2 }} {...chartMotion}/>
                    </AreaChart>
                </ResponsiveContainer>
            </div>
            <PointCount count={data.length} view={view} />
        </div>
    );
});

export const STPEconomicChart = memo(function STPEconomicChart({ data, view }: { data: STPChartDataPoint[]; view: ChartView }) {
    const chartMotion = useChartMotion();
    return (
        <div className="w-full min-w-0">
            <div
                role="img"
                aria-label="Economic impact bar chart showing income and savings from TSE reuse in Omani Rials over the selected period"
                className="h-[280px] min-h-[240px] w-full"
            >
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="4 4" stroke="var(--chart-grid)" vertical={false} />
                        <XAxis dataKey="month" tick={X_TICK} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={24} dy={6} />
                        <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} tickFormatter={compact} width={56}
                            label={{ value: "OMR", angle: -90, position: "insideLeft", style: { textAnchor: "middle", fill: "var(--chart-axis)", fontSize: 11 } }} />
                        <Tooltip
                            contentStyle={TIP_STYLE}
                            cursor={{ fill: "var(--chart-cursor-fill)", radius: 6 }}
                            formatter={(v: TipValue, name) => [fmt(Number(v), "OMR"), name]}
                        />
                        <Legend iconType="circle" wrapperStyle={{ paddingTop: 8, fontSize: 11 }} />
                        <Bar dataKey="income" name="Income" fill={CHART_COLORS.success} radius={[3, 3, 0, 0]} maxBarSize={18} {...chartMotion}/>
                        <Bar dataKey="savings" name="Savings" fill={CHART_COLORS.inlet} radius={[3, 3, 0, 0]} maxBarSize={18} {...chartMotion}/>
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <PointCount count={data.length} view={view} />
        </div>
    );
});

export const STPTankerChart = memo(function STPTankerChart({ data, view }: { data: STPChartDataPoint[]; view: ChartView }) {
    const chartMotion = useChartMotion();
    return (
        <div className="w-full min-w-0">
            <div
                role="img"
                aria-label="Tanker operations line chart showing number of tanker trips over the selected period"
                className="h-[280px] min-h-[240px] w-full"
            >
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="4 4" stroke="var(--chart-grid)" vertical={false} />
                        <XAxis dataKey="month" tick={X_TICK} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={24} dy={6} />
                        <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} allowDecimals={false} width={44}
                            label={{ value: "trips", angle: -90, position: "insideLeft", style: { textAnchor: "middle", fill: "var(--chart-axis)", fontSize: 11 } }} />
                        <Tooltip
                            contentStyle={TIP_STYLE}
                            cursor={{ stroke: "var(--chart-cursor-stroke)", strokeWidth: 2 }}
                            formatter={(v: TipValue, name) => [`${Number(v).toLocaleString("en-US")} trips`, name]}
                        />
                        <Legend iconType="circle" wrapperStyle={{ paddingTop: 8, fontSize: 11 }} />
                        <Line
                            type="monotone"
                            dataKey="trips"
                            name="Tanker Trips"
                            stroke={CHART_COLORS.amber}
                            strokeWidth={view === "daily" ? 2 : 3}
                            dot={data.length <= 60 ? { r: 3, strokeWidth: 1, fill: "var(--card)" } : false}
                            activeDot={{ r: 5, stroke: "var(--card)", strokeWidth: 2 }}
                            {...chartMotion}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
            <PointCount count={data.length} view={view} />
        </div>
    );
});
