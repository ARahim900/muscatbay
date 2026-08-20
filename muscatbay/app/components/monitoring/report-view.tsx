"use client";

/**
 * One monitoring report, rendered.
 *
 * Layout follows the inspection pattern the other modules already use — health
 * cards worst-first, then a period heatmap that answers "when did this start?",
 * then the register — so Monitoring reads as another page of the same app
 * rather than a seventh dialect.
 */

import { CalendarRange, Gauge } from "lucide-react";
import { MetricHeatmap, type HeatColumn, type HeatRow } from "@/components/shared/inspection";
import { SectionBoundary } from "@/components/shared/section-boundary";
import { SectionCard, SourcePanel, UnmonitoredNotice } from "./monitoring-shared";
import { MonitoringFindingsRegister } from "./findings-register";
import { formatPct } from "@/lib/monitoring/coverage";
import type { MonitoringReport, ReportSection } from "@/lib/monitoring/types";

/** Order the cards worst-first — the answer to "what needs attention" comes first. */
const RANK: Record<ReportSection["severity"], number> = {
    critical: 0, high: 1, watch: 2, nodata: 3, good: 4,
};

/**
 * A section's period-by-period completeness as heatmap cells.
 *
 * A cell shows the recorded percentage, never a bare count — `12/13` and
 * `120/130` are the same shortfall at very different scales, and the operator
 * is scanning for the shape of a problem, not doing arithmetic.
 */
function heatRowFor(section: ReportSection, columns: HeatColumn[]): HeatRow {
    const byKey = new Map(section.breakdown.map((row) => [row.key, row]));
    return {
        key: section.key,
        label: section.title,
        cells: columns.map((column) => {
            const row = byKey.get(String(column.key));
            if (!row) {
                return { severity: "nodata", label: "—", title: `${section.title} · ${column.label}: not assessed` };
            }
            return {
                severity: row.severity,
                label: formatPct(row.coverage.pct),
                title: [
                    `${section.title} · ${column.label}`,
                    `${row.coverage.recorded} of ${row.coverage.expected} recorded`,
                    row.note,
                ].filter(Boolean).join(" — "),
            };
        }),
    };
}

export function MonitoringReportView({
    report,
    columns,
    heatmapTitle,
    heatmapNote,
}: {
    report: MonitoringReport;
    /** Periods to plot across the heatmap — days for daily, months for monthly. */
    columns: HeatColumn[];
    heatmapTitle: string;
    heatmapNote: string;
}) {
    const cards = [...report.sections].sort((a, b) => RANK[a.severity] - RANK[b.severity]);
    const plottable = report.sections.filter((s) => !s.unavailable && s.breakdown.length > 0);

    return (
        <div className="space-y-5">
            <SectionBoundary title="Section completeness">
                <section aria-label="Section completeness">
                    <div className="mb-2.5 flex items-center gap-2">
                        <Gauge className="h-4 w-4 text-secondary" aria-hidden="true" />
                        <h2 className="text-base font-semibold text-foreground sm:text-lg">Section completeness</h2>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {cards.map((section) => <SectionCard key={section.key} section={section} />)}
                    </div>
                </section>
            </SectionBoundary>

            <SectionBoundary title="Sources">
                <SourcePanel sources={report.sources} />
            </SectionBoundary>

            {plottable.length > 0 && columns.length > 0 && (
                <SectionBoundary title="Completeness by period">
                    <MetricHeatmap
                        title={heatmapTitle}
                        note={heatmapNote}
                        icon={CalendarRange}
                        columns={columns}
                        rows={plottable.map((section) => heatRowFor(section, columns))}
                    />
                </SectionBoundary>
            )}

            <SectionBoundary title="Findings register">
                <section aria-label="Confirmed issues and recommended checks" className="space-y-2">
                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                        Every row states a <strong className="font-semibold text-foreground">confirmed issue</strong> —
                        a fact read from the data, with the figures quoted — and, separately, a{" "}
                        <strong className="font-semibold text-foreground">recommended check</strong>. Nothing here is
                        inferred, predicted or assigned; the app identifies, the floor actions.
                    </p>
                    <MonitoringFindingsRegister report={report} />
                </section>
            </SectionBoundary>

            <UnmonitoredNotice sections={report.unmonitored} />
        </div>
    );
}
