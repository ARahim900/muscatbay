"use client";

// ─── DCAnalyticsPanel + SupplyReconciliationTable — the Direct Connections tab
//     of the Daily report.
//
//     The tab answers one question: does the NAMA main bulk agree with what the
//     network below it measured? The gauges show the three stages, and the table
//     underneath lists every account behind them — the main bulk, all seven zone
//     bulks (ZEN Project included) and every direct connection — so the middle
//     gauge can be added up by hand from the rows on screen.
//
//     Presentation is the design-system primitives (SectionCard, StatsGrid,
//     Badge, ChartFrame) and tokens only; the arithmetic lives in the pure,
//     unit-tested ./supply-reconciliation module.

import { useMemo, useState } from "react";
import { Badge, ChartFrame, chartTheme, SectionCard } from "@/components/ui";
import { StatsGrid } from "@/components/shared/stats-grid";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import {
    ComposedChart, Area, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    ReferenceLine, CartesianGrid,
} from "recharts";
import { LiquidProgressRing } from "@/components/charts/liquid-progress-ring";
import {
    Droplets, Activity, Zap, AlertTriangle, Gauge, MapPin, Scale,
    ChevronDown, ChevronRight,
} from "lucide-react";
import type { SupabaseDailyWaterConsumption } from "@/entities/water";
import { cn } from "@/lib/cn";
import {
    type ReportData,
    CHART_COLORS, r2, n, DailyLossConnector, thBase, tdBase,
} from "./inline-shared";
import {
    buildSupplyMatrix, supplyDaySnapshot,
    type SupplyMeterRow,
} from "./supply-reconciliation";
import { ExportButton, type ExportColumn } from "@/components/shared/data-table";
import { useChartMotion } from "@/hooks/useReducedMotion";

export { DCAnalyticsPanel, SupplyReconciliationTable };

/** Loose value type matching Recharts' Formatter signature. */
type TipValue = number | string | ReadonlyArray<number | string> | undefined;
const fmtM3 = (v: TipValue, name: number | string | undefined): [string, string] =>
    [v == null ? "—" : `${Number(v).toLocaleString(undefined, { maximumFractionDigits: 2 })} m³`, String(name)];

// ─── DC Analytics Panel (mirrors ZoneAnalyticsPanel) ─────────────────────────

interface DCAnalyticsPanelProps {
    reportData: ReportData;
    monthData: SupabaseDailyWaterConsumption[];
    selectedDay: number;
    month: string;
}

