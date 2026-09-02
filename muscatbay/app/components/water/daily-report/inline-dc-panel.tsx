"use client";

// ─── DCAnalyticsPanel + DCDailyTable — the Direct Connections tab of the Daily
//     report. Data logic unchanged; presentation is the design-system
//     primitives (SectionCard, KpiCard, Badge, ChartFrame) and tokens only.

import { useState, useMemo, useEffect } from "react";
import { Badge, ChartFrame, chartTheme, KpiCard, SectionCard } from "@/components/ui";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import {
    ComposedChart, Area, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
    ReferenceLine, CartesianGrid,
} from "recharts";
import { LiquidProgressRing } from "@/components/charts/liquid-progress-ring";
import { Droplets, Activity, Zap, AlertTriangle } from "lucide-react";
import { DC_METERS, MAIN_BULK_ACCOUNT, ZONE_BULK_CONFIG } from "@/lib/water-accounts";
import type { SupabaseDailyWaterConsumption } from "@/entities/water";
import { cn } from "@/lib/cn";
import {
    type ReportData, type SortState,
    CHART_COLORS, r2, n, DailyLossConnector,
    Th, TableSearch, TablePagination, thBase, tdBase,
} from "./inline-shared";
import { ExportButton, type ExportColumn } from "@/components/shared/data-table";
import { useChartMotion } from "@/hooks/useReducedMotion";

