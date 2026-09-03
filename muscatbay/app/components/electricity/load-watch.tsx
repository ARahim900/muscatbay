"use client";

/**
 * Load Watch — the Electricity section's inspection-first landing, modelled on
 * the Water Zone Watch. It answers "which system is drawing abnormally, and
 * which meters do I check?" from one screen: a briefing row of KPI tiles, a
 * severity-first category table, a category×month heatmap that shows when a
 * category's draw spiked — and whose cells drill
 * straight through to that category's meters for that month — and the
 * auto-generated findings register of flagged meters (spike / dip / zero /
 * negative / missing).
 *
 * Every threshold shown here comes from lib/thresholds.ts and is printed in the
 * UI, so an operator can always see what produced a severity.
 */

import { useMemo, useState } from "react";
import {
    Zap, Gauge, Activity, DollarSign, AlertTriangle, CheckCircle2,
    ArrowUp, ArrowDown, ChevronRight, Info,
} from "lucide-react";
import type { MeterReading } from "@/lib/mock-data";
import { ELECTRICITY_RATES, ELECTRICITY_TARGETS } from "@/lib/config";
import { describeElectricityGates } from "@/lib/thresholds";
import { Card, CardContent } from "@/components/ui/card";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ExportButton, SortableTableHead, TableToolbar, type ExportColumn } from "@/components/shared/data-table";
import { SectionBoundary } from "@/components/shared/section-boundary";
// Briefing figures render on the app-wide StatsGrid tile (the HVAC card) so
// Electricity's headline row looks like Water's and STP's — owner ruling,
// DESIGN_SYSTEM.md §7 ("every module's KPI row is the same StatsGrid tile").
import { StatsGrid, type StatItem } from "@/components/shared/stats-grid";
import {
    MetricHeatmap, SeverityChip, SEV_UI, worstFirst,
} from "@/components/shared/inspection";
import { FindingsRegister } from "@/components/shared/findings-register";
import { cn } from "@/lib/utils";
import {
    buildElectricityModel, buildCategoryMetrics, buildCategoryHeatmap, buildElectricityFindings,
    CATEGORY_HEATMAP_NOTE, type CategoryRow, type FlagKind,
} from "./electricity-analytics";

const RATE = ELECTRICITY_RATES.RATE_PER_KWH;
const num = (x: number, frac = 0) => x.toLocaleString("en-US", { maximumFractionDigits: frac });

type CategorySortField = "urgency" | "consumption" | "cost" | "findings";
type SortDirection = "asc" | "desc";

const SEVERITY_RANK: Record<CategoryRow["severity"], number> = {
    good: 0,
    nodata: 1,
    watch: 2,
    high: 3,
    critical: 4,
};

function countLabel(count: number, singular: string, plural = `${singular}s`): string {
    return `${count} ${count === 1 ? singular : plural}`;
}

function describeFindings(category: CategoryRow): string {
    const counts: Record<Exclude<FlagKind, null>, number> = {
        negative: 0,
        zero: 0,
        "spike-crit": 0,
        "spike-high": 0,
        missing: 0,
        dip: 0,
    };

    category.meters.forEach((meter) => {
        if (meter.flag !== null) counts[meter.flag] += 1;
    });

    const spikes = counts["spike-crit"] + counts["spike-high"];
    return [
        spikes > 0 ? countLabel(spikes, "spike") : null,
        counts.zero > 0 ? countLabel(counts.zero, "zero", "zeros") : null,
        counts.negative > 0 ? countLabel(counts.negative, "fault") : null,
        counts.missing > 0 ? countLabel(counts.missing, "missing read") : null,
        counts.dip > 0 ? countLabel(counts.dip, "low read") : null,
    ].filter((value): value is string => value !== null).join(" · ") || "Clear";
}

function compareCategories(a: CategoryRow, b: CategoryRow, field: CategorySortField): number {
    switch (field) {
        case "urgency":
            return SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]
                || a.flaggedCount - b.flaggedCount
                || a.total - b.total;
        case "consumption":
        case "cost":
            return a.total - b.total;
        case "findings":
            return a.flaggedCount - b.flaggedCount || SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
    }
}