function DCAnalyticsPanel({ reportData, monthData, selectedDay, month }: DCAnalyticsPanelProps) {
    const chartMotion = useChartMotion();

    // One source of truth for the supply side: the same matrix drives the
    // gauges, the trend and the table below, so they cannot drift apart.
    const matrix = useMemo(() => buildSupplyMatrix(monthData), [monthData]);
    const day = useMemo(() => supplyDaySnapshot(matrix, selectedDay), [matrix, selectedDay]);

    // Middle gauge = Σ zone bulks (L2, all seven zones) + Σ direct connections.
    const l2PlusDcTotal = day.combined;
    // Right gauge swaps the zone bulks for the individual meters underneath them.
    const l3PlusDcTotal = r2(reportData.l3Total + day.dcTotal);
    const connectionDifference = r2(l2PlusDcTotal - l3PlusDcTotal);

    // Main bulk (NAMA L1, account C43659) for the selected day. Ideally it
    // equals Σ zone bulks + Σ DC; the gap is trunk-main loss before any zone.
    // Missing reading ≠ zero — the supply stage is simply not shown that day.
    const mainBulkDay = day.mainBulk;
    const trunkLoss = day.trunkLoss;
    const totalGaugeMax = Math.max(mainBulkDay ?? 0, l2PlusDcTotal, l3PlusDcTotal) * 1.2 || 100;

    // 31-day trend — the same series as the gauges: Main Bulk (C43659) against
    // Σ zone bulks + DC, with the DC share kept as context. Null zone/DC
    // readings sum as 0 (matching processReport); a missing main-bulk reading
    // stays null so its line gaps instead of plunging to a fake zero.
    const trendData = useMemo(() => {
        return matrix.days.map((dayNum, i) => ({
            day: `D${String(dayNum).padStart(2, "0")}`,
            dayNum,
            "Zone Bulks + DC": matrix.combined.dailyValues[i],
            "Main Bulk": matrix.main?.dailyValues[i] ?? null,
            // Only a positive gap is a loss. A negative one means the network
            // measured more than the main bulk — a reading-basis mismatch, not
            // water lost — so it gets no bar rather than a misleading one.
            "Trunk loss": (matrix.trunkLoss[i] ?? 0) > 0 ? matrix.trunkLoss[i] : null,
        }));
    }, [matrix]);

    const currentDayLabel = trendData.find(d => d.dayNum === selectedDay)?.day;
    const incompleteRead = day.zonesRead < day.zoneCount || day.dcRead < day.dcCount;

    return (
        <div className="space-y-6">

            {/* ── DC heading ─────────────────────────────────────────────── */}
            <div>
                <h2 className="text-title text-primary dark:text-fg">
                    Direct Connection Analysis — Day {selectedDay}, {month}
                </h2>
                <p className="mt-1 text-body text-muted">
                    <span className="font-medium text-fg">Main Bulk</span> = NAMA supply meter (<span className="meter">C43659</span>) — ideally equal to zone bulks + DC &bull;{" "}
                    <span className="font-medium text-fg">L2 + DC</span> = all {day.zoneCount} zone bulks (ZEN Project included) plus the {day.dcCount} direct connections &bull;{" "}
                    <span className="font-medium text-fg">L3 + DC</span> = individual meters plus the same direct connections &bull;{" "}
                    Sales Center is counted as DC; TSE irrigation is not
                </p>
            </div>

            {/* ── Supply → distribution chain: Main Bulk → L2+DC → L3+DC, with the
                   loss written between each pair (mirrors the monthly A1→A2→A3) ─── */}
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:flex-wrap sm:gap-4 md:gap-6 lg:gap-8">
                {mainBulkDay != null && (
                    <>
                        <LiquidProgressRing
                            value={mainBulkDay}
                            max={totalGaugeMax}
                            label="Main Bulk (C43659)"
                            sublabel="NAMA L1 supply"
                            color={CHART_COLORS.brand}
                            size={160}
                            showPercentage={false}
                            unit="m³"
                            elementId="daily-dc-gauge-0"
                        />
                        <DailyLossConnector loss={trunkLoss} of={mainBulkDay} />
                    </>
                )}
                <LiquidProgressRing
                    value={l2PlusDcTotal}
                    max={totalGaugeMax}
                    label="L2 + DC Total"
                    sublabel={`${day.zoneCount} zone bulks + ${day.dcCount} DC`}
                    color={CHART_COLORS.teal}
                    size={160}
                    showPercentage={false}
                    unit="m³"
                    elementId="daily-dc-gauge-1"
                />
                <DailyLossConnector loss={connectionDifference} of={l2PlusDcTotal} />
                <LiquidProgressRing
                    value={l3PlusDcTotal}
                    max={totalGaugeMax}
                    label="L3 + DC Total"
                    sublabel="Individual meters + DC"
                    color={CHART_COLORS.gray}
                    size={160}
                    showPercentage={false}
                    unit="m³"
                    elementId="daily-dc-gauge-2"
                />
            </div>

            {/* Read coverage for the middle gauge. A zone bulk that was not read
                contributes 0 to the total, which would quietly understate it —
                so say how many of the meters behind the gauge actually reported. */}
            <p className={cn(
                "flex flex-wrap items-center justify-center gap-1.5 text-caption",
                incompleteRead ? "text-warning" : "text-muted",
            )}>
                {incompleteRead && <AlertTriangle size={16} strokeWidth={2} className="shrink-0" aria-hidden="true" />}
                L2 + DC on Day {selectedDay} is built from {day.zonesRead} of {day.zoneCount} zone bulks and {day.dcRead} of {day.dcCount} direct connections.
                {incompleteRead && " Unread meters count as 0, so the total is a floor, not the full picture."}
            </p>

            {mainBulkDay == null && (
                <p className="flex items-center justify-center gap-1.5 text-caption text-warning">
                    <AlertTriangle size={16} strokeWidth={2} className="shrink-0" aria-hidden="true" />
                    No Main Bulk (<span className="meter">C43659</span>) reading for Day {selectedDay} — showing the distribution-level comparison only, not a zero supply.
                </p>
            )}

            {/* ── Daily trend chart ────────────────────────────────────────── */}
            <SectionCard>
                <SectionCard.Header
                    icon={Activity}
                    title="Daily trend — main bulk vs zone bulks + DC"
                    description={`Same series as the gauges above, day by day — ${month}`}
                />
                <SectionCard.Body>
                    <p className="mb-3 text-caption text-muted">
                        Main Bulk (<span className="meter">C43659</span>) supply against all {day.zoneCount} zone bulks plus the {day.dcCount} direct
                        connections. The red bars are the gap between the two lines — the trunk-main loss, on the right axis.
                        Days without a main-bulk reading leave a gap in its line and no bar.
                    </p>
                    {trendData.length === 0 ? (
                        <div className="flex h-chart items-center justify-center text-body text-muted">
                            No trend data available for the supply meters
                        </div>
                    ) : (
                        <ChartFrame
                            series={3}
                            height="chart-lg"
                            legend={[
                                { label: "Main Bulk (L1)", color: CHART_COLORS.brand },
                                { label: "Zone Bulks + DC", color: CHART_COLORS.teal },
                                { label: "Trunk loss", color: CHART_COLORS.loss },
                            ]}
                        >
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={trendData} margin={{ top: 10, right: 4, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="dc-main-bulk-area" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={CHART_COLORS.brand} stopOpacity={0.28} />
                                            <stop offset="100%" stopColor={CHART_COLORS.brand} stopOpacity={0.04} />
                                        </linearGradient>
                                        <linearGradient id="dc-network-area" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={CHART_COLORS.teal} stopOpacity={0.28} />
                                            <stop offset="100%" stopColor={CHART_COLORS.teal} stopOpacity={0.04} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid {...chartTheme.grid} />
                                    <XAxis dataKey="day" {...chartTheme.axis} interval={4} minTickGap={16} />
                                    <YAxis
                                        yAxisId="volume" {...chartTheme.axis} width={52}
                                        tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}
                                    />
                                    {/* Loss keeps its own scale so the bars stay legible against
                                        supply volumes several times their size. */}
                                    <YAxis
                                        yAxisId="loss" orientation="right" width={48}
                                        axisLine={false} tickLine={false} tickMargin={8}
                                        tick={{ fill: CHART_COLORS.loss, fontSize: 12 }}
                                        tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}
                                    />
                                    <Tooltip formatter={fmtM3} {...chartTheme.tooltip} />
                                    {currentDayLabel && (
                                        <ReferenceLine
                                            yAxisId="volume"
                                            x={currentDayLabel}
                                            stroke={CHART_COLORS.brand}
                                            strokeDasharray="4 3"
                                            strokeWidth={1.5}
                                            label={{ value: `Day ${selectedDay}`, position: 'top', fontSize: 11, fill: "var(--color-muted)" }}
                                        />
                                    )}
                                    {/* Bars first so the gradient areas read on top of them. */}
                                    <Bar
                                        yAxisId="loss" name="Trunk loss" dataKey="Trunk loss"
                                        fill={CHART_COLORS.loss} radius={[3, 3, 0, 0]} maxBarSize={14}
                                        {...chartMotion}
                                    />
                                    <Area
                                        yAxisId="volume" type="monotone" name="Main Bulk (L1)" dataKey="Main Bulk"
                                        stroke={CHART_COLORS.brand} fill="url(#dc-main-bulk-area)"
                                        {...chartTheme.area} fillOpacity={1}
                                        activeDot={{ r: 4, stroke: "var(--color-card)", strokeWidth: 2 }}
                                        connectNulls={false}
                                        {...chartMotion}
                                    />
                                    <Area
                                        yAxisId="volume" type="monotone" name="Zone Bulks + DC" dataKey="Zone Bulks + DC"
                                        stroke={CHART_COLORS.teal} fill="url(#dc-network-area)"
                                        {...chartTheme.area} fillOpacity={1}
                                        activeDot={{ r: 4, stroke: "var(--color-card)", strokeWidth: 2 }}
                                        {...chartMotion}
                                    />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </ChartFrame>
                    )}
                </SectionCard.Body>
            </SectionCard>
        </div>
    );
}

