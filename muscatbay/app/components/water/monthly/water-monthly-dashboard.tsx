"use client";

/**
 * @fileoverview Water → Monthly dashboard.
 *
 * Converted from an externally-authored JSX prototype to typed TSX and wired to
 * the live Supabase backend. The prototype's self-contained mock (`DATA`) has
 * been replaced by {@link buildMonthlyData}, which derives the same structure
 * from the `WaterMeter[]` the page fetches via `getWaterMetersFromSupabase`.
 *
 * Theming: the prototype's standalone header, dark-mode toggle and DM Sans
 * import were dropped — the app shell, theme and Geist font take over. The
 * prototype's local CSS variables were renamed to `--wm-*` and are mapped to the
 * app's design tokens in `globals.css`, so the dashboard follows the app's
 * light/dark themes automatically.
 *
 * @module components/water/monthly/water-monthly-dashboard
 */

import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from "react";
import {
    ResponsiveContainer, ComposedChart, BarChart, Bar, Line,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ReferenceLine,
} from "recharts";
import {
    Droplet, TrendingDown, TrendingUp, AlertTriangle, Activity,
    Gauge, Building2, Plug, Search, Layers, ArrowRight, MapPin, CheckCircle2,
    Filter, Download, ClipboardList, XCircle, Target, FileSpreadsheet,
    BarChart3, Database, List, ChevronRight, type LucideIcon,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TabNavigation } from "@/components/shared/tab-navigation";
import { SectionBoundary } from "@/components/shared/section-boundary";
import { DateRangePicker } from "@/components/water/date-range-picker";
import { saveFilterPreferences, loadFilterPreferences, type FilterPreferences } from "@/lib/filter-preferences";
import type { WaterMeter } from "@/lib/water-data";
import {
    buildMonthlyData, computePeriod, MONTHS, TARGET_LOSS_PCT, LOSS_RATE_OMR, TYPECOL,
    fmt, fmt1, pct, isRangeSel, periodValue, monthInSelection, sev, statusFromLoss,
    actionFromLoss, lastReadingLabel, downloadRows, meterFlags, meanReading,
    type WaterData, type PeriodResult, type Sel, type ZoneRow,
} from "@/lib/water-monthly-data";

/* ---------- Muscat Bay Brand & Design System (mapped to app tokens) ---------- */
const C = {
    primary: "var(--primary)",
    accent: "var(--secondary)",
    accentActive: "var(--mb-secondary-active)",
    // domain / chart colours (brand chart palette → app chart tokens)
    supply: "var(--module-water)",
    dist: "var(--chart-1)",
    cons: "var(--chart-success)",
    loss: "var(--chart-loss)",
    brandPurple: "var(--chart-brand)",
    // themed tokens — defined in globals.css under `.water-monthly`, flip with `.dark`
    page: "var(--wm-page)", card: "var(--wm-card)", component: "var(--wm-comp)",
    ink: "var(--wm-ink)", muted: "var(--wm-muted)", border: "var(--wm-border)",
    heading: "var(--wm-heading)", track: "var(--wm-track)", zebra: "var(--wm-zebra)",
} as const;
const RADIUS = { card: 10.5, md: 7, sm: 5 } as const;
const SHADOW = "0px 6px 10px -1px rgba(0,0,0,0.12), 0px 3px 6px -2px rgba(0,0,0,0.1)";
const FONT = "inherit";
const TIP = {
    fontSize: 12, borderRadius: 8,
    background: "var(--wm-card)", color: "var(--wm-ink)", border: "1px solid var(--wm-border)",
} as const;

/* ---------- level colours (token-only) ----------
 * The hierarchy-level chip in the meter database used to hardcode a five-hex
 * palette that never flipped in dark mode. The tint carries the level while the
 * label text stays on `--foreground`, so it is legible in both themes. */
const LEVEL_TOKEN: Record<string, string> = {
    L1: "var(--module-water)",
    L2: "var(--chart-1)",
    L3: "var(--chart-brand)",
    L4: "var(--chart-gray)",
    DC: "var(--chart-elec-secondary)",
};
const levelToken = (level: string): string => LEVEL_TOKEN[level] ?? "var(--chart-axis)";

/* ---------- percentage series names (kept in one place so the tooltip formatter
 * and the <Line> elements can never drift apart) ---------- */
const LOSS_PCT_SERIES = "Loss %";
const TARGET_SERIES = `Target ${TARGET_LOSS_PCT}%`;

/* ---------- stable Recharts formatters (module-level: identity-stable across renders) ----------
 * Param types mirror Recharts' Formatter signature (value may be a number/string/array or undefined,
 * name is string | number) so these are assignable to <Tooltip formatter={...}> without casts. */
type TipValue = number | string | ReadonlyArray<number | string> | undefined;
/** Balance chart: volume series in m³, the loss-% and target series in %. */
const fmtBalance = (v: TipValue, n: number | string | undefined): [string, string] => {
    const name = String(n);
    const isPct = name === LOSS_PCT_SERIES || name === TARGET_SERIES;
    return [isPct ? `${Number(v).toFixed(1)}%` : `${fmt(Number(v))} m³`, name];
};
const fmtM3 = (v: TipValue, n: number | string | undefined): [string, string] => [fmt(Number(v)) + " m³", String(n)];
const fmtConsumptionM3 = (v: TipValue): [string, string] => [fmt(Number(v)) + " m³", "Consumption"];

/* ---------- UI atoms ---------- */
interface KpiProps {
    icon: LucideIcon;
    label: string;
    value: ReactNode;
    unit?: string;
    sub?: ReactNode;
    bg?: string;
    ic?: string;
    delta?: { up: boolean; text: string } | null;
}
function Kpi({ icon: Icon, label, value, unit, sub, bg, ic, delta }: KpiProps) {
    return (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: RADIUS.card, boxShadow: SHADOW }} className="p-4 transition-shadow">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center shrink-0" style={{ background: bg, borderRadius: RADIUS.md }}>
                        <Icon className="w-5 h-5" style={{ color: ic }} />
                    </div>
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: C.muted }}>{label}</p>
                        <p className="text-xl font-semibold tracking-tight leading-tight" style={{ color: C.ink }}>
                            {value}<span className="text-xs font-medium ml-1" style={{ color: C.muted }}>{unit}</span>
                        </p>
                    </div>
                </div>
                {delta && (
                    <div className={`flex items-center gap-1 text-xs font-semibold ${delta.up ? "text-mb-danger-text" : "text-mb-success-text"}`}>
                        {delta.up ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}{delta.text}
                    </div>
                )}
            </div>
            {sub && <p className="text-[11px] mt-2" style={{ color: C.muted }}>{sub}</p>}
        </div>
    );
}

interface PanelProps {
    title: string;
    icon?: LucideIcon;
    right?: ReactNode;
    children: ReactNode;
    note?: string;
    /** Extra classes on the panel root (e.g. `h-full flex flex-col` for equal-height rows). */
    className?: string;
    /** Extra classes on the panel body (e.g. `flex-1 flex flex-col` so a chart fills the height). */
    bodyClassName?: string;
    /**
     * Render as a native `<details>` so the operator can fold the section away.
     * Used for the long, secondary sections of the Zone Analysis view — keyboard
     * operable and screen-reader announced with no extra state.
     */
    collapsible?: boolean;
    /** Only meaningful with `collapsible`. */
    defaultOpen?: boolean;
}
function Panel({ title, icon: Icon, right, children, note, className, bodyClassName, collapsible, defaultOpen = false }: PanelProps) {
    const shell = { background: C.card, border: `1px solid ${C.border}`, borderRadius: RADIUS.card, boxShadow: SHADOW } as const;

    if (collapsible) {
        return (
            <details open={defaultOpen} className={`group ${className ?? ""}`} style={shell}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 [&::-webkit-details-marker]:hidden">
                    <span className="flex items-center gap-2">
                        <ChevronRight className="w-4 h-4 shrink-0 transition-transform group-open:rotate-90" aria-hidden="true" style={{ color: C.heading }} />
                        {Icon && <Icon className="w-4 h-4" aria-hidden="true" style={{ color: C.heading }} />}
                        <span className="text-sm font-semibold tracking-tight" style={{ color: C.heading }}>{title}</span>
                    </span>
                </summary>
                {note && <p className="px-4 text-[11px] mb-1" style={{ color: C.muted }}>{note}</p>}
                {right && <div className="flex items-center justify-end px-4 pb-2">{right}</div>}
                <div className={`px-4 pb-4 ${bodyClassName ?? ""}`}>{children}</div>
            </details>
        );
    }

    return (
        <div className={className} style={shell}>
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
                <div className="flex items-center gap-2">
                    {Icon && <Icon className="w-4 h-4" aria-hidden="true" style={{ color: C.heading }} />}
                    <h3 className="text-sm font-semibold tracking-tight" style={{ color: C.heading }}>{title}</h3>
                </div>{right}
            </div>
            {note && <p className="px-4 text-[11px] -mt-1 mb-1" style={{ color: C.muted }}>{note}</p>}
            <div className={`px-4 pb-4 ${bodyClassName ?? ""}`}>{children}</div>
        </div>
    );
}

interface SelectProps {
    icon: LucideIcon;
    /** Accessible name for the control — required: the icon alone names nothing. */
    label: string;
    value: string;
    setValue: (v: string) => void;
    options: string[];
}
function Select({ icon: Icon, label, value, setValue, options }: SelectProps) {
    return (
        <div className="flex items-center gap-1.5 px-2.5 py-2" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: RADIUS.md }}>
            <Icon className="w-4 h-4" aria-hidden="true" style={{ color: C.muted }} />
            <select aria-label={label} value={value} onChange={(e) => setValue(e.target.value)} className="text-sm outline-none" style={{ color: C.ink, background: C.card }}>
                {options.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
        </div>
    );
}

/**
 * Severity legend for the loss colour scale.
 *
 * Colour alone must never carry meaning (design principle 5), so anywhere the
 * `sev()` palette tints a cell we render this key alongside it. Mirrors the
 * Daily section's `zone-watch` legend.
 */
const SEV_LEGEND: { pctExample: number; label: string; range: string }[] = [
    { pctExample: 5, label: "Good", range: "< 10%" },
    { pctExample: 15, label: "Moderate", range: "10–25%" },
    { pctExample: 35, label: "High", range: "25–50%" },
    { pctExample: 60, label: "Critical", range: "≥ 50%" },
    { pctExample: -1, label: "Check", range: "negative" },
];
function SeverityLegend({ caption }: { caption?: string }) {
    return (
        <div className="mt-3 flex flex-wrap items-center gap-2 pt-3" style={{ borderTop: `1px solid ${C.border}` }}>
            {caption && <span className="text-[11px] font-semibold" style={{ color: C.muted }}>{caption}</span>}
            {SEV_LEGEND.map((s) => {
                const v = sev(s.pctExample);
                return (
                    <span key={s.label} className="inline-flex items-center gap-1.5 text-[11px]" style={{ color: C.muted }}>
                        <span className="h-3 w-3 rounded-sm" aria-hidden="true" style={{ background: v.bg, border: `1px solid ${v.chart}` }} />
                        {s.label} <span className="opacity-70">({s.range})</span>
                    </span>
                );
            })}
        </div>
    );
}

