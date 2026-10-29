"use client";

/**
 * STP Electricity tab — the plant's electricity use (OWATCO monthly reports)
 * and what Nama billed for it (account R54460, meter LG19CT44019309).
 *
 * The STP is on Nama's Cost Reflective Tariff, so the app's flat 25 baisa/kWh
 * is NOT its cost: every OMR figure here is a billed amount (before VAT), and
 * the per-kWh rate is shown only as an indicative ratio. Missing reports and
 * bills are gaps with a reason, never zeros. Kilowatt-hours and OMR are drawn
 * in two charts — never one chart with two scales.
 *
 * The tab carries its own period filter (year + month-range slider, the same
 * control the other STP tabs use — owner request 2026-10-22). KPIs, charts,
 * the register and the export all follow the selected months.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Gauge, Receipt, Zap, CalendarRange, Table2, AlertCircle } from "lucide-react";
import { ChartFrame, chartTheme, SectionCard } from "@/components/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatsGrid, type StatItem } from "@/components/shared/stats-grid";
import { StatsGridSkeleton } from "@/components/shared/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ExportButton } from "@/components/shared/data-table/export-button";
import { PeriodFilterPanel } from "@/components/shared/period-filter-panel";
import { DateRangePicker } from "@/components/water/date-range-picker";
import { getStpElectricityMonths } from "@/functions/api/stp-electricity";
import type { StpElectricityMonth } from "@/entities/stp-electricity";
import type { STPOperation } from "@/lib/mock-data";
import { formatOmr } from "@/lib/currency";
import { getPageCache, setPageCache } from "@/lib/page-cache";
import { useChartMotion } from "@/hooks/useReducedMotion";
import {
    billedStatusLabel, dayLabel, energyIntensity, indicativeRateBaisa, indicativeRates,
    latestReported, monthLabel, owatcoStatusLabel, periodSummary,
} from "@/components/stp/stp-electricity";

const CACHE_KEY = "stp:electricity";
const FULL_MONTH: Record<string, string> = {
    Jan: "January", Feb: "February", Mar: "March", Apr: "April", May: "May", Jun: "June",
    Jul: "July", Aug: "August", Sep: "September", Oct: "October", Nov: "November", Dec: "December",
};

/** A year plus a run of its months, in the picker's "MMM-yy" form. */
interface PeriodSelection {
    year: string;
    start: string;
    end: string;
}

/** "Aug-26" → "August 2026". */
const fullMonth = (label: string) => {
    const [m, y] = label.split("-");
    return `${FULL_MONTH[m] ?? m} 20${y}`;
};

const kwh = (v: number | null) =>
    v === null ? "—" : v.toLocaleString("en-US", { maximumFractionDigits: 1 });
const oneDp = (v: number | null) =>
    v === null ? "—" : v.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

type TipValue = number | string | ReadonlyArray<number | string> | undefined;

interface Props {
    /** The STP daily log (all days) — used only for energy per m³ treated. */
    operations: STPOperation[];
}