// ─── Supply reconciliation table ─────────────────────────────────────────────
//
// Every account behind the gauges, day by day: the NAMA main bulk, all seven
// zone bulks and every direct connection, with a subtotal per group and the
// combined "ΣL2 + ΣDC" line that the middle gauge shows. Seventeen rows, so no
// pagination and no search — the whole balance is meant to be read at once.

/** A row as exported to CSV — meter rows and derived rows share this shape. */
interface SupplyExportRow {
    section: string;
    meter: string;
    account: string;
    dailyValues: (number | null)[];
    total: number | null;
}

/**
 * Collapsible header row that opens a group inside the matrix. Collapsing hides
 * only the individual meter rows — each group's subtotal stays on screen, so the
 * balance can always be read whatever is folded away.
 */
function GroupHeaderRow({
    label, colSpan, open, onToggle, meterCount,
}: {
    label: string;
    colSpan: number;
    open: boolean;
    onToggle: () => void;
    meterCount: number;
}) {
    const Chevron = open ? ChevronDown : ChevronRight;
    return (
        <TableRow className="border-b border-line bg-component">
            <TableCell colSpan={colSpan} className={cn(tdBase, "sticky left-0 z-10 bg-component p-0")}>
                <button
                    type="button"
                    onClick={onToggle}
                    aria-expanded={open}
                    className="flex min-h-11 w-full items-center gap-2 px-3 py-2 text-left text-eyebrow uppercase text-muted transition-colors hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:min-h-9"
                >
                    <Chevron size={16} strokeWidth={2} className="shrink-0" aria-hidden="true" />
                    {label}
                    <span className="normal-case text-caption text-muted">
                        ({open ? "hide" : "show"} {meterCount} meter{meterCount === 1 ? "" : "s"})
                    </span>
                </button>
            </TableCell>
        </TableRow>
    );
}