/** CSV columns for the category-performance export — identification fields only. */
const CATEGORY_EXPORT_COLUMNS: ExportColumn<CategoryRow>[] = [
    { key: 'label', header: 'Category' },
    { key: 'severity', header: 'Status' },
    { key: 'total', header: 'Consumption (kWh)', format: (c) => Math.round(c.total) },
    { key: 'total', header: 'Cost (OMR)', format: (c) => (c.total * RATE).toFixed(1) },
    { key: 'trendPct', header: 'Trend vs prev month (%)', format: (c) => c.trendPct !== null ? c.trendPct.toFixed(1) : '' },
    { key: 'meters', header: 'Meters', format: (c) => c.meters.length },
    { key: 'flaggedCount', header: 'Flagged Meters' },
    { key: 'meters', header: 'Findings', format: (c) => describeFindings(c) },
];

function CategoryTable({
    rows,
    totalRows,
    maxCategoryTotal,
    flaggedOnly,
    sortField,
    sortDirection,
    onFlaggedOnlyChange,
    onSort,
    onInspect,
}: {
    rows: CategoryRow[];
    totalRows: number;
    maxCategoryTotal: number;
    flaggedOnly: boolean;
    sortField: CategorySortField;
    sortDirection: SortDirection;
    onFlaggedOnlyChange: (active: boolean) => void;
    onSort: (field: CategorySortField) => void;
    onInspect: (type: string) => void;
}) {
    return (
        <div className="space-y-3">
            <div className="overflow-hidden rounded-[10.5px] border border-border bg-card shadow-card-standard [&_.ops-table-shell]:rounded-none [&_.ops-table-shell]:border-0 [&_.ops-table-shell]:shadow-none">
                <TableToolbar
                    title="Category performance"
                    count={rows.length === totalRows ? `${totalRows} categories` : `${rows.length} of ${totalRows} categories`}
                >
                    <button
                        type="button"
                        onClick={() => onFlaggedOnlyChange(!flaggedOnly)}
                        aria-pressed={flaggedOnly}
                        className={cn(
                            "inline-flex min-h-8 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/60",
                            flaggedOnly
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-card text-muted-foreground hover:bg-muted-bg hover:text-foreground",
                        )}
                    >
                        <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                        Flagged only
                    </button>
                    <ExportButton rows={rows} filename="electricity-category-performance" columns={CATEGORY_EXPORT_COLUMNS} />
                </TableToolbar>

                <Table
                    data-density="compact"
                    className="min-w-0 table-fixed md:min-w-[880px] md:table-auto"
                    aria-label="Electricity category performance"
                >
                    <TableHeader>
                        <TableRow>
                            <SortableTableHead
                                field="urgency"
                                currentSortField={sortField}
                                currentSortDirection={sortDirection}
                                onSort={(field) => onSort(field as CategorySortField)}
                                className="col-sticky w-[56%] md:w-auto md:min-w-[190px]"
                            >
                                Category / status
                            </SortableTableHead>
                            <SortableTableHead
                                field="consumption"
                                currentSortField={sortField}
                                currentSortDirection={sortDirection}
                                onSort={(field) => onSort(field as CategorySortField)}
                                align="right"
                                className="num w-[44%] md:w-auto md:min-w-[155px]"
                            >
                                Consumption
                            </SortableTableHead>
                            <SortableTableHead
                                field="cost"
                                currentSortField={sortField}
                                currentSortDirection={sortDirection}
                                onSort={(field) => onSort(field as CategorySortField)}
                                align="right"
                                className="num hidden min-w-[105px] md:table-cell"
                            >
                                Cost (OMR)
                            </SortableTableHead>
                            <SortableTableHead
                                field="findings"
                                currentSortField={sortField}
                                currentSortDirection={sortDirection}
                                onSort={(field) => onSort(field as CategorySortField)}
                                className="hidden min-w-[150px] md:table-cell"
                            >
                                Findings
                            </SortableTableHead>
                            <TableHead className="hidden w-12 md:table-cell"><span className="sr-only">Inspect</span></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map((category) => {
                            const findingSummary = describeFindings(category);
                            const barWidth = (category.total / maxCategoryTotal) * 100;

                            return (
                                <TableRow key={category.type}>
                                    <TableCell
                                        className="col-sticky strong"
                                        style={{ boxShadow: `inset 3px 0 0 ${SEV_UI[category.severity].base}` }}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => onInspect(category.type)}
                                            className="group flex min-h-11 w-full items-center justify-between gap-3 rounded-md text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/60"
                                        >
                                            <span className="min-w-0">
                                                <span className="block truncate text-[13px] font-semibold text-foreground group-hover:text-primary">
                                                    {category.label}
                                                </span>
                                                <span className="mt-0.5 block text-[11px] font-normal text-muted-foreground">
                                                    {countLabel(category.meters.length, "meter")}
                                                    <span className="md:hidden"> · {findingSummary}</span>
                                                </span>
                                            </span>
                                            <SeverityChip severity={category.severity} />
                                        </button>
                                    </TableCell>
                                    <TableCell className="num">
                                        <div className="ms-auto w-[130px] max-w-full">
                                            <div className="flex items-baseline justify-end gap-1.5 whitespace-nowrap">
                                                <span className="font-semibold text-foreground">{num(category.total)} kWh</span>
                                                <span className="text-[11px] font-normal text-muted-foreground">{category.share.toFixed(0)}%</span>
                                            </div>
                                            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted-bg" aria-hidden="true">
                                                <div className="h-full rounded-full bg-secondary" style={{ width: `${barWidth}%` }} />
                                            </div>
                                            <p className="mt-1 text-[11px] font-normal text-muted-foreground md:hidden">
                                                {num(category.total * RATE)} OMR
                                            </p>
                                        </div>
                                    </TableCell>
                                    <TableCell className="num hidden whitespace-nowrap md:table-cell">
                                        {num(category.total * RATE)}
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">
                                        <span
                                            className="font-semibold"
                                            style={{ color: category.flaggedCount > 0 ? SEV_UI[category.severity].text : "var(--mb-success-text)" }}
                                        >
                                            {findingSummary}
                                        </span>
                                    </TableCell>
                                    <TableCell className="hidden text-right md:table-cell">
                                        <button
                                            type="button"
                                            onClick={() => onInspect(category.type)}
                                            aria-label={`Inspect ${category.label}`}
                                            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted-bg hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/60"
                                        >
                                            <ChevronRight className="h-4 w-4" aria-hidden="true" />
                                        </button>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {rows.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                                    No flagged categories in this period.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <p className="sr-only" aria-live="polite">
                Showing {rows.length} of {totalRows} electricity categories.
            </p>
        </div>
    );
}

export function LoadWatch({
    meters, allMonths, startMonth, endMonth, onInspectType, onInspectCell,
}: {
    meters: MeterReading[];
    allMonths: string[];
    startMonth: string;
    endMonth: string;
    onInspectType: (type: string) => void;
    /** Drill-through from a heatmap cell: open that category's meters for that month. */
    onInspectCell?: (type: string, month: string) => void;
}) {
    const model = useMemo(
        () => buildElectricityModel(meters, allMonths, startMonth, endMonth),
        [meters, allMonths, startMonth, endMonth],
    );
    const metrics = useMemo(() => worstFirst(buildCategoryMetrics(model)), [model]);
    const [sortField, setSortField] = useState<CategorySortField>("urgency");
    const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
    const [flaggedOnly, setFlaggedOnly] = useState(false);
    const rankedCategories = useMemo(() => {
        const categoriesByType = new Map(model.categories.map((category) => [category.type, category]));
        return metrics.flatMap((metric) => {
            const category = categoriesByType.get(metric.key);
            return category ? [category] : [];
        });
    }, [metrics, model.categories]);
    const attentionCategories = useMemo(
        () => rankedCategories.filter((category) => category.flaggedCount > 0),
        [rankedCategories],
    );
    const visibleCategories = useMemo(() => {
        const filtered = flaggedOnly ? attentionCategories : rankedCategories;
        const direction = sortDirection === "asc" ? 1 : -1;
        return [...filtered].sort((a, b) => {
            const result = compareCategories(a, b, sortField);
            return result === 0 ? a.label.localeCompare(b.label) : result * direction;
        });
    }, [attentionCategories, flaggedOnly, rankedCategories, sortDirection, sortField]);
    const maxCategoryTotal = useMemo(
        () => Math.max(...rankedCategories.map((category) => category.total), 1),
        [rankedCategories],
    );
    const heat = useMemo(() => buildCategoryHeatmap(model, onInspectCell), [model, onInspectCell]);
    const findings = useMemo(() => buildElectricityFindings(model), [model]);
    const gateNote = useMemo(() => describeElectricityGates(), []);

    const handleSort = (field: CategorySortField) => {
        if (field === sortField) {
            setSortDirection((current) => current === "asc" ? "desc" : "asc");
            return;
        }
        setSortField(field);
        setSortDirection("desc");
    };

    if (model.categories.length === 0 || model.currentMonth === null) {
        return (
            <Card className="card-elevated">
                <CardContent className="flex flex-col items-center gap-2 py-14 text-center">
                    <Activity className="h-8 w-8 text-muted-foreground/70" aria-hidden="true" />
                    <p className="text-sm font-semibold text-foreground">No meter readings in the selected range</p>
                    <p className="max-w-md text-xs text-muted-foreground">Widen the year / date range above to load meter data.</p>
                </CardContent>
            </Card>
        );
    }

    const { summary, currentMonth } = model;
    const TrendIcon = summary.trendPct !== null && summary.trendPct < 0 ? ArrowDown : ArrowUp;
    const budget = ELECTRICITY_TARGETS.MONTHLY_BUDGET_OMR;

    // The same four figures the old briefing strip carried, on the app-wide
    // tile. The month that used to sit in the strip's caption now leads the
    // first subtitle so nothing is lost. Colour = meaning: cost turns danger
    // only when it exceeds the configured budget; flagged meters are danger
    // when any exist and success when none do.
    const briefingStats: StatItem[] = [
        {
            icon: Zap,
            label: "Consumption",
            value: num(summary.grandTotal / 1000, 1),
            unit: "MWh",
            subtitle: `${currentMonth} · ${summary.meterCount} meters across ${model.categories.length} categories`,
            variant: "primary",
        },
        {
            icon: DollarSign,
            label: "Estimated cost",
            value: num(summary.cost),
            unit: "OMR",
            subtitle: budget !== null
                ? `${((summary.cost / budget) * 100).toFixed(0)}% of ${num(budget)} OMR budget`
                : `At ${RATE} OMR/kWh`,
            variant: budget !== null && summary.cost > budget ? "danger" : "info",
        },
        {
            icon: TrendIcon,
            label: "Previous month",
            value: summary.trendPct === null ? "—" : `${summary.trendPct > 0 ? "+" : ""}${summary.trendPct.toFixed(1)}%`,
            accessibleValue: summary.trendPct === null ? "No previous month in range" : undefined,
            subtitle: model.prevMonth ? `Compared with ${model.prevMonth}` : "No previous month in range",
            variant: "info",
        },
        {
            icon: summary.flaggedCount > 0 ? AlertTriangle : CheckCircle2,
            label: "Flagged meters",
            value: String(summary.flaggedCount),
            subtitle: summary.flaggedCount > 0
                ? `${attentionCategories.length} categories need review`
                : "All categories are within tolerance",
            variant: summary.flaggedCount > 0 ? "danger" : "success",
        },
    ];

    return (
        <div className="space-y-6">
            <SectionBoundary title="Load briefing">
                <StatsGrid stats={briefingStats} />
            </SectionBoundary>

            <SectionBoundary title="Category control board">
                <div className="space-y-3">
                    <CategoryTable
                        rows={visibleCategories}
                        totalRows={rankedCategories.length}
                        maxCategoryTotal={maxCategoryTotal}
                        flaggedOnly={flaggedOnly}
                        sortField={sortField}
                        sortDirection={sortDirection}
                        onFlaggedOnlyChange={setFlaggedOnly}
                        onSort={handleSort}
                        onInspect={onInspectType}
                    />
                    <details className="rounded-lg border border-border bg-card px-3.5 py-2.5 text-xs text-muted-foreground">
                        <summary className="flex cursor-pointer list-none items-center gap-2 font-semibold text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary">
                            <Info className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                            Alert rules
                        </summary>
                        <p className="mt-2 leading-relaxed">{gateNote}</p>
                    </details>
                </div>
            </SectionBoundary>

            {/* Category × month heatmap */}
            <SectionBoundary title="Category load heatmap">
                <MetricHeatmap
                    title="Category Load Heatmap"
                    note={CATEGORY_HEATMAP_NOTE}
                    icon={Gauge}
                    columns={heat.columns}
                    rows={heat.rows}
                />
            </SectionBoundary>

            {/* Findings — identification only, no assignment or resolution tracking */}
            <div id="electricity-findings-register" className="scroll-mt-6">
                <SectionBoundary title="Findings register">
                    <FindingsRegister
                        rows={findings}
                        title={`Findings — ${currentMonth}`}
                        subtitle="Auto-generated from this month's readings: consumption spikes, dips, zero-consumption, negative reads and missing reads, each against the meter's own baseline."
                        filename={`electricity-findings-${currentMonth}`}
                        emptyHint="Every meter is within tolerance of its own baseline this month — no spikes, dips, zeros, negatives or missing reads."
                        showDate={false}
                        gateNote={gateNote}
                    />
                </SectionBoundary>
            </div>
        </div>
    );
}