export function StpElectricityPanel({ operations }: Props) {
    const cached = getPageCache<StpElectricityMonth[]>(CACHE_KEY);
    const [rows, setRows] = useState<StpElectricityMonth[]>(cached ?? []);
    const [loading, setLoading] = useState(!cached);
    const [error, setError] = useState<string | null>(null);
    const chartMotion = useChartMotion();

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

    // ── Period filter ── ordered ascending (the reader already sorts; this keeps
    // a cached copy honest too), so allMonths[i] labels ordered[i] and a month
    // range is a contiguous slice.
    const ordered = useMemo(() => [...rows].sort((a, b) => a.reportMonth.localeCompare(b.reportMonth)), [rows]);
    const allMonths = useMemo(() => ordered.map((r) => monthLabel(r.reportMonth)), [ordered]);
    const years = useMemo(() => [...new Set(ordered.map((r) => r.reportMonth.slice(0, 4)))], [ordered]);
    const monthsOfYear = useCallback(
        (year: string) => allMonths.filter((m) => m.endsWith(`-${year.slice(2)}`)),
        [allMonths],
    );
    const [selection, setSelection] = useState<PeriodSelection | null>(null);

    // The operator's pick while it still exists in the data; otherwise the whole
    // latest year (also the opening view, and the recovery after a refresh).
    const period = useMemo<PeriodSelection | null>(() => {
        if (selection) {
            const ym = monthsOfYear(selection.year);
            if (ym.includes(selection.start) && ym.includes(selection.end)) return selection;
        }
        const year = years[years.length - 1];
        if (!year) return null;
        const ym = monthsOfYear(year);
        return { year, start: ym[0], end: ym[ym.length - 1] };
    }, [selection, years, monthsOfYear]);

    const periodMonths = useMemo(() => (period ? monthsOfYear(period.year) : []), [period, monthsOfYear]);

    const filteredRows = useMemo(() => {
        if (!period) return [];
        const from = allMonths.indexOf(period.start);
        const to = allMonths.indexOf(period.end);
        return from < 0 || to < from ? [] : ordered.slice(from, to + 1);
    }, [ordered, allMonths, period]);

    const selectYear = useCallback((year: string) => {
        const ym = monthsOfYear(year);
        if (ym.length > 0) setSelection({ year, start: ym[0], end: ym[ym.length - 1] });
    }, [monthsOfYear]);

    const handleRangeChange = useCallback((start: string, end: string) => {
        setSelection({ year: `20${start.split("-")[1]}`, start, end });
    }, []);

    const handleResetRange = useCallback(() => {
        if (period) selectYear(period.year);
    }, [period, selectYear]);

    const intensityByMonth = useMemo(
        () => new Map(rows.map((r) => [r.reportMonth, energyIntensity(r, operations)])),
        [rows, operations],
    );

    const stats = useMemo<StatItem[]>(() => {
        const latest = latestReported(filteredRows);
        const totals = periodSummary(filteredRows);
        const months = filteredRows.length;
        const latestIntensity = [...filteredRows].reverse().find((r) => intensityByMonth.get(r.reportMonth)?.kwhPerM3 != null);
        const intensity = latestIntensity ? intensityByMonth.get(latestIntensity.reportMonth)?.kwhPerM3 ?? null : null;
        const missing = { value: "—", variant: "default" as const, status: "missing" as const };
        return [
            latest
                ? { label: "LATEST MONTH", value: kwh(latest.owatcoKwh), unit: "kWh", subtitle: `${monthLabel(latest.reportMonth)} · ${dayLabel(latest.periodStart)} – ${dayLabel(latest.periodEnd)}`, icon: Zap, variant: "primary" as const }
                : { label: "LATEST MONTH", ...missing, subtitle: "No OWATCO report in this period", icon: Zap },
            totals.owatcoMonths > 0
                ? { label: "PERIOD CONSUMPTION", value: kwh(totals.owatcoKwh), unit: "kWh", subtitle: `${totals.owatcoMonths} of ${months} OWATCO monthly reports`, icon: CalendarRange, variant: "info" as const }
                : { label: "PERIOD CONSUMPTION", ...missing, subtitle: "No OWATCO report in this period", icon: CalendarRange },
            totals.billedMonths > 0
                ? { label: "PERIOD BILL (BEFORE VAT)", value: formatOmr(totals.billedOmr), unit: "OMR", subtitle: `${totals.billedMonths} of ${months} Nama bills · Cost Reflective Tariff`, icon: Receipt, variant: "warning" as const }
                : { label: "PERIOD BILL (BEFORE VAT)", ...missing, subtitle: "No reliable Nama bill in this period", icon: Receipt },
            intensity !== null && latestIntensity
                ? { label: "ENERGY PER M³ TREATED", value: oneDp(intensity), unit: "kWh/m³", subtitle: `${monthLabel(latestIntensity.reportMonth)} · report kWh ÷ inlet m³, same days`, icon: Gauge, variant: "success" as const }
                : { label: "ENERGY PER M³ TREATED", ...missing, subtitle: "Needs a complete daily inlet log for a report period", icon: Gauge },
        ];
    }, [filteredRows, intensityByMonth]);

    const chartRows = useMemo(
        () => filteredRows.map((r) => ({
            m: monthLabel(r.reportMonth),
            owatco: r.owatcoKwh,
            nama: r.owatcoKwh === null ? r.namaKwh : null,
            billed: r.billedStatus === "billed" ? r.billedOmr : null,
        })),
        [filteredRows],
    );

    // Season split from the selected months: Σ bill ÷ Σ kWh over months that have both.
    const rates = useMemo(() => indicativeRates(filteredRows), [filteredRows]);

    const tableRows = useMemo(() => [...filteredRows].reverse(), [filteredRows]);
    const exportColumns = [
        { key: "reportMonth" as const, header: "Report month", format: (r: StpElectricityMonth) => monthLabel(r.reportMonth) },
        { key: "periodStart" as const, header: "OWATCO period start" },
        { key: "periodEnd" as const, header: "OWATCO period end" },
        { key: "owatcoKwh" as const, header: "OWATCO kWh", format: (r: StpElectricityMonth) => r.owatcoKwh ?? "" },
        { key: "owatcoStatus" as const, header: "OWATCO status", format: (r: StpElectricityMonth) => owatcoStatusLabel(r) },
        { key: "namaKwh" as const, header: "Nama-billed kWh", format: (r: StpElectricityMonth) => r.namaKwh ?? "" },
        { key: "billedOmr" as const, header: "Bill before VAT (OMR)", format: (r: StpElectricityMonth) => r.billedOmr === null ? "" : Number(r.billedOmr.toFixed(1)) },
        { key: "billedStatus" as const, header: "Bill status", format: (r: StpElectricityMonth) => billedStatusLabel(r) },
        { key: "reportMonth" as const, header: "Indicative rate (baisa/kWh)", format: (r: StpElectricityMonth) => { const v = indicativeRateBaisa(r); return v === null ? "" : Number(v.toFixed(1)); } },
        { key: "owatcoNote" as const, header: "Notes", format: (r: StpElectricityMonth) => [r.owatcoNote, r.billedNote].filter(Boolean).join(" ") },
    ];

    if (loading) return <StatsGridSkeleton count={4} />;

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

    const tooltipKwh = (value: TipValue, name: string | number | undefined) =>
        [value == null ? "no figure" : `${kwh(Number(value))} kWh`, name] as const;
    const tooltipOmr = (value: TipValue, name: string | number | undefined) =>
        [value == null ? "no reliable bill" : `${formatOmr(Number(value))} OMR`, name] as const;

    return (
        <div className="space-y-6">
            <StatsGrid stats={stats} />

            {/* Same layout as the period filter on the other STP tabs. */}
            {period && (
                <PeriodFilterPanel
                    periodLabel={`${fullMonth(period.start)} – ${fullMonth(period.end)}`}
                    metaLabel={`${filteredRows.length} months`}
                >
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-muted-foreground">Filter by Year:</span>
                                <div className="flex items-center gap-2">
                                    {years.map((year) => (
                                        <Button
                                            key={year}
                                            variant={period.year === year ? "default" : "outline"}
                                            size="sm"
                                            aria-label={`Filter by year ${year}`}
                                            aria-pressed={period.year === year}
                                            onClick={() => selectYear(year)}
                                            className={`rounded-full px-4 ${period.year === year ? "bg-secondary text-secondary-foreground" : "border-border"}`}
                                        >
                                            {year}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                            <Badge variant="outline" className="px-3 py-1.5 text-sm font-normal">
                                {periodMonths.length} Months Available
                            </Badge>
                        </div>
                        <DateRangePicker
                            startMonth={period.start}
                            endMonth={period.end}
                            availableMonths={periodMonths}
                            onRangeChange={handleRangeChange}
                            onReset={handleResetRange}
                        />
                    </div>
                </PeriodFilterPanel>
            )}

            <SectionCard>
                <SectionCard.Header title="Energy consumed (kWh)" description="Per OWATCO report month · 26th of the previous month to the 25th" icon={Zap} />
                <SectionCard.Body>
                    <ChartFrame
                        series={2}
                        height="chart-lg"
                        legend={[
                            { label: "OWATCO monthly report", color: chartTheme.series[0] },
                            { label: "Nama bill (no OWATCO report)", color: chartTheme.series[1] },
                        ]}
                    >
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 1, height: 1 }}>
                            <BarChart data={chartRows} margin={{ top: 6, right: 4, left: 0, bottom: 0 }}>
                                <CartesianGrid {...chartTheme.grid} />
                                <XAxis dataKey="m" {...chartTheme.axis} interval="preserveStartEnd" minTickGap={8} />
                                <YAxis {...chartTheme.axis} width={56} tickFormatter={(v: number) => v.toLocaleString("en-US")} />
                                <Tooltip {...chartTheme.tooltip} formatter={tooltipKwh} />
                                {/* The two sources never share a month, so one stack slot each month. */}
                                <Bar dataKey="owatco" name="OWATCO report" stackId="kwh" fill={chartTheme.series[0]} {...chartTheme.bar} {...chartMotion} />
                                <Bar dataKey="nama" name="Nama bill" stackId="kwh" fill={chartTheme.series[1]} {...chartTheme.bar} {...chartMotion} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartFrame>
                </SectionCard.Body>
                <SectionCard.Footer>
                    {chartRows.some((r) => r.nama !== null)
                        ? "A missing bar is a missing report, never zero. Jan–Aug 2024 show Nama-billed kWh; the two sources are never added together."
                        : "A missing bar is a missing report, never zero."}
                </SectionCard.Footer>
            </SectionCard>

            <SectionCard>
                <SectionCard.Header title="Nama bill (OMR, before VAT)" description="Account R54460 · Cost Reflective Tariff" icon={Receipt} />
                <SectionCard.Body>
                    <ChartFrame series={1} height="chart-lg">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 1, height: 1 }}>
                            <BarChart data={chartRows} margin={{ top: 6, right: 4, left: 0, bottom: 0 }}>
                                <CartesianGrid {...chartTheme.grid} />
                                <XAxis dataKey="m" {...chartTheme.axis} interval="preserveStartEnd" minTickGap={8} />
                                <YAxis {...chartTheme.axis} width={56} tickFormatter={(v: number) => v.toLocaleString("en-US")} />
                                <Tooltip {...chartTheme.tooltip} formatter={tooltipOmr} />
                                <Bar dataKey="billed" name="Bill before VAT" fill={chartTheme.series[3]} {...chartTheme.bar} {...chartMotion} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartFrame>
                </SectionCard.Body>
                <SectionCard.Footer tone="info">
                    {rates.summer !== null && rates.winter !== null
                        ? `Indicative cost: ${oneDp(rates.summer)} baisa/kWh May–Sep vs ${oneDp(rates.winter)} Oct–Apr — seasonal, not the flat 25.`
                        : rates.overall !== null
                            ? `Indicative cost in this period: ${oneDp(rates.overall)} baisa/kWh — bill ÷ OWATCO kWh, not the flat 25.`
                            : "No indicative rate: no month in this period has both a reliable Nama bill and OWATCO kWh."}
                </SectionCard.Footer>
            </SectionCard>

            <SectionCard>
                <SectionCard.Header
                    title="Month-by-month register"
                    description="Newest first · each figure with its source status"
                    icon={Table2}
                    action={<ExportButton rows={tableRows} filename="stp-electricity" columns={exportColumns} />}
                />
                <SectionCard.Body flush>
                    <div className="overflow-x-auto">
                        <table className="w-full text-caption">
                            <thead>
                                <tr>
                                    {["Report month", "OWATCO period", "OWATCO kWh", "Nama-billed kWh", "Bill before VAT (OMR)", "Indicative rate (baisa/kWh)", "kWh per m³", "Notes"].map((h) => (
                                        <th key={h} scope="col" className="whitespace-nowrap bg-primary px-3 py-2 text-left text-eyebrow uppercase text-on-primary">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="[&>tr:nth-child(even)]:bg-component">
                                {tableRows.map((r) => {
                                    const rate = indicativeRateBaisa(r);
                                    const intensity = intensityByMonth.get(r.reportMonth);
                                    const flagged = r.owatcoStatus !== "reported" || r.billedStatus === "unreliable";
                                    const notes = [
                                        r.owatcoStatus !== "reported" ? owatcoStatusLabel(r) : null,
                                        r.owatcoNote,
                                        r.billedStatus === "unreliable" ? billedStatusLabel(r) : null,
                                        r.billedNote,
                                    ].filter(Boolean).join(" · ");
                                    return (
                                        <tr key={r.reportMonth} className="border-t border-line align-top">
                                            <td className="whitespace-nowrap px-3 py-2 font-medium text-fg">{monthLabel(r.reportMonth)}</td>
                                            <td className="whitespace-nowrap px-3 py-2 text-muted">{dayLabel(r.periodStart)} – {dayLabel(r.periodEnd)}</td>
                                            <td className="num px-3 py-2 text-fg">{kwh(r.owatcoKwh)}</td>
                                            <td className="num px-3 py-2 text-fg">{kwh(r.namaKwh)}</td>
                                            <td className="num px-3 py-2 text-fg">{r.billedStatus === "billed" ? formatOmr(r.billedOmr) : "—"}</td>
                                            <td className="num px-3 py-2 text-fg">{oneDp(rate)}</td>
                                            <td className="num px-3 py-2 text-fg" title={intensity && intensity.kwhPerM3 === null && intensity.daysInPeriod > 0 ? `Inlet logged on ${intensity.daysRecorded} of ${intensity.daysInPeriod} days` : undefined}>
                                                {oneDp(intensity?.kwhPerM3 ?? null)}
                                            </td>
                                            <td className="min-w-64 px-3 py-2 text-muted">
                                                {flagged && <AlertCircle size={14} strokeWidth={2} className="me-1 inline align-text-bottom text-warning" aria-hidden />}
                                                {notes || "—"}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </SectionCard.Body>
            </SectionCard>

            <p className="text-caption text-muted">
                Nama confirmed in August 2026 that the STP (account R54460, meter LG19CT44019309) is on the Cost Reflective Tariff, so
                its cost is the billed amount, not consumption × 25 baisa. The indicative rate divides the bill by OWATCO&apos;s kWh, and the two
                may cover different days (Nama&apos;s billing period vs OWATCO&apos;s 26th–25th cycle). A detailed Nama invoice is still needed to confirm
                the tariff option and charge breakdown. Bills are database records, not checked invoices.
            </p>
        </div>
    );
}
