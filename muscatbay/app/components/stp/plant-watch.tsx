"use client";

/**
 * Plant Watch — the STP section's inspection-first landing, modelled on the
 * Water Zone Watch. One screen answers "is the plant healthy, and if not, what
 * do I do?": a briefing strip, severity-first process table (worst first,
 * including data completeness), a consolidated load-vs-recovery chart, a
 * metric×day heatmap that pinpoints the day a problem started — and whose cells
 * drill through to that day in the operations log — and the auto-generated
 * findings register.
 *
 * Every band shown comes from lib/thresholds.ts and is printed in the UI.
 */

import { useMemo, useState } from "react";
import {
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import {
    Activity, Gauge, Droplets, Recycle, Truck, DollarSign, AlertTriangle,
    CheckCircle2, CalendarCheck, TrendingUp,
} from "lucide-react";
import type { STPOperation } from "@/lib/mock-data";
import { STP_THRESHOLDS } from "@/lib/thresholds";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    ExportButton, SortableTableHead, TableToolbar, type ExportColumn,
} from "@/components/shared/data-table";
import { SectionBoundary } from "@/components/shared/section-boundary";
import {
    MetricHeatmap, InspectionTicker, SeverityChip, Sparkline, SEV_UI, SEVERITY_LABEL, SEVERITY_RANK, worstFirst,
    type HealthMetric, type TickerStat,
} from "@/components/shared/inspection";
import { FindingsRegister } from "@/components/shared/findings-register";
import { cn } from "@/lib/utils";
import {
    buildSTPModel, buildHealthMetrics, buildHeatmap, buildSTPFindings, effSeverity, STP_GATE_NOTE,
    type STPDay,
} from "./stp-analytics";
import { useChartMotion } from "@/hooks/useReducedMotion";

const TIP_STYLE = {
    fontSize: 12, borderRadius: 8,
    background: "var(--card)", color: "var(--foreground)", border: "1px solid var(--border)",
} as const;

type TipValue = number | string | ReadonlyArray<number | string> | undefined;

/** Trailing window for the load-vs-recovery chart, in days. */
type ChartRange = 7 | 30 | 90;

const CHART_RANGES: ReadonlyArray<{ value: ChartRange; label: string }> = [
    { value: 90, label: "Last 90 days" },
    { value: 30, label: "Last 30 days" },
    { value: 7, label: "Last 7 days" },
];

const num = (x: number, frac = 0) => x.toLocaleString("en-US", { maximumFractionDigits: frac });

type ProcessSortField = "status" | "summary";

/** CSV columns for the process-health export — identification fields only. */
const PROCESS_EXPORT_COLUMNS: ExportColumn<HealthMetric>[] = [
    { key: 'title', header: 'Process' },
    { key: 'severity', header: 'Status', format: (m) => SEVERITY_LABEL[m.severity] },
    { key: 'headline', header: 'Current Summary' },
    { key: 'headlineNote', header: 'Operating Context', format: (m) => m.headlineNote ?? '' },
    { key: 'facts', header: 'Supporting Metrics', format: (m) => (m.facts ?? []).map((f) => `${f.label} ${f.value}`).join(' · ') },
];

