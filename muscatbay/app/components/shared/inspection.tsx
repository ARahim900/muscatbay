"use client";

/**
 * Inspection toolkit — the shared "what needs attention" language for operations
 * modules. Extracted so Electricity, STP (and any future section) render their
 * watch surfaces from ONE severity model and ONE set of primitives, exactly the
 * way the Water section reads: severity-first cards, a period heatmap that shows
 * *when* something went wrong, and an auto-generated Exceptions & Actions
 * register with a suggested action on every row.
 *
 * Design contract:
 *  - Tokens only, and ONE severity colour model for the whole app:
 *      · saturated indicators (dots, card stripes, icons)  → --status-*
 *      · tinted surfaces (chips, heatmap cells, callouts)  → --mb-*-light
 *      · text sitting on a tint (WCAG-tuned)               → --mb-*-text
 *    That is the same split used by StatsGrid, alerts-feed, module-coverage,
 *    PageStatusBar, firefighting/firefighting-ui.tsx and StatusBadge, so "danger"
 *    is the same red on every module page and flips correctly in both themes.
 *  - Status is never colour-only: every severity is paired with a text label and
 *    an icon (WCAG AA in the field, per design principle #5).
 *  - Domain-agnostic: sections compute Severity + rows; these primitives render.
 */

import type { LucideIcon } from "lucide-react";
import {
    AlertTriangle, CheckCircle2, HelpCircle, TrendingUp, XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTickerLoop } from "@/hooks/useTickerLoop";

// ─── Severity model ───────────────────────────────────────────────────────────

export type Severity = "nodata" | "good" | "watch" | "high" | "critical";

export const SEVERITY_LABEL: Record<Severity, string> = {
    nodata: "No data",
    good: "Healthy",
    watch: "Watch",
    high: "High",
    critical: "Critical",
};

/** Higher = more urgent. Drives worst-first ordering of cards and rows. */
export const SEVERITY_RANK: Record<Severity, number> = {
    good: 0,
    nodata: 1,
    watch: 2,
    high: 3,
    critical: 4,
};

type ChipColor = "success" | "danger" | "warning" | "default";

export const SEV_UI: Record<Severity, { base: string; text: string; bg: string; chip: ChipColor }> = {
    nodata: {
        base: "var(--status-stale)", text: "var(--mb-stale-text)",
        bg: "color-mix(in srgb, var(--mb-stale) 12%, transparent)", chip: "default",
    },
    good: {
        base: "var(--status-normal)", text: "var(--mb-success-text)",
        bg: "color-mix(in srgb, var(--mb-success) 12%, transparent)", chip: "success",
    },
    watch: {
        base: "var(--status-warning)", text: "var(--mb-warning-text)",
        bg: "color-mix(in srgb, var(--mb-warning) 18%, transparent)", chip: "warning",
    },
    high: {
        base: "var(--status-danger)", text: "var(--mb-danger-text)",
        bg: "color-mix(in srgb, var(--mb-danger) 15%, transparent)", chip: "danger",
    },
    critical: {
        base: "var(--status-danger)", text: "var(--mb-danger-text)",
        bg: "color-mix(in srgb, var(--mb-danger) 30%, transparent)", chip: "danger",
    },
};

// Token-only: --mb-*-light and --mb-*-text already flip in the .dark block, so
// one class list is correct in both themes — no dark: variants, no raw palette.
// This is the same chip tint recipe used by firefighting/firefighting-ui.tsx, the Gulf Expert
// tabs, reading-cell and the water daily panels — one chip look app-wide.
const CHIP_STYLES: Record<ChipColor, string> = {
    success: "bg-mb-success-light text-mb-success-text ring-mb-success/30",
    danger: "bg-mb-danger-light text-mb-danger-text ring-mb-danger/30",
    warning: "bg-mb-warning-light text-mb-warning-text ring-mb-warning/30",
    default: "bg-muted text-muted-foreground ring-border/20",
};

