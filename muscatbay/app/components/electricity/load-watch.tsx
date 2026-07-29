"use client";

/**
 * Load Watch — the Electricity section's inspection-first landing, modelled on
 * the Water Zone Watch. It answers "which system is drawing abnormally, and
 * which meters do I check?" from one screen: a briefing strip, severity-first
 * category cards (worst first, tap to drill into that type), a category×month
 * heatmap that shows when a category's draw spiked — and whose cells now drill
 * straight through to that category's meters for that month — and the
 * auto-generated findings register of flagged meters (spike / dip / zero /
 * negative / missing).
 *
 * Every threshold shown here comes from lib/thresholds.ts and is printed in the
 * UI, so an operator can always see what produced a severity.
 */

import { useMemo } from "react";
import { Zap, Gauge, Activity, DollarSign, Layers, AlertTriangle, CheckCircle2, ArrowUp, ArrowDown, Target } from "lucide-react";
import type { MeterReading } from "@/lib/mock-data";
import { ELECTRICITY_RATES, ELECTRICITY_TARGETS } from "@/lib/config";
import { describeElectricityGates } from "@/lib/thresholds";
import { Card, CardContent } from "@/components/ui/card";
import { SectionBoundary } from "@/components/shared/section-boundary";
import {
    HealthCard, MetricHeatmap, InspectionTicker, worstFirst, type TickerStat, type HealthMetric,
} from "@/components/shared/inspection";
import { FindingsRegister } from "@/components/shared/findings-register";
import {
    buildElectricityModel, buildCategoryMetrics, buildCategoryHeatmap, buildElectricityFindings,
    CATEGORY_HEATMAP_NOTE,
} from "./electricity-analytics";

const RATE = ELECTRICITY_RATES.RATE_PER_KWH;
const num = (x: number, frac = 0) => x.toLocaleString("en-US", { maximumFractionDigits: frac });

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

    // ── Card budget: detail cards for what needs eyes, one fold for the rest ──
    // The estate has 10 meter-type categories, so an exhaustive grid is a 2×5
    // wall of cards — reported as clutter (2026-07-29). The cards' job is
    // triage, not enumeration: every category that is NOT healthy always gets
    // its own card (a warning is never folded away), then the biggest quiet
    // categories fill up to the budget, and the remaining quiet ones collapse
    // into a single combined card. Nothing is lost — every category still has
    // its own row in the heatmap directly below.
    const CARD_BUDGET = 5;
    const { visibleMetrics, foldedCard } = useMemo(() => {
        const calm = (s: HealthMetric["severity"]) => s === "good" || s === "nodata";
        const attention = metrics.filter((m) => !calm(m.severity));
        // `metrics` is worst-first, and within equal severity keeps the model's
        // total-consumption order — so the quiet list starts with the biggest loads.
        const quiet = metrics.filter((m) => calm(m.severity));
        const fill = Math.max(0, CARD_BUDGET - attention.length);
        const folded = quiet.slice(fill);

        if (folded.length <= 1) {
            // Folding a single category saves nothing — show it directly.
            return { visibleMetrics: metrics, foldedCard: null };
        }

        const foldedKeys = new Set(folded.map((m) => m.key));
        const foldedTotal = model.categories
            .filter((c) => foldedKeys.has(c.type))
            .reduce((s, c) => s + c.total, 0);
        const foldedShare = model.categories
            .filter((c) => foldedKeys.has(c.type))
            .reduce((s, c) => s + c.share, 0);

        const card: HealthMetric = {
            key: "__folded",
            title: `Other categories (${folded.length})`,
            severity: "good",
            headline: `${num(foldedTotal)} kWh`,
            headlineNote: `${foldedShare.toFixed(0)}% of load · combined`,
            subtitle: folded.map((m) => m.title).join(" · "),
            facts: [{ label: "cost", value: `${num(foldedTotal * RATE)} OMR` }],
        };
        return { visibleMetrics: [...attention, ...quiet.slice(0, fill)], foldedCard: card };
    }, [metrics, model]);
    const heat = useMemo(() => buildCategoryHeatmap(model, onInspectCell), [model, onInspectCell]);
    const findings = useMemo(() => buildElectricityFindings(model), [model]);
    const gateNote = useMemo(() => describeElectricityGates(), []);

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

    const tickerItems: TickerStat[] = [
        { icon: Zap, label: "Consumption", value: <>{num(summary.grandTotal / 1000, 1)} <span className="text-muted-foreground">MWh</span></> },
        // Rate comes from config — hardcoding it here would silently lie the day the tariff changes.
        { icon: DollarSign, label: "Cost", value: <>{num(summary.cost)} <span className="text-muted-foreground">OMR</span></>, title: `at ${RATE} OMR/kWh` },
        budget !== null
            ? {
                icon: Target,
                label: "vs monthly budget",
                value: `${((summary.cost / budget) * 100).toFixed(0)}% of ${num(budget)} OMR`,
                tone: summary.cost > budget ? "danger" : "success",
                title: ELECTRICITY_TARGETS.SOURCE_NOTE,
            }
            : {
                icon: Target,
                label: "Monthly budget",
                value: "not configured",
                title: ELECTRICITY_TARGETS.SOURCE_NOTE,
            },
        { icon: Layers, label: "Categories", value: String(model.categories.length), title: "meter types" },
        {
            icon: summary.flaggedCount > 0 ? AlertTriangle : CheckCircle2,
            label: "Flagged meters",
            value: summary.flaggedCount > 0 ? `${summary.flaggedCount} need a look` : "0 · all clear",
            tone: summary.flaggedCount > 0 ? "danger" : "success",
        },
        { icon: TrendIcon, label: "vs prev month", value: summary.trendPct === null ? "—" : `${summary.trendPct > 0 ? "+" : ""}${summary.trendPct.toFixed(1)}%`, tone: "info", title: "Consumption vs the previous month" },
    ];

    return (
        <div className="space-y-6">
            {/* Briefing ticker — same idiom as the Water Daily strip */}
            <SectionBoundary title="Load briefing">
                <InspectionTicker caption={`Load briefing · ${currentMonth}`} items={tickerItems} />
            </SectionBoundary>

            {/* Category cards — worst first, tap to inspect. Detail cards are
                budgeted (see CARD_BUDGET above); the quiet tail folds into one
                combined card, and the heatmap below still lists every category. */}
            <SectionBoundary title="Category health">
                <div className="space-y-2">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {visibleMetrics.map((m) => <HealthCard key={m.key} metric={m} onInspect={onInspectType} />)}
                        {foldedCard && <HealthCard key={foldedCard.key} metric={foldedCard} />}
                    </div>
                    <p className="text-[11px] leading-snug text-muted-foreground">
                        <span className="font-semibold uppercase tracking-wide">Thresholds in force · </span>{gateNote}
                    </p>
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
    );
}