function ProcessHealthTable({
    metrics,
    totalMetrics,
    attentionOnly,
    onAttentionOnlyChange,
}: {
    metrics: HealthMetric[];
    totalMetrics: number;
    attentionOnly: boolean;
    onAttentionOnlyChange: (active: boolean) => void;
}) {
    const [sortField, setSortField] = useState<ProcessSortField | null>(null);
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

    const handleSort = (field: string) => {
        const f = field as ProcessSortField;
        if (sortField === f) {
            setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
        } else {
            setSortField(f);
            setSortDirection("asc");
        }
    };

    // Unsorted order is worst-first (the inspection default); clicking a header
    // re-orders by that column instead.
    const sortedMetrics = useMemo(() => {
        if (!sortField) return metrics;
        const dir = sortDirection === "asc" ? 1 : -1;
        return [...metrics].sort((a, b) => {
            if (sortField === "status") return (SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]) * dir;
            const na = parseFloat(a.headline.replace(/[^0-9.eE+-]/g, ""));
            const nb = parseFloat(b.headline.replace(/[^0-9.eE+-]/g, ""));
            if (Number.isNaN(na) || Number.isNaN(nb)) return a.headline.localeCompare(b.headline) * dir;
            return (na - nb) * dir;
        });
    }, [metrics, sortField, sortDirection]);

    return (
        <div className="space-y-2">
            <div className="overflow-hidden rounded-[10.5px] border border-border bg-card shadow-card-standard [&_.ops-table-shell]:rounded-none [&_.ops-table-shell]:border-0 [&_.ops-table-shell]:shadow-none">
                <TableToolbar
                    title="Process health"
                    count={metrics.length === totalMetrics ? `${totalMetrics} indicators` : `${metrics.length} of ${totalMetrics} indicators`}
                >
                    <button
                        type="button"
                        onClick={() => onAttentionOnlyChange(!attentionOnly)}
                        aria-pressed={attentionOnly}
                        className={cn(
                            "inline-flex min-h-8 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/60",
                            attentionOnly
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-card text-muted-foreground hover:bg-muted-bg hover:text-foreground",
                        )}
                    >
                        <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                        Attention only
                    </button>
                    <ExportButton rows={sortedMetrics} filename="stp-process-health" columns={PROCESS_EXPORT_COLUMNS} />
                </TableToolbar>

                <Table
                    data-density="compact"
                    className="min-w-0 table-fixed md:min-w-[860px] md:table-auto"
                    aria-label="STP process health"
                >
                    <TableHeader>
                        <TableRow>
                            <SortableTableHead field="status" currentSortField={sortField} currentSortDirection={sortDirection} onSort={handleSort} className="col-sticky w-[46%] md:w-auto md:min-w-[190px]">Process / status</SortableTableHead>
                            <SortableTableHead field="summary" currentSortField={sortField} currentSortDirection={sortDirection} onSort={handleSort} align="right" className="num w-[54%] text-right md:w-auto md:min-w-[150px]">Current summary</SortableTableHead>
                            <TableHead className="hidden min-w-[260px] md:table-cell">Operating context</TableHead>
                            <TableHead className="num hidden min-w-[165px] text-right md:table-cell">Supporting metrics</TableHead>
                            <TableHead className="num hidden min-w-[145px] text-right md:table-cell">Recent trend</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedMetrics.map((metric) => {
                            const severityUi = SEV_UI[metric.severity];
                            const isCalm = metric.severity === "good" || metric.severity === "nodata";
                            const sparkPointCount = metric.spark?.filter((value) => value !== null && Number.isFinite(value)).length ?? 0;

                            return (
                                <TableRow key={metric.key}>
                                    <TableCell
                                        className="col-sticky strong"
                                        style={{ boxShadow: `inset 3px 0 0 ${severityUi.base}` }}
                                    >
                                        <div className="flex min-h-11 flex-col items-start justify-center gap-1.5 md:flex-row md:items-center md:justify-between md:gap-3">
                                            <span className="min-w-0 text-[13px] font-semibold leading-snug text-foreground">
                                                {metric.title}
                                            </span>
                                            <SeverityChip severity={metric.severity} />
                                        </div>
                                    </TableCell>
                                    <TableCell className="num">
                                        <div className="ms-auto max-w-[190px] text-right">
                                            <p
                                                className="font-bold tabular-nums"
                                                style={{ color: isCalm ? "var(--foreground)" : severityUi.text }}
                                            >
                                                {metric.headline}
                                            </p>
                                            {metric.headlineNote && (
                                                <p className="mt-0.5 text-[10px] font-normal leading-snug text-muted-foreground md:hidden">
                                                    {metric.headlineNote}
                                                </p>
                                            )}
                                            {metric.facts && metric.facts.length > 0 && (
                                                <p className="mt-1 text-[10px] font-normal text-muted-foreground md:hidden">
                                                    {metric.facts.slice(0, 2).map((fact) => `${fact.label} ${fact.value}`).join(" · ")}
                                                </p>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">
                                        <p className="max-w-[300px] text-xs font-normal leading-snug text-muted-foreground">
                                            {metric.headlineNote ?? "—"}
                                        </p>
                                        {metric.signal && (
                                            <span className={cn(
                                                "mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                                                metric.signal.tone === "danger"
                                                    ? "bg-mb-danger-light text-mb-danger-text"
                                                    : "bg-mb-warning-light text-mb-warning-text",
                                            )}>
                                                <TrendingUp className="h-2.5 w-2.5" aria-hidden="true" />
                                                {metric.signal.label}
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="num hidden md:table-cell">
                                        {metric.facts && metric.facts.length > 0 ? (
                                            <div className="space-y-0.5 text-right text-[11px] font-normal text-muted-foreground">
                                                {metric.facts.slice(0, 2).map((fact) => (
                                                    <p key={fact.label}>
                                                        {fact.label} <span className="font-semibold text-foreground tabular-nums">{fact.value}</span>
                                                    </p>
                                                ))}
                                            </div>
                                        ) : "—"}
                                    </TableCell>
                                    <TableCell className="num hidden md:table-cell">
                                        <div className="ms-auto flex w-[120px] items-center justify-end">
                                            {metric.spark && sparkPointCount >= 2 ? (
                                                <Sparkline
                                                    values={metric.spark}
                                                    stroke={isCalm ? "var(--chart-success)" : "var(--chart-loss)"}
                                                    className="w-24"
                                                />
                                            ) : (
                                                <span className="text-muted-foreground" title="Not enough trend data">—</span>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {metrics.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                                    No STP process indicators need attention in this period.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                <p className="sr-only" aria-live="polite">
                    Showing {metrics.length} of {totalMetrics} STP process indicators.
                </p>
            </div>
            <p className="text-[11px] leading-snug text-muted-foreground">
                <span className="font-semibold uppercase tracking-wide">Thresholds in force · </span>{STP_GATE_NOTE}
            </p>
        </div>
    );
}

export function PlantWatch({
    operations, onInspectDay,
}: {
    operations: STPOperation[];
    /** Drill-through from a heatmap cell to that day in the daily operations log. */
    onInspectDay?: (day: { iso: string; ym: string; dayLabel: string; date: Date }) => void;
}) {
    const chartMotion = useChartMotion();
    const [attentionOnly, setAttentionOnly] = useState(false);
    const [chartRange, setChartRange] = useState<ChartRange>(30);
    const model = useMemo(() => buildSTPModel(operations), [operations]);
    const metrics = useMemo(() => worstFirst(buildHealthMetrics(model)), [model]);
    const visibleMetrics = useMemo(
        () => attentionOnly ? metrics.filter((metric) => metric.severity !== "good") : metrics,
        [attentionOnly, metrics],
    );
    const heat = useMemo(
        () => buildHeatmap(model, onInspectDay ? (d: STPDay) => onInspectDay(d) : undefined),
        [model, onInspectDay],
    );
    const findings = useMemo(() => buildSTPFindings(model), [model]);

    // Consolidated load-vs-recovery chart. The window is the reader's choice —
    // 7d to see the last week's shape, 90d to judge whether a dip is a trend or
    // a blip. 30d is the default because it matches the process-health tiles.
    //
    // `tse` is carried through RAW: buildSTPModel deliberately never clamps a
    // negative TSE, because a below-zero reading is a data fault worth seeing.
    // An area that dips under the axis is exactly the right way to show it.
    const chartData = useMemo(
        () => model.days.slice(-chartRange).map((d) => ({
            day: d.dayLabel, inlet: d.inlet, tse: d.tse, eff: d.eff,
        })),
        [model.days, chartRange],
    );
    const rangeLabel = CHART_RANGES.find((r) => r.value === chartRange)?.label ?? "Last 30 days";

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
    const completeness = summary.completenessPct;

    const tickerItems: TickerStat[] = [
        { icon: Gauge, label: "Efficiency", value: summary.avgEfficiency !== null ? `${summary.avgEfficiency.toFixed(1)}%` : "—", tone: effTone, title: `TSE ÷ inlet · target ≥ ${STP_THRESHOLDS.RECOVERY_GOOD}%` },
        { icon: Droplets, label: "Inlet treated", value: <>{num(summary.totalInlet)} <span className="text-muted-foreground">m³</span></> },
        { icon: Recycle, label: "TSE reused", value: <>{num(summary.totalTSE)} <span className="text-muted-foreground">m³</span></> },
        { icon: Truck, label: "Tanker trips", value: num(summary.totalTrips) },
        { icon: DollarSign, label: "Economic impact", value: <>{num(summary.economicImpact)} <span className="text-muted-foreground">OMR</span></> },
        {
            // Data completeness was computed and never rendered — a period missing
            // a third of its days used to look as trustworthy as a full one.
            icon: CalendarCheck,
            label: "Days logged",
            value: `${summary.daysLogged}/${summary.daysExpected}${completeness !== null ? ` · ${completeness.toFixed(0)}%` : ""}`,
            tone: completeness === null ? "default" : completeness >= 98 ? "success" : completeness >= 90 ? "warning" : "danger",
            title: `${summary.missingDays} calendar day${summary.missingDays === 1 ? "" : "s"} in this span have no record`,
        },
        {
            icon: findings.length > 0 ? AlertTriangle : CheckCircle2,
            label: "Findings",
            value: findings.length > 0 ? `${findings.length} to review` : "0 · all clear",
            tone: findings.length > 0 ? "danger" : "success",
        },
    ];

    return (
        <div className="space-y-6">
            {/* Briefing ticker — same idiom as the Water Daily strip */}
            <SectionBoundary title="Plant briefing">
                <InspectionTicker caption={`Plant briefing · ${summary.periodLabel}`} items={tickerItems} />
            </SectionBoundary>

            {/* Process health — same compact table language as Water and Electricity */}
            <SectionBoundary title="Process health">
                <ProcessHealthTable
                    metrics={visibleMetrics}
                    totalMetrics={metrics.length}
                    attentionOnly={attentionOnly}
                    onAttentionOnlyChange={setAttentionOnly}
                />
            </SectionBoundary>

            {/* Consolidated load vs recovery */}
            <SectionBoundary title="Load vs recovery">
                <Card className="card-elevated">
                    <CardHeader className="card-elevated-header flex flex-col gap-3 p-4 pb-2 sm:flex-row sm:items-start sm:p-5 md:p-6">
                        <div className="grid flex-1 gap-1">
                            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                <Gauge className="h-4 w-4 text-secondary" aria-hidden="true" />
                                Load vs Recovery
                            </CardTitle>
                            <p className="text-xs text-muted-foreground">
                                Daily inlet (hydraulic load) against the TSE sent to irrigation, both m³.
                                The gap between the two bands is the water that never made it back out —
                                recovery is {STP_THRESHOLDS.RECOVERY_GOOD}% or better on a good day, and the
                                exact figure for any day is in the tooltip.
                            </p>
                        </div>
                        {/* Base UI's Select.Value renders the raw value, not the
                            matched item's text, so the value IS the label here —
                            the same shape as every other Select in the app. */}
                        <Select
                            value={rangeLabel}
                            onValueChange={(v) =>
                                setChartRange(CHART_RANGES.find((r) => r.label === v)?.value ?? 30)
                            }
                        >
                            <SelectTrigger
                                className="w-full rounded-lg sm:ml-auto sm:w-[160px]"
                                aria-label="Select the reporting window"
                            >
                                <SelectValue placeholder="Last 30 days" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                {CHART_RANGES.map((r) => (
                                    <SelectItem key={r.value} value={r.label} className="rounded-lg">
                                        {r.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </CardHeader>
                    <CardContent className="p-4 pt-2 sm:p-5 md:p-6">
                        <ResponsiveContainer width="100%" height={280}>
                            <AreaChart data={chartData} margin={{ top: 6, right: 8, left: -8, bottom: 0 }}>
                                {/* Bands are LAYERED, not stacked. Stacking would draw a total of
                                    inlet + TSE, which is not a quantity that exists: TSE is the
                                    portion of the inlet that came back out, so it belongs inside
                                    the inlet band, not on top of it. */}
                                <defs>
                                    <linearGradient id="stpFillInlet" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--chart-brand)" stopOpacity={0.55} />
                                        <stop offset="95%" stopColor="var(--chart-brand)" stopOpacity={0.06} />
                                    </linearGradient>
                                    <linearGradient id="stpFillTse" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--chart-stp-primary)" stopOpacity={0.75} />
                                        <stop offset="95%" stopColor="var(--chart-stp-primary)" stopOpacity={0.1} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--chart-grid)" />
                                <XAxis
                                    dataKey="day"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    minTickGap={24}
                                    tick={{ fontSize: 10, fill: "var(--chart-axis)" }}
                                />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    width={64}
                                    unit=" m³"
                                    tick={{ fontSize: 11, fill: "var(--chart-axis)" }}
                                />
                                <Tooltip
                                    contentStyle={TIP_STYLE}
                                    cursor={{ stroke: "var(--chart-axis)", strokeOpacity: 0.35 }}
                                    formatter={(v: TipValue, name) => [`${num(Number(v))} m³`, name]}
                                    labelFormatter={(label, payload) => {
                                        // Recovery is the point of the chart, so it rides on the
                                        // tooltip label rather than costing a second axis.
                                        // Recharts types `label` as ReactNode and overloads
                                        // `payload`, so narrow both rather than casting to any.
                                        const first = Array.isArray(payload) ? payload[0] : undefined;
                                        const point = first?.payload as { eff?: number | null } | undefined;
                                        const eff = point?.eff;
                                        return eff == null ? label : `${String(label)} · ${eff.toFixed(1)}% recovered`;
                                    }}
                                />
                                <Legend wrapperStyle={{ fontSize: 11, color: "var(--foreground)" }} />
                                <Area
                                    dataKey="inlet"
                                    name="Inlet load"
                                    type="natural"
                                    fill="url(#stpFillInlet)"
                                    stroke="var(--chart-brand)"
                                    strokeWidth={2}
                                    {...chartMotion}
                                />
                                <Area
                                    dataKey="tse"
                                    name="TSE to irrigation"
                                    type="natural"
                                    fill="url(#stpFillTse)"
                                    stroke="var(--chart-stp-primary)"
                                    strokeWidth={2}
                                    {...chartMotion}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </SectionBoundary>

            {/* Metric × day heatmap */}
            <SectionBoundary title="Daily process heatmap">
                <MetricHeatmap
                    title={`Daily Process Heatmap — ${model.days[model.days.length - 1]?.date.toLocaleString("en-US", { month: "long", year: "numeric" })}`}
                    note={`Each cell is one day for that process dimension (efficiency %, inlet & TSE reuse in thousand m³, tanker trips). Redder = worse — a row turning red across days pinpoints when a problem began. Select a cell to open that day in the operations log. ${STP_GATE_NOTE}`}
                    icon={Droplets}
                    columns={heat.columns}
                    rows={heat.rows}
                />
            </SectionBoundary>

            {/* Findings — identification only, no assignment or resolution tracking */}
            <SectionBoundary title="Findings register">
                <FindingsRegister
                    rows={findings}
                    title={`Findings — ${summary.periodLabel}`}
                    subtitle="Auto-generated from the range's daily readings: low recovery, stopped reuse, negative TSE, inlet surges, zero-inlet days, high tanker discharge and sharp efficiency drops. Runs of the same finding on consecutive logged days are collapsed into one row."
                    filename={`stp-findings-${model.days[0]?.iso ?? "range"}`}
                    emptyHint="Every logged day is within tolerance for efficiency, load, reuse and tanker activity across the selected range."
                    gateNote={STP_GATE_NOTE}
                />
            </SectionBoundary>
        </div>
    );
}