/** One meter's readings across the month. */
function MeterRow({ row, badgeTone }: { row: SupplyMeterRow; badgeTone: "info" | "neutral" }) {
    const Icon = row.kind === "main" ? Gauge : row.kind === "zone" ? MapPin : row.isIrr ? Droplets : Zap;
    return (
        <TableRow className="border-b border-line transition-colors even:bg-component hover:bg-component">
            <TableCell className={cn(tdBase, "sticky left-0 z-10 bg-card font-medium")}>
                <span className="inline-flex items-center gap-2">
                    <Icon size={14} strokeWidth={2} className="shrink-0 text-muted" aria-hidden="true" />
                    {row.label}
                </span>
            </TableCell>
            <TableCell className={cn(tdBase, "meter text-muted")}>{row.account}</TableCell>
            <TableCell className={cn(tdBase, "text-center")}>
                <Badge tone={badgeTone}>{row.category}</Badge>
            </TableCell>
            {row.dailyValues.map((val, i) => (
                <TableCell key={i} className={cn(tdBase, "px-2 text-right tabular-nums")}>
                    {val === null ? (
                        <span className="text-muted">—</span>
                    ) : val === 0 ? (
                        <span className="text-muted">0.00</span>
                    ) : (
                        n(val)
                    )}
                </TableCell>
            ))}
            <TableCell className={cn(tdBase, "bg-component text-right font-medium tabular-nums")}>
                {n(row.total)}
            </TableCell>
        </TableRow>
    );
}