/** Row-count choices for the long tables. */
const ROW_OPTIONS = ["10", "20", "50", "All"];

/** Resolve a `ROW_OPTIONS` value to the rows actually shown. */
function limitRows<T>(rows: T[], choice: string): T[] {
    return choice === "All" ? rows : rows.slice(0, Number(choice));
}

/**
 * Compact "rows shown" control for the long tables — lets an operator cap how
 * many rows render (or show All) with a dropdown instead of scrolling a
 * fixed-height box.
 */
function RowsPicker({ value, setValue, total }: { value: string; setValue: (v: string) => void; total: number }) {
    return (
        <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium" style={{ color: C.muted }}>Rows</span>
            <Select icon={List} label="Rows to show" value={value} setValue={setValue} options={ROW_OPTIONS} />
            <span className="text-[11px] whitespace-nowrap" style={{ color: C.muted }}>of {total}</span>
        </div>
    );
}

/* compact per-panel CSV export — exports the full row set, not just the rows shown */
function PanelExport({ onClick }: { onClick: () => void }) {
    return (
        <button onClick={onClick} title="Export CSV" aria-label="Export CSV"
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold"
            style={{ background: C.primary, color: "var(--primary-foreground)", borderRadius: RADIUS.md }}>
            <Download className="w-3.5 h-3.5" />CSV
        </button>
    );
}

/* circular ring gauge (clean, theme-aware) */
interface RingGaugeProps {
    frac: number;
    color: string;
    big: string;
    small: string;
    label: string;
    caption: string;
}
function RingGauge({ frac, color, big, small, label, caption }: RingGaugeProps) {
    const S = 168, cc = 84, r = 66, sw = 9;
    const Cf = 2 * Math.PI * r;
    const f = Math.max(0, Math.min(1, frac || 0));
    const pctv = Math.round(f * 100);
    const bl = String(big).length;
    const fs = bl <= 4 ? 28 : bl <= 6 ? 23 : 19;
    const titleId = `ring-${label.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`;
    return (
        <div className="flex flex-col items-center">
            <svg viewBox={`0 0 ${S} ${S}`} width="100%" style={{ maxWidth: 160 }} role="img" aria-labelledby={titleId}>
                <title id={titleId}>{`${label}: ${big} ${small}, ${pctv}% of supply — ${caption}`}</title>
                <circle cx={cc} cy={cc} r={r} fill="none" stroke="var(--wm-track)" strokeWidth={sw} />
                {f > 0.002 && (
                    <circle cx={cc} cy={cc} r={r} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round"
                        strokeDasharray={`${f * Cf} ${Cf}`} transform={`rotate(-90 ${cc} ${cc})`} />
                )}
                <text x={cc} y={cc - 10} textAnchor="middle" style={{ fontSize: fs, fontWeight: 700, fill: "var(--wm-ink)", fontFamily: FONT }}>{big}</text>
                <text x={cc} y={cc + 6} textAnchor="middle" style={{ fontSize: 11, fill: "var(--wm-muted)", fontFamily: FONT }}>{small}</text>
                <text x={cc} y={cc + 24} textAnchor="middle" style={{ fontSize: 13, fontWeight: 700, fill: color, fontFamily: FONT }}>{pctv}%</text>
            </svg>
            <p className="text-sm font-semibold mt-1" style={{ color: "var(--wm-ink)" }}>{label}</p>
            <p className="text-[11px]" style={{ color: "var(--wm-muted)" }}>{caption}</p>
        </div>
    );
}

/* loss connector shown between gauges */
function LossLink({ label, v, of }: { label: string; v: number; of: number }) {
    const p = of ? Math.round((v / of) * 1000) / 10 : 0;
    return (
        <div className="flex flex-col items-center shrink-0 px-0.5">
            <ArrowRight className="w-4 h-4" style={{ color: C.muted }} />
            <span className="px-1.5 py-0.5 rounded text-[11px] font-bold mt-1 whitespace-nowrap bg-mb-danger-light text-mb-danger-text">−{fmt(v)} m³</span>
            <span className="text-[10px] mt-0.5 whitespace-nowrap font-semibold text-mb-danger-text">{label} · {p}%</span>
        </div>
    );
}

/** Zone-dropdown key for the primary/trunk network stage (A1 → A2). Prefixed so
 * it can never collide with a real zone code. */
const TRUNK_KEY = "__trunk__";

/** Section tabs, in display order. */
const SECTION_TABS: { key: string; label: string; icon: LucideIcon }[] = [
    { key: "overview", label: "Overview", icon: BarChart3 },
    { key: "zones", label: "Zone Analysis", icon: MapPin },
    { key: "assets", label: "Assets & Connections", icon: Activity },
    { key: "meters", label: "Main Database", icon: Database },
    { key: "exceptions", label: "Exceptions & Actions", icon: ClipboardList },
];

interface PeriodFilterProps {
    data: WaterData;
    year: string;
    nMonths: number;
    startMonth: string;
    endMonth: string;
    onRangeChange: (start: string, end: string) => void;
    onYear: (year: number) => void;
    onReset: () => void;
}
/**
 * Year selector + date-range picker, built from the app's shared
 * `DateRangePicker` and `Card` so it matches every other section's filter bar.
 */
function PeriodFilter({ data, year, nMonths, startMonth, endMonth, onRangeChange, onYear, onReset }: PeriodFilterProps) {
    return (
        <Card className="card-elevated">
            <CardContent className="p-4 sm:p-5 md:p-6">
                <div className="flex flex-col gap-4">
                    {/* Year selector */}
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-muted-foreground">Filter by Year:</span>
                            <div className="flex items-center gap-2">
                                {data.meta.years.map((y) => {
                                    const active = year === String(y);
                                    return (
                                        <Button
                                            key={y}
                                            variant={active ? "default" : "outline"}
                                            size="sm"
                                            aria-label={`Filter by year ${y}`}
                                            aria-pressed={active}
                                            onClick={() => onYear(y)}
                                            className={`rounded-full px-4 min-h-[44px] lg:min-h-0 ${active ? "bg-secondary text-primary-foreground" : "border-border dark:border-border"}`}
                                        >
                                            {y}
                                        </Button>
                                    );
                                })}
                            </div>
                        </div>
                        <span className="self-start rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground lg:self-auto">
                            {nMonths} {nMonths === 1 ? "Month" : "Months"} Available
                        </span>
                    </div>

                    {/* Date range */}
                    <DateRangePicker
                        startMonth={startMonth}
                        endMonth={endMonth}
                        availableMonths={data.meta.availableMonths}
                        onRangeChange={onRangeChange}
                        onReset={onReset}
                    />
                </div>
            </CardContent>
        </Card>
    );
}

/* ================= OVERVIEW ================= */
interface OverviewProps {
    data: WaterData;
    period: PeriodResult;
    monthly: PeriodResult[];
    sel: Sel;
    year: string;
    nMonths: number;
    lossDelta: { up: boolean; text: string } | null;
    periodLabel: string;
}
function Overview({ period: t, monthly, sel, lossDelta, periodLabel }: OverviewProps) {
    const a2f = pct(t.A2, t.A1) / 100, a3f = pct(t.A3, t.A1) / 100;
    const typePie = t.types.map((x) => ({ name: x.type.replace("Residential ", "").replace("(", "").replace(")", ""), value: x.total, pct: x.pct }));
    // `target` is a real management target, so it is drawn as its own series
    // (see the balance chart below) rather than sitting unused in the data.
    const trend = monthly.map((p, i) => ({ m: MONTHS[i], A1: p.A1, A3: p.A3, loss: p.loss, lossPct: p.lossPct, target: TARGET_LOSS_PCT }));
    const selM = isRangeSel(sel) ? `${MONTHS[sel[0]]}–${MONTHS[sel[1]]}` : sel != null ? MONTHS[sel] : null;
    const selectedLineMonths = isRangeSel(sel) ? [sel[0], sel[1]] : sel != null ? [sel] : [];
    const efficiency = pct(t.A3, t.A1);
    const lossCost = Math.max(0, t.loss) * LOSS_RATE_OMR;

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                <Kpi icon={Droplet} label="Total Supply (A1)" value={fmt(t.A1)} unit="m³" bg="var(--chart-bg-blue)" ic="var(--module-water)" sub={periodLabel} />
                <Kpi icon={Droplet} label="Distribution (A2)" value={fmt(t.A2)} unit="m³" bg="var(--chart-bg-cyan)" ic="var(--chart-1)" sub="Zone bulk + direct" />
                <Kpi icon={CheckCircle2} label="Consumption (A3)" value={fmt(t.A3)} unit="m³" bg="var(--chart-bg-green)" ic="var(--mb-success-text)" sub="Billed at end-user" />
                <Kpi icon={Gauge} label="Efficiency" value={`${efficiency}%`} bg="var(--chart-bg-green)" ic="var(--mb-success-text)" sub={`Target ≥ ${100 - TARGET_LOSS_PCT}%`} />
                <Kpi icon={AlertTriangle} label="Total Loss" value={fmt(t.loss)} unit="m³" bg="var(--chart-bg-red)" ic="var(--mb-danger-text)" sub={`${t.lossPct}% of supply`} delta={lossDelta} />
                <Kpi icon={FileSpreadsheet} label="Loss Cost Estimate" value={fmt(lossCost)} unit="OMR" bg="var(--chart-bg-orange)" ic="var(--mb-warning-text)" sub={`${LOSS_RATE_OMR} OMR / m³ assumption`} />
            </div>

            {(t.missingMeters > 0 || t.negativeMeters > 0) && (
                <p className="flex items-start gap-2 px-3 py-2 text-[11px] rounded-lg" style={{ background: "var(--mb-warning-light)", color: "var(--mb-warning-text)" }}>
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px" aria-hidden="true" />
                    <span>
                        Balance completeness: {t.missingMeters > 0 && <><b>{t.missingMeters}</b> meter{t.missingMeters === 1 ? " has" : "s have"} no reading for this period</>}
                        {t.missingMeters > 0 && t.negativeMeters > 0 && "; "}
                        {t.negativeMeters > 0 && <><b>{t.negativeMeters}</b> reported a negative reading</>}
                        . Unread meters contribute nothing to A1/A2/A3, so the loss shown may be overstated. See <b>Exceptions &amp; Actions</b> for the list.
                    </span>
                </p>
            )}

            <Panel title="System Water Balance" icon={Gauge}
                note={`Supply → distribution → consumption, with the loss at each stage — ${periodLabel}. Management target: loss ≤ ${TARGET_LOSS_PCT}%.`}>
                <div className="flex items-center justify-center gap-1 sm:gap-3 overflow-x-auto pb-1">
                    <RingGauge frac={1} color={C.accent} big={fmt(t.A1)} small="m³" label="A1 · Supply" caption="total entering" />
                    <LossLink label="trunk" v={t.stage1} of={t.A1} />
                    <RingGauge frac={a2f} color={C.dist} big={fmt(t.A2)} small="m³" label="A2 · Distribution" caption="reaches zones" />
                    <LossLink label="network" v={t.stage2} of={t.A1} />
                    <RingGauge frac={a3f} color={C.cons} big={fmt(t.A3)} small="m³" label="A3 · Consumption" caption="at meters" />
                </div>
                <div className="flex justify-center mt-3 pt-3" style={{ borderTop: `1px solid ${C.border}` }}>
                    <div className={`flex items-center gap-3 px-4 py-2 rounded-lg border ${t.lossPct > TARGET_LOSS_PCT ? "bg-mb-danger-light border-mb-danger" : "bg-mb-success-light border-mb-success"}`}>
                        <Target className={`w-5 h-5 shrink-0 ${t.lossPct > TARGET_LOSS_PCT ? "text-mb-danger-text" : "text-mb-success-text"}`} />
                        <div className="leading-tight">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">Total System Loss vs 15% Target</p>
                            <p className="text-lg font-bold text-primary">{fmt(t.loss)} <span className="text-xs font-medium">m³</span> · {t.lossPct}% · {t.lossPct <= TARGET_LOSS_PCT ? "Within target" : `${(t.lossPct - TARGET_LOSS_PCT).toFixed(1)} pp above target`}</p>
                        </div>
                    </div>
                </div>
            </Panel>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
                {/* Supply/consumption volumes and the loss trend, merged into one
                    chart: the standalone "Monthly Loss %" area panel restated the
                    same months, so loss % now rides a right-hand axis here
                    against the management target. */}
                <Panel className="h-full flex flex-col" bodyClassName="flex-1 flex flex-col" title="Monthly Supply, Consumption &amp; Loss" icon={Activity}
                    note={`Bars are volumes (m³, left axis); lines are loss as a share of supply against the ${TARGET_LOSS_PCT}% target (%, right axis).${selM ? ` Highlighted: ${selM}.` : ""}`}>
                    <div className="flex-1 min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={trend} margin={{ top: 6, right: 4, left: -10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--wm-track)" />
                                <XAxis dataKey="m" tick={{ fontSize: 11, fill: C.muted }} />
                                <YAxis yAxisId="vol" tick={{ fontSize: 11, fill: C.muted }} />
                                <YAxis yAxisId="pct" orientation="right" unit="%" width={44} tick={{ fontSize: 11, fill: C.muted }} />
                                <Tooltip formatter={fmtBalance} contentStyle={TIP} />
                                <Legend wrapperStyle={{ fontSize: 11, color: "var(--wm-ink)" }} />
                                {selectedLineMonths.map((i) => <ReferenceLine key={i} yAxisId="vol" x={MONTHS[i]} stroke={C.primary} strokeDasharray="4 4" />)}
                                <Bar yAxisId="vol" dataKey="A1" name="Supply" fill={C.supply} radius={[3, 3, 0, 0]} barSize={14} />
                                <Bar yAxisId="vol" dataKey="A3" name="Consumption" fill={C.cons} radius={[3, 3, 0, 0]} barSize={14} />
                                <Line yAxisId="pct" dataKey="lossPct" name={LOSS_PCT_SERIES} stroke={C.loss} strokeWidth={2.5} dot={{ r: 2 }} />
                                <Line yAxisId="pct" dataKey="target" name={TARGET_SERIES} stroke="var(--status-danger)" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </Panel>
                <Panel className="h-full flex flex-col" bodyClassName="flex-1 flex flex-col" title="Consumption by Type" icon={Layers} note={`Share of A3 — ${periodLabel}.`}>
                    <ResponsiveContainer width="100%" height={210}>
                        <PieChart>
                            <Pie data={typePie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={48} outerRadius={80} paddingAngle={2}>
                                {typePie.map((e, i) => <Cell key={i} fill={TYPECOL[i % TYPECOL.length]} />)}
                            </Pie>
                            <Tooltip formatter={(v, n, p) => [`${fmt(Number(v))} m³ (${p?.payload?.pct}%)`, n]} contentStyle={TIP} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-1 mt-1">
                        {typePie.slice(0, 6).map((x, i) => (
                            <div key={i} className="flex items-center justify-between text-[11px]">
                                <span className="flex items-center gap-1.5" style={{ color: C.ink }}><span className="w-2.5 h-2.5 rounded-sm" style={{ background: TYPECOL[i % TYPECOL.length] }} />{x.name}</span>
                                <span className="font-semibold" style={{ color: C.muted }}>{x.pct}%</span>
                            </div>
                        ))}
                    </div>
                </Panel>
            </div>

        </div>
    );
}

