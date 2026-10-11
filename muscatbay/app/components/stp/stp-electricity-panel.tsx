"use client";

/**
 * STP Electricity tab — the plant's electricity use (OWATCO monthly reports)
 * and what Nama billed for it (account R54460, meter LG19CT44019309).
 *
 * The STP is on Nama's Cost Reflective Tariff, so the app's flat 25 baisa/kWh
 * is NOT its cost: every OMR figure here is a billed amount (before VAT), and
 * the per-kWh rate is shown only as an indicative ratio. Missing reports and
 * bills are gaps with a reason, never zeros. Kilowatt-hours and OMR are drawn
 * in separate charts — never one chart with two scales.
 *
 * Layout and styling copy the STP Dashboard tab on purpose (owner ruling
 * 2026-10-11): the same chart cards and Recharts idiom as "Water Treatment
 * Volumes", and the same toolbar / table / totals row / pagination as the
 * "Daily Operations Log". Do not give this tab a style of its own.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Activity, Download, Gauge, Receipt, Search, Zap, CalendarRange } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    SortableTableHead, StatusBadge, TablePagination, TableToolbar,
    type BadgeColor, type PageSizeOption,
} from "@/components/shared/data-table";
import { StatsGrid, type StatItem } from "@/components/shared/stats-grid";
import { ChartSkeleton, Skeleton, StatsGridSkeleton } from "@/components/shared/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { getStpElectricityMonths } from "@/functions/api/stp-electricity";
import type { StpElectricityMonth } from "@/entities/stp-electricity";
import type { STPOperation } from "@/lib/mock-data";
import { formatOmr } from "@/lib/currency";
import { exportToCSV, getDateForFilename } from "@/lib/export-utils";
import { getPageCache, setPageCache } from "@/lib/page-cache";
import {
    billedStatusLabel, dayLabel, energyIntensity, indicativeRateBaisa, latestCompleteYear,
    latestReported, monthLabel, owatcoStatusLabel, periodLabel, rowStatus, type RowStatusTone,
} from "@/components/stp/stp-electricity";
import type { STPElectricityChartPoint } from "@/components/stp/stp-trend-charts";

// Recharts loads on demand, exactly as the Dashboard tab's charts do.
function TrendChartFallback({ height }: { height: string }) {
    return (
        <div className="w-full min-w-0" aria-hidden="true">
            <Skeleton className={`${height} w-full rounded-[10.5px]`} />
            <Skeleton className="mx-auto mt-1 h-3 w-56" />
        </div>
    );
}
const STPElectricityKwhChart = dynamic(
    () => import("@/components/stp/stp-trend-charts").then((m) => ({ default: m.STPElectricityKwhChart })),
    { loading: () => <TrendChartFallback height="h-[320px]" />, ssr: false },
);
const STPElectricityBillChart = dynamic(
    () => import("@/components/stp/stp-trend-charts").then((m) => ({ default: m.STPElectricityBillChart })),
    { loading: () => <TrendChartFallback height="h-[280px]" />, ssr: false },
);
const STPElectricityRateChart = dynamic(
    () => import("@/components/stp/stp-trend-charts").then((m) => ({ default: m.STPElectricityRateChart })),
    { loading: () => <TrendChartFallback height="h-[280px]" />, ssr: false },
);

const CACHE_KEY = "stp:electricity";
const ALL_YEARS = "all";
const SUMMER = new Set(["05", "06", "07", "08", "09"]);
const TONE_COLOR: Record<RowStatusTone, BadgeColor> = { good: "green", watch: "amber", missing: "slate" };

type SortField = "month" | "owatco" | "nama" | "billed" | "rate" | "intensity";

const kwh = (v: number | null) =>
    v === null ? "—" : v.toLocaleString("en-US", { maximumFractionDigits: 1 });
const oneDp = (v: number | null) =>
    v === null ? "—" : v.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
/** "—" stays bare: a missing figure never carries a unit. */
const withUnit = (text: string, unit: string) => (text === "—" ? text : `${text} ${unit}`);
const billOf = (r: StpElectricityMonth) => (r.billedStatus === "billed" ? r.billedOmr : null);

interface Props {
    /** The STP daily log (all days) — used only for energy per m³ treated. */
    operations: STPOperation[];
}