// Shape-distinct glyph per severity, so a chip never depends on colour alone
// (WCAG 1.4.1). Same mapping as StatsGrid / alerts-feed / module-coverage.
const CHIP_ICON: Record<Severity, LucideIcon> = {
    nodata: HelpCircle,
    good: CheckCircle2,
    watch: AlertTriangle,
    high: XCircle,
    critical: XCircle,
};

export function SeverityChip({ severity, label }: { severity: Severity; label?: string }) {
    const Icon = CHIP_ICON[severity];
    return (
        <span className={cn(
            "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ring-1 ring-inset whitespace-nowrap",
            CHIP_STYLES[SEV_UI[severity].chip],
        )}>
            <Icon className="h-3 w-3 shrink-0" strokeWidth={2.5} aria-hidden="true" />
            {label ?? SEVERITY_LABEL[severity]}
        </span>
    );
}

// ─── Sparkline (inline SVG — no chart lib for tiny trends) ────────────────────

export function Sparkline({ values, stroke, className }: { values: (number | null)[]; stroke: string; className?: string }) {
    const nums = values.filter((v): v is number => v !== null && Number.isFinite(v));
    if (nums.length < 2) {
        return <p className={cn("h-7 text-[10px] leading-7 text-muted-foreground", className)}>not enough trend data</p>;
    }
    const min = Math.min(...nums);
    const max = Math.max(...nums);
    const span = max - min || 1;
    const W = 100, H = 28, PAD = 3;
    const x = (i: number) => (values.length === 1 ? W / 2 : (i / (values.length - 1)) * (W - PAD * 2) + PAD);
    const y = (v: number) => H - PAD - ((v - min) / span) * (H - PAD * 2);
    let d = "";
    let pen = false;
    values.forEach((v, i) => {
        if (v === null || !Number.isFinite(v)) { pen = false; return; }
        d += `${pen ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`;
        pen = true;
    });
    return (
        <svg viewBox={`0 0 ${W} ${H}`} className={cn("h-7 w-full", className)} preserveAspectRatio="none" aria-hidden="true">
            <path d={d} fill="none" stroke={stroke} strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
    );
}

// ─── Health card — the "which unit needs inspection" answer, at a glance ──────

export interface HealthFact { label: string; value: string }

export interface HealthMetric {
    key: string;
    title: string;
    severity: Severity;
    /** Big headline value, e.g. "88.2%" or "1,240 m³". */
    headline: string;
    headlineNote?: string;
    /** Up to two supporting figures shown on the right. */
    facts?: HealthFact[];
    /** ≤14-point trend; nulls break the line. */
    spark?: (number | null)[];
    sparkNote?: string;
    /** Optional "3d rising" / "leak signature" style badge. */
    signal?: { label: string; tone: "danger" | "warning" };
    /** Subtitle under the title (e.g. "12 meters · tap to inspect"). */
    subtitle?: string;
}

