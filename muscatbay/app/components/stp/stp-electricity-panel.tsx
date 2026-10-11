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
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Gauge, Receipt, Zap, CalendarRange, Table2, AlertCircle } from "lucide-react";
import { ChartFrame, chartTheme, SectionCard } from "@/components/ui";
import { StatsGrid, type StatItem } from "@/components/shared/stats-grid";
import { StatsGridSkeleton } from "@/components/shared/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ExportButton } from "@/components/shared/data-table/export-button";
import { getStpElectricityMonths } from "@/functions/api/stp-electricity";
import type { StpElectricityMonth } from "@/entities/stp-electricity";
import type { STPOperation } from "@/lib/mock-data";
import { formatOmr } from "@/lib/currency";
import { getPageCache, setPageCache } from "@/lib/page-cache";
import { useChartMotion } from "@/hooks/useReducedMotion";
import {
    billedStatusLabel, dayLabel, energyIntensity, indicativeRateBaisa, latestCompleteYear,
    latestReported, monthLabel, owatcoStatusLabel,
} from "@/components/stp/stp-electricity";

const CACHE_KEY = "stp:electricity";
const SUMMER = new Set(["05", "06", "07", "08", "09"]);

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

    const chartRows = useMemo(
        () => rows.map((r) => ({
            m: monthLabel(r.reportMonth),
            owatco: r.owatcoKwh,
            nama: r.owatcoKwh === null ? r.namaKwh : null,
            billed: r.billedStatus === "billed" ? r.billedOmr : null,
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

    const tableRows = useMemo(() => [...rows].reverse(), [rows]);
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

            <SectionCard>
                <SectionCard.Header title="Monthly electricity use" description="kWh per OWATCO report month (26th of the previous month to the 25th)" icon={Zap} />
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
                    A missing bar is a missing report, never zero. Jan–Aug 2024 show Nama-billed kWh; the two sources are never added together.
                </SectionCard.Footer>
            </SectionCard>

            <SectionCard>
                <SectionCard.Header title="Monthly electricity bill" description="OMR before VAT · Nama account R54460 · Cost Reflective Tariff" icon={Receipt} />
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
                    {season.summer !== null && season.winter !== null
                        ? `Indicative cost: ${oneDp(season.summer)} baisa/kWh May–Sep vs ${oneDp(season.winter)} Oct–Apr — seasonal, not the flat 25.`
                        : "2024 monthly bills are not on file; a gap means no reliable bill."}
                </SectionCard.Footer>
            </SectionCard>

            <SectionCard>
                <SectionCard.Header
                    title="Monthly record"
                    description="Newest first · every figure with its source status"
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
