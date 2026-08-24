"use client";

// ─── DCAnalyticsPanel + DCDailyTable — extracted verbatim from
//     daily-water-report.tsx. Pure relocation; no behavior changes.

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import {
    ComposedChart, Area, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
    ReferenceLine, Legend,
} from "recharts";
import { LiquidProgressRing } from "@/components/charts/liquid-progress-ring";
import { LiquidTooltip } from "@/components/charts/liquid-tooltip";
import { Droplets, Activity, Zap, AlertTriangle } from "lucide-react";
import { DC_METERS, MAIN_BULK_ACCOUNT, ZONE_BULK_CONFIG } from "@/lib/water-accounts";
import type { SupabaseDailyWaterConsumption } from "@/entities/water";
import { cn } from "@/lib/utils";
import {
    type ReportData, type SortState,
    CHART_COLORS, r2, n, DailyLossConnector, PALETTE,
    Th, TableSearch, StatusChip, TablePagination, thBase, tdBase,
    HierarchyStatCard,
} from "./inline-shared";
import { ExportButton, type ExportColumn } from "@/components/shared/data-table";
import { useChartMotion } from "@/hooks/useReducedMotion";

export { DCAnalyticsPanel, DCDailyTable };
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
                <h2 className="text-xl font-medium text-foreground">
                    Direct Connection Analysis — Day {selectedDay}, {month}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                    <span className="text-mb-primary font-medium">Main Bulk</span> = NAMA supply meter (<span className="meter">C43659</span>) — ideally equal to zone bulks + DC &bull;{" "}
                    <span className="text-mb-secondary font-medium">L2 + DC</span> = zone bulks plus direct connections &bull;{" "}
                    <span className="font-medium">L3 + DC</span> = individual meters plus the same direct connections &bull;{" "}
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
                <p className="flex items-center justify-center gap-1.5 text-xs text-mb-warning-text">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    No Main Bulk (<span className="meter">C43659</span>) reading for Day {selectedDay} — showing the distribution-level comparison only, not a zero supply.
                </p>
            )}

            {/* ── Daily trend chart ────────────────────────────────────────── */}
            <Card className="card-elevated">
                <CardHeader className="card-elevated-header p-4 sm:p-5 md:p-6">
                    <CardTitle className="text-base sm:text-lg">
                        Daily Trend — Main Bulk vs Zone Bulks + DC
                    </CardTitle>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                        Same series as the gauges above, day by day: Main Bulk (<span className="meter">C43659</span>) supply against zone bulks + direct connections,
                        with the share of the {totalMeters} DC meters alone — {month}. Days without a main-bulk reading leave a gap in its line.
                    </p>
                </CardHeader>
                <CardContent className="p-4 sm:p-5 md:p-6 pt-0">
                    {trendData.length === 0 ? (
                        <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
                            No trend data available for direct connections
                        </div>
                    ) : (
                        <div className="h-[200px] sm:h-[250px] md:h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="gradDailyDC" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={CHART_COLORS.gray} stopOpacity={0.35} />
                                            <stop offset="95%" stopColor={CHART_COLORS.gray} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis
                                        dataKey="day"
                                        axisLine={false} tickLine={false}
                                        tick={{ fontSize: 11, fill: "var(--chart-axis)" }}
                                        dy={10} interval={4}
                                    />
                                    <YAxis
                                        axisLine={false} tickLine={false}
                                        tick={{ fontSize: 11, fill: "var(--chart-axis)" }}
                                        tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                                        label={{ value: 'm³', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: "var(--chart-axis)", fontSize: 11 } }}
                                    />
                                    <Tooltip content={<LiquidTooltip />} cursor={{ stroke: 'var(--chart-cursor-stroke)', strokeWidth: 2 }} />
                                    <Legend iconType="circle" />
                                    {currentDayLabel && (
                                        <ReferenceLine
                                            x={currentDayLabel}
                                            stroke={CHART_COLORS.brand}
                                            strokeDasharray="4 3"
                                            strokeWidth={1.5}
                                            label={{ value: `Day ${selectedDay}`, position: 'top', fontSize: 10, fill: CHART_COLORS.brand, fontWeight: 600 }}
                                        />
                                    )}
                                    <Area
                                        type="monotone" name="DC Total" dataKey="DC Total"
                                        stroke={CHART_COLORS.gray} fill="url(#gradDailyDC)" strokeWidth={2}
                                        activeDot={{ r: 5, stroke: 'var(--card)', strokeWidth: 2 }}
                                        {...chartMotion}
                                    />
                                    <Line
                                        type="monotone" name="Zone Bulks + DC" dataKey="Zone Bulks + DC"
                                        stroke={CHART_COLORS.teal} strokeWidth={2.5} dot={{ r: 2 }}
                                        activeDot={{ r: 6, stroke: 'var(--card)', strokeWidth: 2 }}
                                        {...chartMotion}
                                    />
                                    <Line
                                        type="monotone" name="Main Bulk" dataKey="Main Bulk"
                                        stroke={CHART_COLORS.brand} strokeWidth={2.5} dot={{ r: 2 }}
                                        connectNulls={false}
                                        activeDot={{ r: 6, stroke: 'var(--card)', strokeWidth: 2 }}
                                        {...chartMotion}
                                    />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </CardContent>
            </Card>
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
        <Card className="card-elevated">
            <CardHeader className="card-elevated-header p-4 sm:p-5 md:p-6">
                <div>
                    <CardTitle className="text-base sm:text-lg">Direct Connection — Meters</CardTitle>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        {dcMeters.length} meters — Day 1 to Day {latestDay}
                    </p>
                </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 md:p-6 pt-0 space-y-4">
                {/* DC summary KPI cards — the shared HierarchyStatCard, so these
                    match the other daily tiles. The hand-rolled markup they
                    replace carried a hardcoded blue `rgba(6,81,237,…)` shadow
                    that belonged to no palette in this app. */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <HierarchyStatCard
                        label="Monthly DC Total (m³)"
                        value={n(grandTotal)}
                        icon={<Droplets className="w-4 h-4 sm:w-5 sm:h-5" />}
                        color={PALETTE.blue}
                    />
                    <HierarchyStatCard
                        label="DC Meters"
                        value={String(dcMeters.length)}
                        icon={<Activity className="w-4 h-4 sm:w-5 sm:h-5" />}
                        color={PALETTE.primary}
                    />
                    <HierarchyStatCard
                        label={`Active (Day ${latestDay})`}
                        value={`${activeMeters} / ${dcMeters.length}`}
                        icon={<Zap className="w-4 h-4 sm:w-5 sm:h-5" />}
                        color={PALETTE.mint}
                        valueColor="var(--mb-success-text)"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <TableSearch value={search} onChange={setSearch} placeholder="Search meter or account..." />
                    <ExportButton rows={filtered} filename="water-dc-daily" columns={exportColumns} className="ml-auto" />
                </div>

                {/* Horizontally scrollable table */}
                <div className="relative -mx-4 sm:-mx-5 md:-mx-6">
                <Table
                    role="region"
                    aria-label="Direct connection daily readings. Scroll horizontally to view all days."
                    tabIndex={0}
                    className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    style={{ minWidth: `${420 + days.length * 72}px` }}
                    data-density="compact"
                >
                    <TableHeader>
                        <TableRow className="border-b border-border">
                            <Th
                                sortKey="label" sort={sort} onSort={setSort}
                                className="sticky left-0 z-20 bg-[var(--primary)] min-w-[180px]"
                            >Meter</Th>
                            <Th sortKey="account" sort={sort} onSort={setSort} className="min-w-[100px]">Account</Th>
                            <TableHead scope="col" className={cn(thBase, "text-center min-w-[90px]")}>Type</TableHead>
                            {days.map(d => (
                                <TableHead scope="col" key={d} className={cn(thBase, "text-right min-w-[64px] px-2")}>D{d}</TableHead>
                            ))}
                            <Th
                                sortKey="total" sort={sort} onSort={setSort}
                                className="text-right min-w-[80px]"
                            >Total</Th>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginated.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={colCount} className="text-center py-10 text-[13px] text-muted-foreground">
                                    No meters found
                                </TableCell>
                            </TableRow>
                        ) : paginated.map(meter => (
                            <TableRow
                                key={meter.account}
                                className="border-b border-border/60 dark:border-border/60 transition-colors hover:bg-muted/70 dark:hover:bg-muted/30 even:bg-muted/40 dark:even:bg-muted/20"
                            >
                                <TableCell className={cn(tdBase, "font-semibold sticky left-0 z-10 bg-card")}>
                                    <span className="inline-flex items-center gap-2">
                                        {/* Icon distinguishes irrigation from potable; colour is a
                                            reinforcement only, so it comes from chart tokens. */}
                                        {meter.isIrr ? (
                                            <Droplets className="h-3.5 w-3.5 shrink-0" style={{ color: CHART_COLORS.teal }} aria-hidden="true" />
                                        ) : (
                                            <Zap className="h-3.5 w-3.5 shrink-0" style={{ color: CHART_COLORS.amber }} aria-hidden="true" />
                                        )}
                                        {meter.label}
                                    </span>
                                </TableCell>
                                <TableCell className={cn(tdBase, "font-mono text-[11px] text-muted-foreground")}>{meter.account}</TableCell>
                                <TableCell className={cn(tdBase, "text-center")}>
                                    <StatusChip label={meter.isIrr ? "Irrigation" : "Service"} color={meter.isIrr ? "primary" : "default"} />
                                </TableCell>
                                {meter.dailyValues.map((val, i) => (
                                    <TableCell key={i} className={cn(tdBase, "text-right tabular-nums px-2 text-[12px]")}>
                                        {val === null ? (
                                            <span className="text-muted-foreground/70 dark:text-muted-foreground">—</span>
                                        ) : val === 0 ? (
                                            <span className="text-muted-foreground">0.00</span>
                                        ) : (
                                            n(val)
                                        )}
                                    </TableCell>
                                ))}
                                <TableCell className={cn(tdBase, "text-right tabular-nums font-semibold bg-muted/80 dark:bg-muted/40")}>
                                    {n(meter.total)}
                                </TableCell>
                            </TableRow>
                        ))}
                        {/* ΣDC Footer */}
                        <TableRow className="border-t-2 border-border bg-muted/60 dark:bg-muted/20">
                            <TableCell className={cn(tdBase, "font-medium sticky left-0 z-10 bg-muted/60 dark:bg-muted/20")} colSpan={3}>
                                ΣDC Total ({dcMeters.length} meters)
                            </TableCell>
                            {dayTotals.map((t, i) => (
                                <TableCell key={i} className={cn(tdBase, "text-right tabular-nums font-medium px-2 text-[12px]")}>{n(t)}</TableCell>
                            ))}
                            <TableCell className={cn(tdBase, "text-right tabular-nums font-medium bg-muted/80 dark:bg-muted/40")}>{n(grandTotal)}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
                <div
                    className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-card to-transparent sm:hidden"
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
            </CardContent>
        </Card>
    );
}
