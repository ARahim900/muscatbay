"use client";

/**
 * Findings register — the identification-only replacement for the Exceptions &
 * Actions table.
 *
 * Why this exists alongside `components/shared/inspection.tsx`
 * -----------------------------------------------------------
 * The shared `ExceptionsRegister` hardcodes two tracking columns — `Owner` and
 * `Status: "Open"` — that are pure fiction: nothing in the app assigns work or
 * closes an item, and management explicitly does NOT want assignment or
 * resolution tracking, only identification. This register keeps everything that
 * is real (severity, item, value, remarks, suggested action) and drops the
 * theatre. It deliberately reuses the shared severity model (`Severity`,
 * `SeverityChip`, `SEV_UI`) rather than inventing a second one, so the colours
 * and labels stay identical to the health cards and heatmaps above it.
 *
 * It also fixes the two things that made the old register unusable at scale:
 *  - grouping: repeated identical findings collapse into one row with an
 *    occurrence count and a date span, instead of hundreds of near-identical
 *    "No inlet recorded" rows burying the Critical ones;
 *  - filtering + progressive disclosure: severity chips, a category select, a
 *    free-text search, and a "show more" batch so the table never renders an
 *    unbounded list.
 */

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ClipboardList, Download, Search, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { exportToCSV } from "@/lib/export-utils";
import { SeverityChip } from "@/components/shared/inspection";

// ─── Row model ────────────────────────────────────────────────────────────────

export type FindingSeverity = "Critical" | "Watch";

export interface Finding {
    /** Stable key for React + de-duplication. */
    id: string;
    /** Day or period the finding belongs to; omitted for single-period registers. */
    date?: string;
    category: string;
    item: string;
    severity: FindingSeverity;
    /** The measured figure that triggered the finding. */
    value: string;
    /** Why it fired — the live threshold that was crossed, and any grouping span. */
    remarks?: string;
    /** What an operator should go and check. Identification only — never a work order. */
    action: string;
    /** >1 when consecutive identical findings were collapsed into this row. */
    occurrences?: number;
}

const PAGE_BATCH = 50;

const thBase =
    "h-[2.875rem] px-4 py-3 text-left align-middle text-[11px] font-medium uppercase tracking-[0.04em] text-muted-foreground whitespace-nowrap";
const tdBase = "px-4 py-3.5 align-middle text-[13px] font-medium text-card-foreground";

// ─── Grouping helper (exported — analytics modules collapse runs before render) ─

/**
 * Collapse a chronologically-ordered run of identical findings (same category +
 * item + severity) into one row carrying the occurrence count and the date span.
 * Keeps the register honest: nothing is dropped, it is summarised.
 */
export function collapseConsecutive(rows: Finding[]): Finding[] {
    const out: Finding[] = [];
    for (const row of rows) {
        const prev = out[out.length - 1];
        const sameFinding =
            prev &&
            prev.category === row.category &&
            prev.item === row.item &&
            prev.severity === row.severity;
        if (sameFinding) {
            const count = (prev.occurrences ?? 1) + 1;
            const firstDate = prev.date?.split(" – ")[0] ?? prev.date;
            const baseRemark = prev.remarks?.split(" · spans ")[0];
            out[out.length - 1] = {
                ...prev,
                occurrences: count,
                // The first occurrence's value is kept (it is the one that opened
                // the run); the span and count carry the rest of the story.
                date: firstDate && row.date ? `${firstDate} – ${row.date}` : (row.date ?? prev.date),
                remarks: [baseRemark, `spans ${count} consecutive logged days`].filter(Boolean).join(" · "),
            };
        } else {
            out.push(row);
        }
    }
    return out;
}

// ─── Summary tiles ────────────────────────────────────────────────────────────