export function StpElectricityPanel({ operations }: Props) {
    const cached = getPageCache<StpElectricityMonth[]>(CACHE_KEY);
    const [rows, setRows] = useState<StpElectricityMonth[]>(cached ?? []);
    const [loading, setLoading] = useState(!cached);
    const [error, setError] = useState<string | null>(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedYear, setSelectedYear] = useState<string | null>(null);
    const [sortField, setSortField] = useState<SortField>("month");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState<PageSizeOption>(25);

    const load = useCallback(async () => {
        setError(null);
        try {
            const data = await getStpElectricityMonths();
            setRows(data);
            setPageCache(CACHE_KEY, data);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Unable to load STP electricity.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { void load(); }, [load]);

    const intensityByMonth = useMemo(
        () => new Map(rows.map((r) => [r.reportMonth, energyIntensity(r, operations)])),
        [rows, operations],
    );

    const stats = useMemo<StatItem[]>(() => {
        const latest = latestReported(rows);
        const year = latestCompleteYear(rows);
        const latestIntensity = [...rows].reverse().find((r) => intensityByMonth.get(r.reportMonth)?.kwhPerM3 != null);
        const intensity = latestIntensity ? intensityByMonth.get(latestIntensity.reportMonth)?.kwhPerM3 ?? null : null;
        const missing = { value: "—", variant: "default" as const, status: "missing" as const };
        return [
            latest
                ? { label: "LATEST MONTH", value: kwh(latest.owatcoKwh), unit: "kWh", subtitle: `${monthLabel(latest.reportMonth)} · ${dayLabel(latest.periodStart)} – ${dayLabel(latest.periodEnd)}`, icon: Zap, variant: "primary" as const }
                : { label: "LATEST MONTH", ...missing, subtitle: "No OWATCO report on file", icon: Zap },
            year
                ? { label: `${year.year} CONSUMPTION`, value: kwh(year.owatcoKwh), unit: "kWh", subtitle: "12 of 12 OWATCO monthly reports", icon: CalendarRange, variant: "info" as const }
                : { label: "FULL-YEAR CONSUMPTION", ...missing, subtitle: "No year with all 12 reports yet", icon: CalendarRange },
            year && year.billedMonths > 0
                ? { label: `${year.year} BILL (BEFORE VAT)`, value: formatOmr(year.billedOmr), unit: "OMR", subtitle: `${year.billedMonths} of 12 Nama bills · Cost Reflective Tariff`, icon: Receipt, variant: "warning" as const }
                : { label: "FULL-YEAR BILL", ...missing, subtitle: "No bills on file for a complete year", icon: Receipt },
            intensity !== null && latestIntensity
                ? { label: "ENERGY PER M³ TREATED", value: oneDp(intensity), unit: "kWh/m³", subtitle: `${monthLabel(latestIntensity.reportMonth)} · report kWh ÷ inlet m³, same days`, icon: Gauge, variant: "success" as const }
                : { label: "ENERGY PER M³ TREATED", ...missing, subtitle: "Needs a complete daily inlet log for a report period", icon: Gauge },
        ];
    }, [rows, intensityByMonth]);

    const chartData = useMemo<STPElectricityChartPoint[]>(
        () => rows.map((r) => ({
            month: monthLabel(r.reportMonth),
            owatco: r.owatcoKwh,
            nama: r.owatcoKwh === null ? r.namaKwh : null,
            billed: billOf(r),
            rate: indicativeRateBaisa(r),
        })),
        [rows],
    );

    // Season split from the data itself: Σ bill ÷ Σ kWh over months that have both.
    const season = useMemo(() => {
        const acc = { summer: { omr: 0, kwh: 0 }, winter: { omr: 0, kwh: 0 } };
        for (const r of rows) {
            if (indicativeRateBaisa(r) === null) continue;
            const bucket = SUMMER.has(r.reportMonth.slice(5, 7)) ? acc.summer : acc.winter;
            bucket.omr += r.billedOmr ?? 0;
            bucket.kwh += r.owatcoKwh ?? 0;
        }
        const rate = (b: { omr: number; kwh: number }) => (b.kwh > 0 ? (b.omr / b.kwh) * 1000 : null);
        return { summer: rate(acc.summer), winter: rate(acc.winter) };
    }, [rows]);

    // ── Monthly record table (same behaviour as the Daily Operations Log) ──
    const years = useMemo(() => [...new Set(rows.map((r) => r.reportMonth.slice(0, 4)))].sort().reverse(), [rows]);
    const year = selectedYear ?? years[0] ?? ALL_YEARS;

    const filteredRows = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        return rows.filter((r) => {
            if (year !== ALL_YEARS && !r.reportMonth.startsWith(`${year}-`)) return false;
            if (!term) return true;
            const haystack = [monthLabel(r.reportMonth), periodLabel(r), rowStatus(r).label, r.owatcoNote, r.billedNote]
                .filter(Boolean).join(" ").toLowerCase();
            return haystack.includes(term);
        });
    }, [rows, year, searchTerm]);

    const sortedRows = useMemo(() => {
        const value = (r: StpElectricityMonth): number | string | null => {
            switch (sortField) {
                case "month": return r.reportMonth;
                case "owatco": return r.owatcoKwh;
                case "nama": return r.namaKwh;
                case "billed": return billOf(r);
                case "rate": return indicativeRateBaisa(r);
                case "intensity": return intensityByMonth.get(r.reportMonth)?.kwhPerM3 ?? null;
            }
        };
        return [...filteredRows].sort((a, b) => {
            const va = value(a);
            const vb = value(b);
            // Missing figures always sort last, whichever the direction.
            if (va === null && vb === null) return 0;
            if (va === null) return 1;
            if (vb === null) return -1;
            const cmp = va < vb ? -1 : va > vb ? 1 : 0;
            return sortDirection === "asc" ? cmp : -cmp;
        });
    }, [filteredRows, sortField, sortDirection, intensityByMonth]);

    const effectivePageSize = pageSize === "All" ? sortedRows.length : pageSize;
    const totalPages = Math.ceil(sortedRows.length / (effectivePageSize || 1));
    const startIndex = (currentPage - 1) * effectivePageSize;
    const pageRows = useMemo(
        () => sortedRows.slice(startIndex, startIndex + effectivePageSize),
        [sortedRows, startIndex, effectivePageSize],
    );

    // Totals over the figures actually on file — each says how many months it covers.
    const totals = useMemo(() => {
        if (filteredRows.length === 0) return null;
        const reported = filteredRows.filter((r) => r.owatcoKwh !== null);
        const nama = filteredRows.filter((r) => r.namaKwh !== null);
        const billed = filteredRows.filter((r) => billOf(r) !== null);
        const paired = filteredRows.filter((r) => indicativeRateBaisa(r) !== null);
        const pairedKwh = paired.reduce((s, r) => s + (r.owatcoKwh ?? 0), 0);
        const pairedOmr = paired.reduce((s, r) => s + (r.billedOmr ?? 0), 0);
        return {
            months: filteredRows.length,
            owatco: reported.length ? reported.reduce((s, r) => s + (r.owatcoKwh ?? 0), 0) : null,
            owatcoMonths: reported.length,
            nama: nama.length ? nama.reduce((s, r) => s + (r.namaKwh ?? 0), 0) : null,
            namaMonths: nama.length,
            billed: billed.length ? billed.reduce((s, r) => s + (r.billedOmr ?? 0), 0) : null,
            billedMonths: billed.length,
            rate: pairedKwh > 0 ? (pairedOmr / pairedKwh) * 1000 : null,
        };
    }, [filteredRows]);

    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
        } else {
            setSortField(field as SortField);
            setSortDirection("desc");
        }
        setCurrentPage(1);
    };

    // Missing figures export as empty cells, never as 0.
    const handleExportCSV = () => {
        const data = sortedRows.map((r) => {
            const rate = indicativeRateBaisa(r);
            const intensity = intensityByMonth.get(r.reportMonth)?.kwhPerM3 ?? null;
            const bill = billOf(r);
            return {
                Month: monthLabel(r.reportMonth),
                "OWATCO Period Start": r.periodStart ?? "",
                "OWATCO Period End": r.periodEnd ?? "",
                "OWATCO (kWh)": r.owatcoKwh ?? "",
                "OWATCO Status": owatcoStatusLabel(r),
                "Nama-Billed (kWh)": r.namaKwh ?? "",
                "Bill Before VAT (OMR)": bill === null ? "" : Number(bill.toFixed(1)),
                "Bill Status": billedStatusLabel(r),
                "Indicative Rate (baisa/kWh)": rate === null ? "" : Number(rate.toFixed(1)),
                "kWh per m³": intensity === null ? "" : Number(intensity.toFixed(1)),
                Notes: [r.owatcoNote, r.billedNote].filter(Boolean).join(" "),
            };
        });
        exportToCSV(data, `stp-electricity-${year}-${getDateForFilename()}`);
    };

    if (loading) {
        return (
            <div className="space-y-6" role="status" aria-busy="true" aria-label="Loading STP electricity">
                <StatsGridSkeleton count={4} />
                <ChartSkeleton height="h-[420px]" />
            </div>
        );
    }

    if (error) {
        return (
            <div role="alert" className="ops-table-shell">
                <EmptyState
                    variant="error"
                    title="STP electricity could not be loaded"
                    description={error}
                    action={{ label: "Retry", onClick: () => { setLoading(true); void load(); } }}
                />
            </div>
        );
    }

    if (rows.length === 0) {
        return (
            <div className="ops-table-shell">
                <EmptyState
                    variant="no-data"
                    title="No STP electricity records yet"
                    description="The stp_electricity_monthly table is empty. Load sql/migrations/20261011_stp_electricity_monthly.sql."
                />
            </div>
        );
    }

    const range = `${monthLabel(rows[0].reportMonth)} – ${monthLabel(rows[rows.length - 1].reportMonth)}`;
    const cell = "px-4 sm:px-6 py-4 align-middle text-sm font-semibold text-right tabular-nums text-foreground";
    const coverage = (n: number) =>
        totals && n > 0 && n < totals.months
            ? <span className="block text-xs font-normal text-muted-foreground">{n} of {totals.months} months</span>
            : null;

    return (
        <div className="space-y-6">
            <StatsGrid stats={stats} />

            {/* Electricity Consumption Chart — same card and chart as Water Treatment Volumes */}
            <Card className="card-elevated">
                <CardHeader className="card-elevated-header">
                    <div className="space-y-1">
                        <CardTitle className="text-lg">Electricity Consumption (kWh)</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            {range} · {rows.length} months · OWATCO report month runs 26th to 25th · a gap means no figure on file
                        </p>
                    </div>
                </CardHeader>
                <CardContent>
                    <STPElectricityKwhChart data={chartData} />
                </CardContent>
            </Card>

            {/* Two Charts Side by Side — same cards as Economic Impact / Tanker Operations */}
            <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
                <Card className="card-elevated h-full">
                    <CardHeader className="card-elevated-header">
                        <div className="space-y-1">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Receipt className="h-5 w-5 text-primary" />
                                Electricity Bill (OMR)
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">Before VAT · Nama account R54460 · Cost Reflective Tariff</p>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <STPElectricityBillChart data={chartData} />
                    </CardContent>
                </Card>

                <Card className="card-elevated h-full">
                    <CardHeader className="card-elevated-header">
                        <div className="space-y-1">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Gauge className="h-5 w-5 text-[var(--mb-warning-text)]" />
                                Indicative Cost (baisa/kWh)
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                                {season.summer !== null && season.winter !== null
                                    ? `Bill ÷ OWATCO kWh · May–Sep ${oneDp(season.summer)} vs Oct–Apr ${oneDp(season.winter)}`
                                    : "Bill ÷ OWATCO kWh · indicative only"}
                            </p>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <STPElectricityRateChart data={chartData} />
                    </CardContent>
                </Card>
            </div>

            {/* Monthly Electricity Record — same toolbar / table / footer as the Daily Operations Log */}
            <div className="space-y-4">
                <TableToolbar className="flex-wrap">
                    <div>
                        <h2 className="text-lg font-semibold text-foreground">Monthly Electricity Record</h2>
                        <p className="text-sm text-muted-foreground">OWATCO reports and Nama bills by report month</p>
                    </div>

                    <div className="relative min-w-0 basis-full sm:flex-1 sm:min-w-[200px] max-w-md sm:ml-auto">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            aria-label="Search electricity records"
                            placeholder="Search records..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="pl-10 pr-4 py-2 w-full rounded-lg border border-border/80 bg-card text-foreground text-sm placeholder:text-muted-foreground shadow-sm transition-shadow focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
                        />
                    </div>

                    <Select value={year} onValueChange={(value) => { if (value) { setSelectedYear(value); setCurrentPage(1); } }}>
                        <SelectTrigger className="w-full sm:w-[200px]">
                            <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                        <SelectContent alignItemWithTrigger={false}>
                            {years.map((y) => (
                                <SelectItem key={y} value={y}>{y}</SelectItem>
                            ))}
                            <SelectItem value={ALL_YEARS}>All years</SelectItem>
                        </SelectContent>
                    </Select>

                    <button
                        onClick={handleExportCSV}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                        <Download className="w-3.5 h-3.5" />
                        <span>Export CSV</span>
                    </button>

                    <div className="text-sm text-muted-foreground whitespace-nowrap">
                        <span className="font-semibold text-foreground">{sortedRows.length}</span> records
                    </div>
                </TableToolbar>

                {/* Mobile card view */}
                <div className="md:hidden space-y-3">
                    {pageRows.map((r) => {
                        const status = rowStatus(r);
                        return (
                            <div key={r.reportMonth} className="rounded-xl border border-border/80 bg-card p-4 shadow-sm space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-foreground">{monthLabel(r.reportMonth)}</span>
                                    <StatusBadge label={status.label} color={TONE_COLOR[status.tone]} />
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="space-y-0.5">
                                        <span className="text-muted-foreground">OWATCO</span>
                                        <p className="font-mono font-medium text-primary dark:text-foreground">{withUnit(kwh(r.owatcoKwh), "kWh")}</p>
                                    </div>
                                    <div className="space-y-0.5">
                                        <span className="text-muted-foreground">Nama-Billed</span>
                                        <p className="font-mono font-medium text-mb-info-text">{withUnit(kwh(r.namaKwh), "kWh")}</p>
                                    </div>
                                    <div className="space-y-0.5">
                                        <span className="text-muted-foreground">Bill (before VAT)</span>
                                        <p className="font-mono font-semibold text-foreground">{billOf(r) === null ? "—" : `${formatOmr(billOf(r))} OMR`}</p>
                                    </div>
                                    <div className="space-y-0.5">
                                        <span className="text-muted-foreground">Indicative Cost</span>
                                        <p className="font-mono font-medium text-[var(--mb-warning-text)]">{withUnit(oneDp(indicativeRateBaisa(r)), "baisa/kWh")}</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {sortedRows.length === 0 && (
                        <div className="py-12 text-center text-muted-foreground">
                            <Zap className="w-7 h-7 mx-auto text-muted-foreground/70 dark:text-muted-foreground mb-2" />
                            <p className="text-sm font-medium">No electricity records match</p>
                            <p className="text-xs text-muted-foreground">Select a different year or clear the search.</p>
                        </div>
                    )}
                    {totals && (
                        <div className="space-y-3 rounded-xl border border-border bg-muted-bg/60 p-4">
                            <p className="text-sm font-semibold text-foreground">
                                <Activity className="mr-1.5 inline h-3.5 w-3.5 text-module-stp" aria-hidden="true" />
                                {year === ALL_YEARS ? "Total" : `${year} Total`} — {totals.months} month{totals.months !== 1 ? "s" : ""}
                            </p>
                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div>
                                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">OWATCO (kWh)</p>
                                    <p className="mt-0.5 font-mono text-sm font-semibold text-foreground">{kwh(totals.owatco)}</p>
                                    {coverage(totals.owatcoMonths)}
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Bill (OMR)</p>
                                    <p className="mt-0.5 font-mono text-sm font-semibold text-foreground">{totals.billed === null ? "—" : formatOmr(totals.billed)}</p>
                                    {coverage(totals.billedMonths)}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Desktop table */}
                <div className="hidden md:block">
                    <Table data-density="compact">
                        <TableHeader>
                            <TableRow>
                                <SortableTableHead field="month" currentSortField={sortField} currentSortDirection={sortDirection} onSort={handleSort}>Month</SortableTableHead>
                                <SortableTableHead field="owatco" currentSortField={sortField} currentSortDirection={sortDirection} onSort={handleSort} align="right" className="text-right">OWATCO (kWh)</SortableTableHead>
                                <SortableTableHead field="nama" currentSortField={sortField} currentSortDirection={sortDirection} onSort={handleSort} align="right" className="text-right">Nama-Billed (kWh)</SortableTableHead>
                                <SortableTableHead field="billed" currentSortField={sortField} currentSortDirection={sortDirection} onSort={handleSort} align="right" className="text-right">Bill (OMR)</SortableTableHead>
                                <SortableTableHead field="rate" currentSortField={sortField} currentSortDirection={sortDirection} onSort={handleSort} align="right" className="text-right">Rate (baisa/kWh)</SortableTableHead>
                                <SortableTableHead field="intensity" currentSortField={sortField} currentSortDirection={sortDirection} onSort={handleSort} align="right" className="text-right">kWh per m³</SortableTableHead>
                                <TableHead scope="col" className="text-right">Status</TableHead>
                                <TableHead scope="col">Notes</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pageRows.map((r) => {
                                const status = rowStatus(r);
                                const intensity = intensityByMonth.get(r.reportMonth);
                                const bill = billOf(r);
                                const notes = [r.owatcoNote, r.billedNote].filter(Boolean).join(" ");
                                return (
                                    <TableRow key={r.reportMonth}>
                                        <TableCell className="font-semibold" title={`OWATCO period ${periodLabel(r)}`}>{monthLabel(r.reportMonth)}</TableCell>
                                        <TableCell className="num text-primary dark:text-foreground">{kwh(r.owatcoKwh)}</TableCell>
                                        <TableCell className="num text-mb-info-text">{kwh(r.namaKwh)}</TableCell>
                                        <TableCell className="num text-foreground">{bill === null ? "—" : formatOmr(bill)}</TableCell>
                                        <TableCell className="num text-mb-warning-text">{oneDp(indicativeRateBaisa(r))}</TableCell>
                                        <TableCell
                                            className="num text-mb-success-text"
                                            title={intensity && intensity.kwhPerM3 === null && intensity.daysInPeriod > 0 ? `Inlet logged on ${intensity.daysRecorded} of ${intensity.daysInPeriod} days` : undefined}
                                        >
                                            {oneDp(intensity?.kwhPerM3 ?? null)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end">
                                                <StatusBadge label={status.label} color={TONE_COLOR[status.tone]} />
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {/* A td ignores max-width in auto layout; the inner block sets the wrap width. */}
                                            <div className="w-40 whitespace-normal">{notes || "—"}</div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {sortedRows.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={8} className="py-12 text-center">
                                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                            <Zap className="w-7 h-7 text-muted-foreground/70 dark:text-muted-foreground" />
                                            <p className="text-sm font-medium">No electricity records match</p>
                                            <p className="text-xs text-muted-foreground">Select a different year or clear the search.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>

                        {totals && (
                            <TableFooter>
                                <tr className="border-t-2 border-border bg-muted-bg/80 dark:bg-muted-bg/50">
                                    <td className="whitespace-nowrap px-4 py-4 align-middle text-sm font-semibold text-foreground sm:px-6">
                                        <span className="inline-flex items-center gap-2">
                                            <Activity className="h-3.5 w-3.5 shrink-0 text-module-stp" aria-hidden="true" />
                                            {year === ALL_YEARS ? "Total" : `${year} Total`}
                                        </span>
                                        <span className="block text-xs font-normal text-muted-foreground">{totals.months} month{totals.months !== 1 ? "s" : ""}</span>
                                    </td>
                                    <td className={cell}>{kwh(totals.owatco)}{coverage(totals.owatcoMonths)}</td>
                                    <td className={cell}>{kwh(totals.nama)}{coverage(totals.namaMonths)}</td>
                                    <td className={`${cell} bg-muted-bg/60 dark:bg-muted-bg/30 text-primary dark:text-foreground`}>
                                        {totals.billed === null ? "—" : formatOmr(totals.billed)}{coverage(totals.billedMonths)}
                                    </td>
                                    <td className={cell}>{oneDp(totals.rate)}</td>
                                    <td className={cell}>—</td>
                                    <td className={cell} />
                                    <td className={cell} />
                                </tr>
                            </TableFooter>
                        )}
                    </Table>
                </div>

                {/* Pagination */}
                {sortedRows.length > 0 && (
                    <TablePagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={sortedRows.length}
                        pageSize={pageSize}
                        startIndex={startIndex}
                        endIndex={Math.min(startIndex + effectivePageSize, sortedRows.length)}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
                    />
                )}
            </div>

            <p className="text-xs text-muted-foreground">
                Nama confirmed in August 2026 that the STP (account R54460, meter LG19CT44019309) is on the Cost Reflective Tariff, so
                its cost is the billed amount, not consumption × 25 baisa. The indicative rate divides the bill by OWATCO&apos;s kWh, and the two
                may cover different days (Nama&apos;s billing period vs OWATCO&apos;s 26th–25th cycle). A detailed Nama invoice is still needed to confirm
                the tariff option and charge breakdown. Bills are database records, not checked invoices.
            </p>
        </div>
    );
}