export function HealthCard({ metric, onInspect }: { metric: HealthMetric; onInspect?: (key: string) => void }) {
    const s = SEV_UI[metric.severity];
    const calm = metric.severity === "good" || metric.severity === "nodata";
    // Calm by default, urgent only when earned: the headline stays foreground on
    // healthy cards and only takes the status colour once there's something to see.
    const headlineColor = calm ? "var(--foreground)" : s.text;
    const inner = (
        <>
            <div className="flex items-center justify-between gap-2">
                <h4 className="truncate text-[13px] font-semibold tracking-tight text-foreground">{metric.title}</h4>
                <SeverityChip severity={metric.severity} />
            </div>
            {metric.subtitle && <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{metric.subtitle}</p>}

            <div className="mt-2.5 flex items-end justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-xl font-bold tracking-tight tabular-nums leading-none" style={{ color: headlineColor }}>{metric.headline}</p>
                    {metric.headlineNote && <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{metric.headlineNote}</p>}
                </div>
                {metric.facts && metric.facts.length > 0 && (
                    <div className="shrink-0 space-y-0.5 text-right text-[11px] text-muted-foreground">
                        {metric.facts.slice(0, 2).map((f) => (
                            <p key={f.label}>{f.label} <span className="font-semibold text-foreground tabular-nums">{f.value}</span></p>
                        ))}
                    </div>
                )}
            </div>

            {metric.spark && (
                <div className="mt-2.5">
                    <Sparkline values={metric.spark} stroke={calm ? "var(--chart-success)" : "var(--chart-loss)"} className="h-6 opacity-90" />
                    <div className="mt-1 flex items-center justify-between gap-2">
                        {metric.sparkNote && <p className="truncate text-[10px] text-muted-foreground">{metric.sparkNote}</p>}
                        {metric.signal && (
                            <span className={cn(
                                "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                                metric.signal.tone === "danger"
                                    ? "bg-mb-danger-light text-mb-danger-text"
                                    : "bg-mb-warning-light text-mb-warning-text",
                            )}>
                                <TrendingUp className="h-2.5 w-2.5" aria-hidden="true" />
                                {metric.signal.label}
                            </span>
                        )}
                    </div>
                </div>
            )}
        </>
    );

    const cls = "rounded-[10.5px] border border-border bg-card p-3.5 text-left shadow-card-standard";
    const style = { borderInlineStart: `3px solid ${s.base}` };
    if (onInspect) {
        return (
            <button
                type="button"
                onClick={() => onInspect(metric.key)}
                aria-label={`Inspect ${metric.title} — ${SEVERITY_LABEL[metric.severity]}`}
                className={cn(cls, "transition-[box-shadow,transform] duration-150 ease-out hover:shadow-md motion-safe:hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50")}
                style={style}
            >
                {inner}
            </button>
        );
    }
    return <div className={cls} style={style}>{inner}</div>;
}

// ─── Inspection ticker — the compact briefing strip (matches Water Daily) ──────

export interface TickerStat {
    icon: LucideIcon;
    label: string;
    value: React.ReactNode;
    tone?: "default" | "danger" | "warning" | "success" | "info";
    title?: string;
}

const TICKER_ICON: Record<NonNullable<TickerStat["tone"]>, string> = {
    default: "var(--secondary)",
    danger: "var(--status-danger)",
    warning: "var(--status-warning)",
    success: "var(--status-normal)",
    info: "var(--status-info)",
};
const TICKER_VALUE: Record<NonNullable<TickerStat["tone"]>, string> = {
    default: "text-foreground",
    danger: "text-mb-danger-text",
    warning: "text-mb-warning-text",
    success: "text-mb-success-text",
    info: "text-foreground",
};

function TickerRun({ items, duplicate, runRef }: { items: TickerStat[]; duplicate?: boolean; runRef?: (n: HTMLElement | null) => void }) {
    return (
        <ul ref={runRef} className="mb-ticker-copy flex list-none items-center gap-x-8 pr-8" aria-hidden={duplicate ? "true" : undefined}>
            {items.map((it, i) => {
                const tone = it.tone ?? "default";
                return (
                    <li key={`${it.label}-${i}`} className="flex items-center gap-1.5" title={it.title}>
                        <it.icon className="h-4 w-4 shrink-0" style={{ color: TICKER_ICON[tone] }} aria-hidden="true" />
                        <span className="mb-ticker-label">{it.label}</span>
                        <span className={cn("mb-ticker-value", TICKER_VALUE[tone])}>{it.value}</span>
                    </li>
                );
            })}
        </ul>
    );
}

/**
 * A compact news-ticker briefing strip: a fixed caption on the left and the
 * stats looping continuously beside it — the same idiom as the Water Daily
 * briefing. The run is repeated (`2 × repeat` copies) until half the track is
 * viewport-wide, so the loop is seamless AND always moving. Hover/focus pauses
 * it; reduced-motion gets a single still, swipeable run (shared mb-ticker CSS).
 */