export { DCAnalyticsPanel, DCDailyTable };

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
    // O(1) lookup map keyed by account_number
    const accountMap = useMemo(() => {
        const map = new Map<string, SupabaseDailyWaterConsumption>();
        for (const row of monthData) map.set(row.account_number, row);
        return map;
    }, [monthData]);

    const l2PlusDcTotal = r2(reportData.l2Total + reportData.dcTotal);
    const l3PlusDcTotal = r2(reportData.l3Total + reportData.dcTotal);
    const connectionDifference = r2(l2PlusDcTotal - l3PlusDcTotal);

    // Main bulk (NAMA L1, account C43659) for the selected day. Ideally it
    // equals Σ zone bulks + Σ DC; the gap is trunk-main loss before any zone.
    // Missing reading ≠ zero — the supply stage is simply not shown that day.
    const mainBulkRaw = accountMap.get(MAIN_BULK_ACCOUNT)?.[`day_${selectedDay}` as keyof SupabaseDailyWaterConsumption];
    const mainBulkDay = mainBulkRaw != null ? r2(Number(mainBulkRaw)) : null;
    const trunkLoss = mainBulkDay != null ? r2(mainBulkDay - l2PlusDcTotal) : null;
    const totalGaugeMax = Math.max(mainBulkDay ?? 0, l2PlusDcTotal, l3PlusDcTotal) * 1.2 || 100;

    // 31-day trend — same series as the gauges above: Main Bulk (C43659) vs
    // Σ zone bulks + DC, with the DC share kept as context. Null zone/DC
    // readings sum as 0 (matching processReport); a missing main-bulk reading
    // stays null so its line gaps instead of plunging to a fake zero.
    const trendData = useMemo(() => {
        const zoneBulkAccounts = ZONE_BULK_CONFIG.map(z => z.l2Account);
        const mainBulkRow = accountMap.get(MAIN_BULK_ACCOUNT);
        const results: { day: string; dayNum: number; 'DC Total': number; 'Zone Bulks + DC': number; 'Main Bulk': number | null }[] = [];
        for (let day = 1; day <= 31; day++) {
            const dayCol = `day_${day}` as keyof SupabaseDailyWaterConsumption;
            let dcSum = 0;
            let zoneSum = 0;
            let hasAny = false;
            for (const dc of DC_METERS) {
                const v = accountMap.get(dc.account)?.[dayCol];
                if (v != null) {
                    dcSum += Number(v);
                    hasAny = true;
                }
            }
            for (const acc of zoneBulkAccounts) {
                const v = accountMap.get(acc)?.[dayCol];
                if (v != null) {
                    zoneSum += Number(v);
                    hasAny = true;
                }
            }
            const mbRaw = mainBulkRow?.[dayCol];
            const mainBulk = mbRaw != null ? r2(Number(mbRaw)) : null;
            if (mainBulk != null) hasAny = true;
            if (!hasAny) continue;
            results.push({
                day: `D${String(day).padStart(2, '0')}`,
                dayNum: day,
                'DC Total': r2(dcSum),
                'Zone Bulks + DC': r2(zoneSum + dcSum),
                'Main Bulk': mainBulk,
            });
        }
        return results;
    }, [accountMap]);

    const totalMeters = reportData.dcRows.length;

    const currentDayLabel = trendData.find(d => d.dayNum === selectedDay)?.day;

    return (
        <div className="space-y-6">

            {/* ── DC heading ─────────────────────────────────────────────── */}
            <div>
                <h2 className="text-title text-primary dark:text-fg">
                    Direct Connection Analysis — Day {selectedDay}, {month}
                </h2>
                <p className="mt-1 text-body text-muted">
                    <span className="font-medium text-fg">Main Bulk</span> = NAMA supply meter (<span className="meter">C43659</span>) — ideally equal to zone bulks + DC &bull;{" "}
                    <span className="font-medium text-fg">L2 + DC</span> = zone bulks plus direct connections &bull;{" "}
                    <span className="font-medium text-fg">L3 + DC</span> = individual meters plus the same direct connections &bull;{" "}
                    Sales Center is counted as DC
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
                    sublabel="Zone bulk total + DC"
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
                        Main Bulk (<span className="meter">C43659</span>) supply against zone bulks + direct connections,
                        with the share of the {totalMeters} DC meters alone. Days without a main-bulk reading leave a gap in its line.
                    </p>
                    {trendData.length === 0 ? (
                        <div className="flex h-chart items-center justify-center text-body text-muted">
                            No trend data available for direct connections
                        </div>
                    ) : (
                        <ChartFrame
                            series={3}
                            height="chart-lg"
                            legend={[
                                { label: "DC Total", color: CHART_COLORS.gray },
                                { label: "Zone Bulks + DC", color: CHART_COLORS.teal },
                                { label: "Main Bulk", color: CHART_COLORS.brand },
                            ]}
                        >
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <CartesianGrid {...chartTheme.grid} />
                                    <XAxis dataKey="day" {...chartTheme.axis} interval={4} />
                                    <YAxis {...chartTheme.axis} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                                    <Tooltip formatter={fmtM3} {...chartTheme.tooltip} />
                                    {currentDayLabel && (
                                        <ReferenceLine
                                            x={currentDayLabel}
                                            stroke={CHART_COLORS.brand}
                                            strokeDasharray="4 3"
                                            strokeWidth={1.5}
                                            label={{ value: `Day ${selectedDay}`, position: 'top', fontSize: 11, fill: "var(--color-muted)" }}
                                        />
                                    )}
                                    <Area
                                        type="monotone" name="DC Total" dataKey="DC Total"
                                        stroke={CHART_COLORS.gray} fill={CHART_COLORS.gray} {...chartTheme.area}
                                        {...chartMotion}
                                    />
                                    <Line
                                        type="monotone" name="Zone Bulks + DC" dataKey="Zone Bulks + DC"
                                        stroke={CHART_COLORS.teal} {...chartTheme.line}
                                        {...chartMotion}
                                    />
                                    <Line
                                        type="monotone" name="Main Bulk" dataKey="Main Bulk"
                                        stroke={CHART_COLORS.brand} {...chartTheme.line}
                                        connectNulls={false}
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

// ─── DC Daily Meters Table (mirrors ZoneL3Table) ─────────────────────────────

interface DcMeterRow {
    account: string;
    label: string;
    isIrr: boolean;
    dailyValues: (number | null)[];
    rawValues: (number | null)[];
    total: number | null;
}

function DCDailyTable({ monthData }: { monthData: SupabaseDailyWaterConsumption[] }) {
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState<SortState>({ key: '', dir: null });
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(15);

    // Build account map for quick lookups
    const accountMap = useMemo(() => {
        const map = new Map<string, SupabaseDailyWaterConsumption>();
        for (const row of monthData) map.set(row.account_number, row);
        return map;
    }, [monthData]);

    // Determine latest day with data for any DC account
    const latestDay = useMemo(() => {
        let maxDay = 0;
        for (const dc of DC_METERS) {
            const row = accountMap.get(dc.account);
            if (!row) continue;
            for (let d = 31; d >= 1; d--) {
                if (d <= maxDay) break;
                const val = row[`day_${d}` as keyof SupabaseDailyWaterConsumption];
                if (val != null) { maxDay = d; break; }
            }
        }
        return Math.max(maxDay, 1);
    }, [accountMap]);

    const days = useMemo(() => Array.from({ length: latestDay }, (_, i) => i + 1), [latestDay]);

    // Build DC meter list with all daily readings. Missing readings stay null;
    // only an explicit source zero is displayed as 0.00.
    const dcMeters = useMemo(() => {
        return DC_METERS.map(dc => {
            const dbRow = accountMap.get(dc.account);

            const dailyValues: (number | null)[] = [];
            const rawValues: (number | null)[] = [];
            let total = 0;
            let hasReading = false;
            for (let d = 1; d <= latestDay; d++) {
                const raw = dbRow ? (dbRow[`day_${d}` as keyof SupabaseDailyWaterConsumption] as number | null) : null;
                rawValues.push(raw != null ? Number(raw) : null);
                const val = raw != null ? r2(Number(raw)) : null;
                dailyValues.push(val);
                if (val !== null) hasReading = true;
                total += val ?? 0;
            }

            return {
                account: dc.account,
                label: dc.meterName,
                isIrr: dc.isIrr,
                dailyValues,
                rawValues,
                total: hasReading ? r2(total) : null,
            };
        });
    }, [accountMap, latestDay]);

    // Per-day ΣDC totals for footer
    const dayTotals = useMemo(() => {
        return days.map((_, i) => r2(dcMeters.reduce((sum, m) => sum + (m.dailyValues[i] ?? 0), 0)));
    }, [days, dcMeters]);
    const grandTotal = r2(dayTotals.reduce((s, v) => s + v, 0));

    // Active meters today are those with an actual stored reading, including
    // an explicit zero.
    const activeMeters = dcMeters.filter(m => m.rawValues[latestDay - 1] !== null).length;

    // Filter & sort
    const filtered = useMemo(() => {
        let result = [...dcMeters];
        if (search) {
            const q = search.toLowerCase();
            result = result.filter(m => m.label.toLowerCase().includes(q) || m.account.includes(q));
        }
        if (sort.dir && sort.key) {
            result.sort((a, b) => {
                let va: number | string, vb: number | string;
                if (sort.key === 'label') { va = a.label; vb = b.label; }
                else if (sort.key === 'total') { va = a.total ?? Number.NEGATIVE_INFINITY; vb = b.total ?? Number.NEGATIVE_INFINITY; }
                else { va = a.account; vb = b.account; }
                const cmp = va < vb ? -1 : va > vb ? 1 : 0;
                return sort.dir === 'desc' ? -cmp : cmp;
            });
        }
        return result;
    }, [dcMeters, search, sort]);

    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset pagination to page 1 when search/sort change; storing page in state is needed because users can also change it via pagination controls.
    useEffect(() => { setPage(1); }, [search, sort]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
    const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);
    const colCount = 3 + days.length + 1; // Meter, Account, Type, ...days, Total

    // CSV mirrors the on-screen matrix; missing readings export as empty cells,
    // never 0 — the no-fabrication rule.
    const exportColumns = useMemo<ExportColumn<DcMeterRow>[]>(() => [
        { key: 'label', header: 'Meter' },
        { key: 'account', header: 'Account' },
        { key: 'isIrr', header: 'Type', format: (m) => m.isIrr ? 'Irrigation' : 'Service' },
        ...days.map((d) => ({
            key: 'dailyValues',
            header: `Day ${d}`,
            format: (m: DcMeterRow) => m.dailyValues[d - 1] ?? '',
        } as ExportColumn<DcMeterRow>)),
        { key: 'total', header: 'Total (m³)', format: (m) => m.total ?? '' },
    ], [days]);

    return (
        <SectionCard>
            <SectionCard.Header
                icon={Zap}
                title="Direct connection — meters"
                description={`${dcMeters.length} meters — Day 1 to Day ${latestDay}`}
            />
            <SectionCard.Body className="space-y-4">
                {/* DC summary KPIs (KpiCard — DESIGN_SYSTEM.md §6) */}
                <div className="grid grid-cols-2 gap-3.5 md:grid-cols-3">
                    <KpiCard tone="water" icon={Droplets} label="Monthly DC total" value={n(grandTotal)} unit="m³" footnote={`Day 1 to Day ${latestDay}`} />
                    <KpiCard icon={Activity} label="DC meters" value={String(dcMeters.length)} footnote="Direct connections on the main inlet" />
                    <KpiCard icon={Zap} label={`Active (Day ${latestDay})`} value={`${activeMeters} / ${dcMeters.length}`} footnote="Meters with a stored reading" />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <TableSearch value={search} onChange={setSearch} placeholder="Search meter or account..." />
                    <ExportButton rows={filtered} filename="water-dc-daily" columns={exportColumns} className="ml-auto" />
                </div>

                {/* Horizontally scrollable table */}
                <div className="relative -mx-5">
                <Table
                    role="region"
                    aria-label="Direct connection daily readings. Scroll horizontally to view all days."
                    tabIndex={0}
                    className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    style={{ minWidth: `${420 + days.length * 72}px` }}
                    data-density="compact"
                >
                    <TableHeader>
                        <TableRow className="border-b border-line">
                            <Th
                                sortKey="label" sort={sort} onSort={setSort}
                                className="sticky left-0 z-20 min-w-44 bg-primary"
                            >Meter</Th>
                            <Th sortKey="account" sort={sort} onSort={setSort} className="min-w-24">Account</Th>
                            <TableHead scope="col" className={cn(thBase, "min-w-24 text-center")}>Type</TableHead>
                            {days.map(d => (
                                <TableHead scope="col" key={d} className={cn(thBase, "min-w-16 px-2 text-right")}>D{d}</TableHead>
                            ))}
                            <Th
                                sortKey="total" sort={sort} onSort={setSort}
                                className="min-w-20 text-right"
                            >Total</Th>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginated.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={colCount} className="py-10 text-center text-label text-muted">
                                    No meters found
                                </TableCell>
                            </TableRow>
                        ) : paginated.map(meter => (
                            <TableRow
                                key={meter.account}
                                className="border-b border-line transition-colors even:bg-component hover:bg-component"
                            >
                                <TableCell className={cn(tdBase, "sticky left-0 z-10 bg-card font-medium")}>
                                    <span className="inline-flex items-center gap-2">
                                        {/* Icon distinguishes irrigation from potable; colour is a
                                            reinforcement only, so it comes from chart tokens. */}
                                        {meter.isIrr ? (
                                            <Droplets size={14} strokeWidth={2} className="shrink-0" style={{ color: CHART_COLORS.teal }} aria-hidden="true" />
                                        ) : (
                                            <Zap size={14} strokeWidth={2} className="shrink-0" style={{ color: CHART_COLORS.amber }} aria-hidden="true" />
                                        )}
                                        {meter.label}
                                    </span>
                                </TableCell>
                                <TableCell className={cn(tdBase, "meter text-muted")}>{meter.account}</TableCell>
                                <TableCell className={cn(tdBase, "text-center")}>
                                    <Badge tone={meter.isIrr ? "info" : "neutral"}>{meter.isIrr ? "Irrigation" : "Service"}</Badge>
                                </TableCell>
                                {meter.dailyValues.map((val, i) => (
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
                                    {n(meter.total)}
                                </TableCell>
                            </TableRow>
                        ))}
                        {/* ΣDC Footer */}
                        <TableRow className="border-t-2 border-line bg-component">
                            <TableCell className={cn(tdBase, "sticky left-0 z-10 bg-component font-medium")} colSpan={3}>
                                ΣDC Total ({dcMeters.length} meters)
                            </TableCell>
                            {dayTotals.map((t, i) => (
                                <TableCell key={i} className={cn(tdBase, "px-2 text-right font-medium tabular-nums")}>{n(t)}</TableCell>
                            ))}
                            <TableCell className={cn(tdBase, "bg-component text-right font-medium tabular-nums")}>{n(grandTotal)}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
                <div
                    className="pointer-events-none absolute bottom-0 right-0 top-0 w-8 bg-linear-to-l from-card to-transparent sm:hidden"
                    aria-hidden="true"
                />
                </div>

                {filtered.length > rowsPerPage && (
                    <TablePagination
                        page={page}
                        totalPages={totalPages}
                        totalItems={filtered.length}
                        onPageChange={setPage}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={rpp => { setRowsPerPage(rpp); setPage(1); }}
                    />
                )}
            </SectionCard.Body>
        </SectionCard>
    );
}
