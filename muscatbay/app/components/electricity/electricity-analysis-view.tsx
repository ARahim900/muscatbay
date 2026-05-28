"use client";

// ─── Analysis-tab view — extracted verbatim from app/electricity/page.tsx.
//     Pure relocation; no behavior changes. Renders the analysis stats grid,
//     trend chart, top consumers, comparison chart, and monthly breakdown
//     table. State management remains in the page; this component only renders.

import type { LucideIcon } from "lucide-react";
import type { MeterReading } from "@/lib/mock-data";
import { StatsGrid, type StatVariant } from "@/components/shared/stats-grid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LiquidTooltip } from "@/components/charts/liquid-tooltip";
import {
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, BarChart, Bar, Cell, Legend, ReferenceLine,
    LineChart as RechartsLineChart, Line,
} from "recharts";
import { LineChart } from "lucide-react";
import { CHART_COLORS, meterColors } from "./electricity-shared";

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

interface AnalysisConsumerPoint {
    name: string;
    fullName: string;
    consumption: number;
    cost: number;
    color: string;
}

interface AnalysisComparisonPoint extends AnalysisConsumerPoint {
    isAboveAvg: boolean;
}

interface AnalysisTableRow extends MeterReading {
    rangeConsumption: number;
    rangeCost: number;
    monthlyReadings: Record<string, number>;
}

export interface AnalysisData {
    stats: AnalysisStat[];
    chartData: AnalysisMonthlyPoint[];
    perMeterChartData: Record<string, string | number>[];
    topConsumers: AnalysisConsumerPoint[];
    comparisonData: AnalysisComparisonPoint[];
    tableData: AnalysisTableRow[];
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
    totalMeterCount: number;
}