/* ================= ZONES ================= */
interface ZonesViewProps {
    data: WaterData;
    period: PeriodResult;
    monthly: PeriodResult[];
    sel: Sel;
    nMonths: number;
    year: string;
}
function ZonesView({ data, period, monthly, sel, nMonths, year }: ZonesViewProps) {
    const [zoneSel, setZoneSel] = useState("all");
    // Rows to show in the drill-down tables (A1 reconciliation / individual
    // meters) — an operator picks 10/20/50/All instead of scrolling a fixed box.
    const [rowsShown, setRowsShown] = useState("20");
    const real = period.zones;

    // Primary/trunk network stage (A1 → A2): the loss above every zone — water
    // that left the main bulk but never reached a zone-bulk or direct-connection
    // meter. Zones only ever show the A2 → A3 (in-zone) portion, so this is
    // surfaced as its own first-class item here.
    const trunkLoss = period.stage1;      // A1 − A2
    const trunkPct = period.stage1Pct;    // % of A1
    const ts = sev(trunkPct);

    // Stable handler for zone cards — reads the zone key off the clicked button's
    // data attribute so a single callback replaces a per-item lambda inside .map().
    const selectZoneFromCard = useCallback((e: MouseEvent<HTMLButtonElement>) => {
        setZoneSel(e.currentTarget.dataset.zone ?? "all");
    }, []);

    const picker = (
        <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-sm font-semibold tracking-tight" style={{ color: C.heading }}>Zone</span>
            <div className="flex items-center gap-1.5 px-2.5 py-2" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: RADIUS.md }}>
                <MapPin className="w-4 h-4" aria-hidden="true" style={{ color: C.muted }} />
                <select aria-label="Select zone to analyse" value={zoneSel} onChange={(e) => setZoneSel(e.target.value)} className="text-sm font-medium outline-none cursor-pointer" style={{ color: C.ink, background: C.card }}>
                    <option value="all">All zones (overview)</option>
                    <option value={TRUNK_KEY}>Primary network (A1 → A2)</option>
                    {real.map((z) => <option key={z.zone} value={z.zone}>{z.name}</option>)}
                </select>
            </div>
            {zoneSel !== "all" && (
                <button onClick={() => setZoneSel("all")} className="text-[12px] font-semibold px-2.5 py-2" style={{ color: C.accentActive }}>← all zones</button>
            )}
        </div>
    );

    /* ---------- primary / trunk network drill-down (A1 → A2) ---------- */
    if (zoneSel === TRUNK_KEY) {
        const A1 = period.A1, A2 = period.A2;
        const reachedPct = A1 ? Math.min(100, Math.max(0, (A2 / A1) * 100)) : 0;
        const lossBar = A1 ? Math.max(0, (trunkLoss / A1) * 100) : 0;
        const tmonthly = monthly.map((p, i) => ({ m: MONTHS[i], a1: p.A1, a2: p.A2, loss: p.stage1 }));
        // A2 is Σ zone-bulk (L2) + Σ direct connections — the meters A1 must
        // reconcile against. A missing / under-reading one here inflates the gap.
        const comp = [
            ...real.map((z) => ({ name: z.name, kind: "Zone bulk (L2)", val: z.bulk })),
            ...period.dcs.map((d) => ({ name: d.name, kind: "Direct connection", val: d.total })),
        ].sort((a, b) => b.val - a.val);
        const pctOfA1 = (v: number) => (A1 ? ((v / A1) * 100).toFixed(1) : "0.0");

        return (
            <div className="space-y-5">
                {picker}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <Kpi icon={Droplet} label="Main Bulk Supply (A1)" value={fmt(A1)} unit="m³" bg="var(--chart-bg-blue)" ic="var(--module-water)" sub="NAMA L1 — total entering" />
                    <Kpi icon={Plug} label="Reached Distribution (A2)" value={fmt(A2)} unit="m³" bg="var(--chart-bg-cyan)" ic="var(--chart-1)" sub="Σ zone bulk + direct" />
                    <Kpi icon={AlertTriangle} label="Trunk Loss" value={fmt(trunkLoss)} unit="m³" bg="var(--chart-bg-red)" ic="var(--mb-danger-text)" sub="A1 − A2 · before any zone" />
                    <Kpi icon={Gauge} label="Trunk Loss %" value={`${trunkPct}%`} bg={ts.bg} ic={ts.c} sub={ts.label} />
                </div>

                <Panel title="Main Bulk vs Reached Distribution" icon={Droplet}
                    note="Green reached a zone-bulk or direct-connection meter; red left the main bulk but was never metered downstream — the trunk-main loss.">
                    <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-mb-success-text">Reached A2 {fmt(A2)} m³ · {Math.round(reachedPct)}%</span>
                        <span className="font-semibold text-mb-danger-text">Trunk loss {fmt(trunkLoss)} m³ · {trunkPct}%</span>
                    </div>
                    <div className="w-full h-8 rounded-md overflow-hidden flex" style={{ background: "var(--wm-track)" }}>
                        <div style={{ width: `${reachedPct}%`, background: C.cons }} title={`Reached A2 ${fmt(A2)} m³`} />
                        <div style={{ width: `${lossBar}%`, background: "var(--status-danger)" }} title={`Trunk loss ${fmt(trunkLoss)} m³`} />
                    </div>
                    <div className="text-[11px] mt-1 text-right" style={{ color: C.muted }}>Main bulk supply (A1) {fmt(A1)} m³ · 100%</div>
                    {trunkLoss < 0 && (
                        <p className="text-[11px] mt-2 font-medium text-mb-warning-text">Negative gap — Σ zone bulk + direct exceeds the main bulk (A1). Physically impossible over time; reconcile the L1 main-meter reading and check for a reading-date/timing mismatch.</p>
                    )}
                </Panel>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <Panel title="Monthly — Main Bulk vs Reached Distribution" icon={Activity} note="Gap between the bars each month is the trunk-main loss (A1 − A2). A wildly swinging or negative gap points to meter-reading timing, not real leakage.">
                        <ResponsiveContainer width="100%" height={260}>
                            <ComposedChart data={tmonthly} margin={{ top: 6, right: 8, left: -10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--wm-track)" />
                                <XAxis dataKey="m" tick={{ fontSize: 11, fill: C.muted }} />
                                <YAxis tick={{ fontSize: 11, fill: C.muted }} />
                                <Tooltip formatter={fmtM3} contentStyle={TIP} />
                                <Legend wrapperStyle={{ fontSize: 11, color: "var(--wm-ink)" }} />
                                {(isRangeSel(sel) ? [sel[0], sel[1]] : sel != null ? [sel] : []).map((i) => <ReferenceLine key={i} x={MONTHS[i]} stroke={C.primary} strokeDasharray="4 4" />)}
                                <Bar dataKey="a1" name="Main bulk (A1)" fill={C.supply} radius={[3, 3, 0, 0]} barSize={14} />
                                <Bar dataKey="a2" name="Reached zones (A2)" fill={C.dist} radius={[3, 3, 0, 0]} barSize={14} />
                                <Line dataKey="loss" name="Trunk loss" stroke="var(--status-danger)" strokeWidth={2.5} dot={{ r: 2 }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </Panel>
                    <Panel title="What makes up A2" icon={Layers} note="Every zone-bulk & direct-connection meter A1 must reconcile against. A missing or under-reading meter here shows up as trunk loss.">
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={comp.slice(0, 10).map((c) => ({ name: c.name.length > 18 ? c.name.slice(0, 18) + "…" : c.name, val: c.val }))} layout="vertical" margin={{ top: 4, right: 30, left: 10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--wm-track)" horizontal={false} />
                                <XAxis type="number" tick={{ fontSize: 10, fill: C.muted }} />
                                <YAxis type="category" dataKey="name" tick={{ fontSize: 9.5, fill: C.ink }} width={120} />
                                <Tooltip formatter={fmtConsumptionM3} contentStyle={TIP} />
                                <Bar dataKey="val" fill={C.dist} radius={[0, 4, 4, 0]} barSize={13} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Panel>
                </div>

                <Panel collapsible defaultOpen title="A1 Reconciliation — Σ zone bulk + direct vs main bulk" icon={Layers}
                    right={<div className="flex items-center gap-2">
                        <PanelExport onClick={() => downloadRows(comp.map((c, i) => ({ "#": i + 1, Meter: c.name, Kind: c.kind, "Volume (m3)": c.val.toFixed(1), "% of A1": pctOfA1(c.val) })), `water-a1-reconciliation-${year}.csv`)} />
                        <RowsPicker value={rowsShown} setValue={setRowsShown} total={comp.length} />
                    </div>}
                    note="Main bulk (A1) = Σ zone bulk + Σ direct connections + trunk loss. Use it to spot which downstream bulk meters are missing or under-reading before blaming leakage.">
                    <div className="overflow-auto" style={{ maxHeight: rowsShown === "All" ? 480 : undefined }}>
                        <table className="w-full text-[12px]">
                            <caption className="sr-only">
                                A1 reconciliation for {year}: every zone-bulk and direct-connection meter, its volume in cubic metres and its share of main bulk supply, with the reached-distribution total and trunk loss summarised at the end.
                            </caption>
                            <thead className="sticky top-0 z-10" style={{ background: C.primary, color: "var(--primary-foreground)" }}>
                                <tr>
                                    <th scope="col" className="text-left px-3 py-2">#</th>
                                    <th scope="col" className="text-left px-2 py-2">Meter</th>
                                    <th scope="col" className="text-left px-2 py-2">Kind</th>
                                    <th scope="col" className="text-right px-2 py-2">Volume (m³)</th>
                                    <th scope="col" className="text-right px-3 py-2">% of A1</th>
                                </tr>
                            </thead>
                            <tbody>
                                {limitRows(comp, rowsShown).map((c, i) => (
                                    <tr key={c.name + i} style={{ background: i % 2 ? "var(--wm-zebra)" : "var(--wm-card)" }}>
                                        <td className="px-3 py-1.5" style={{ color: C.muted }}>{i + 1}</td>
                                        <th scope="row" className="px-2 py-1.5 text-left font-semibold whitespace-nowrap" style={{ color: C.ink }}>{c.name}</th>
                                        <td className="px-2 py-1.5 whitespace-nowrap" style={{ color: C.muted }}>{c.kind}</td>
                                        <td className="px-2 py-1.5 text-right" style={{ color: C.ink }}>{fmt1(c.val)}</td>
                                        <td className="px-3 py-1.5 text-right" style={{ color: C.muted }}>{pctOfA1(c.val)}%</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr style={{ borderTop: `2px solid ${C.border}` }}>
                                    <td colSpan={3} className="px-3 py-1.5 font-semibold text-mb-success-text">Σ Reached distribution (A2)</td>
                                    <td className="px-2 py-1.5 text-right font-bold text-mb-success-text">{fmt1(A2)}</td>
                                    <td className="px-3 py-1.5 text-right font-bold text-mb-success-text">{Math.round(reachedPct)}%</td>
                                </tr>
                                <tr>
                                    <td colSpan={3} className="px-3 py-1.5 font-semibold text-mb-danger-text">Trunk loss (unaccounted before zones)</td>
                                    <td className="px-2 py-1.5 text-right font-bold text-mb-danger-text">{fmt1(trunkLoss)}</td>
                                    <td className="px-3 py-1.5 text-right font-bold text-mb-danger-text">{trunkPct}%</td>
                                </tr>
                                <tr style={{ borderTop: `1px solid ${C.border}` }}>
                                    <td colSpan={3} className="px-3 py-1.5 font-bold" style={{ color: C.heading }}>Main bulk supply (A1)</td>
                                    <td className="px-2 py-1.5 text-right font-bold" style={{ color: C.heading }}>{fmt1(A1)}</td>
                                    <td className="px-3 py-1.5 text-right font-bold" style={{ color: C.heading }}>100%</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </Panel>

                <Panel collapsible title="How to identify &amp; manage this gap" icon={Target}>
                    <div className="text-[12px] leading-relaxed">
                        <p className="mt-0.5" style={{ color: C.muted }}>
                            A high A1→A2 gap is loss on the primary / trunk mains <b>before</b> water reaches any zone, so no zone card will ever show it.
                            Work it in order: <b>(1)</b> confirm every zone-bulk &amp; direct-connection meter above reported for the period — a missing or
                            zero one inflates the gap; <b>(2)</b> reconcile the NAMA main-bulk (L1) reading against Σ zone bulk + direct, checking for a
                            reading-date/timing mismatch; <b>(3)</b> only once the meters check out, dispatch a trunk-main / PRV inspection between the
                            reservoir and the zone inlets. Track the monthly trend, not a single month — timing noise makes individual months swing
                            (and occasionally go negative when A2 &gt; A1).
                        </p>
                    </div>
                </Panel>
            </div>
        );
    }

    /* ---------- single-zone drill-down ---------- */
    if (zoneSel !== "all") {
        const z: ZoneRow = real.find((x) => x.zone === zoneSel)
            || { zone: zoneSel, bulk: 0, end: 0, loss: 0, lossPct: 0, name: zoneSel, meters: 0, missing: 0, bulkMissing: false };
        const s = sev(z.lossPct);
        const supply = z.bulk, cons = z.end, loss = z.loss;
        const consPct = supply ? Math.min(100, (cons / supply) * 100) : 0;
        const lossBar = supply ? Math.max(0, (loss / supply) * 100) : 0;
        const zmonthly = monthly.map((p, i) => {
            const m = p.zones.find((x) => x.zone === zoneSel);
            return { m: MONTHS[i], Supply: m ? m.bulk : 0, Consumption: m ? m.end : 0, loss: m ? m.loss : 0 };
        });
        // `val` is `null` when the meter has no reading at all in the period —
        // rendered as "no reading", never as a confident 0.
        const meters = data.meters
            .filter((m) => { const c = m.y[year]; return c && (c.label === "L3" || c.label === "L4") && c.typ !== "D_Building_Bulk" && c.zone === zoneSel; })
            .map((m) => { const c = m.y[year]; const v = periodValue(c, sel); return { name: m.name, typ: (c.typ || "").replace("Residential ", ""), val: v }; })
            .sort((a, b) => (b.val ?? -Infinity) - (a.val ?? -Infinity));
        const unread = meters.filter((m) => m.val == null).length;
        const blds = period.buildings.filter((b) => b.zone === z.name);
        const worstBld = blds.reduce<typeof blds[number] | null>((w, b) => (!w || b.lossPct > w.lossPct ? b : w), null);
        const pctOf = (v: number | null) => (supply && v != null ? ((v / supply) * 100).toFixed(1) : "–");

        return (
            <div className="space-y-5">
                {picker}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <Kpi icon={Droplet} label="Zone Supply" value={fmt(supply)} unit="m³" bg="var(--chart-bg-blue)" ic={C.dist} sub="L2 bulk meter" />
                    <Kpi icon={CheckCircle2} label="Individual Use" value={fmt(cons)} unit="m³" bg="var(--chart-bg-green)" ic="var(--mb-success-text)" sub={`${z.meters} meters`} />
                    <Kpi icon={AlertTriangle} label="Zone Loss" value={fmt(loss)} unit="m³" bg="var(--chart-bg-red)" ic="var(--mb-danger-text)" sub="supply − individual" />
                    <Kpi icon={Gauge} label="Loss %" value={`${z.lossPct}%`} bg={s.bg} ic={s.c} sub={s.label} />
                </div>

                <Panel title={`${z.name} — Supply vs Individual Consumption`} icon={Droplet}
                    note="Green is water recorded by individual meters; red is what entered the zone but no meter recorded — the loss.">
                    <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-mb-success-text">Consumption {fmt(cons)} m³ · {Math.round(consPct)}%</span>
                        <span className="font-semibold text-mb-danger-text">Loss {fmt(loss)} m³ · {z.lossPct}%</span>
                    </div>
                    <div className="w-full h-8 rounded-md overflow-hidden flex" style={{ background: "var(--wm-track)" }}>
                        <div style={{ width: `${consPct}%`, background: C.cons }} title={`Consumption ${fmt(cons)} m³`} />
                        <div style={{ width: `${lossBar}%`, background: "var(--status-danger)" }} title={`Loss ${fmt(loss)} m³`} />
                    </div>
                    <div className="text-[11px] mt-1 text-right" style={{ color: C.muted }}>Zone supply (bulk) {fmt(supply)} m³ · 100%</div>
                </Panel>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <Panel title="Monthly — Supply vs Consumption" icon={Activity} note="Gap between the bars each month is the loss.">
                        <ResponsiveContainer width="100%" height={260}>
                            <ComposedChart data={zmonthly} margin={{ top: 6, right: 8, left: -10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--wm-track)" />
                                <XAxis dataKey="m" tick={{ fontSize: 11, fill: C.muted }} />
                                <YAxis tick={{ fontSize: 11, fill: C.muted }} />
                                <Tooltip formatter={fmtM3} contentStyle={TIP} />
                                <Legend wrapperStyle={{ fontSize: 11, color: "var(--wm-ink)" }} />
                                {(isRangeSel(sel) ? [sel[0], sel[1]] : sel != null ? [sel] : []).map((i) => <ReferenceLine key={i} x={MONTHS[i]} stroke={C.primary} strokeDasharray="4 4" />)}
                                <Bar dataKey="Supply" fill={C.dist} radius={[3, 3, 0, 0]} barSize={14} />
                                <Bar dataKey="Consumption" fill={C.cons} radius={[3, 3, 0, 0]} barSize={14} />
                                <Line dataKey="loss" name="Loss" stroke="var(--status-danger)" strokeWidth={2.5} dot={{ r: 2 }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </Panel>
                    <Panel title="Top Individual Consumers" icon={Layers} note="Largest end-user meters in this zone for the period. Meters with no reading are excluded rather than plotted as zero.">
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={meters.filter((m) => m.val != null).slice(0, 10).map((m) => ({ name: m.name.length > 18 ? m.name.slice(0, 18) + "…" : m.name, val: m.val as number }))} layout="vertical" margin={{ top: 4, right: 30, left: 10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--wm-track)" horizontal={false} />
                                <XAxis type="number" tick={{ fontSize: 10, fill: C.muted }} />
                                <YAxis type="category" dataKey="name" tick={{ fontSize: 9.5, fill: C.ink }} width={120} />
                                <Tooltip formatter={fmtConsumptionM3} contentStyle={TIP} />
                                <Bar dataKey="val" fill={C.cons} radius={[0, 4, 4, 0]} barSize={13} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Panel>
                </div>

                <Panel collapsible defaultOpen title={`Individual Meters in ${z.name} (${meters.length})`} icon={Layers}
                    right={<div className="flex items-center gap-2">
                        <PanelExport onClick={() => downloadRows(meters.map((m, i) => ({ "#": i + 1, Meter: m.name, Type: m.typ, "Consumption (m3)": m.val == null ? "no reading" : m.val.toFixed(1), "% of supply": pctOf(m.val) })), `water-zone-${String(z.zone).replace(/\s+/g, "-").toLowerCase()}-meters-${year}.csv`)} />
                        <RowsPicker value={rowsShown} setValue={setRowsShown} total={meters.length} />
                    </div>}
                    note={`Zone supply = Σ individual consumption + loss.${unread > 0 ? ` ${unread} meter${unread === 1 ? " has" : "s have"} no reading this period, so Σ individual consumption is incomplete and the loss below may be overstated.` : ""}`}>
                    <div className="overflow-auto" style={{ maxHeight: rowsShown === "All" ? 480 : undefined }}>
                        <table className="w-full text-[12px]">
                            <caption className="sr-only">
                                Individual end-user meters in {z.name} for {year}, with each meter&apos;s consumption in cubic metres and its share of zone supply. Meters with no reading are labelled &ldquo;no reading&rdquo;.
                            </caption>
                            <thead className="sticky top-0 z-10" style={{ background: C.primary, color: "var(--primary-foreground)" }}>
                                <tr>
                                    <th scope="col" className="text-left px-3 py-2">#</th>
                                    <th scope="col" className="text-left px-2 py-2">Meter</th>
                                    <th scope="col" className="text-left px-2 py-2">Type</th>
                                    <th scope="col" className="text-right px-2 py-2">Consumption (m³)</th>
                                    <th scope="col" className="text-right px-3 py-2">% of supply</th>
                                </tr>
                            </thead>
                            <tbody>
                                {limitRows(meters, rowsShown).map((m, i) => (
                                    <tr key={m.name + i} style={{ background: i % 2 ? "var(--wm-zebra)" : "var(--wm-card)" }}>
                                        <td className="px-3 py-1.5" style={{ color: C.muted }}>{i + 1}</td>
                                        <th scope="row" className="px-2 py-1.5 text-left font-semibold whitespace-nowrap" style={{ color: C.ink }}>{m.name}</th>
                                        <td className="px-2 py-1.5 whitespace-nowrap" style={{ color: C.muted }}>{m.typ}</td>
                                        <td className="px-2 py-1.5 text-right" style={{ color: m.val == null ? C.muted : C.ink }}>
                                            {m.val == null ? <span className="italic">no reading</span> : fmt1(m.val)}
                                        </td>
                                        <td className="px-3 py-1.5 text-right" style={{ color: C.muted }}>{pctOf(m.val)}{m.val == null ? "" : "%"}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr style={{ borderTop: `2px solid ${C.border}` }}>
                                    <td colSpan={3} className="px-3 py-1.5 font-semibold text-mb-success-text">Σ Individual consumption</td>
                                    <td className="px-2 py-1.5 text-right font-bold text-mb-success-text">{fmt1(cons)}</td>
                                    <td className="px-3 py-1.5 text-right font-bold text-mb-success-text">{Math.round(consPct)}%</td>
                                </tr>
                                <tr>
                                    <td colSpan={3} className="px-3 py-1.5 font-semibold text-mb-danger-text">Unaccounted (loss)</td>
                                    <td className="px-2 py-1.5 text-right font-bold text-mb-danger-text">{fmt1(loss)}</td>
                                    <td className="px-3 py-1.5 text-right font-bold text-mb-danger-text">{z.lossPct}%</td>
                                </tr>
                                <tr style={{ borderTop: `1px solid ${C.border}` }}>
                                    <td colSpan={3} className="px-3 py-1.5 font-bold" style={{ color: C.heading }}>Zone supply (bulk)</td>
                                    <td className="px-2 py-1.5 text-right font-bold" style={{ color: C.heading }}>{fmt1(supply)}</td>
                                    <td className="px-3 py-1.5 text-right font-bold" style={{ color: C.heading }}>100%</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </Panel>

                {/* The full building bulk-vs-apartment table lives on the
                    Assets & Connections tab (same rows, same columns, plus a
                    Zone column) — repeating it here was pure duplication. What
                    is genuinely zone-specific is the headline, so that stays. */}
                {blds.length > 0 && worstBld && (
                    <div className="flex items-start gap-3 px-4 py-3" style={{ background: C.component, border: `1px solid ${C.border}`, borderRadius: RADIUS.md }}>
                        <Building2 className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" style={{ color: C.heading }} />
                        <div className="text-[12px] leading-relaxed">
                            <p className="font-semibold" style={{ color: C.heading }}>Building losses in {z.name}</p>
                            <p className="mt-0.5" style={{ color: C.muted }}>
                                {blds.length} building bulk meter{blds.length === 1 ? "" : "s"} in this zone.
                                Worst gap: <b style={{ color: C.ink }}>{worstBld.name.replace(" Building Bulk Meter", "")}</b> —
                                bulk {fmt(worstBld.bulk)} m³ vs apartments {fmt(worstBld.sub)} m³
                                (<b style={{ color: sev(worstBld.lossPct).c }}>{worstBld.lossPct}% · {sev(worstBld.lossPct).label}</b>).
                                Full building-by-building table on the <b>Assets &amp; Connections</b> tab.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    /* ---------- all-zones overview ---------- */
    const bar = real.map((z) => ({ name: z.name, lossPct: z.lossPct, loss: z.loss, fill: sev(z.lossPct).chart }));
    const heat = real.map((z) => ({
        zone: z.zone, name: z.name, yr: z.lossPct,
        months: monthly.map((p) => { const m = p.zones.find((x) => x.zone === z.zone); return m ? m.lossPct : 0; }),
        lossM: monthly.map((p) => { const m = p.zones.find((x) => x.zone === z.zone); return m ? m.loss : 0; }),
    }));

    return (
        <div className="space-y-5">
            {picker}

            {/* Primary/trunk network (A1 → A2): the loss that sits ABOVE every zone.
                Kept prominent at the top so it is never overlooked next to the zones. */}
            <button onClick={() => setZoneSel(TRUNK_KEY)}
                className="w-full text-left p-4 transition-shadow hover:shadow-md flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4"
                style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: RADIUS.card, borderLeft: `4px solid ${ts.chart}`, boxShadow: SHADOW }}>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: ts.bg, color: ts.c }}>Stage 1 · {ts.label}</span>
                        <h4 className="text-sm font-semibold tracking-tight" style={{ color: C.heading }}>Primary network (A1 → A2)</h4>
                    </div>
                    <p className="text-[11px] mt-1" style={{ color: C.muted }}>
                        Trunk-main loss <b>before</b> water reaches any zone bulk or direct connection — not attributable to a single zone. Tap to reconcile A1 vs Σ zone bulk + direct.
                    </p>
                </div>
                <div className="flex items-center gap-5 shrink-0">
                    <div className="text-right text-[11px]" style={{ color: C.muted }}>
                        <p>A1 <b style={{ color: C.ink }}>{fmt(period.A1)}</b> → A2 <b style={{ color: C.ink }}>{fmt(period.A2)}</b></p>
                        <p>trunk loss <b style={{ color: ts.c }}>{fmt(trunkLoss)} m³</b></p>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-extrabold" style={{ color: ts.c }}>{trunkPct}%</p>
                        <p className="text-[11px]" style={{ color: C.muted }}>of supply · review →</p>
                    </div>
                </div>
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <Panel title="Loss % by Zone" icon={AlertTriangle} note="Higher = more water lost inside the zone. Pick a zone above to drill in.">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={bar} layout="vertical" margin={{ top: 4, right: 30, left: 10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--wm-track)" horizontal={false} />
                            <XAxis type="number" tick={{ fontSize: 11, fill: C.muted }} unit="%" />
                            <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: C.ink }} width={90} />
                            <Tooltip formatter={(v, n, p) => [`${v}%  (${fmt(p?.payload?.loss)} m³)`, "Loss"]} contentStyle={TIP} />
                            <Bar dataKey="lossPct" radius={[0, 4, 4, 0]} barSize={20}>{bar.map((e, i) => <Cell key={i} fill={e.fill} />)}</Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </Panel>
                <Panel title="Supply vs Consumption by Zone" icon={Droplet} note="The gap between the two bars is the loss.">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={real.map((z) => ({ name: z.name, bulk: z.bulk, end: z.end }))} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--wm-track)" />
                            <XAxis dataKey="name" tick={{ fontSize: 10, fill: C.muted }} interval={0} angle={-15} textAnchor="end" height={50} />
                            <YAxis tick={{ fontSize: 11, fill: C.muted }} />
                            <Tooltip formatter={(v, n) => [fmt(Number(v)) + " m³", n === "bulk" ? "Zone supply" : "Consumption"]} contentStyle={TIP} />
                            <Legend wrapperStyle={{ fontSize: 11, color: "var(--wm-ink)" }} />
                            <Bar dataKey="bulk" name="Zone supply" fill={C.dist} radius={[3, 3, 0, 0]} barSize={18} />
                            <Bar dataKey="end" name="Consumption" fill={C.cons} radius={[3, 3, 0, 0]} barSize={18} />
                        </BarChart>
                    </ResponsiveContainer>
                </Panel>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {real.map((z) => {
                    const s = sev(z.lossPct);
                    return (
                        <button key={z.zone} data-zone={z.zone} onClick={selectZoneFromCard} className="text-left p-4 transition-shadow hover:shadow-md"
                            style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: RADIUS.card, borderLeft: `4px solid ${s.chart}`, boxShadow: SHADOW }}>
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-semibold tracking-tight" style={{ color: C.heading }}>{z.name}</h4>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.c }}>{s.label}</span>
                            </div>
                            <p className="text-[11px] mt-0.5" style={{ color: C.muted }}>{z.meters} end-user meters · tap to drill in</p>
                            <div className="flex items-end justify-between mt-3">
                                <div><p className="text-2xl font-extrabold" style={{ color: s.c }}>{z.lossPct}%</p><p className="text-[11px]" style={{ color: C.muted }}>loss · {fmt(z.loss)} m³</p></div>
                                <div className="text-right text-[11px]" style={{ color: C.muted }}><p>supply <b style={{ color: C.ink }}>{fmt(z.bulk)}</b></p><p>used <b style={{ color: C.ink }}>{fmt(z.end)}</b></p></div>
                            </div>
                            <div className="mt-2 h-2 rounded-full overflow-hidden" style={{ background: "var(--wm-track)" }}>
                                <div className="h-2 rounded-full" style={{ width: `${Math.min(100, Math.max(0, z.lossPct))}%`, background: s.chart }} />
                            </div>
                        </button>
                    );
                })}
            </div>

            <Panel collapsible defaultOpen title="Zone Loss % — Monthly Heatmap" icon={Gauge} note="Each cell is one month's loss for that zone, as a percentage of zone supply. Selected month is ringed. Colour repeats the severity band named in the key below — it never carries meaning on its own.">
                <div className="overflow-x-auto">
                    <table className="w-full text-[11px] border-collapse">
                        <caption className="sr-only">
                            Monthly loss percentage by zone for {heat.length} zones over {nMonths} months, plus a year column. Each value is followed by its severity band.
                        </caption>
                        <thead>
                            <tr>
                                <th scope="col" className="text-left px-2 py-1.5 sticky left-0" style={{ color: C.muted, background: C.card }}>Zone</th>
                                {MONTHS.slice(0, nMonths).map((m, i) => (
                                    <th scope="col" key={m} className="px-1.5 py-1.5 text-center font-semibold" style={{ color: monthInSelection(sel, i) ? C.primary : C.muted, textDecoration: monthInSelection(sel, i) ? "underline" : "none" }}>{m}</th>
                                ))}
                                <th scope="col" className="px-2 py-1.5 text-center" style={{ color: C.muted }}>Yr</th>
                            </tr>
                        </thead>
                        <tbody>
                            {heat.map((z) => (
                                <tr key={z.zone}>
                                    <th scope="row" className="px-2 py-1 text-left font-semibold sticky left-0 whitespace-nowrap" style={{ color: C.ink, background: C.card }}>{z.name}</th>
                                    {z.months.map((lp, i) => {
                                        const s = sev(lp);
                                        return (
                                            <td key={i} className="text-center px-1.5 py-1 font-medium" title={`${z.name} · ${MONTHS[i]}: ${lp}% loss (${s.label}) · ${fmt(z.lossM[i])} m³`}
                                                style={{ background: s.bg, color: s.c, borderRadius: 4, outline: monthInSelection(sel, i) ? `2px solid ${C.primary}` : "none", outlineOffset: -1 }}>
                                                {lp}
                                                <span className="sr-only"> percent loss, {s.label}</span>
                                            </td>
                                        );
                                    })}
                                    <td className="text-center px-2 py-1 font-bold" style={{ color: sev(z.yr).c }}>
                                        {z.yr}
                                        <span className="sr-only"> percent loss for the year, {sev(z.yr).label}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <SeverityLegend caption="Loss band:" />
            </Panel>
        </div>
    );
}

/* ================= BUILDINGS / DIRECT / COMMON ================= */
function AssetsView({ period }: { period: PeriodResult }) {
    // This is now the single home for the building bulk-vs-apartment table (the
    // zone drill-down used to repeat it), so it shows every building rather than
    // an arbitrary top-12 slice.
    const [rowsShown, setRowsShown] = useState("20");
    const blds = period.buildings;
    const dcs = period.dcs;
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Panel title="Buildings — Bulk vs Apartment Meters" icon={Building2}
                right={<RowsPicker value={rowsShown} setValue={setRowsShown} total={blds.length} />}
                note="Building bulk meter minus the sum of its apartment meters. A positive gap points at in-building leakage or a meter problem.">
                <div className="overflow-x-auto" style={{ maxHeight: rowsShown === "All" ? 480 : undefined }}>
                    <table className="w-full text-[12px]">
                        <caption className="sr-only">
                            Building bulk meters compared with the sum of their apartment meters: bulk volume, apartment total, the gap in cubic metres, and the gap as a percentage with its severity band.
                        </caption>
                        <thead><tr style={{ color: C.muted }} className="text-left border-b">
                            <th scope="col" className="py-2 pr-2">Building</th><th scope="col" className="pr-2">Zone</th><th scope="col" className="text-right pr-2">Bulk</th><th scope="col" className="text-right pr-2">Apts</th><th scope="col" className="text-right pr-2">Loss</th><th scope="col" className="text-right">Loss % · band</th>
                        </tr></thead>
                        <tbody>
                            {blds.length === 0 && <tr><td colSpan={6} className="py-3 text-center" style={{ color: C.muted }}>No building data for this period.</td></tr>}
                            {limitRows(blds, rowsShown).map((b) => { const s = sev(b.lossPct); return (
                                <tr key={b.name} className="border-b" style={{ borderColor: "var(--wm-border)" }}>
                                    <th scope="row" className="py-1.5 pr-2 text-left font-semibold" style={{ color: C.ink }}>{b.name.replace(" Building Bulk Meter", "")}</th>
                                    <td className="pr-2" style={{ color: C.muted }}>{b.zone}</td>
                                    <td className="text-right pr-2" style={{ color: C.ink }}>{fmt(b.bulk)}</td><td className="text-right pr-2" style={{ color: C.ink }}>{fmt(b.sub)}</td>
                                    <td className="text-right pr-2 font-medium" style={{ color: C.ink }}>{fmt(b.loss)}</td>
                                    <td className="text-right whitespace-nowrap">
                                        {/* Percentage + named band: the colour is a reinforcement, never the only signal. */}
                                        <span className="font-bold" style={{ color: s.c }}>{b.lossPct}%</span>
                                        <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold" style={{ background: s.bg, color: s.c }}>{s.label}</span>
                                    </td>
                                </tr>); })}
                        </tbody>
                    </table>
                </div>
                <SeverityLegend caption="Loss band:" />
            </Panel>
            <Panel title="Direct Connections" icon={Plug} note="Meters fed straight from the main inlet, bypassing the zones.">
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dcs.slice(0, 10).map((d) => ({ name: d.name.length > 24 ? d.name.slice(0, 24) + "…" : d.name, total: d.total }))} layout="vertical" margin={{ top: 4, right: 30, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--wm-track)" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 10, fill: C.muted }} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 9.5, fill: C.ink }} width={140} />
                        <Tooltip formatter={fmtConsumptionM3} contentStyle={TIP} />
                        <Bar dataKey="total" fill={C.accent} radius={[0, 4, 4, 0]} barSize={14} />
                    </BarChart>
                </ResponsiveContainer>
            </Panel>
        </div>
    );
}

/* ================= METERS ================= */
function MetersView({ data, year, sel, nMonths }: { data: WaterData; year: string; sel: Sel; nMonths: number }) {
    const [q, setQ] = useState("");
    const [zone, setZone] = useState("All");
    const [level, setLevel] = useState("All");
    const [typ, setTyp] = useState("All");
    // Rows shown in the database grid — defaults to All (no change to existing
    // behaviour) but lets an operator cap to 10/20/50 to avoid scrolling.
    const [rowsShown, setRowsShown] = useState("All");

    const yearMeters = useMemo(() => data.meters.filter((m) => m.y[year]).map((m) => {
        const c = m.y[year];
        const shown = periodValue(c, sel);
        // Mean over the months that were actually read — averaging unread months
        // in as zeros used to drag the baseline down and mask real spikes.
        const avg = meanReading(c.vals);
        const flags = meterFlags(c, shown, avg);
        return { name: m.name, acct: m.acct, label: c.label, zoneName: c.zoneName, typ: c.typ, vals: c.vals, total: c.total, shown, flags: flags.join(" | "), lastUpdated: lastReadingLabel(year, nMonths, c.vals, sel) };
    }), [data, year, sel, nMonths]);

    const zoneOpts = useMemo(() => ["All", ...Array.from(new Set(yearMeters.map((m) => m.zoneName)))], [yearMeters]);
    const levelOpts = ["All", "L1", "L2", "L3", "L4", "DC", "N/A"];
    const typeOpts = useMemo(() => ["All", ...Array.from(new Set(yearMeters.map((m) => m.typ)))], [yearMeters]);

    const rows = useMemo(() => yearMeters
        .filter((m) => zone === "All" || m.zoneName === zone)
        .filter((m) => level === "All" || m.label === level)
        .filter((m) => typ === "All" || m.typ === typ)
        .filter((m) => !q || m.name.toLowerCase().includes(q.toLowerCase()) || (m.acct || "").includes(q))
        .sort((a, b) => (b.shown ?? -Infinity) - (a.shown ?? -Infinity)), [yearMeters, zone, level, typ, q]);

    const exportData = rows.map((m) => ({
        Meter: m.name,
        Account: m.acct,
        Zone: m.zoneName,
        Level: m.label,
        Type: m.typ,
        Total_m3: fmt1(m.total),
        // "no reading" and "0" are exported as different things, matching the UI.
        Selected_m3: m.shown == null ? "no reading" : fmt1(m.shown),
        Flags: m.flags,
        Last_Updated: m.lastUpdated,
        ...Object.fromEntries(MONTHS.slice(0, nMonths).map((mo, i) => [mo, m.vals[i] ?? "no reading"])),
    }));

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-2" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 7 }}>
                    <Search className="w-4 h-4" aria-hidden="true" style={{ color: C.muted }} />
                    <label htmlFor="wm-meter-search" className="sr-only">Search meters by name or account number</label>
                    <input id="wm-meter-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search meter name or account number…" className="text-sm outline-none w-64" style={{ background: "transparent", color: C.ink }} />
                </div>
                <Select icon={MapPin} label="Filter by zone" value={zone} setValue={setZone} options={zoneOpts} />
                <Select icon={Filter} label="Filter by hierarchy level" value={level} setValue={setLevel} options={levelOpts} />
                <Select icon={Layers} label="Filter by meter type" value={typ} setValue={setTyp} options={typeOpts} />
                <button onClick={() => downloadRows(exportData, `water-meter-explorer-${year}.csv`)} className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold" style={{ background: C.primary, color: "var(--primary-foreground)", borderRadius: RADIUS.md }}><Download className="w-4 h-4" />Export CSV</button>
                <button onClick={() => downloadRows(exportData, `water-meter-explorer-${year}-excel.csv`)} className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold" style={{ background: C.accent, color: C.primary, borderRadius: RADIUS.md }}><FileSpreadsheet className="w-4 h-4" />Excel-ready</button>
                <RowsPicker value={rowsShown} setValue={setRowsShown} total={rows.length} />
                <span className="text-[12px] ml-auto font-medium" style={{ color: C.muted }}>
                    {rows.length} meters · {sel == null ? "period total" : isRangeSel(sel) ? `${MONTHS[sel[0]]}–${MONTHS[sel[1]]} highlighted` : `${MONTHS[sel]} highlighted`}
                </span>
            </div>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: RADIUS.card, boxShadow: SHADOW }} className="overflow-hidden">
                <div className="overflow-auto" style={{ maxHeight: rowsShown === "All" ? 600 : undefined }}>
                    <table className="text-[11px] border-collapse w-full">
                        <caption className="sr-only">
                            Water meter database for {year}: {rows.length} meters with account number, zone, hierarchy level, type, the volume for the selected period, data-quality flag, last reading and every month&apos;s reading. A dot means no reading was recorded.
                        </caption>
                        <thead className="sticky top-0 z-10" style={{ background: C.primary, color: "var(--primary-foreground)" }}>
                            <tr>
                                <th scope="col" className="text-left px-3 py-2 sticky left-0" style={{ background: C.primary }}>Meter</th>
                                <th scope="col" className="px-2 py-2 text-left">Account</th>
                                <th scope="col" className="px-2 py-2 text-left">Zone</th><th scope="col" className="px-2 py-2">Lvl</th><th scope="col" className="px-2 py-2 text-left">Type</th>
                                <th scope="col" className="px-2 py-2 text-right">Selected</th><th scope="col" className="px-2 py-2 text-left">Flag</th><th scope="col" className="px-2 py-2 text-left">Last update</th>
                                {MONTHS.slice(0, nMonths).map((m, i) => (<th scope="col" key={m} className="px-2 py-2 text-right" style={{ background: monthInSelection(sel, i) ? C.accent : C.primary, color: monthInSelection(sel, i) ? C.primary : "var(--primary-foreground)" }}>{m}</th>))}
                            </tr>
                        </thead>
                        <tbody>
                            {limitRows(rows, rowsShown).map((m, i) => {
                                const lvlc = levelToken(m.label);
                                const isAlert = m.flags !== "Normal";
                                const bgr = i % 2 ? "var(--wm-zebra)" : "var(--wm-card)";
                                return (
                                    <tr key={m.acct + i} style={{ background: bgr }}>
                                        <th scope="row" className="px-3 py-1.5 text-left font-semibold whitespace-nowrap sticky left-0" style={{ color: C.ink, background: bgr }}>{m.name}</th>
                                        <td className="px-2 py-1.5 whitespace-nowrap font-mono" style={{ color: C.muted }}>{m.acct}</td>
                                        <td className="px-2 py-1.5 whitespace-nowrap" style={{ color: C.muted }}>{m.zoneName}</td>
                                        <td className="px-2 py-1.5 text-center">
                                            {/* Tinted chip: the level token carries the colour, the label
                                                stays on --foreground so it is legible in both themes. */}
                                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ background: `color-mix(in srgb, ${lvlc} 22%, transparent)`, color: C.ink, boxShadow: `inset 0 0 0 1px ${lvlc}` }}>{m.label}</span>
                                        </td>
                                        <td className="px-2 py-1.5 whitespace-nowrap" style={{ color: C.muted }}>{(m.typ || "").replace("Residential ", "")}</td>
                                        <td className="px-2 py-1.5 text-right font-bold" style={{ color: m.shown == null ? C.muted : C.ink }}>{m.shown == null ? "—" : fmt1(m.shown)}</td>
                                        <td className="px-2 py-1.5 whitespace-nowrap"><span className={`px-2 py-0.5 rounded-full font-semibold ${isAlert ? "bg-mb-danger-light text-mb-danger-text" : "bg-mb-success-light text-mb-success-text"}`}>{m.flags}</span></td>
                                        <td className="px-2 py-1.5 whitespace-nowrap" style={{ color: C.muted }}>{m.lastUpdated}</td>
                                        {/* `·` = no reading recorded; `0.0` = the meter reported zero. */}
                                        {m.vals.map((v, j) => (
                                            <td key={j} className="px-2 py-1.5 text-right" title={v == null ? `${MONTHS[j]}: no reading recorded` : `${MONTHS[j]}: ${fmt1(v)} m³`}
                                                style={{ color: v == null ? C.muted : C.ink, background: monthInSelection(sel, j) ? "var(--row-hover)" : "transparent", fontWeight: monthInSelection(sel, j) ? 700 : 400 }}>
                                                {v == null ? "·" : fmt1(v)}
                                            </td>
                                        ))}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

/* ================= EXCEPTIONS & ACTIONS =================
 *
 * This register identifies issues; it deliberately does NOT track them. The
 * former `Owner` and `Status` columns were hardcoded literals ("O&M / FM",
 * "Open") rendered in a chip that looked interactive but did nothing — fake
 * workflow state that a reader could easily mistake for real assignment and
 * resolution tracking. Management asked for identification only, so those
 * columns are gone and no assignment / acknowledge / close flow replaces them.
 */
interface ExceptionRow {
    Category: string;
    Item: string;
    Severity: string;
    Value: string;
    Remarks: string;
    /** All columns are strings; the index signature lets rows feed `downloadRows`. */
    [key: string]: string;
}
function ExceptionsView({ data, year, sel, period }: { data: WaterData; year: string; sel: Sel; period: PeriodResult }) {
    const [rowsShown, setRowsShown] = useState("20");
    const rows = useMemo<ExceptionRow[]>(() => {
        const out: ExceptionRow[] = [];
        // Primary/trunk network (A1→A2) — the loss above every zone. Flag when it
        // breaches the loss target or goes negative (A2 > A1 → main-meter/timing issue).
        if (period.stage1Pct > TARGET_LOSS_PCT || period.stage1Pct < 0) {
            const neg = period.stage1Pct < 0;
            out.push({
                Category: "Primary network loss (A1→A2)",
                Item: "Trunk mains — main bulk vs zone bulk + direct",
                Severity: neg ? "Watch" : statusFromLoss(period.stage1Pct).label,
                Value: `${period.stage1Pct}% · ${fmt(period.stage1)} m³`,
                Remarks: neg
                    ? "A2 exceeds A1 — reconcile the NAMA main-bulk (L1) reading and check for a reading-date/timing mismatch."
                    : "Confirm every zone-bulk & direct meter reported this period; reconcile L1 vs Σ zone bulk + direct; inspect trunk mains / PRVs before the zones.",
            });
        }
        period.zones.filter((z) => z.lossPct > TARGET_LOSS_PCT).forEach((z) => out.push({
            Category: "High-loss zone", Item: z.name, Severity: statusFromLoss(z.lossPct).label, Value: `${z.lossPct}% · ${fmt(z.loss)} m³`,
            Remarks: actionFromLoss(z.lossPct, z.missing),
        }));
        // Zones whose own bulk meter was not read — the loss figure for these is
        // not merely high, it is unusable until the L2 reading is recovered.
        period.zones.filter((z) => z.bulkMissing).forEach((z) => out.push({
            Category: "Missing zone bulk reading", Item: z.name, Severity: "Critical", Value: "L2 not read",
            Remarks: "The zone bulk (L2) meter has no reading this period, so this zone's loss cannot be computed. Recover the reading before interpreting the balance.",
        }));
        period.buildings.filter((b) => b.lossPct > TARGET_LOSS_PCT && b.loss > 0).slice(0, 12).forEach((b) => out.push({
            Category: "High-loss building", Item: b.name.replace(" Building Bulk Meter", ""), Severity: statusFromLoss(b.lossPct).label, Value: `${b.lossPct}% · ${fmt(b.loss)} m³`,
            Remarks: "Compare bulk meter with apartment meters; inspect common area leakage.",
        }));
        data.meters.forEach((m) => {
            const c = m.y[year]; if (!c || c.label === "N/A") return;
            const shown = periodValue(c, sel);
            const avg = meanReading(c.vals);
            const flags = meterFlags(c, shown, avg).filter((f) => f !== "Normal");
            flags.forEach((f) => out.push({
                Category: f, Item: `${m.name} (${m.acct})`,
                Severity: f.includes("Negative") || f.includes("Missing") || f.includes("spike") ? "Critical" : "Watch",
                Value: shown == null ? "no reading" : `${fmt1(shown)} m³`,
                Remarks: f.includes("spike") ? "Verify reading/photo and inspect for leak."
                    : f.includes("Zero") ? "Meter reported 0 — check occupancy, valve status and meter operation."
                        : f.includes("Missing") ? "No reading was recorded for this period; it is not counted in the balance, which understates A1/A2/A3. Recover the reading."
                            : f.includes("Negative") ? "Reported consumption is negative, which is physically impossible. Validate the source reading before billing/reporting."
                                : "Validate source reading before billing/reporting.",
            }));
        });
        period.zones.filter((z) => Math.abs(z.bulk - z.end) > 0 && z.lossPct > TARGET_LOSS_PCT).slice(0, 8).forEach((z) => out.push({
            Category: "Bulk/individual mismatch", Item: z.name, Severity: statusFromLoss(z.lossPct).label, Value: `${fmt(z.bulk)} − ${fmt(z.end)} = ${fmt(z.loss)} m³`,
            Remarks: `Reconcile L2 bulk vs L3/L4 total; check physical leakage${z.missing > 0 ? ` — note ${z.missing} end-user meter${z.missing === 1 ? " has" : "s have"} no reading, which inflates this gap` : ""}.`,
        }));
        return out.sort((a, b) => (a.Severity === "Critical" ? 0 : 1) - (b.Severity === "Critical" ? 0 : 1));
    }, [data, year, sel, period]);

    const critical = rows.filter((r) => r.Severity === "Critical").length;
    const watch = rows.filter((r) => r.Severity === "Watch").length;

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Kpi icon={ClipboardList} label="Exceptions Identified" value={rows.length} bg="var(--chart-bg-purple)" ic={C.heading} sub="Auto-generated from selected period" />
                <Kpi icon={XCircle} label="Critical" value={critical} bg="var(--chart-bg-red)" ic="var(--mb-danger-text)" sub="Needs validation now" />
                <Kpi icon={AlertTriangle} label="Watch" value={watch} bg="var(--chart-bg-orange)" ic="var(--mb-warning-text)" sub="Monitor or verify" />
            </div>
            <Panel title="Exceptions Register" icon={ClipboardList} note="Issues detected in the selected period: high-loss zones/buildings, zero readings, sudden spikes, negative values, missing readings and reconciliation mismatches. This register identifies problems and suggests a next step — it does not assign or track them.">
                <div className="flex items-center justify-between gap-2 mb-2">
                    <RowsPicker value={rowsShown} setValue={setRowsShown} total={rows.length} />
                    <button onClick={() => downloadRows(rows, `water-exceptions-${year}.csv`)} className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold" style={{ background: C.primary, color: "var(--primary-foreground)", borderRadius: RADIUS.md }}><Download className="w-4 h-4" aria-hidden="true" />Export CSV</button>
                </div>
                <div className="overflow-auto" style={{ maxHeight: rowsShown === "All" ? 560 : undefined }}>
                    <table className="w-full text-[12px]">
                        <caption className="sr-only">
                            {rows.length} exceptions detected for {year}, each with its category, the item affected, a severity band, the measured value and a suggested next step.
                        </caption>
                        <thead className="sticky top-0 z-10" style={{ background: C.primary, color: "var(--primary-foreground)" }}>
                            <tr><th scope="col" className="text-left px-3 py-2">Category</th><th scope="col" className="text-left px-2 py-2">Item</th><th scope="col" className="text-left px-2 py-2">Severity</th><th scope="col" className="text-right px-2 py-2">Value</th><th scope="col" className="text-left px-3 py-2">Remarks / Suggested Action</th></tr>
                        </thead>
                        <tbody>
                            {limitRows(rows, rowsShown).map((r, i) => { const stClass = r.Severity === "Critical" ? "bg-mb-danger-light text-mb-danger-text" : r.Severity === "Watch" ? "bg-mb-warning-light text-mb-warning-text" : "bg-mb-success-light text-mb-success-text"; return (
                                <tr key={i} style={{ background: i % 2 ? "var(--wm-zebra)" : "var(--wm-card)" }}>
                                    <td className="px-3 py-1.5 font-semibold" style={{ color: C.ink }}>{r.Category}</td>
                                    <th scope="row" className="px-2 py-1.5 text-left font-normal" style={{ color: C.ink }}>{r.Item}</th>
                                    <td className="px-2 py-1.5"><span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${stClass}`}>{r.Severity}</span></td>
                                    <td className="px-2 py-1.5 text-right font-mono" style={{ color: C.ink }}>{r.Value}</td>
                                    <td className="px-3 py-1.5" style={{ color: C.muted }}>{r.Remarks}</td>
                                </tr>
                            );})}
                            {!rows.length && <tr><td colSpan={5} className="text-center py-6" style={{ color: C.muted }}>No exceptions detected for the selected period.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </Panel>
        </div>
    );
}

/* ================= ROOT ================= */

/** Persisted Monthly filter state — mirrors what Daily stores under `water-daily`. */
const MONTHLY_PREFS_KEY = "water-monthly";
type MonthlyPrefs = FilterPreferences & {
    tab?: string;
    startMonth?: string;
    endMonth?: string;
};
const isSectionTab = (v: unknown): v is string => SECTION_TABS.some((t) => t.key === v);

export function WaterMonthlyDashboard({ waterMeters }: { waterMeters: WaterMeter[] }) {
    const data = useMemo(() => buildMonthlyData(waterMeters), [waterMeters]);
    const years = data.meta.years;
    const latestYear = years.length ? String(years[years.length - 1]) : "";

    // "Mon-YY" months that have data, for a given year.
    const monthsOfYear = useCallback(
        (yy: string) => data.meta.availableMonths.filter((m) => `20${m.split("-")[1]}` === yy),
        [data],
    );
    const latestYearMonths = useMemo(() => monthsOfYear(latestYear), [monthsOfYear, latestYear]);

    // The filter is driven by start/end "Mon-YY" months — same model the rest of
    // the app's date pickers use — so the shared DateRangePicker drops straight in.
    const [startMonth, setStartMonth] = useState(latestYearMonths[0] ?? "");
    const [endMonth, setEndMonth] = useState(latestYearMonths[latestYearMonths.length - 1] ?? "");
    const [tab, setTab] = useState("overview");

    // ── Restore / persist the section tab and the selected range ──────────────
    // Daily already persists its tab + zone; Monthly silently reset to Overview
    // and the latest year on every visit. Restored once on mount (client-only —
    // localStorage is unavailable during SSR, so this cannot be a lazy state
    // initialiser without a hydration mismatch), and each saved month is
    // re-validated against the months actually loaded before it is applied.
    // Captured at mount, which is exactly when the restore below reads it.
    const availableMonthsRef = useRef(data.meta.availableMonths);

    useEffect(() => {
        const prefs = loadFilterPreferences<MonthlyPrefs>(MONTHLY_PREFS_KEY);
        if (!prefs) return;
        // localStorage is client-only, so restoring the saved section/range must
        // happen after hydration; a lazy useState initialiser would render a
        // different value on the server than on the client.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (isSectionTab(prefs.tab)) setTab(prefs.tab);
        const months = availableMonthsRef.current;
        if (prefs.startMonth && prefs.endMonth
            && months.includes(prefs.startMonth) && months.includes(prefs.endMonth)) {
            setStartMonth(prefs.startMonth);
            setEndMonth(prefs.endMonth);
        }
    }, []);

    useEffect(() => {
        if (!startMonth || !endMonth) return;
        saveFilterPreferences(MONTHLY_PREFS_KEY, { tab, startMonth, endMonth });
    }, [tab, startMonth, endMonth]);

    // Year is derived from the selected end month, with a safe fallback.
    const endYear = endMonth ? `20${endMonth.split("-")[1]}` : "";
    const year = endYear && data.meta.monthsWithData[endYear] ? endYear : latestYear;
    const nMonths = data.meta.monthsWithData[year] ?? 0;

    // Map the "Mon-YY" range onto Jan-first month indices for the compute layer.
    const monthNames: readonly string[] = MONTHS;
    const rawStart = startMonth ? monthNames.indexOf(startMonth.split("-")[0]) : 0;
    const rawEnd = endMonth ? monthNames.indexOf(endMonth.split("-")[0]) : nMonths - 1;
    const safeStart = Math.max(0, Math.min(rawStart < 0 ? 0 : rawStart, 11));
    const safeEnd = Math.max(safeStart, Math.min(rawEnd < 0 ? Math.max(0, nMonths - 1) : rawEnd, 11));
    const selectedMonths = safeEnd - safeStart + 1;
    // Covering Jan → last data month (or beyond) is treated as the whole period.
    const fullSelection = safeStart === 0 && safeEnd >= nMonths - 1;
    const singleMonthSelection = selectedMonths === 1;
    const partial = nMonths > 0 && nMonths < 12;
    const periodSel = useMemo<Sel>(
        () => (fullSelection ? null : singleMonthSelection ? safeStart : [safeStart, safeEnd]),
        [fullSelection, singleMonthSelection, safeStart, safeEnd],
    );

    const handleRangeChange = useCallback((start: string, end: string) => {
        setStartMonth(start);
        setEndMonth(end);
    }, []);
    const chooseYear = useCallback((y: number) => {
        const ms = monthsOfYear(String(y));
        if (ms.length) {
            setStartMonth(ms[0]);
            setEndMonth(ms[ms.length - 1]);
        }
    }, [monthsOfYear]);
    const resetRange = useCallback(() => chooseYear(Number(year)), [chooseYear, year]);

    const monthly = useMemo(
        () => (nMonths ? Array.from({ length: nMonths }, (_, i) => computePeriod(data, year, i)) : []),
        [data, year, nMonths],
    );
    const period = useMemo(() => {
        if (!nMonths) return computePeriod(data, year, null);
        if (periodSel == null) return computePeriod(data, year, null);
        if (typeof periodSel === "number") return periodSel < monthly.length ? monthly[periodSel] : computePeriod(data, year, periodSel);
        return computePeriod(data, year, periodSel);
    }, [data, year, periodSel, monthly, nMonths]);

    const prevYear = String(Number(year) - 1);
    const prevFull = useMemo(
        () => (data.meta.monthsWithData[prevYear] ? computePeriod(data, prevYear, null) : null),
        [data, prevYear],
    );

    const periodLabel = periodSel == null
        ? (partial ? `Year to date · Jan–${MONTHS[nMonths - 1]} ${year}` : `Full Year ${year}`)
        : singleMonthSelection
            ? `${MONTHS[safeStart]} ${year}`
            : `${MONTHS[safeStart]} ${year} – ${MONTHS[safeEnd]} ${year}`;

    let lossDelta: { up: boolean; text: string } | null = null;
    if (singleMonthSelection && safeStart > 0 && safeStart - 1 < monthly.length) {
        const prev = monthly[safeStart - 1];
        lossDelta = { up: period.lossPct > prev.lossPct, text: `${(period.lossPct - prev.lossPct).toFixed(1)} pp MoM` };
    } else if (periodSel == null && prevFull && !partial && data.meta.monthsWithData[prevYear] >= 12) {
        lossDelta = { up: period.lossPct > prevFull.lossPct, text: `${(period.lossPct - prevFull.lossPct).toFixed(1)} pp YoY` };
    }

    // A single month whose balance is arithmetically impossible (no supply, or a
    // loss outside 0–100%). We can state *that* the figures don't reconcile; we
    // cannot know *why*, so the banner below offers candidate explanations
    // instead of asserting one.
    const anomaly = singleMonthSelection && (period.A1 <= 0 || period.lossPct < 0 || period.lossPct > 100);
    const anomalyReason = period.A1 <= 0
        ? "no main-bulk (A1) supply is recorded"
        : period.lossPct < 0
            ? "recorded consumption exceeds recorded supply"
            : "the computed loss exceeds total supply";

    if (!years.length || !nMonths) {
        return (
            <div className="water-monthly">
                <div className="flex items-center gap-2 text-sm font-medium px-4 py-6 rounded-lg justify-center" style={{ background: "var(--wm-card)", color: "var(--wm-muted)", border: "1px solid var(--wm-border)" }}>
                    <Database className="w-4 h-4" /> No monthly water data is available yet.
                </div>
            </div>
        );
    }

    return (
        <div className="water-monthly space-y-5">
            <TabNavigation activeTab={tab} onTabChange={setTab} tabs={SECTION_TABS} ariaLabel="Water monthly sections" />

            <PeriodFilter
                data={data}
                year={year}
                nMonths={nMonths}
                startMonth={startMonth || (monthsOfYear(year)[0] ?? "")}
                endMonth={endMonth || (monthsOfYear(year).slice(-1)[0] ?? "")}
                onRangeChange={handleRangeChange}
                onYear={chooseYear}
                onReset={resetRange}
            />

            <p className="text-[11px] -mt-2 px-1" style={{ color: "var(--wm-muted)" }}>
                NAMA Bulk Account {data.meta.mainAccount} · {data.meta.totalMeters} meters · {periodLabel}
            </p>

            {anomaly && (
                <div role="alert" className="flex items-start gap-2 text-xs font-medium px-3 py-2 rounded-lg border bg-mb-danger-light text-mb-danger-text border-mb-danger">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-px" aria-hidden="true" />
                    <span>
                        <b>{MONTHS[safeStart]} {year} does not reconcile</b> — {anomalyReason}, which is not physically possible.
                        The cause has not been determined. Possible explanations include a source billing adjustment
                        (estimate or meter reset), a missing or mis-dated bulk reading, or meters read on different dates.
                        {period.missingMeters > 0 && <> {period.missingMeters} meter{period.missingMeters === 1 ? " has" : "s have"} no reading this month, which is consistent with the second.</>}
                        {" "}Treat this month&apos;s balance as unverified and prefer the year-to-date figure until it is checked.
                    </span>
                </div>
            )}
            {/* Each section is isolated: a render failure in one must not take
                down the whole Water page. */}
            {tab === "overview" && (
                <SectionBoundary title="Overview">
                    <Overview data={data} period={period} monthly={monthly} sel={periodSel} year={year} nMonths={nMonths} lossDelta={lossDelta} periodLabel={periodLabel} />
                </SectionBoundary>
            )}
            {tab === "zones" && (
                <SectionBoundary title="Zone Analysis">
                    <ZonesView data={data} period={period} monthly={monthly} sel={periodSel} nMonths={nMonths} year={year} />
                </SectionBoundary>
            )}
            {tab === "assets" && (
                <SectionBoundary title="Assets & Connections">
                    <AssetsView period={period} />
                </SectionBoundary>
            )}
            {tab === "meters" && (
                <SectionBoundary title="Main Database">
                    <MetersView data={data} year={year} sel={periodSel} nMonths={nMonths} />
                </SectionBoundary>
            )}
            {tab === "exceptions" && (
                <SectionBoundary title="Exceptions">
                    <ExceptionsView data={data} year={year} sel={periodSel} period={period} />
                </SectionBoundary>
            )}

            <footer className="pt-2 text-[11px]" style={{ color: "var(--wm-muted)" }}>
                Water balance — <b>A1</b> Main Bulk (NAMA L1) → <b>A2</b> Zone Bulk + Direct Connections (L2 + DC) → <b>A3</b> Individual meters + DC
                (L3/L4, building bulks excluded to avoid double-counting). TSE irrigation excluded. Stage 1 loss = A1−A2 (trunk main); Stage 2 loss = A2−A3 (distribution &amp; in-building).
            </footer>
        </div>
    );
}

export default WaterMonthlyDashboard;
