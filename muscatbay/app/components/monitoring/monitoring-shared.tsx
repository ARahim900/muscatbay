"use client";

/**
 * Shared pieces of the monitoring surfaces.
 *
 * Everything here renders a value the rules engine already computed — nothing
 * recalculates a figure at render time. That is deliberate: the CSV export, the
 * dashboard and any future digest all read the same report object, so they
 * cannot drift apart the way four copies of a threshold once did.
 *
 * Severity is never colour-only: every state carries an icon and a word as well
 * (WCAG 1.4.1), which is why these lean on `SeverityChip` rather than tinting
 * text and hoping.
 */

import { AlertTriangle, CheckCircle2, HelpCircle, Info, WifiOff } from "lucide-react";
import { SEV_UI, SeverityChip, type Severity } from "@/components/shared/inspection";
import { formatCoverage, formatPct } from "@/lib/monitoring/coverage";
import type { CoverageStat, ReportSection, SourceStatus } from "@/lib/monitoring/types";
import { cn } from "@/lib/utils";

/* ── Coverage bar ─────────────────────────────────────────────────────────── */

/**
 * A completeness bar that refuses to draw an unknown.
 *
 * When `pct` is null nothing was expected, so the track stays empty with an
 * explicit "—" rather than filling to 100% and implying a clean sweep.
 */
export function CoverageBar({ stat, severity }: { stat: CoverageStat; severity: Severity }) {
    const known = stat.pct !== null;
    return (
        <div className="flex items-center gap-2">
            <div
                className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
                role="img"
                aria-label={known ? `${formatPct(stat.pct)} recorded — ${formatCoverage(stat)}` : "Coverage unknown"}
            >
                {known && (
                    <div
                        className="h-full rounded-full transition-[width] duration-500"
                        style={{ width: `${Math.min(100, Math.max(0, stat.pct ?? 0))}%`, background: SEV_UI[severity].base }}
                    />
                )}
            </div>
            <span className="w-12 shrink-0 text-right text-[11px] font-semibold tabular-nums text-muted-foreground">
                {formatPct(stat.pct)}
            </span>
        </div>
    );
}

/* ── Section card ─────────────────────────────────────────────────────────── */

/**
 * One monitored section: how complete it is, and — when it could not be read at
 * all — a plain statement that its state is unknown. A blind section is never
 * shown as healthy.
 */
export function SectionCard({ section }: { section: ReportSection }) {
    const blind = Boolean(section.unavailable);
    return (
        <div className="card-elevated flex flex-col gap-3 rounded-[10.5px] border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <h3 className="truncate text-[13px] font-semibold tracking-tight text-foreground">{section.title}</h3>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {blind ? "Not assessable this pass" : formatCoverage(section.coverage)}
                    </p>
                </div>
                <SeverityChip severity={section.severity} label={blind ? "Unknown" : undefined} />
            </div>

            {blind ? (
                <p className="flex items-start gap-1.5 rounded-[7px] bg-muted/60 px-2.5 py-2 text-[11px] leading-relaxed text-muted-foreground">
                    <WifiOff className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span>{section.unavailable}</span>
                </p>
            ) : (
                <>
                    <CoverageBar stat={section.coverage} severity={section.severity} />
                    <p className="text-[11px] leading-relaxed text-muted-foreground">{section.headline}</p>
                </>
            )}
        </div>
    );
}

/* ── Source panel ─────────────────────────────────────────────────────────── */

const SOURCE_UI: Record<SourceStatus["state"], { icon: typeof CheckCircle2; chip: string; word: string }> = {
    ok: { icon: CheckCircle2, chip: "bg-mb-success-light text-mb-success-text", word: "Read" },
    empty: { icon: Info, chip: "bg-muted text-muted-foreground", word: "Empty" },
    error: { icon: AlertTriangle, chip: "bg-mb-danger-light text-mb-danger-text", word: "Failed" },
    "not-configured": { icon: HelpCircle, chip: "bg-mb-stale-light text-mb-stale-text", word: "Not configured" },
};

/**
 * What the agent could actually read this pass.
 *
 * This panel is the report's honesty ledger: a section can only be trusted as
 * far as its source, and a source that failed says so here in the operator's
 * own words ("connection reset"), not as a silent zero somewhere upstream.
 */
export function SourcePanel({ sources }: { sources: SourceStatus[] }) {
    const failed = sources.filter((s) => s.state === "error" || s.state === "not-configured");
    return (
        <div className="rounded-[10.5px] border border-border bg-card p-4">
            <div className="mb-2.5 flex items-center justify-between gap-2">
                <h3 className="text-[13px] font-semibold tracking-tight text-foreground">Sources read this pass</h3>
                {failed.length > 0 && (
                    <span className="rounded-[5px] bg-mb-danger-light px-2 py-0.5 text-[11px] font-semibold text-mb-danger-text">
                        {failed.length} unavailable — report is partial
                    </span>
                )}
            </div>
            <ul className="grid gap-1.5 sm:grid-cols-2 xl:grid-cols-3">
                {sources.map((source) => {
                    const ui = SOURCE_UI[source.state];
                    const Icon = ui.icon;
                    return (
                        <li key={source.key} className="flex items-start gap-2 rounded-[7px] bg-muted/40 px-2.5 py-2">
                            <span className={cn("mt-px flex items-center gap-1 rounded-[5px] px-1.5 py-0.5 text-[10px] font-semibold", ui.chip)}>
                                <Icon className="h-3 w-3" aria-hidden="true" />
                                {ui.word}
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-[11px] font-medium text-foreground">{source.label}</span>
                                <span className="block text-[10px] leading-relaxed text-muted-foreground">
                                    {source.rows !== null ? `${source.rows.toLocaleString("en-GB")} rows` : "not read"}
                                    {source.message ? ` · ${source.message}` : ""}
                                </span>
                            </span>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

/* ── Unmonitored notice ───────────────────────────────────────────────────── */

/**
 * Names the modules this report does not cover.
 *
 * In a completeness report, saying nothing about a module reads as "that one is
 * fine". Listing them is the difference between a report that is silent and one
 * that is honest about its own scope.
 */
export function UnmonitoredNotice({ sections }: { sections: string[] }) {
    if (sections.length === 0) return null;
    return (
        <div className="rounded-[10.5px] border border-dashed border-border bg-muted/30 p-4">
            <h3 className="flex items-center gap-1.5 text-[12px] font-semibold text-foreground">
                <Info className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                Not covered by this report
            </h3>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                These modules have no periodic-entry obligation defined, so nothing above says anything
                about them either way. Give one a cadence and it moves into the report.
            </p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
                {sections.map((name) => (
                    <li key={name} className="rounded-[5px] bg-card px-2 py-1 text-[10px] text-muted-foreground ring-1 ring-border/60">
                        {name}
                    </li>
                ))}
            </ul>
        </div>
    );
}