export function ElectricityAnalysisView({
    analysisData,
    analysisType,
    selectedMeter,
    metersOfSelectedType,
    totalMeterCount,
}: AnalysisViewProps) {
    return (
        <div id="panel-analysis" role="tabpanel" aria-labelledby="tab-analysis" tabIndex={0} className="space-y-6 motion-safe:animate-in motion-safe:fade-in duration-200">
            {/* Filtered Stats Grid */}
            <StatsGrid stats={analysisData.stats} />

            {/* Monthly Trend Chart */}
            <Card className="card-elevated">
                <CardHeader className="card-elevated-header">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <LineChart className="w-5 h-5 text-amber-500" />
                            {selectedMeter !== "All"
                                ? `Monthly Trend — ${analysisData.selectedMeterName}`
                                : analysisType !== "All" && metersOfSelectedType.length <= 10
                                    ? `Per-Meter Breakdown — ${analysisType}`
                                    : `Monthly Trend — ${analysisType === "All" ? "All Types" : analysisType}`
                            }
                        </CardTitle>
                        {analysisType !== "All" && selectedMeter === "All" && metersOfSelectedType.length <= 10 && (
                            <Badge variant="outline" className="text-xs font-normal px-2.5 py-1">
                                {metersOfSelectedType.length} meters
                            </Badge>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <div role="img" aria-label={`Electricity consumption trend for ${analysisType === 'All' ? 'all meter types' : analysisType}: chart showing kilowatt-hour usage over time per meter or aggregate`} className="h-[280px] sm:h-[340px] md:h-[380px] min-h-[260px]">
                        <ResponsiveContainer width="100%" height="100%">
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
                                            animationDuration={600}
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
                                    <Area type="monotone" dataKey="consumption" name="Consumption" stroke={CHART_COLORS.secondary} fill="url(#anlGrad)" strokeWidth={3} activeDot={{ r: 6, stroke: 'var(--card)', strokeWidth: 2 }} animationDuration={600} />
                                </AreaChart>
                            )}
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Comparison & Top Consumers Charts Row */}
            <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
                {/* Top Consumers Bar Chart */}
                <Card className="card-elevated">
                    <CardHeader className="card-elevated-header">
                        <CardTitle className="text-lg">Top 10 {analysisType === "All" ? "Overall" : analysisType} Consumers</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div role="img" aria-label={`Top 10 electricity consumers bar chart for ${analysisType === 'All' ? 'all types' : analysisType}, ranked by kilowatt-hour consumption`} className="h-[300px] sm:h-[350px] md:h-[400px] min-h-[260px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={analysisData.topConsumers}
                                    layout="vertical"
                                    margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
                                >
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
                                        width={150}
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 11, fill: "var(--chart-axis)" }}
                                    />
                                    <Tooltip
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const data = payload[0].payload as AnalysisConsumerPoint;
                                                return (
                                                    <div className="card-elevated px-4 py-3 border border-border/40 shadow-xl !rounded-xl !bg-card">
                                                        <p className="text-sm font-semibold text-foreground mb-2">{data.fullName}</p>
                                                        <div className="flex items-center gap-2 text-xs mb-1">
                                                            <div className="w-2 h-2 rounded-full bg-mb-warning" />
                                                            <span className="text-muted-foreground">Consumption:</span>
                                                            <span className="font-mono font-medium text-foreground">
                                                                {data.consumption.toLocaleString('en-US', { maximumFractionDigits: 1 })} kWh
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs">
                                                            <div className="w-2 h-2 rounded-full bg-mb-success" />
                                                            <span className="text-muted-foreground">Cost:</span>
                                                            <span className="font-mono font-medium text-[var(--mb-success-text)]">
                                                                {data.cost.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} OMR
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                        cursor={{ fill: 'var(--chart-cursor-fill)', radius: 6 }}
                                    />
                                    <Bar
                                        dataKey="consumption"
                                        radius={[0, 8, 8, 0]}
                                        barSize={28}
                                        animationDuration={600}
                                    >
                                        {(analysisData.topConsumers || []).map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Per-Meter Comparison vs Average (only when a specific type is selected) */}
                {analysisType !== "All" && analysisData.comparisonData.length > 1 && (
                    <Card className="card-elevated">
                        <CardHeader className="card-elevated-header">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">Meter vs Average — {analysisType}</CardTitle>
                                <Badge variant="outline" className="text-xs font-normal px-2.5 py-1">
                                    Avg: {(analysisData.typeAverage / 1000).toFixed(1)} MWh
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div role="img" aria-label={`Meter vs type average bar chart for ${analysisType}: comparing each meter's consumption against the group average`} className="h-[300px] sm:h-[350px] md:h-[400px] min-h-[260px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={analysisData.comparisonData}
                                        layout="vertical"
                                        margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
                                    >
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
                                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: data.color }} />
                                                                <span className="text-muted-foreground">Total:</span>
                                                                <span className="font-mono font-medium">{data.consumption.toLocaleString('en-US', { maximumFractionDigits: 1 })} kWh</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-xs">
                                                                <div className="w-2 h-2 rounded-full bg-mb-warning" />
                                                                <span className="text-muted-foreground">vs Avg:</span>
                                                                <span className={`font-mono font-medium ${diff > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                                                    {diff > 0 ? '+' : ''}{pct}%
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                            cursor={{ fill: 'var(--chart-cursor-fill)', radius: 6 }}
                                        />
                                        <Bar dataKey="consumption" radius={[0, 8, 8, 0]} barSize={24} animationDuration={600}>
                                            {analysisData.comparisonData.map((entry, index) => (
                                                <Cell key={`comp-${index}`} fill={entry.isAboveAvg ? CHART_COLORS.loss : CHART_COLORS.success} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Monthly Breakdown Table */}
            <Card className="card-elevated">
                <CardHeader className="card-elevated-header">
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-lg">Monthly Breakdown</CardTitle>
                        <div className="text-xs text-muted-foreground">
                            Showing {analysisData.tableData.length} of {totalMeterCount} meters · {analysisData.selectedMonths.length} months
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-auto max-h-[calc(100vh-20rem)] sm:max-h-[600px] rounded-xl">
                        <Table data-density="compact">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="col-sticky min-w-[180px]">Name</TableHead>
                                    <TableHead className="min-w-[100px]">Account #</TableHead>
                                    {analysisData.selectedMonths.map(month => (
                                        <TableHead key={month} className="text-right min-w-[75px]">{month}</TableHead>
                                    ))}
                                    <TableHead className="num min-w-[90px]">Total (kWh)</TableHead>
                                    <TableHead className="text-right min-w-[90px]">Cost (OMR)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {analysisData.tableData.map((meter) => (
                                    <TableRow key={meter.id}>
                                        <TableCell className="col-sticky strong">{meter.name}</TableCell>
                                        <TableCell className="meter">{meter.account_number}</TableCell>
                                        {analysisData.selectedMonths.map(month => {
                                            const val = meter.monthlyReadings?.[month] || 0;
                                            return (
                                                <TableCell key={month} className="num">
                                                    {val > 0 ? val.toLocaleString('en-US', { maximumFractionDigits: 1 }) : <span className="text-muted-foreground/70 dark:text-muted-foreground">—</span>}
                                                </TableCell>
                                            );
                                        })}
                                        <TableCell className="num">
                                            {meter.rangeConsumption.toLocaleString('en-US', { maximumFractionDigits: 1 })}
                                        </TableCell>
                                        <TableCell className="num text-mb-success dark:text-mb-success-hover">
                                            {meter.rangeCost.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {analysisData.tableData.length > 1 && (
                                    <TableRow className="bg-muted/80 dark:bg-muted/60">
                                        <TableCell className="col-sticky strong">Total</TableCell>
                                        <TableCell />
                                        {analysisData.selectedMonths.map(month => {
                                            const monthTotal = analysisData.tableData.reduce((sum, m) => sum + (m.monthlyReadings?.[month] || 0), 0);
                                            return (
                                                <TableCell key={`total-${month}`} className="num">
                                                    {monthTotal > 0 ? monthTotal.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '—'}
                                                </TableCell>
                                            );
                                        })}
                                        <TableCell className="num">
                                            {analysisData.tableData.reduce((s, m) => s + m.rangeConsumption, 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                                        </TableCell>
                                        <TableCell className="num text-mb-success dark:text-mb-success-hover">
                                            {analysisData.tableData.reduce((s, m) => s + m.rangeCost, 0).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

