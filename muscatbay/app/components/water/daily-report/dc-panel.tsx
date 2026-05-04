"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Droplets, Zap, Activity } from "lucide-react";
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
    ReferenceLine, Legend,
} from "recharts";
import { LiquidProgressRing } from "@/components/charts/liquid-progress-ring";
import { LiquidTooltip } from "@/components/charts/liquid-tooltip";
import { DC_METERS, NULL_AS_ZERO_ACCOUNTS } from "@/lib/water-accounts";
import type { SupabaseDailyWaterConsumption } from "@/entities/water";
import { cn } from "@/lib/utils";
import {
    type DCAnalyticsPanelProps, type SortState,
    CHART_COLORS, r2, n,
} from "./report-types";
import {
    Th, TableSearch, StatusChip,
    TablePagination, thBase, tdBase,
} from "./report-primitives";

export function DCAnalyticsPanel({ reportData, monthData, selectedDay, month }: DCAnalyticsPanelProps) {
    // O(1) lookup map keyed by account_number
    const accountMap = useMemo(() => {
        const map = new Map<string, SupabaseDailyWaterConsumption>();
        for (const row of monthData) map.set(row.account_number, row);
        return map;
    }, [monthData]);

    // Daily DC total = sum of all DC meters for the selected day
    const dailyDcTotal = r2(reportData.dcRows.reduce((s, r) => s + (r.displayValue ?? 0), 0));

    // 31-day DC trend + monthly aggregates
    const { trendData, monthlyTotal } = useMemo(() => {
        const results: { day: string; dayNum: number; 'DC Total': number }[] = [];
        let mTotal = 0;
        for (let day = 1; day <= 31; day++) {
            const dayCol = `day_${day}` as keyof SupabaseDailyWaterConsumption;
            let dayTotal = 0;
            let hasAny = false;
            for (const dc of DC_METERS) {
                const row = accountMap.get(dc.account);
                const v = row?.[dayCol];
                if (v != null) {
                    dayTotal += Number(v);
                    hasAny = true;
                }
            }
            if (!hasAny) continue;
            mTotal += dayTotal;
            results.push({
                day: `D${String(day).padStart(2, '0')}`,
                dayNum: day,
                'DC Total': r2(dayTotal),
            });
        }
        return { trendData: results, monthlyTotal: r2(mTotal) };
    }, [accountMap]);

    // Active meters (reporting on selected day)
    const activeMeters = reportData.dcRows.filter(r => r.rawValue !== null).length;
    const totalMeters = reportData.dcRows.length;

    // Gauge scales
    const maxDaily = Math.max(...trendData.map(d => d['DC Total']), dailyDcTotal);
    const dailyGaugeMax = maxDaily * 1.2 || 100;
    const monthlyGaugeMax = monthlyTotal * 1.2 || 100;

    const currentDayLabel = trendData.find(d => d.dayNum === selectedDay)?.day;

    return (
        <div className="space-y-6">

            {/* ── DC heading ─────────────────────────────────────────────── */}
            <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                    Direct Connection Analysis — Day {selectedDay}, {month}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    <span className="text-mb-secondary font-medium">DC Daily Total</span> = sum of all DC meters today &bull;{" "}
                    <span className="text-mb-primary font-medium">Monthly Total</span> = month-to-date DC consumption &bull;{" "}
                    <span style={{ color: CHART_COLORS.success }} className="font-medium">Active Meters</span> = meters reporting today
                </p>
            </div>

            {/* ── 3 Gauge rings ────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
                <LiquidProgressRing
                    value={dailyDcTotal}
                    max={dailyGaugeMax}
                    label="DC Daily Total"
                    sublabel="Sum of DC meters today"
                    color={CHART_COLORS.teal}
                    size={160}
                    showPercentage={false}
                    unit="m³"
                    elementId="daily-dc-gauge-1"
                />
                <LiquidProgressRing
                    value={monthlyTotal}
                    max={monthlyGaugeMax}
                    label="Monthly DC Total"
                    sublabel="Month-to-date consumption"
                    color={CHART_COLORS.brand}
                    size={160}
                    showPercentage={false}
                    unit="m³"
                    elementId="daily-dc-gauge-2"
                />
                <LiquidProgressRing
                    value={activeMeters}
                    max={totalMeters || 1}
                    label="Active DC Meters"
                    sublabel={`${activeMeters} of ${totalMeters} reporting`}
                    color={CHART_COLORS.success}
                    size={160}
                    showPercentage={true}
                    elementId="daily-dc-gauge-3"
                />
            </div>

            {/* ── Daily trend chart ────────────────────────────────────────── */}
            <Card className="card-elevated">
                <CardHeader className="card-elevated-header p-4 sm:p-5 md:p-6">
                    <CardTitle className="text-base sm:text-lg">
                        Direct Connection Daily Consumption Trend
                    </CardTitle>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        Day-by-day DC total across all {totalMeters} meters — {month}
                    </p>
                </CardHeader>
                <CardContent className="p-4 sm:p-5 md:p-6 pt-0">
                    {trendData.length === 0 ? (
                        <div className="flex items-center justify-center h-48 text-sm text-slate-400 dark:text-slate-500">
                            No trend data available for direct connections
                        </div>
                    ) : (
                        <div className="h-[200px] sm:h-[250px] md:h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="gradDailyDC" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={CHART_COLORS.teal} stopOpacity={0.4} />
                                            <stop offset="95%" stopColor={CHART_COLORS.teal} stopOpacity={0} />
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
                                    <Tooltip content={<LiquidTooltip />} cursor={{ stroke: 'rgba(0,0,0,0.1)', strokeWidth: 2 }} />
                                    <Legend iconType="circle" />
                                    {currentDayLabel && (
                                        <ReferenceLine
                                            x={currentDayLabel}
                                            stroke={CHART_COLORS.individual}
                                            strokeDasharray="4 3"
                                            strokeWidth={1.5}
                                            label={{ value: `Day ${selectedDay}`, position: 'top', fontSize: 10, fill: CHART_COLORS.individual, fontWeight: 600 }}
                                        />
                                    )}
                                    <Area
                                        type="monotone" name="DC Total" dataKey="DC Total"
                                        stroke={CHART_COLORS.teal} fill="url(#gradDailyDC)" strokeWidth={3}
                                        activeDot={{ r: 6, stroke: 'var(--card)', strokeWidth: 2 }}
                                        animationDuration={600}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

// ─── DC Daily Meters Table (mirrors ZoneL3Table) ─────────────────────────────

export function DCDailyTable({ monthData }: { monthData: SupabaseDailyWaterConsumption[] }) {
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

    // Build DC meter list with all daily readings.
    // `rawValues` preserves the pre-normalization null so "active today" logic
    // can distinguish a real 0 reading from an IRR/null-as-zero placeholder.
    const dcMeters = useMemo(() => {
        return DC_METERS.map(dc => {
            const dbRow = accountMap.get(dc.account);
            const isNullAsZero = dc.isIrr || NULL_AS_ZERO_ACCOUNTS.has(dc.account);

            const dailyValues: (number | null)[] = [];
            const rawValues: (number | null)[] = [];
            let total = 0;
            for (let d = 1; d <= latestDay; d++) {
                const raw = dbRow ? (dbRow[`day_${d}` as keyof SupabaseDailyWaterConsumption] as number | null) : null;
                rawValues.push(raw != null ? Number(raw) : null);
                const val = raw != null ? r2(Number(raw)) : isNullAsZero ? 0 : null;
                dailyValues.push(val);
                total += val ?? 0;
            }

            return {
                account: dc.account,
                label: dc.meterName,
                isIrr: dc.isIrr,
                isNullAsZero,
                dailyValues,
                rawValues,
                total: r2(total),
            };
        });
    }, [accountMap, latestDay]);

    // Per-day ΣDC totals for footer
    const dayTotals = useMemo(() => {
        return days.map((_, i) => r2(dcMeters.reduce((sum, m) => sum + (m.dailyValues[i] ?? 0), 0)));
    }, [days, dcMeters]);
    const grandTotal = r2(dayTotals.reduce((s, v) => s + v, 0));

    // Active meters today (latest day) — measured from rawValues so IRR
    // meters that were normalized null→0 aren't mistakenly counted as active.
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
                else if (sort.key === 'total') { va = a.total; vb = b.total; }
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

    return (
        <Card className="card-elevated">
            <CardHeader className="card-elevated-header p-4 sm:p-5 md:p-6">
                <div>
                    <CardTitle className="text-base sm:text-lg">Direct Connection — Meters</CardTitle>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {dcMeters.length} meters — Day 1 to Day {latestDay}
                    </p>
                </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 md:p-6 pt-0 space-y-4">
                {/* DC summary KPI cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    {/* Monthly Total */}
                    <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] dark:shadow-[0_2px_10px_-3px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_30px_-4px_rgba(6,81,237,0.15)] dark:hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.4)] motion-safe:hover:-translate-y-0.5 transition-[box-shadow,transform] duration-200 ease-out">
                        <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0">
                                <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-medium mb-1 uppercase tracking-wide">Monthly DC Total (m³)</p>
                                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100 tabular-nums tracking-tight">{n(grandTotal)}</h3>
                            </div>
                            <div className="p-2 sm:p-3 rounded-lg bg-mb-secondary-light flex-shrink-0">
                                <Droplets className="w-4 h-4 sm:w-5 sm:h-5 text-mb-secondary" />
                            </div>
                        </div>
                    </div>
                    {/* Total Meters */}
                    <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] dark:shadow-[0_2px_10px_-3px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_30px_-4px_rgba(6,81,237,0.15)] dark:hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.4)] motion-safe:hover:-translate-y-0.5 transition-[box-shadow,transform] duration-200 ease-out">
                        <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0">
                                <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-medium mb-1 uppercase tracking-wide">DC Meters</p>
                                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100 tabular-nums tracking-tight">{dcMeters.length}</h3>
                            </div>
                            <div className="p-2 sm:p-3 rounded-lg bg-mb-primary-light/20 flex-shrink-0">
                                <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-mb-primary" />
                            </div>
                        </div>
                    </div>
                    {/* Active Meters (latest day) */}
                    <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] dark:shadow-[0_2px_10px_-3px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_30px_-4px_rgba(6,81,237,0.15)] dark:hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.4)] motion-safe:hover:-translate-y-0.5 transition-[box-shadow,transform] duration-200 ease-out">
                        <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0">
                                <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-medium mb-1 uppercase tracking-wide">Active (Day {latestDay})</p>
                                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-mb-success-text tabular-nums tracking-tight">
                                    {activeMeters}<span className="text-slate-400 dark:text-slate-500 text-base font-semibold"> / {dcMeters.length}</span>
                                </h3>
                            </div>
                            <div className="p-2 sm:p-3 rounded-lg bg-mb-success-light flex-shrink-0">
                                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-mb-success" />
                            </div>
                        </div>
                    </div>
                </div>

                <TableSearch value={search} onChange={setSearch} placeholder="Search meter or account..." />

                {/* Horizontally scrollable table */}
                <div className="relative overflow-x-auto -mx-4 sm:-mx-5 md:-mx-6 border-t border-slate-100 dark:border-slate-800">
                    <table className="w-full border-collapse" style={{ minWidth: `${420 + days.length * 72}px` }}>
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800">
                                <Th
                                    sortKey="label" sort={sort} onSort={setSort}
                                    className="sticky left-0 z-10 bg-white dark:bg-slate-900 min-w-[180px]"
                                >Meter</Th>
                                <Th sortKey="account" sort={sort} onSort={setSort} className="min-w-[100px]">Account</Th>
                                <th scope="col" className={cn(thBase, "text-center min-w-[90px]")}>Type</th>
                                {days.map(d => (
                                    <th scope="col" key={d} className={cn(thBase, "text-right min-w-[64px] px-2")}>D{d}</th>
                                ))}
                                <Th
                                    sortKey="total" sort={sort} onSort={setSort}
                                    className="text-right min-w-[80px] bg-slate-50/80 dark:bg-slate-800/40"
                                >Total</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={colCount} className="text-center py-10 text-[13px] text-slate-400 dark:text-slate-500">
                                        No meters found
                                    </td>
                                </tr>
                            ) : paginated.map(meter => (
                                <tr
                                    key={meter.account}
                                    className="border-b border-slate-50 dark:border-slate-800/60 transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/30 even:bg-slate-50/40 dark:even:bg-slate-800/20"
                                >
                                    <td className={cn(tdBase, "font-semibold sticky left-0 z-10 bg-white dark:bg-slate-900")}>
                                        <span className="inline-flex items-center gap-2">
                                            {meter.isIrr ? (
                                                <Droplets className="h-3.5 w-3.5 text-teal-500 shrink-0" />
                                            ) : (
                                                <Zap className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                            )}
                                            {meter.label}
                                        </span>
                                    </td>
                                    <td className={cn(tdBase, "font-mono text-[11px] text-slate-400 dark:text-slate-500")}>{meter.account}</td>
                                    <td className={cn(tdBase, "text-center")}>
                                        <StatusChip label={meter.isIrr ? "Irrigation" : "Service"} color={meter.isIrr ? "primary" : "default"} />
                                    </td>
                                    {meter.dailyValues.map((val, i) => (
                                        <td key={i} className={cn(tdBase, "text-right tabular-nums px-2 text-[12px]")}>
                                            {val === null ? (
                                                <span className="text-slate-300 dark:text-slate-600">—</span>
                                            ) : val === 0 ? (
                                                <span className="text-slate-400">0.00</span>
                                            ) : (
                                                n(val)
                                            )}
                                        </td>
                                    ))}
                                    <td className={cn(tdBase, "text-right tabular-nums font-semibold bg-slate-50/80 dark:bg-slate-800/40")}>
                                        {n(meter.total)}
                                    </td>
                                </tr>
                            ))}
                            {/* ΣDC Footer */}
                            <tr className="border-t-2 border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/20">
                                <td className={cn(tdBase, "font-bold sticky left-0 z-10 bg-slate-50/60 dark:bg-slate-800/20")} colSpan={3}>
                                    ΣDC Total ({dcMeters.length} meters)
                                </td>
                                {dayTotals.map((t, i) => (
                                    <td key={i} className={cn(tdBase, "text-right tabular-nums font-bold px-2 text-[12px]")}>{n(t)}</td>
                                ))}
                                <td className={cn(tdBase, "text-right tabular-nums font-bold bg-slate-50/80 dark:bg-slate-800/40")}>{n(grandTotal)}</td>
                            </tr>
                        </tbody>
                    </table>
                    <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-card to-transparent sm:hidden" />
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