/**
 * A subtotal / derived line. `values` may contain nulls (not computable).
 *
 * `tone="loss"` tints every cell that carries an actual loss in light red, so
 * the days that cost water are findable by eye across a 31-column matrix. A
 * negative value is not a loss — the network measured more than the main bulk,
 * which is a reading-basis mismatch — so it stays untinted.
 */
function TotalsRow({
    label, values, total, emphasis = false, tone = "neutral",
}: {
    label: React.ReactNode;
    values: (number | null)[];
    total: number | null;
    emphasis?: boolean;
    tone?: "neutral" | "loss";
}) {
    const isLoss = (v: number | null) => tone === "loss" && v !== null && v > 0;
    const rowBg = emphasis ? "bg-accent-tint" : "bg-component";
    return (
        <TableRow className={cn("border-t-2 border-line", rowBg)}>
            <TableCell colSpan={3} className={cn(tdBase, "sticky left-0 z-10 font-medium", rowBg)}>
                {label}
            </TableCell>
            {values.map((v, i) => (
                <TableCell
                    key={i}
                    className={cn(
                        tdBase, "px-2 text-right font-medium tabular-nums",
                        isLoss(v) && "bg-danger-tint text-danger",
                    )}
                >
                    {v === null ? <span className="text-muted">—</span> : n(v)}
                </TableCell>
            ))}
            <TableCell
                className={cn(
                    tdBase, "text-right font-medium tabular-nums",
                    isLoss(total) && "bg-danger-tint text-danger",
                )}
            >
                {n(total)}
            </TableCell>
        </TableRow>
    );
}