function SummaryStat({
    label, value, icon, color, valueColor,
}: { label: string; value: string; icon: React.ReactNode; color: string; valueColor?: string }) {
    return (
        <div className="relative overflow-hidden rounded-xl border border-border bg-card p-4 shadow-card-standard sm:p-5">
            <div className="absolute left-0 right-0 top-0 h-[3px]" style={{ backgroundColor: color }} aria-hidden="true" />
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">{label}</p>
                    <h3 className="text-lg font-semibold tracking-tight tabular-nums text-foreground sm:text-xl md:text-2xl" style={valueColor ? { color: valueColor } : undefined}>
                        {value}
                    </h3>
                </div>
                <div className="flex-shrink-0 rounded-lg p-2 sm:p-3" style={{ backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`, color }}>
                    {icon}
                </div>
            </div>
        </div>
    );
}

// ─── Register ─────────────────────────────────────────────────────────────────

export function FindingsRegister({
    rows, title, subtitle, filename, emptyHint, showDate = true, gateNote,
}: {
    rows: Finding[];
    title: string;
    subtitle: string;
    filename: string;
    emptyHint?: string;
    showDate?: boolean;
    /** The live threshold sentence — so an operator can see what produced these rows. */
    gateNote?: string;
}) {
    const [severityFilter, setSeverityFilter] = useState<"all" | FindingSeverity>("all");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");
    const [search, setSearch] = useState("");
    const [visible, setVisible] = useState(PAGE_BATCH);

    const categories = useMemo(
        () => Array.from(new Set(rows.map((r) => r.category))).sort(),
        [rows],
    );

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        return rows.filter((r) => {
            if (severityFilter !== "all" && r.severity !== severityFilter) return false;
            if (categoryFilter !== "all" && r.category !== categoryFilter) return false;
            if (term) {
                const hay = `${r.item} ${r.category} ${r.value} ${r.remarks ?? ""} ${r.date ?? ""}`.toLowerCase();
                if (!hay.includes(term)) return false;
            }
            return true;
        });
    }, [rows, severityFilter, categoryFilter, search]);

    const criticalTotal = rows.filter((r) => r.severity === "Critical").length;
    const watchTotal = rows.length - criticalTotal;
    const shown = filtered.slice(0, visible);
    const hasFilters = severityFilter !== "all" || categoryFilter !== "all" || search.trim() !== "";

    const handleExport = () => {
        // Exports exactly what is on screen (the filtered set), identification
        // fields only — no owner, no status, no due date.
        const data = filtered.map((r) => ({
            ...(showDate ? { Date: r.date ?? "" } : {}),
            Category: r.category,
            Item: r.item,
            Severity: r.severity,
            Value: r.value,
            Occurrences: r.occurrences ?? 1,
            Remarks: r.remarks ?? "",
            "Suggested Action": r.action,
        }));
        exportToCSV(data, filename);
    };

    const sevButton = (key: "all" | FindingSeverity, label: string, count: number) => (
        <button
            key={key}
            type="button"
            onClick={() => { setSeverityFilter(key); setVisible(PAGE_BATCH); }}
            aria-pressed={severityFilter === key}
            className={cn(
                "rounded-[5px] px-2.5 py-1 text-[11px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/60",
                severityFilter === key
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground",
            )}
        >
            {label} <span className="tabular-nums opacity-80">({count})</span>
        </button>
    );

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
                <SummaryStat label="Findings" value={String(rows.length)} icon={<ClipboardList className="h-4 w-4 sm:h-5 sm:w-5" />} color="var(--primary)" />
                <SummaryStat label="Critical" value={String(criticalTotal)} icon={<XCircle className="h-4 w-4 sm:h-5 sm:w-5" />} color="var(--status-danger)" valueColor={criticalTotal > 0 ? "var(--mb-danger-text)" : undefined} />
                <SummaryStat label="Watch" value={String(watchTotal)} icon={<AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />} color="var(--status-warning)" />
            </div>

            <div className="card-elevated rounded-[10.5px] border border-border bg-card">
                <div className="p-4 pb-2 sm:p-5 md:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                            <h3 className="flex items-center gap-2 text-base font-semibold text-foreground sm:text-lg">
                                <ClipboardList className="h-4 w-4 text-secondary" aria-hidden="true" />
                                {title}
                            </h3>
                            <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
                            {gateNote && (
                                <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground/90">
                                    <span className="font-semibold uppercase tracking-wide">Thresholds in force · </span>
                                    {gateNote}
                                </p>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={handleExport}
                            disabled={filtered.length === 0}
                            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Download className="h-4 w-4" aria-hidden="true" />
                            Export findings
                        </button>
                    </div>
                </div>

                {rows.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 px-4 pb-3 sm:px-5 md:px-6">
                        {sevButton("all", "All", rows.length)}
                        {sevButton("Critical", "Critical", criticalTotal)}
                        {sevButton("Watch", "Watch", watchTotal)}

                        {categories.length > 1 && (
                            <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                <span className="sr-only">Filter findings by category</span>
                                <select
                                    value={categoryFilter}
                                    onChange={(e) => { setCategoryFilter(e.target.value); setVisible(PAGE_BATCH); }}
                                    aria-label="Filter findings by category"
                                    className="rounded-[5px] border border-border bg-card px-2 py-1 text-[11px] font-medium text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/60"
                                >
                                    <option value="all">All categories</option>
                                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </label>
                        )}

                        <div className="relative ms-auto min-w-0 flex-1 sm:max-w-[240px]">
                            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setVisible(PAGE_BATCH); }}
                                placeholder="Search findings…"
                                aria-label="Search findings"
                                className="w-full rounded-[5px] border border-border bg-card py-1 pe-2 ps-8 text-[11px] text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/60"
                            />
                        </div>

                        <span className="whitespace-nowrap text-[11px] tabular-nums text-muted-foreground">
                            {filtered.length === rows.length ? `${rows.length} shown` : `${filtered.length} of ${rows.length}`}
                        </span>
                    </div>
                )}

                <div className="p-4 pt-2 sm:p-5 md:p-6">
                    {rows.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 py-10 text-center">
                            <CheckCircle2 className="h-8 w-8 text-mb-success-text" aria-hidden="true" />
                            <p className="text-sm font-semibold text-foreground">No findings in this period</p>
                            {emptyHint && <p className="max-w-md text-xs text-muted-foreground">{emptyHint}</p>}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 py-10 text-center">
                            <Search className="h-7 w-7 text-muted-foreground/70" aria-hidden="true" />
                            <p className="text-sm font-semibold text-foreground">No findings match these filters</p>
                            {hasFilters && (
                                <button
                                    type="button"
                                    onClick={() => { setSeverityFilter("all"); setCategoryFilter("all"); setSearch(""); }}
                                    className="text-xs font-semibold text-secondary underline underline-offset-2"
                                >
                                    Clear filters
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="overflow-hidden rounded-[10.5px] border border-border">
                                <div className="overflow-auto" style={{ maxHeight: 560 }}>
                                    <table className="w-full border-collapse text-[12px]" style={{ minWidth: 820 }}>
                                        <thead>
                                            <tr>
                                                {showDate && <th scope="col" className={thBase}>Date</th>}
                                                <th scope="col" className={thBase}>Category</th>
                                                <th scope="col" className={thBase}>Item</th>
                                                <th scope="col" className={thBase}>Severity</th>
                                                <th scope="col" className={cn(thBase, "text-right")}>Value</th>
                                                <th scope="col" className={thBase}>Remarks</th>
                                                <th scope="col" className={thBase}>Suggested action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {shown.map((r, i) => (
                                                <tr key={r.id} className={cn("border-b border-border/60", i % 2 === 1 && "bg-muted/40 dark:bg-muted/20")}>
                                                    {showDate && <td className={cn(tdBase, "whitespace-nowrap text-muted-foreground")}>{r.date ?? "—"}</td>}
                                                    <td className={cn(tdBase, "whitespace-nowrap font-semibold text-foreground")}>{r.category}</td>
                                                    <td className={cn(tdBase, "text-foreground")}>
                                                        {r.item}
                                                        {r.occurrences && r.occurrences > 1 && (
                                                            <span className="ms-2 inline-flex items-center rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
                                                                ×{r.occurrences}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className={tdBase}>
                                                        <SeverityChip severity={r.severity === "Critical" ? "critical" : "watch"} label={r.severity} />
                                                    </td>
                                                    <td className={cn(tdBase, "whitespace-nowrap text-right tabular-nums text-foreground")}>{r.value}</td>
                                                    <td className={cn(tdBase, "min-w-[160px] text-muted-foreground")}>{r.remarks ?? "—"}</td>
                                                    <td className={cn(tdBase, "min-w-[240px] text-muted-foreground")}>{r.action}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {filtered.length > shown.length && (
                                <div className="mt-3 flex items-center justify-center gap-3">
                                    <p className="text-[11px] tabular-nums text-muted-foreground">
                                        Showing {shown.length} of {filtered.length}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => setVisible((v) => v + PAGE_BATCH)}
                                        className="rounded-[5px] border border-border px-3 py-1 text-[11px] font-semibold text-foreground transition-colors hover:bg-muted"
                                    >
                                        Show {Math.min(PAGE_BATCH, filtered.length - shown.length)} more
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