export function InspectionTicker({ caption, items }: { caption: string; items: TickerStat[] }) {
    // Measures one run against the viewport to derive how many copies the
    // seamless loop needs and how long one cycle takes at constant speed.
    const { viewportRef, runRef, trackProps, repeat } = useTickerLoop();
    return (
        <section aria-label={caption} className="mb-ticker-note">
            <p className="mb-ticker-note__caption">{caption}</p>
            <div className="flex min-w-0 flex-1 items-center px-3">
                <div ref={viewportRef} className="mb-ticker-viewport min-w-0 flex-1">
                    <div className="mb-ticker-track items-center" {...trackProps}>
                        {/* Only the first copy is measured or read aloud; the rest
                            exist to keep the viewport covered mid-cycle. */}
                        {Array.from({ length: repeat * 2 }, (_, i) => (
                            <TickerRun key={i} items={items} duplicate={i > 0} runRef={i === 0 ? runRef : undefined} />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

/** Order a set of metrics worst-first — the thing you must see is never below the fold. */
export function worstFirst<T extends { severity: Severity }>(items: T[]): T[] {
    return [...items].sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]);
}

// ─── Metric × period heatmap — "when did it start?" ───────────────────────────

export interface HeatColumn { key: string | number; label: string; highlight?: boolean }
export interface HeatCell { severity: Severity; label: string; title: string; onClick?: () => void }
export interface HeatRow { key: string; label: string; cells: HeatCell[]; trailing?: { severity: Severity; label: string; title?: string } }

export function MetricHeatmap({
    title, note, icon: Icon, columns, rows, trailingLabel,
}: {
    title: string; note?: string; icon?: LucideIcon;
    columns: HeatColumn[]; rows: HeatRow[]; trailingLabel?: string;
}) {
    const legend: Severity[] = ["good", "watch", "high", "critical", "nodata"];
    return (
        <div className="card-elevated rounded-[10.5px] border border-border bg-card">
            <div className="p-4 sm:p-5 md:p-6 pb-2">
                <h3 className="flex items-center gap-2 text-base sm:text-lg font-semibold text-foreground">
                    {Icon && <Icon className="h-4 w-4 text-secondary" aria-hidden="true" />}
                    {title}
                </h3>
                {note && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}
            </div>
            <div className="p-4 sm:p-5 md:p-6 pt-2">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-[11px]">
                        <thead>
                            <tr>
                                <th scope="col" className="sticky left-0 z-10 bg-card px-2 py-1.5 text-left font-semibold text-muted-foreground">Metric</th>
                                {columns.map((c) => (
                                    <th
                                        scope="col"
                                        key={c.key}
                                        className={cn(
                                            "px-1 py-1.5 text-center font-semibold tabular-nums",
                                            c.highlight ? "text-primary underline dark:text-secondary" : "text-muted-foreground",
                                        )}
                                    >
                                        {c.label}
                                    </th>
                                ))}
                                {trailingLabel && <th scope="col" className="px-2 py-1.5 text-center font-semibold text-muted-foreground">{trailingLabel}</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => (
                                <tr key={row.key}>
                                    <td className="sticky left-0 z-10 whitespace-nowrap bg-card px-2 py-1 font-semibold text-foreground">{row.label}</td>
                                    {row.cells.map((cell, i) => {
                                        const s = SEV_UI[cell.severity];
                                        const content = (
                                            <span
                                                className="flex min-h-[26px] w-full min-w-[26px] items-center justify-center rounded px-1 py-1 font-medium tabular-nums"
                                                style={{ background: s.bg, color: cell.severity === "nodata" ? "var(--muted-foreground)" : s.text }}
                                            >
                                                {cell.label}
                                            </span>
                                        );
                                        return (
                                            <td key={columns[i]?.key ?? i} className="p-0.5 text-center" title={cell.title}>
                                                {cell.onClick ? (
                                                    <button
                                                        type="button"
                                                        onClick={cell.onClick}
                                                        aria-label={cell.title}
                                                        className="w-full rounded transition-shadow hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/60"
                                                    >
                                                        {content}
                                                    </button>
                                                ) : content}
                                            </td>
                                        );
                                    })}
                                    {row.trailing && (
                                        <td className="px-2 py-1 text-center font-bold tabular-nums" style={{ color: SEV_UI[row.trailing.severity].text }} title={row.trailing.title}>
                                            {row.trailing.label}
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
                    {legend.map((sev) => (
                        <span key={sev} className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <span className="h-3 w-3 rounded-sm border border-border/40" style={{ background: SEV_UI[sev].bg }} aria-hidden="true" />
                            {SEVERITY_LABEL[sev]}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}