function SupplyReconciliationTable({
    monthData, selectedDay,
}: {
    monthData: SupabaseDailyWaterConsumption[];
    selectedDay: number;
}) {
    const matrix = useMemo(() => buildSupplyMatrix(monthData), [monthData]);
    const { days, latestDay, main, zones, dcs, zoneTotals, dcTotals, combined, trunkLoss } = matrix;
    const day = useMemo(() => supplyDaySnapshot(matrix, selectedDay), [matrix, selectedDay]);

    // Sections start open — the point of the table is that the whole balance is
    // visible — but 17 meters × 31 days is a lot of grid, so each can be folded.
    const [openSections, setOpenSections] = useState({ main: true, zones: true, dcs: true });
    const toggle = (key: keyof typeof openSections) =>
        setOpenSections(s => ({ ...s, [key]: !s[key] }));

    const colCount = 3 + days.length + 1; // Meter, Account, Level, …days, Total
    const meterCount = (main ? 1 : 0) + zones.length + dcs.length;

    // Month-to-date trunk loss quoted against the same days it was computable
    // on, so the percentage is like for like rather than against a fuller month.
    const lossPct = matrix.trunkLossTotal !== null && matrix.mainBulkComparableTotal
        ? r2((matrix.trunkLossTotal / matrix.mainBulkComparableTotal) * 100)
        : null;

    // CSV mirrors the on-screen matrix, subtotals included, so the exported file
    // reconciles the same way. Missing readings export as empty cells, never 0.
    const exportRows = useMemo<SupplyExportRow[]>(() => {
        const rows: SupplyExportRow[] = [];
        if (main) rows.push({ section: "Main bulk (L1)", meter: main.label, account: main.account, dailyValues: main.dailyValues, total: main.total });
        for (const z of zones) rows.push({ section: "Zone bulk (L2)", meter: z.label, account: z.account, dailyValues: z.dailyValues, total: z.total });
        rows.push({ section: "Subtotal", meter: `ΣL2 — ${zones.length} zone bulks`, account: "", dailyValues: zoneTotals.dailyValues, total: zoneTotals.total });
        for (const dc of dcs) rows.push({ section: "Direct connection (DC)", meter: dc.label, account: dc.account, dailyValues: dc.dailyValues, total: dc.total });
        rows.push({ section: "Subtotal", meter: `ΣDC — ${dcs.length} direct connections`, account: "", dailyValues: dcTotals.dailyValues, total: dcTotals.total });
        rows.push({ section: "Balance", meter: "ΣL2 + ΣDC", account: "", dailyValues: combined.dailyValues, total: combined.total });
        rows.push({ section: "Balance", meter: "Trunk-main loss (L1 − (ΣL2 + ΣDC))", account: "", dailyValues: trunkLoss, total: matrix.trunkLossTotal });
        return rows;
    }, [main, zones, dcs, zoneTotals, dcTotals, combined, trunkLoss, matrix.trunkLossTotal]);

    const exportColumns = useMemo<ExportColumn<SupplyExportRow>[]>(() => [
        { key: "section", header: "Section" },
        { key: "meter", header: "Meter" },
        { key: "account", header: "Account" },
        ...days.map((d) => ({
            key: "dailyValues",
            header: `Day ${d}`,
            format: (row: SupplyExportRow) => row.dailyValues[d - 1] ?? "",
        } as ExportColumn<SupplyExportRow>)),
        { key: "total", header: "Total (m³)", format: (row) => row.total ?? "" },
    ], [days]);

    return (
        <SectionCard>
            <SectionCard.Header
                icon={Scale}
                title="Supply reconciliation — main bulk vs zone bulks + DC"
                description={`${meterCount} supply meters — Day 1 to Day ${latestDay}`}
            />
            <SectionCard.Body className="space-y-4">
                <p className="text-caption text-muted">
                    Every account behind the gauges above. Add the <span className="font-medium text-fg">ΣL2</span> and{" "}
                    <span className="font-medium text-fg">ΣDC</span> lines and you get the middle gauge exactly; the difference
                    against the main bulk is the trunk-main loss before any zone. Unread meters show &quot;—&quot; and count as 0 in
                    the subtotals — never as a reading of zero.
                </p>

                {/* Day-of-interest summary — the app-wide StatsGrid tile */}
                <StatsGrid stats={[
                    {
                        label: `Main Bulk (Day ${selectedDay})`,
                        value: day.mainBulk === null ? "—" : n(day.mainBulk),
                        unit: day.mainBulk === null ? undefined : "m³",
                        subtitle: day.mainBulk === null ? "No L1 reading stored for this day" : "NAMA L1 supply (C43659)",
                        icon: Gauge,
                        variant: "primary",
                        status: day.mainBulk === null ? "missing" : "normal",
                    },
                    {
                        label: `L2 + DC (Day ${selectedDay})`,
                        value: n(day.combined),
                        unit: "m³",
                        subtitle: `${day.zonesRead}/${day.zoneCount} zone bulks · ${day.dcRead}/${day.dcCount} DC read`,
                        icon: Droplets,
                        variant: "info",
                        dataQuality: day.zonesRead < day.zoneCount || day.dcRead < day.dcCount ? "incomplete" : undefined,
                    },
                    {
                        label: "Trunk loss (month to date)",
                        value: matrix.trunkLossTotal === null ? "—" : n(matrix.trunkLossTotal),
                        unit: matrix.trunkLossTotal === null ? undefined : "m³",
                        subtitle: matrix.trunkLossTotal === null
                            ? "No day has both an L1 and a distribution reading"
                            : `${lossPct === null ? "—" : `${lossPct.toFixed(1)}%`} of main bulk over the comparable days`,
                        icon: AlertTriangle,
                        variant: matrix.trunkLossTotal !== null && matrix.trunkLossTotal > 0 ? "warning" : "success",
                    },
                ]} />

                <div className="flex flex-wrap items-center gap-2">
                    <ExportButton rows={exportRows} filename="water-supply-reconciliation" columns={exportColumns} className="ml-auto" />
                </div>

                {/* Horizontally scrollable table */}
                <div className="relative -mx-5">
                    <Table
                        containerProps={{
                            role: "region",
                            "aria-label": "Daily supply reconciliation: main bulk, zone bulks and direct connections. Scroll horizontally to view all days.",
                            tabIndex: 0,
                            className: "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                        }}
                        style={{ minWidth: `${420 + days.length * 72}px` }}
                        data-density="compact"
                    >
                        <TableHeader>
                            <TableRow className="border-b border-line">
                                <TableHead scope="col" className={cn(thBase, "sticky left-0 z-20 min-w-44 bg-primary")}>Meter</TableHead>
                                <TableHead scope="col" className={cn(thBase, "min-w-24")}>Account</TableHead>
                                <TableHead scope="col" className={cn(thBase, "min-w-24 text-center")}>Level</TableHead>
                                {days.map(d => (
                                    <TableHead scope="col" key={d} className={cn(thBase, "min-w-16 px-2 text-right")}>D{d}</TableHead>
                                ))}
                                <TableHead scope="col" className={cn(thBase, "min-w-20 text-right")}>Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {/* ── Supply ─────────────────────────────────── */}
                            <GroupHeaderRow
                                label="Main bulk (L1) — NAMA supply"
                                colSpan={colCount}
                                open={openSections.main}
                                onToggle={() => toggle("main")}
                                meterCount={main ? 1 : 0}
                            />
                            {openSections.main && (main ? (
                                <MeterRow row={main} badgeTone="info" />
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={colCount} className="py-4 text-center text-caption text-warning">
                                        <span className="inline-flex items-center gap-1.5">
                                            <AlertTriangle size={16} strokeWidth={2} className="shrink-0" aria-hidden="true" />
                                            No main-bulk (<span className="meter">C43659</span>) rows for this month — the trunk-main balance cannot be computed.
                                        </span>
                                    </TableCell>
                                </TableRow>
                            ))}

                            {/* ── Zone bulks ─────────────────────────────── */}
                            <GroupHeaderRow
                                label={`Zone bulks (L2) — ${zones.length} zones`}
                                colSpan={colCount}
                                open={openSections.zones}
                                onToggle={() => toggle("zones")}
                                meterCount={zones.length}
                            />
                            {openSections.zones && zones.map(z => <MeterRow key={z.account} row={z} badgeTone="neutral" />)}
                            <TotalsRow
                                label={`ΣL2 — all ${zones.length} zone bulks`}
                                values={zoneTotals.dailyValues}
                                total={zoneTotals.total}
                            />

                            {/* ── Direct connections ─────────────────────── */}
                            <GroupHeaderRow
                                label={`Direct connections (DC) — ${dcs.length} meters`}
                                colSpan={colCount}
                                open={openSections.dcs}
                                onToggle={() => toggle("dcs")}
                                meterCount={dcs.length}
                            />
                            {openSections.dcs && dcs.map(dc => <MeterRow key={dc.account} row={dc} badgeTone={dc.isIrr ? "info" : "neutral"} />)}
                            <TotalsRow
                                label={`ΣDC — all ${dcs.length} direct connections`}
                                values={dcTotals.dailyValues}
                                total={dcTotals.total}
                            />

                            {/* ── Balance ────────────────────────────────── */}
                            <TotalsRow
                                label={
                                    <span className="inline-flex items-center gap-1.5">
                                        <Droplets size={14} strokeWidth={2} className="shrink-0" aria-hidden="true" />
                                        ΣL2 + ΣDC — the L2 + DC gauge
                                    </span>
                                }
                                values={combined.dailyValues}
                                total={combined.total}
                                emphasis
                            />
                            <TotalsRow
                                label="Trunk-main loss — L1 − (ΣL2 + ΣDC)"
                                values={trunkLoss}
                                total={matrix.trunkLossTotal}
                                tone="loss"
                            />
                        </TableBody>
                    </Table>
                    <div
                        className="pointer-events-none absolute bottom-0 right-0 top-0 w-8 bg-linear-to-l from-card to-transparent sm:hidden"
                        aria-hidden="true"
                    />
                </div>
            </SectionCard.Body>
        </SectionCard>
    );
}
