"use client";

/**
 * @fileoverview Water → Monthly dashboard.
 *
 * Converted from an externally-authored JSX prototype to typed TSX and wired to
 * the live Supabase backend. The prototype's self-contained mock (`DATA`) has
 * been replaced by {@link buildMonthlyData}, which derives the same structure
 * from the `WaterMeter[]` the page fetches via `getWaterMetersFromSupabase`.
 *
 * Presentation: every block is one of the design-system primitives in
 * `components/ui/` (DESIGN_SYSTEM.md §6 — `KpiCard`, `SectionCard`, `Tabs`,
 * `DateRangePicker`, `ChartFrame`, `Badge`, `Button`) and every colour, radius,
 * shadow and type step is a token from `app/design-tokens.css`. The prototype's
 * local `--wm-*` palette, inline card shells and hand-rolled tabs are gone.
 *
 * @module components/water/monthly/water-monthly-dashboard
 */

import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from "react";
import {
    ResponsiveContainer, ComposedChart, BarChart, Bar, Line,
    XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ReferenceLine,
} from "recharts";
import {
    Droplet, AlertTriangle, Activity,
    Gauge, Building2, Plug, Search, Layers, ArrowRight, MapPin, CheckCircle2,
    Filter, Download, ClipboardList, XCircle, Target, FileSpreadsheet,
    BarChart3, Database, List, ChevronDown, ChevronUp, CalendarClock, type LucideIcon,
} from "lucide-react";

import { Badge, Button, ChartFrame, chartTheme, DateRangePicker, KpiCard, SectionCard, Tabs } from "@/components/ui";
import { SectionBoundary } from "@/components/shared/section-boundary";
import { saveFilterPreferences, loadFilterPreferences, type FilterPreferences } from "@/lib/filter-preferences";
import type { WaterMeter } from "@/lib/water-data";
import type { DerivedMonth } from "@/functions/api/water";
import {
    buildMonthlyData, computePeriod, MONTHS, TARGET_LOSS_PCT, LOSS_RATE_OMR,
    fmt, fmt1, pct, isRangeSel, periodValue, monthInSelection, sev, statusFromLoss,
    actionFromLoss, lastReadingLabel, downloadRows, meterFlags, meanReading,
    type WaterData, type PeriodResult, type Sel, type ZoneRow, type Severity,
} from "@/lib/water-monthly-data";
import { useChartMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/cn";

/* ---------- Chart series (DESIGN_SYSTEM.md §2.4, through chartTheme) ---------- */
const SERIES = {
    supply: chartTheme.series[2],   // water blue
    dist: chartTheme.series[1],     // teal
    cons: chartTheme.series[5],     // sage
    primary: chartTheme.series[0],  // purple — selection markers
    loss: chartTheme.loss,
    target: chartTheme.target,
} as const;
const PIE_SERIES = chartTheme.series;

/* ---------- level colours (token-only) ----------
 * The hierarchy-level chip in the meter database tints with the level while the
 * label text stays on the foreground token, so it is legible in both themes. */
const LEVEL_TOKEN: Record<string, string> = {
    L1: chartTheme.series[2],
    L2: chartTheme.series[1],
    L3: chartTheme.series[0],
    L4: chartTheme.series[4],
    DC: chartTheme.series[3],
};
const levelToken = (level: string): string => LEVEL_TOKEN[level] ?? "var(--color-neutral)";

/* ---------- severity → status tokens ----------
 * `sev()` names the band ("Good" … "Critical"); the colours here are the
 * design system's muted status pairs (§2.2), so a Water cell and an STP badge
 * read the same. Colour is always paired with the band's label. */
type StatusTone = "success" | "warning" | "danger" | "neutral";
const TONE_CSS: Record<StatusTone, { text: string; tint: string }> = {
    success: { text: "var(--color-success)", tint: "var(--color-success-tint)" },
    warning: { text: "var(--color-warning)", tint: "var(--color-warning-tint)" },
    danger: { text: "var(--color-danger)", tint: "var(--color-danger-tint)" },
    neutral: { text: "var(--color-muted)", tint: "var(--color-neutral-tint)" },
};
const BAND_TONE: Record<string, StatusTone> = { Good: "success", Moderate: "warning", High: "danger", Critical: "danger" };
function sevStyle(s: Severity): { tone: StatusTone; text: string; tint: string } {
    const tone = BAND_TONE[s.label] ?? "neutral";
    const css = TONE_CSS[tone];
    // Critical carries a heavier tint than High so the two separate in the heatmap.
    const tint = s.label === "Critical" ? "color-mix(in srgb, var(--color-danger) 30%, transparent)" : css.tint;
    return { tone, text: css.text, tint };
}
/** Exceptions-register severities ("Critical" / "Watch" / "Normal") → badge tone. */
const severityTone = (label: string): StatusTone =>
    label === "Critical" ? "danger" : label === "Watch" ? "warning" : "success";

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

/* ---------- shared class strings (tokens only) ---------- */
/** Purple header row, eyebrow type, on-primary text (DESIGN_SYSTEM.md §6 DataTable). */
const TH = "sticky top-0 z-10 whitespace-nowrap bg-primary px-3 py-2 text-left text-eyebrow uppercase text-on-primary";
const TD = "px-3 py-2 text-caption text-fg";
/** Zebra striping on the component surface; rows keep a 44 px minimum. */
const TBODY = "[&>tr]:h-11 [&>tr:nth-child(even)]:bg-component";
/** Clickable summary card (zone / trunk cards). */
const CARD_BUTTON = "w-full rounded-card border border-line bg-card p-4 text-left shadow-card transition-[box-shadow,transform] duration-200 hover:-translate-y-px hover:shadow-card-hover";
/** Inline callouts: status tint + status text, one radius. */
const CALLOUT = "flex items-start gap-2 rounded-card px-3 py-2 text-caption";

/* ---------- UI atoms ---------- */

/** Explanatory line under a card header — wraps freely so the 56 px header never has to. */
function Note({ children }: { children: ReactNode }) {
    return <p className="mb-3 text-caption text-muted">{children}</p>;
}

/**
 * A `SectionCard` the operator can fold away — used for the long, secondary
 * sections of the Zone Analysis view. The header (title, description, action)
 * stays fixed; only the body shows or hides.
 */
function FoldableCard({
    title, icon, description, note, action, defaultOpen = false, children,
}: {
    title: string;
    icon?: LucideIcon;
    description?: string;
    note?: string;
    action?: ReactNode;
    defaultOpen?: boolean;
    children: ReactNode;
}) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <SectionCard>
            <SectionCard.Header
                title={title}
                icon={icon}
                description={description}
                action={
                    <div className="flex items-center gap-2">
                        {open && action}
                        <Button
                            variant="ghost"
                            size="sm"
                            icon={open ? ChevronUp : ChevronDown}
                            aria-expanded={open}
                            onClick={() => setOpen((o) => !o)}
                        >
                            {open ? "Hide" : "Show"}
                        </Button>
                    </div>
                }
            />
            {open && (
                <SectionCard.Body>
                    {note && <Note>{note}</Note>}
                    {children}
                </SectionCard.Body>
            )}
        </SectionCard>
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
        <span className="inline-flex h-9 items-center gap-1.5 rounded-control border border-line bg-card px-2.5">
            <Icon size={16} strokeWidth={2} aria-hidden="true" className="shrink-0 text-muted" />
            <select aria-label={label} value={value} onChange={(e) => setValue(e.target.value)} className="bg-transparent text-label text-fg outline-none">
                {options.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
        </span>
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
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3 text-caption text-muted">
            {caption && <span className="font-medium">{caption}</span>}
            {SEV_LEGEND.map((s) => {
                const st = sevStyle(sev(s.pctExample));
                return (
                    <span key={s.label} className="inline-flex items-center gap-1.5">
                        <span className="h-3 w-3 rounded-control" aria-hidden="true" style={{ background: st.tint, border: `1px solid ${st.text}` }} />
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
        <span className="inline-flex items-center gap-1.5 text-caption text-muted">
            Rows
            <Select icon={List} label="Rows to show" value={value} setValue={setValue} options={ROW_OPTIONS} />
            <span className="whitespace-nowrap">of {total}</span>
        </span>
    );
}

/* compact per-panel CSV export — exports the full row set, not just the rows shown */
function PanelExport({ onClick }: { onClick: () => void }) {
    return (
        <Button variant="secondary" size="sm" icon={Download} onClick={onClick} title="Export CSV" aria-label="Export CSV">
            CSV
        </Button>
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
                <circle cx={cc} cy={cc} r={r} fill="none" stroke="var(--color-line)" strokeWidth={sw} />
                {f > 0.002 && (
                    <circle cx={cc} cy={cc} r={r} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round"
                        strokeDasharray={`${f * Cf} ${Cf}`} transform={`rotate(-90 ${cc} ${cc})`} />
                )}
                <text x={cc} y={cc - 10} textAnchor="middle" style={{ fontSize: fs, fontWeight: 700, fill: "var(--color-fg)" }}>{big}</text>
                <text x={cc} y={cc + 6} textAnchor="middle" style={{ fontSize: 11, fill: "var(--color-muted)" }}>{small}</text>
                <text x={cc} y={cc + 24} textAnchor="middle" style={{ fontSize: 13, fontWeight: 700, fill: color }}>{pctv}%</text>
            </svg>
            <p className="mt-1 text-label text-fg">{label}</p>
            <p className="text-caption text-muted">{caption}</p>
        </div>
    );
}

/* loss connector shown between gauges */
function LossLink({ label, v, of }: { label: string; v: number; of: number }) {
    const p = of ? Math.round((v / of) * 1000) / 10 : 0;
    return (
        <div className="flex shrink-0 flex-col items-center px-0.5">
            <ArrowRight size={16} strokeWidth={2} className="text-muted" aria-hidden="true" />
            <span className="mt-1 whitespace-nowrap rounded-control bg-danger-tint px-1.5 py-0.5 text-caption font-medium text-danger">−{fmt(v)} m³</span>
            <span className="mt-0.5 whitespace-nowrap text-caption font-medium text-danger">{label} · {p}%</span>
        </div>
    );
}

/** Zone-dropdown key for the primary/trunk network stage (A1 → A2). Prefixed so
 * it can never collide with a real zone code. */
const TRUNK_KEY = "__trunk__";

/** Section tabs, in display order (DESIGN_SYSTEM.md §7 — five, never scrolling). */
type SectionKey = "overview" | "zones" | "assets" | "meters" | "exceptions";
const SECTION_TABS: { value: SectionKey; label: string; icon: LucideIcon }[] = [
    { value: "overview", label: "Overview", icon: BarChart3 },
    { value: "zones", label: "Zone Analysis", icon: MapPin },
    { value: "assets", label: "Assets & Connections", icon: Activity },
    { value: "meters", label: "Main Database", icon: Database },
    { value: "exceptions", label: "Exceptions", icon: ClipboardList },
];
const isSectionTab = (v: unknown): v is SectionKey => SECTION_TABS.some((t) => t.value === v);

/* ---------- "Mon-YY" ↔ "YYYY-MM" (the DateRangePicker speaks ISO month keys) ---------- */
const monthNames: readonly string[] = MONTHS;
const toMonthKey = (m: string): string => {
    const [mon, yy] = m.split("-");
    return `20${yy}-${String(monthNames.indexOf(mon) + 1).padStart(2, "0")}`;
};
const fromMonthKey = (k: string): string => {
    const [yyyy, mm] = k.split("-");
    return `${monthNames[Number(mm) - 1]}-${yyyy.slice(2)}`;
};
const yearOf = (m: string): string => `20${m.split("-")[1]}`;

function WaterSummary({ period, lossDelta, periodLabel }: Pick<OverviewProps, "period" | "lossDelta" | "periodLabel">) {
    const efficiency = pct(period.A3, period.A1);
    const lossCost = Math.max(0, period.loss) * LOSS_RATE_OMR;
    return (
        <div className="grid grid-cols-2 gap-3.5 xl:grid-cols-3">
            <KpiCard tone="water" icon={Droplet} label="Total supply (A1)" value={fmt(period.A1)} unit="m³" footnote={periodLabel} />
            <KpiCard tone="water" icon={Droplet} label="Distribution (A2)" value={fmt(period.A2)} unit="m³" footnote="Zone bulk + direct" />
            <KpiCard tone="water" icon={CheckCircle2} label="Consumption (A3)" value={fmt(period.A3)} unit="m³" footnote="Billed at end-user" />
            <KpiCard icon={Gauge} label="Efficiency" value={efficiency.toFixed(1)} unit="%" footnote={`Target ≥ ${100 - TARGET_LOSS_PCT}%`} />
            <KpiCard
                icon={AlertTriangle}
                label="Total loss"
                value={fmt(period.loss)}
                unit="m³"
                footnote={`${period.lossPct}% of supply`}
                trend={lossDelta ? { value: lossDelta.text, direction: lossDelta.up ? "up" : "down", good: !lossDelta.up } : undefined}
            />
            <KpiCard icon={FileSpreadsheet} label="Loss cost estimate" value={fmt(lossCost)} unit="OMR" footnote={`${LOSS_RATE_OMR} OMR / m³ assumption`} />
        </div>
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
function Overview({ period: t, monthly, sel, periodLabel }: OverviewProps) {
    const chartMotion = useChartMotion();
    const a2f = pct(t.A2, t.A1) / 100, a3f = pct(t.A3, t.A1) / 100;
    const typePie = t.types.map((x) => ({ name: x.type.replace("Residential ", "").replace("(", "").replace(")", ""), value: x.total, pct: x.pct }));
    // `target` is a real management target, so it is drawn as its own series
    // (see the balance chart below) rather than sitting unused in the data.
    const trend = monthly.map((p, i) => ({ m: MONTHS[i], A1: p.A1, A3: p.A3, loss: p.loss, lossPct: p.lossPct, target: TARGET_LOSS_PCT }));
    const selM = isRangeSel(sel) ? `${MONTHS[sel[0]]}–${MONTHS[sel[1]]}` : sel != null ? MONTHS[sel] : null;
    const selectedLineMonths = isRangeSel(sel) ? [sel[0], sel[1]] : sel != null ? [sel] : [];
    const aboveTarget = t.lossPct > TARGET_LOSS_PCT;

    return (
        <div className="space-y-6">
            {(t.missingMeters > 0 || t.negativeMeters > 0) && (
                <p className={cn(CALLOUT, "bg-warning-tint text-warning")}>
                    <AlertTriangle size={16} strokeWidth={2} className="mt-px shrink-0" aria-hidden="true" />
                    <span>
                        Balance completeness: {t.missingMeters > 0 && <><b>{t.missingMeters}</b> meter{t.missingMeters === 1 ? " has" : "s have"} no reading for this period</>}
                        {t.missingMeters > 0 && t.negativeMeters > 0 && "; "}
                        {t.negativeMeters > 0 && <><b>{t.negativeMeters}</b> reported a negative reading</>}
                        . Unread meters contribute nothing to A1/A2/A3, so the loss shown may be overstated. See <b>Exceptions</b> for the list.
                    </span>
                </p>
            )}

            <SectionCard>
                <SectionCard.Header
                    icon={Gauge}
                    title="System water balance"
                    description={`Supply → distribution → consumption · ${periodLabel} · target loss ≤ ${TARGET_LOSS_PCT}%`}
                />
                <SectionCard.Body>
                    <div className="flex items-center justify-center gap-1 overflow-x-auto pb-1 sm:gap-3">
                        <RingGauge frac={1} color={SERIES.dist} big={fmt(t.A1)} small="m³" label="A1 · Supply" caption="total entering" />
                        <LossLink label="trunk" v={t.stage1} of={t.A1} />
                        <RingGauge frac={a2f} color={SERIES.supply} big={fmt(t.A2)} small="m³" label="A2 · Distribution" caption="reaches zones" />
                        <LossLink label="network" v={t.stage2} of={t.A1} />
                        <RingGauge frac={a3f} color={SERIES.cons} big={fmt(t.A3)} small="m³" label="A3 · Consumption" caption="at meters" />
                    </div>
                </SectionCard.Body>
                <SectionCard.Footer tone={aboveTarget ? "danger" : "success"}>
                    Total system loss vs {TARGET_LOSS_PCT}% target: {fmt(t.loss)} m³ · {t.lossPct}% · {aboveTarget ? `${(t.lossPct - TARGET_LOSS_PCT).toFixed(1)} pp above target` : "Within target"}
                </SectionCard.Footer>
            </SectionCard>

            <div className="grid grid-cols-12 gap-3.5">
                {/* Supply/consumption volumes and the loss trend, merged into one
                    chart: the standalone "Monthly Loss %" area panel restated the
                    same months, so loss % now rides a right-hand axis here
                    against the management target. */}
                <div className="col-span-12 lg:col-span-7">
                    <SectionCard>
                        <SectionCard.Header
                            icon={Activity}
                            title="Monthly supply, consumption & loss"
                            description="Volumes in m³ (left) · loss share of supply (right)"
                        />
                        <SectionCard.Body>
                            <ChartFrame
                                series={4}
                                legend={[
                                    { label: "Supply", color: SERIES.supply },
                                    { label: "Consumption", color: SERIES.cons },
                                    { label: LOSS_PCT_SERIES, color: SERIES.loss },
                                    { label: TARGET_SERIES, color: SERIES.target, dashed: true },
                                ]}
                            >
                                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 1, height: 1 }}>
                                    <ComposedChart data={trend} margin={{ top: 6, right: 4, left: -10, bottom: 0 }}>
                                        <CartesianGrid {...chartTheme.grid} />
                                        <XAxis dataKey="m" {...chartTheme.axis} />
                                        <YAxis yAxisId="vol" {...chartTheme.axis} />
                                        <YAxis yAxisId="pct" orientation="right" unit="%" width={44} {...chartTheme.axis} />
                                        <Tooltip formatter={fmtBalance} {...chartTheme.tooltip} />
                                        {selectedLineMonths.map((i) => <ReferenceLine key={i} yAxisId="vol" x={MONTHS[i]} stroke={SERIES.primary} strokeDasharray="4 4" />)}
                                        <Bar yAxisId="vol" dataKey="A1" name="Supply" fill={SERIES.supply} {...chartTheme.bar} barSize={14} {...chartMotion} />
                                        <Bar yAxisId="vol" dataKey="A3" name="Consumption" fill={SERIES.cons} {...chartTheme.bar} barSize={14} {...chartMotion} />
                                        <Line yAxisId="pct" dataKey="lossPct" name={LOSS_PCT_SERIES} stroke={SERIES.loss} {...chartTheme.line} dot={{ r: 2 }} {...chartMotion} />
                                        <Line yAxisId="pct" dataKey="target" name={TARGET_SERIES} stroke={SERIES.target} strokeWidth={1.5} strokeDasharray="5 5" dot={false} {...chartMotion} />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </ChartFrame>
                        </SectionCard.Body>
                        <SectionCard.Footer>
                            Target line at {TARGET_LOSS_PCT}%{selM ? ` · Highlighted: ${selM}` : ""}
                        </SectionCard.Footer>
                    </SectionCard>
                </div>
                <div className="col-span-12 lg:col-span-5">
                    <SectionCard>
                        <SectionCard.Header icon={Layers} title="Consumption by type" description={`Share of A3 · ${periodLabel}`} />
                        <SectionCard.Body>
                            {/* Donut rule: no labels on the ring — the legend table beside carries the shares. */}
                            <ChartFrame series={1}>
                                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 1, height: 1 }}>
                                    <PieChart>
                                        <Pie data={typePie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={56} outerRadius={92} paddingAngle={2} {...chartMotion}>
                                            {typePie.map((e, i) => <Cell key={i} fill={PIE_SERIES[i % PIE_SERIES.length]} />)}
                                        </Pie>
                                        <Tooltip formatter={(v, n, p) => [`${fmt(Number(v))} m³ (${p?.payload?.pct}%)`, n]} {...chartTheme.tooltip} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </ChartFrame>
                            <ul className="mt-3 space-y-1 text-caption">
                                {typePie.slice(0, 6).map((x, i) => (
                                    <li key={i} className="flex items-center justify-between">
                                        <span className="flex items-center gap-1.5 text-fg"><span className="h-2.5 w-2.5 rounded-control" style={{ background: PIE_SERIES[i % PIE_SERIES.length] }} />{x.name}</span>
                                        <span className="font-medium tabular-nums text-muted">{x.pct}%</span>
                                    </li>
                                ))}
                            </ul>
                        </SectionCard.Body>
                        <SectionCard.Footer>
                            {typePie.slice(0, 3).map((x) => `${x.name} ${x.pct}%`).join(" · ")}
                        </SectionCard.Footer>
                    </SectionCard>
                </div>
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
    const chartMotion = useChartMotion();
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
    const tst = sevStyle(ts);

    // Stable handler for zone cards — reads the zone key off the clicked button's
    // data attribute so a single callback replaces a per-item lambda inside .map().
    const selectZoneFromCard = useCallback((e: MouseEvent<HTMLButtonElement>) => {
        setZoneSel(e.currentTarget.dataset.zone ?? "all");
    }, []);

    const picker = (
        <div className="flex flex-wrap items-center gap-2">
            <span className="text-label text-fg">Zone</span>
            <span className="inline-flex h-9 items-center gap-1.5 rounded-control border border-line bg-card px-2.5">
                <MapPin size={16} strokeWidth={2} aria-hidden="true" className="shrink-0 text-muted" />
                <select aria-label="Select zone to analyse" value={zoneSel} onChange={(e) => setZoneSel(e.target.value)} className="cursor-pointer bg-transparent text-label text-fg outline-none">
                    <option value="all">All zones (overview)</option>
                    <option value={TRUNK_KEY}>Primary network (A1 → A2)</option>
                    {real.map((z) => <option key={z.zone} value={z.zone}>{z.name}</option>)}
                </select>
            </span>
            {zoneSel !== "all" && (
                <Button variant="ghost" size="sm" onClick={() => setZoneSel("all")}>← all zones</Button>
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
            <div className="space-y-6">
                {picker}
                <div className="grid grid-cols-2 gap-3.5 xl:grid-cols-4">
                    <KpiCard tone="water" icon={Droplet} label="Main bulk supply (A1)" value={fmt(A1)} unit="m³" footnote="NAMA L1 — total entering" />
                    <KpiCard tone="water" icon={Plug} label="Reached distribution (A2)" value={fmt(A2)} unit="m³" footnote="Σ zone bulk + direct" />
                    <KpiCard icon={AlertTriangle} label="Trunk loss" value={fmt(trunkLoss)} unit="m³" footnote="A1 − A2 · before any zone" />
                    <KpiCard icon={Gauge} label="Trunk loss %" value={String(trunkPct)} unit="%" footnote={ts.label} />
                </div>

                <SectionCard>
                    <SectionCard.Header icon={Droplet} title="Main bulk vs reached distribution" />
                    <SectionCard.Body>
                        <Note>Green reached a zone-bulk or direct-connection meter; red left the main bulk but was never metered downstream — the trunk-main loss.</Note>
                        <div className="mb-1 flex justify-between text-caption">
                            <span className="text-success">Reached A2 {fmt(A2)} m³ · {Math.round(reachedPct)}%</span>
                            <span className="font-medium text-danger">Trunk loss {fmt(trunkLoss)} m³ · {trunkPct}%</span>
                        </div>
                        <div className="flex h-8 w-full overflow-hidden rounded-control bg-component">
                            <div style={{ width: `${reachedPct}%`, background: SERIES.cons }} title={`Reached A2 ${fmt(A2)} m³`} />
                            <div style={{ width: `${lossBar}%`, background: SERIES.loss }} title={`Trunk loss ${fmt(trunkLoss)} m³`} />
                        </div>
                        <div className="mt-1 text-right text-caption text-muted">Main bulk supply (A1) {fmt(A1)} m³ · 100%</div>
                        {trunkLoss < 0 && (
                            <p className="mt-2 text-caption font-medium text-warning">Negative gap — Σ zone bulk + direct exceeds the main bulk (A1). Physically impossible over time; reconcile the L1 main-meter reading and check for a reading-date/timing mismatch.</p>
                        )}
                    </SectionCard.Body>
                </SectionCard>

                <div className="grid grid-cols-12 gap-3.5">
                    <div className="col-span-12 lg:col-span-6">
                        <SectionCard>
                            <SectionCard.Header icon={Activity} title="Monthly — main bulk vs reached distribution" />
                            <SectionCard.Body>
                                <Note>Gap between the bars each month is the trunk-main loss (A1 − A2). A wildly swinging or negative gap points to meter-reading timing, not real leakage.</Note>
                                <ChartFrame series={3} legend={[{ label: "Main bulk (A1)", color: SERIES.supply }, { label: "Reached zones (A2)", color: SERIES.dist }, { label: "Trunk loss", color: SERIES.loss }]}>
                                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 1, height: 1 }}>
                                        <ComposedChart data={tmonthly} margin={{ top: 6, right: 8, left: -10, bottom: 0 }}>
                                            <CartesianGrid {...chartTheme.grid} />
                                            <XAxis dataKey="m" {...chartTheme.axis} />
                                            <YAxis {...chartTheme.axis} />
                                            <Tooltip formatter={fmtM3} {...chartTheme.tooltip} />
                                            {(isRangeSel(sel) ? [sel[0], sel[1]] : sel != null ? [sel] : []).map((i) => <ReferenceLine key={i} x={MONTHS[i]} stroke={SERIES.primary} strokeDasharray="4 4" />)}
                                            <Bar dataKey="a1" name="Main bulk (A1)" fill={SERIES.supply} {...chartTheme.bar} barSize={14} {...chartMotion} />
                                            <Bar dataKey="a2" name="Reached zones (A2)" fill={SERIES.dist} {...chartTheme.bar} barSize={14} {...chartMotion} />
                                            <Line dataKey="loss" name="Trunk loss" stroke={SERIES.loss} {...chartTheme.line} dot={{ r: 2 }} {...chartMotion} />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </ChartFrame>
                            </SectionCard.Body>
                        </SectionCard>
                    </div>
                    <div className="col-span-12 lg:col-span-6">
                        <SectionCard>
                            <SectionCard.Header icon={Layers} title="What makes up A2" />
                            <SectionCard.Body>
                                <Note>Every zone-bulk & direct-connection meter A1 must reconcile against. A missing or under-reading meter here shows up as trunk loss.</Note>
                                <ChartFrame series={1}>
                                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 1, height: 1 }}>
                                        <BarChart data={comp.slice(0, 10).map((c) => ({ name: c.name.length > 18 ? c.name.slice(0, 18) + "…" : c.name, val: c.val }))} layout="vertical" margin={{ top: 4, right: 30, left: 10, bottom: 0 }}>
                                            <CartesianGrid {...chartTheme.grid} vertical horizontal={false} />
                                            <XAxis type="number" {...chartTheme.axis} />
                                            <YAxis type="category" dataKey="name" {...chartTheme.axis} tick={{ fontSize: 11, fill: "var(--color-fg)" }} width={120} />
                                            <Tooltip formatter={fmtConsumptionM3} {...chartTheme.tooltip} />
                                            <Bar dataKey="val" fill={SERIES.dist} {...chartTheme.bar} radius={[0, 4, 4, 0]} barSize={13} {...chartMotion} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </ChartFrame>
                            </SectionCard.Body>
                        </SectionCard>
                    </div>
                </div>

                <FoldableCard
                    defaultOpen
                    title="A1 reconciliation — Σ zone bulk + direct vs main bulk"
                    icon={Layers}
                    action={<div className="flex items-center gap-2">
                        <PanelExport onClick={() => downloadRows(comp.map((c, i) => ({ "#": i + 1, Meter: c.name, Kind: c.kind, "Volume (m3)": c.val.toFixed(1), "% of A1": pctOfA1(c.val) })), `water-a1-reconciliation-${year}.csv`)} />
                        <RowsPicker value={rowsShown} setValue={setRowsShown} total={comp.length} />
                    </div>}
                    note="Main bulk (A1) = Σ zone bulk + Σ direct connections + trunk loss. Use it to spot which downstream bulk meters are missing or under-reading before blaming leakage."
                >
                    <div className="overflow-auto rounded-control border border-line" style={{ maxHeight: rowsShown === "All" ? 480 : undefined }}>
                        <table className="w-full">
                            <caption className="sr-only">
                                A1 reconciliation for {year}: every zone-bulk and direct-connection meter, its volume in cubic metres and its share of main bulk supply, with the reached-distribution total and trunk loss summarised at the end.
                            </caption>
                            <thead>
                                <tr>
                                    <th scope="col" className={TH}>#</th>
                                    <th scope="col" className={TH}>Meter</th>
                                    <th scope="col" className={TH}>Kind</th>
                                    <th scope="col" className={cn(TH, "text-right")}>Volume (m³)</th>
                                    <th scope="col" className={cn(TH, "text-right")}>% of A1</th>
                                </tr>
                            </thead>
                            <tbody className={TBODY}>
                                {limitRows(comp, rowsShown).map((c, i) => (
                                    <tr key={c.name + i}>
                                        <td className={cn(TD, "text-muted")}>{i + 1}</td>
                                        <th scope="row" className={cn(TD, "whitespace-nowrap text-left font-medium")}>{c.name}</th>
                                        <td className={cn(TD, "whitespace-nowrap text-muted")}>{c.kind}</td>
                                        <td className={cn(TD, "text-right tabular-nums")}>{fmt1(c.val)}</td>
                                        <td className={cn(TD, "text-right tabular-nums text-muted")}>{pctOfA1(c.val)}%</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="[&>tr]:h-11">
                                <tr className="border-t-2 border-line">
                                    <td colSpan={3} className={cn(TD, "font-medium text-success")}>Σ Reached distribution (A2)</td>
                                    <td className={cn(TD, "text-right font-medium tabular-nums text-success")}>{fmt1(A2)}</td>
                                    <td className={cn(TD, "text-right font-medium tabular-nums text-success")}>{Math.round(reachedPct)}%</td>
                                </tr>
                                <tr>
                                    <td colSpan={3} className={cn(TD, "font-medium text-danger")}>Trunk loss (unaccounted before zones)</td>
                                    <td className={cn(TD, "text-right font-medium tabular-nums text-danger")}>{fmt1(trunkLoss)}</td>
                                    <td className={cn(TD, "text-right font-medium tabular-nums text-danger")}>{trunkPct}%</td>
                                </tr>
                                <tr className="border-t border-line">
                                    <td colSpan={3} className={cn(TD, "font-medium")}>Main bulk supply (A1)</td>
                                    <td className={cn(TD, "text-right font-medium tabular-nums")}>{fmt1(A1)}</td>
                                    <td className={cn(TD, "text-right font-medium tabular-nums")}>100%</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </FoldableCard>

                <FoldableCard title="How to identify & manage this gap" icon={Target}>
                    <p className="text-body text-muted">
                        A high A1→A2 gap is loss on the primary / trunk mains <b>before</b> water reaches any zone, so no zone card will ever show it.
                        Work it in order: <b>(1)</b> confirm every zone-bulk &amp; direct-connection meter above reported for the period — a missing or
                        zero one inflates the gap; <b>(2)</b> reconcile the NAMA main-bulk (L1) reading against Σ zone bulk + direct, checking for a
                        reading-date/timing mismatch; <b>(3)</b> only once the meters check out, dispatch a trunk-main / PRV inspection between the
                        reservoir and the zone inlets. Track the monthly trend, not a single month — timing noise makes individual months swing
                        (and occasionally go negative when A2 &gt; A1).
                    </p>
                </FoldableCard>
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
        const worstStyle = worstBld ? sevStyle(sev(worstBld.lossPct)) : null;

        return (
            <div className="space-y-6">
                {picker}
                <div className="grid grid-cols-2 gap-3.5 xl:grid-cols-4">
                    <KpiCard tone="water" icon={Droplet} label="Zone supply" value={fmt(supply)} unit="m³" footnote="L2 bulk meter" />
                    <KpiCard tone="water" icon={CheckCircle2} label="Individual use" value={fmt(cons)} unit="m³" footnote={`${z.meters} meters`} />
                    <KpiCard icon={AlertTriangle} label="Zone loss" value={fmt(loss)} unit="m³" footnote="supply − individual" />
                    <KpiCard icon={Gauge} label="Loss %" value={String(z.lossPct)} unit="%" footnote={s.label} />
                </div>

                <SectionCard>
                    <SectionCard.Header icon={Droplet} title={`${z.name} — supply vs individual consumption`} />
                    <SectionCard.Body>
                        <Note>Green is water recorded by individual meters; red is what entered the zone but no meter recorded — the loss.</Note>
                        <div className="mb-1 flex justify-between text-caption">
                            <span className="text-success">Consumption {fmt(cons)} m³ · {Math.round(consPct)}%</span>
                            <span className="font-medium text-danger">Loss {fmt(loss)} m³ · {z.lossPct}%</span>
                        </div>
                        <div className="flex h-8 w-full overflow-hidden rounded-control bg-component">
                            <div style={{ width: `${consPct}%`, background: SERIES.cons }} title={`Consumption ${fmt(cons)} m³`} />
                            <div style={{ width: `${lossBar}%`, background: SERIES.loss }} title={`Loss ${fmt(loss)} m³`} />
                        </div>
                        <div className="mt-1 text-right text-caption text-muted">Zone supply (bulk) {fmt(supply)} m³ · 100%</div>
                    </SectionCard.Body>
                </SectionCard>

                <div className="grid grid-cols-12 gap-3.5">
                    <div className="col-span-12 lg:col-span-6">
                        <SectionCard>
                            <SectionCard.Header icon={Activity} title="Monthly — supply vs consumption" description="Gap between the bars each month is the loss" />
                            <SectionCard.Body>
                                <ChartFrame series={3} legend={[{ label: "Supply", color: SERIES.dist }, { label: "Consumption", color: SERIES.cons }, { label: "Loss", color: SERIES.loss }]}>
                                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 1, height: 1 }}>
                                        <ComposedChart data={zmonthly} margin={{ top: 6, right: 8, left: -10, bottom: 0 }}>
                                            <CartesianGrid {...chartTheme.grid} />
                                            <XAxis dataKey="m" {...chartTheme.axis} />
                                            <YAxis {...chartTheme.axis} />
                                            <Tooltip formatter={fmtM3} {...chartTheme.tooltip} />
                                            {(isRangeSel(sel) ? [sel[0], sel[1]] : sel != null ? [sel] : []).map((i) => <ReferenceLine key={i} x={MONTHS[i]} stroke={SERIES.primary} strokeDasharray="4 4" />)}
                                            <Bar dataKey="Supply" fill={SERIES.dist} {...chartTheme.bar} barSize={14} {...chartMotion} />
                                            <Bar dataKey="Consumption" fill={SERIES.cons} {...chartTheme.bar} barSize={14} {...chartMotion} />
                                            <Line dataKey="loss" name="Loss" stroke={SERIES.loss} {...chartTheme.line} dot={{ r: 2 }} {...chartMotion} />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </ChartFrame>
                            </SectionCard.Body>
                        </SectionCard>
                    </div>
                    <div className="col-span-12 lg:col-span-6">
                        <SectionCard>
                            <SectionCard.Header icon={Layers} title="Top individual consumers" />
                            <SectionCard.Body>
                                <Note>Largest end-user meters in this zone for the period. Meters with no reading are excluded rather than plotted as zero.</Note>
                                <ChartFrame series={1}>
                                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 1, height: 1 }}>
                                        <BarChart data={meters.filter((m) => m.val != null).slice(0, 10).map((m) => ({ name: m.name.length > 18 ? m.name.slice(0, 18) + "…" : m.name, val: m.val as number }))} layout="vertical" margin={{ top: 4, right: 30, left: 10, bottom: 0 }}>
                                            <CartesianGrid {...chartTheme.grid} vertical horizontal={false} />
                                            <XAxis type="number" {...chartTheme.axis} />
                                            <YAxis type="category" dataKey="name" {...chartTheme.axis} tick={{ fontSize: 11, fill: "var(--color-fg)" }} width={120} />
                                            <Tooltip formatter={fmtConsumptionM3} {...chartTheme.tooltip} />
                                            <Bar dataKey="val" fill={SERIES.cons} {...chartTheme.bar} radius={[0, 4, 4, 0]} barSize={13} {...chartMotion} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </ChartFrame>
                            </SectionCard.Body>
                        </SectionCard>
                    </div>
                </div>

                <FoldableCard
                    defaultOpen
                    title={`Individual meters in ${z.name} (${meters.length})`}
                    icon={Layers}
                    action={<div className="flex items-center gap-2">
                        <PanelExport onClick={() => downloadRows(meters.map((m, i) => ({ "#": i + 1, Meter: m.name, Type: m.typ, "Consumption (m3)": m.val == null ? "no reading" : m.val.toFixed(1), "% of supply": pctOf(m.val) })), `water-zone-${String(z.zone).replace(/\s+/g, "-").toLowerCase()}-meters-${year}.csv`)} />
                        <RowsPicker value={rowsShown} setValue={setRowsShown} total={meters.length} />
                    </div>}
                    note={`Zone supply = Σ individual consumption + loss.${unread > 0 ? ` ${unread} meter${unread === 1 ? " has" : "s have"} no reading this period, so Σ individual consumption is incomplete and the loss below may be overstated.` : ""}`}
                >
                    <div className="overflow-auto rounded-control border border-line" style={{ maxHeight: rowsShown === "All" ? 480 : undefined }}>
                        <table className="w-full">
                            <caption className="sr-only">
                                Individual end-user meters in {z.name} for {year}, with each meter&apos;s consumption in cubic metres and its share of zone supply. Meters with no reading are labelled &ldquo;no reading&rdquo;.
                            </caption>
                            <thead>
                                <tr>
                                    <th scope="col" className={TH}>#</th>
                                    <th scope="col" className={TH}>Meter</th>
                                    <th scope="col" className={TH}>Type</th>
                                    <th scope="col" className={cn(TH, "text-right")}>Consumption (m³)</th>
                                    <th scope="col" className={cn(TH, "text-right")}>% of supply</th>
                                </tr>
                            </thead>
                            <tbody className={TBODY}>
                                {limitRows(meters, rowsShown).map((m, i) => (
                                    <tr key={m.name + i}>
                                        <td className={cn(TD, "text-muted")}>{i + 1}</td>
                                        <th scope="row" className={cn(TD, "whitespace-nowrap text-left font-medium")}>{m.name}</th>
                                        <td className={cn(TD, "whitespace-nowrap text-muted")}>{m.typ}</td>
                                        <td className={cn(TD, "text-right tabular-nums", m.val == null && "text-muted")}>
                                            {m.val == null ? "no reading" : fmt1(m.val)}
                                        </td>
                                        <td className={cn(TD, "text-right tabular-nums text-muted")}>{pctOf(m.val)}{m.val == null ? "" : "%"}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="[&>tr]:h-11">
                                <tr className="border-t-2 border-line">
                                    <td colSpan={3} className={cn(TD, "font-medium text-success")}>Σ Individual consumption</td>
                                    <td className={cn(TD, "text-right font-medium tabular-nums text-success")}>{fmt1(cons)}</td>
                                    <td className={cn(TD, "text-right font-medium tabular-nums text-success")}>{Math.round(consPct)}%</td>
                                </tr>
                                <tr>
                                    <td colSpan={3} className={cn(TD, "font-medium text-danger")}>Unaccounted (loss)</td>
                                    <td className={cn(TD, "text-right font-medium tabular-nums text-danger")}>{fmt1(loss)}</td>
                                    <td className={cn(TD, "text-right font-medium tabular-nums text-danger")}>{z.lossPct}%</td>
                                </tr>
                                <tr className="border-t border-line">
                                    <td colSpan={3} className={cn(TD, "font-medium")}>Zone supply (bulk)</td>
                                    <td className={cn(TD, "text-right font-medium tabular-nums")}>{fmt1(supply)}</td>
                                    <td className={cn(TD, "text-right font-medium tabular-nums")}>100%</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </FoldableCard>

                {/* The full building bulk-vs-apartment table lives on the
                    Assets & Connections tab (same rows, same columns, plus a
                    Zone column) — repeating it here was pure duplication. What
                    is genuinely zone-specific is the headline, so that stays. */}
                {blds.length > 0 && worstBld && worstStyle && (
                    <div className="flex items-start gap-3 rounded-card border border-line bg-component px-4 py-3 text-caption">
                        <Building2 size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-muted" aria-hidden="true" />
                        <div>
                            <p className="text-label text-fg">Building losses in {z.name}</p>
                            <p className="mt-0.5 text-muted">
                                {blds.length} building bulk meter{blds.length === 1 ? "" : "s"} in this zone.
                                Worst gap: <b className="text-fg">{worstBld.name.replace(" Building Bulk Meter", "")}</b> —
                                bulk {fmt(worstBld.bulk)} m³ vs apartments {fmt(worstBld.sub)} m³
                                (<b style={{ color: worstStyle.text }}>{worstBld.lossPct}% · {sev(worstBld.lossPct).label}</b>).
                                Full building-by-building table on the <b>Assets &amp; Connections</b> tab.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    /* ---------- all-zones overview ---------- */
    const bar = real.map((z) => ({ name: z.name, lossPct: z.lossPct, loss: z.loss, fill: sevStyle(sev(z.lossPct)).text }));
    const heat = real.map((z) => ({
        zone: z.zone, name: z.name, yr: z.lossPct,
        months: monthly.map((p) => { const m = p.zones.find((x) => x.zone === z.zone); return m ? m.lossPct : 0; }),
        lossM: monthly.map((p) => { const m = p.zones.find((x) => x.zone === z.zone); return m ? m.loss : 0; }),
    }));

    return (
        <div className="space-y-6">
            {picker}

            {/* Primary/trunk network (A1 → A2): the loss that sits ABOVE every zone.
                Kept prominent at the top so it is never overlooked next to the zones. */}
            <button type="button" onClick={() => setZoneSel(TRUNK_KEY)} className={cn(CARD_BUTTON, "flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4")}>
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={tst.tone}>Stage 1 · {ts.label}</Badge>
                        <h3 className="text-title text-primary dark:text-fg">Primary network (A1 → A2)</h3>
                    </div>
                    <p className="mt-1 text-caption text-muted">
                        Trunk-main loss <b>before</b> water reaches any zone bulk or direct connection — not attributable to a single zone. Tap to reconcile A1 vs Σ zone bulk + direct.
                    </p>
                </div>
                <div className="flex shrink-0 items-center gap-5">
                    <div className="text-right text-caption text-muted">
                        <p>A1 <b className="text-fg">{fmt(period.A1)}</b> → A2 <b className="text-fg">{fmt(period.A2)}</b></p>
                        <p>trunk loss <b style={{ color: tst.text }}>{fmt(trunkLoss)} m³</b></p>
                    </div>
                    <div className="text-right">
                        <p className="text-kpi tabular-nums" style={{ color: tst.text }}>{trunkPct}%</p>
                        <p className="text-caption text-muted">of supply · review →</p>
                    </div>
                </div>
            </button>

            <div className="grid grid-cols-12 gap-3.5">
                <div className="col-span-12 lg:col-span-6">
                    <SectionCard>
                        <SectionCard.Header icon={AlertTriangle} title="Loss % by zone" description="Higher = more water lost inside the zone · pick a zone above to drill in" />
                        <SectionCard.Body>
                            <ChartFrame series={1} height="chart-lg">
                                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 1, height: 1 }}>
                                    <BarChart data={bar} layout="vertical" margin={{ top: 4, right: 30, left: 10, bottom: 0 }}>
                                        <CartesianGrid {...chartTheme.grid} vertical horizontal={false} />
                                        <XAxis type="number" {...chartTheme.axis} unit="%" />
                                        <YAxis type="category" dataKey="name" {...chartTheme.axis} tick={{ fontSize: 11, fill: "var(--color-fg)" }} width={90} />
                                        <Tooltip formatter={(v, n, p) => [`${v}%  (${fmt(p?.payload?.loss)} m³)`, "Loss"]} {...chartTheme.tooltip} />
                                        <Bar dataKey="lossPct" {...chartTheme.bar} radius={[0, 4, 4, 0]} barSize={20} {...chartMotion}>{bar.map((e, i) => <Cell key={i} fill={e.fill} />)}</Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </ChartFrame>
                        </SectionCard.Body>
                    </SectionCard>
                </div>
                <div className="col-span-12 lg:col-span-6">
                    <SectionCard>
                        <SectionCard.Header icon={Droplet} title="Supply vs consumption by zone" description="The gap between the two bars is the loss" />
                        <SectionCard.Body>
                            <ChartFrame series={2} height="chart-lg" legend={[{ label: "Zone supply", color: SERIES.dist }, { label: "Consumption", color: SERIES.cons }]}>
                                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 1, height: 1 }}>
                                    <BarChart data={real.map((z) => ({ name: z.name, bulk: z.bulk, end: z.end }))} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                                        <CartesianGrid {...chartTheme.grid} />
                                        <XAxis dataKey="name" {...chartTheme.axis} interval={0} angle={-15} textAnchor="end" height={50} />
                                        <YAxis {...chartTheme.axis} />
                                        <Tooltip formatter={(v, n) => [fmt(Number(v)) + " m³", n === "bulk" ? "Zone supply" : "Consumption"]} {...chartTheme.tooltip} />
                                        <Bar dataKey="bulk" name="Zone supply" fill={SERIES.dist} {...chartTheme.bar} barSize={18} {...chartMotion} />
                                        <Bar dataKey="end" name="Consumption" fill={SERIES.cons} {...chartTheme.bar} barSize={18} {...chartMotion} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </ChartFrame>
                        </SectionCard.Body>
                    </SectionCard>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                {real.map((z) => {
                    const s = sev(z.lossPct);
                    const st = sevStyle(s);
                    return (
                        <button key={z.zone} type="button" data-zone={z.zone} onClick={selectZoneFromCard} className={CARD_BUTTON}>
                            <div className="flex items-center justify-between gap-2">
                                <h3 className="truncate text-title text-primary dark:text-fg">{z.name}</h3>
                                <Badge tone={st.tone}>{s.label}</Badge>
                            </div>
                            <p className="mt-0.5 text-caption text-muted">{z.meters} end-user meters · tap to drill in</p>
                            <div className="mt-3 flex items-end justify-between">
                                <div><p className="text-kpi tabular-nums" style={{ color: st.text }}>{z.lossPct}%</p><p className="text-caption text-muted">loss · {fmt(z.loss)} m³</p></div>
                                <div className="text-right text-caption text-muted"><p>supply <b className="text-fg">{fmt(z.bulk)}</b></p><p>used <b className="text-fg">{fmt(z.end)}</b></p></div>
                            </div>
                            <div className="mt-2 h-1.5 overflow-hidden rounded-pill bg-component">
                                <div className="h-1.5 rounded-pill" style={{ width: `${Math.min(100, Math.max(0, z.lossPct))}%`, background: st.text }} />
                            </div>
                        </button>
                    );
                })}
            </div>

            <FoldableCard
                defaultOpen
                title="Zone loss % — monthly heatmap"
                icon={Gauge}
                note="Each cell is one month's loss for that zone, as a percentage of zone supply. Selected month is ringed. Colour repeats the severity band named in the key below — it never carries meaning on its own."
            >
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-caption">
                        <caption className="sr-only">
                            Monthly loss percentage by zone for {heat.length} zones over {nMonths} months, plus a year column. Each value is followed by its severity band.
                        </caption>
                        <thead>
                            <tr>
                                <th scope="col" className="sticky left-0 bg-card px-2 py-1.5 text-left text-eyebrow uppercase text-muted">Zone</th>
                                {MONTHS.slice(0, nMonths).map((m, i) => (
                                    <th scope="col" key={m} className={cn("px-1.5 py-1.5 text-center text-eyebrow uppercase", monthInSelection(sel, i) ? "text-primary underline dark:text-accent" : "text-muted")}>{m}</th>
                                ))}
                                <th scope="col" className="px-2 py-1.5 text-center text-eyebrow uppercase text-muted">Yr</th>
                            </tr>
                        </thead>
                        <tbody>
                            {heat.map((z) => (
                                <tr key={z.zone}>
                                    <th scope="row" className="sticky left-0 whitespace-nowrap bg-card px-2 py-1 text-left text-label text-fg">{z.name}</th>
                                    {z.months.map((lp, i) => {
                                        const s = sev(lp);
                                        const st = sevStyle(s);
                                        return (
                                            <td key={i} className="rounded-control px-1.5 py-1 text-center font-medium tabular-nums" title={`${z.name} · ${MONTHS[i]}: ${lp}% loss (${s.label}) · ${fmt(z.lossM[i])} m³`}
                                                style={{ background: st.tint, color: st.text, outline: monthInSelection(sel, i) ? "2px solid var(--color-primary)" : "none", outlineOffset: -1 }}>
                                                {lp}
                                                <span className="sr-only"> percent loss, {s.label}</span>
                                            </td>
                                        );
                                    })}
                                    <td className="px-2 py-1 text-center font-medium tabular-nums" style={{ color: sevStyle(sev(z.yr)).text }}>
                                        {z.yr}
                                        <span className="sr-only"> percent loss for the year, {sev(z.yr).label}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <SeverityLegend caption="Loss band:" />
            </FoldableCard>
        </div>
    );
}

/* ================= BUILDINGS / DIRECT / COMMON ================= */
function AssetsView({ period }: { period: PeriodResult }) {
    const chartMotion = useChartMotion();
    // This is now the single home for the building bulk-vs-apartment table (the
    // zone drill-down used to repeat it), so it shows every building rather than
    // an arbitrary top-12 slice.
    const [rowsShown, setRowsShown] = useState("20");
    const blds = period.buildings;
    const dcs = period.dcs;
    return (
        <div className="grid grid-cols-12 gap-3.5">
            <div className="col-span-12 lg:col-span-6">
                <SectionCard>
                    <SectionCard.Header
                        icon={Building2}
                        title="Buildings — bulk vs apartment meters"
                        action={<div className="flex items-center gap-2">
                            <PanelExport onClick={() => downloadRows(blds.map((b) => { const s = sev(b.lossPct); return { Building: b.name.replace(" Building Bulk Meter", ""), Zone: b.zone, "Bulk (m3)": b.bulk.toFixed(1), "Apartments (m3)": b.sub.toFixed(1), "Loss (m3)": b.loss.toFixed(1), "Loss %": b.lossPct, Band: s.label }; }), "water-building-balance.csv")} />
                            <RowsPicker value={rowsShown} setValue={setRowsShown} total={blds.length} />
                        </div>}
                    />
                    <SectionCard.Body>
                        <Note>Building bulk meter minus the sum of its apartment meters. A positive gap points at in-building leakage or a meter problem.</Note>
                        <div className="overflow-auto rounded-control border border-line" style={{ maxHeight: rowsShown === "All" ? 480 : undefined }}>
                            <table className="w-full">
                                <caption className="sr-only">
                                    Building bulk meters compared with the sum of their apartment meters: bulk volume, apartment total, the gap in cubic metres, and the gap as a percentage with its severity band.
                                </caption>
                                <thead>
                                    <tr>
                                        <th scope="col" className={TH}>Building</th>
                                        <th scope="col" className={TH}>Zone</th>
                                        <th scope="col" className={cn(TH, "text-right")}>Bulk</th>
                                        <th scope="col" className={cn(TH, "text-right")}>Apts</th>
                                        <th scope="col" className={cn(TH, "text-right")}>Loss</th>
                                        <th scope="col" className={cn(TH, "text-right")}>Loss % · band</th>
                                    </tr>
                                </thead>
                                <tbody className={TBODY}>
                                    {blds.length === 0 && <tr><td colSpan={6} className={cn(TD, "text-center text-muted")}>No building data for this period.</td></tr>}
                                    {limitRows(blds, rowsShown).map((b) => { const s = sev(b.lossPct); const st = sevStyle(s); return (
                                        <tr key={b.name}>
                                            <th scope="row" className={cn(TD, "text-left font-medium")}>{b.name.replace(" Building Bulk Meter", "")}</th>
                                            <td className={cn(TD, "text-muted")}>{b.zone}</td>
                                            <td className={cn(TD, "text-right tabular-nums")}>{fmt(b.bulk)}</td>
                                            <td className={cn(TD, "text-right tabular-nums")}>{fmt(b.sub)}</td>
                                            <td className={cn(TD, "text-right font-medium tabular-nums")}>{fmt(b.loss)}</td>
                                            <td className={cn(TD, "whitespace-nowrap text-right")}>
                                                {/* Percentage + named band: the colour is a reinforcement, never the only signal. */}
                                                <span className="font-medium tabular-nums" style={{ color: st.text }}>{b.lossPct}%</span>
                                                <Badge tone={st.tone} className="ml-1.5">{s.label}</Badge>
                                            </td>
                                        </tr>); })}
                                </tbody>
                            </table>
                        </div>
                        <SeverityLegend caption="Loss band:" />
                    </SectionCard.Body>
                </SectionCard>
            </div>
            <div className="col-span-12 lg:col-span-6">
                <SectionCard>
                    <SectionCard.Header icon={Plug} title="Direct connections" description="Meters fed straight from the main inlet, bypassing the zones" />
                    <SectionCard.Body>
                        <ChartFrame series={1} height="chart-lg">
                            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 1, height: 1 }}>
                                <BarChart data={dcs.slice(0, 10).map((d) => ({ name: d.name.length > 24 ? d.name.slice(0, 24) + "…" : d.name, total: d.total }))} layout="vertical" margin={{ top: 4, right: 30, left: 10, bottom: 0 }}>
                                    <CartesianGrid {...chartTheme.grid} vertical horizontal={false} />
                                    <XAxis type="number" {...chartTheme.axis} />
                                    <YAxis type="category" dataKey="name" {...chartTheme.axis} tick={{ fontSize: 11, fill: "var(--color-fg)" }} width={140} />
                                    <Tooltip formatter={fmtConsumptionM3} {...chartTheme.tooltip} />
                                    <Bar dataKey="total" fill={SERIES.dist} {...chartTheme.bar} radius={[0, 4, 4, 0]} barSize={14} {...chartMotion} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartFrame>
                    </SectionCard.Body>
                </SectionCard>
            </div>
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

    const selectionLabel = sel == null ? "period total" : isRangeSel(sel) ? `${MONTHS[sel[0]]}–${MONTHS[sel[1]]} highlighted` : `${MONTHS[sel]} highlighted`;

    return (
        <SectionCard>
            <SectionCard.Header
                icon={Database}
                title="Main database"
                description={`${rows.length} meters · ${selectionLabel}`}
                action={<Button variant="primary" size="sm" icon={Download} onClick={() => downloadRows(exportData, `water-meter-explorer-${year}.csv`)}>Export CSV</Button>}
            />
            <SectionCard.Body flush>
                <div className="flex flex-wrap items-center gap-2 border-b border-line p-4">
                    <span className="inline-flex h-9 items-center gap-2 rounded-control border border-line bg-card px-2.5">
                        <Search size={16} strokeWidth={2} aria-hidden="true" className="shrink-0 text-muted" />
                        <label htmlFor="wm-meter-search" className="sr-only">Search meters by name or account number</label>
                        <input id="wm-meter-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search meter name or account number…" className="w-64 bg-transparent text-label text-fg outline-none placeholder:text-muted" />
                    </span>
                    <Select icon={MapPin} label="Filter by zone" value={zone} setValue={setZone} options={zoneOpts} />
                    <Select icon={Filter} label="Filter by hierarchy level" value={level} setValue={setLevel} options={levelOpts} />
                    <Select icon={Layers} label="Filter by meter type" value={typ} setValue={setTyp} options={typeOpts} />
                    <Button variant="secondary" size="sm" icon={FileSpreadsheet} onClick={() => downloadRows(exportData, `water-meter-explorer-${year}-excel.csv`)}>Excel-ready</Button>
                    <RowsPicker value={rowsShown} setValue={setRowsShown} total={rows.length} />
                </div>
                <div className="overflow-auto" style={{ maxHeight: rowsShown === "All" ? 600 : undefined }}>
                    <table className="w-full border-collapse">
                        <caption className="sr-only">
                            Water meter database for {year}: {rows.length} meters with account number, zone, hierarchy level, type, the volume for the selected period, data-quality flag, last reading and every month&apos;s reading. A dot means no reading was recorded.
                        </caption>
                        <thead>
                            <tr>
                                <th scope="col" className={cn(TH, "left-0 z-20")}>Meter</th>
                                <th scope="col" className={TH}>Account</th>
                                <th scope="col" className={TH}>Zone</th><th scope="col" className={cn(TH, "text-center")}>Lvl</th><th scope="col" className={TH}>Type</th>
                                <th scope="col" className={cn(TH, "text-right")}>Selected</th><th scope="col" className={TH}>Flag</th><th scope="col" className={TH}>Last update</th>
                                {MONTHS.slice(0, nMonths).map((m, i) => (<th scope="col" key={m} className={cn(TH, "text-right")} style={monthInSelection(sel, i) ? { background: "var(--color-accent)", color: "var(--color-primary)" } : undefined}>{m}</th>))}
                            </tr>
                        </thead>
                        <tbody className={TBODY}>
                            {limitRows(rows, rowsShown).map((m, i) => {
                                const lvlc = levelToken(m.label);
                                const isAlert = m.flags !== "Normal";
                                // Sticky first column needs its own opaque surface, matching the zebra stripe.
                                const stickyBg = i % 2 ? "var(--color-component)" : "var(--color-card)";
                                return (
                                    <tr key={m.acct + i}>
                                        <th scope="row" className={cn(TD, "sticky left-0 whitespace-nowrap text-left font-medium")} style={{ background: stickyBg }}>{m.name}</th>
                                        <td className={cn(TD, "meter whitespace-nowrap text-muted")}>{m.acct}</td>
                                        <td className={cn(TD, "whitespace-nowrap text-muted")}>{m.zoneName}</td>
                                        <td className={cn(TD, "text-center")}>
                                            {/* Tinted chip: the level token carries the colour, the label
                                                stays on the foreground token so it is legible in both themes. */}
                                            <span className="rounded-control px-1.5 py-0.5 text-caption font-medium text-fg" style={{ background: `color-mix(in srgb, ${lvlc} 22%, transparent)`, boxShadow: `inset 0 0 0 1px ${lvlc}` }}>{m.label}</span>
                                        </td>
                                        <td className={cn(TD, "whitespace-nowrap text-muted")}>{(m.typ || "").replace("Residential ", "")}</td>
                                        <td className={cn(TD, "text-right font-medium tabular-nums", m.shown == null && "text-muted")}>{m.shown == null ? "—" : fmt1(m.shown)}</td>
                                        <td className={cn(TD, "whitespace-nowrap")}><Badge tone={isAlert ? "danger" : "success"}>{m.flags}</Badge></td>
                                        <td className={cn(TD, "whitespace-nowrap text-muted")}>{m.lastUpdated}</td>
                                        {/* `·` = no reading recorded; `0.0` = the meter reported zero. */}
                                        {m.vals.map((v, j) => (
                                            <td key={j} className={cn(TD, "text-right tabular-nums", v == null && "text-muted", monthInSelection(sel, j) && "bg-accent-tint font-medium")} title={v == null ? `${MONTHS[j]}: no reading recorded` : `${MONTHS[j]}: ${fmt1(v)} m³`}>
                                                {v == null ? "·" : fmt1(v)}
                                            </td>
                                        ))}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </SectionCard.Body>
        </SectionCard>
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
/** Every rule firing on the selected period's data — computed once in the root
 *  so the Exceptions tab can show its count before the operator opens it. */
function buildExceptionRows(data: WaterData, year: string, sel: Sel, period: PeriodResult): ExceptionRow[] {
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
}

function ExceptionsView({ rows, year }: { rows: ExceptionRow[]; year: string }) {
    const [rowsShown, setRowsShown] = useState("20");
    const critical = rows.filter((r) => r.Severity === "Critical").length;
    const watch = rows.filter((r) => r.Severity === "Watch").length;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3.5 md:grid-cols-3">
                <KpiCard icon={ClipboardList} label="Exceptions identified" value={String(rows.length)} footnote="Auto-generated from selected period" />
                <KpiCard icon={XCircle} label="Critical" value={String(critical)} footnote="Needs validation now" />
                <KpiCard icon={AlertTriangle} label="Watch" value={String(watch)} footnote="Monitor or verify" />
            </div>
            <SectionCard>
                <SectionCard.Header
                    icon={ClipboardList}
                    title="Exceptions register"
                    action={<div className="flex items-center gap-2">
                        <RowsPicker value={rowsShown} setValue={setRowsShown} total={rows.length} />
                        <Button variant="primary" size="sm" icon={Download} onClick={() => downloadRows(rows, `water-exceptions-${year}.csv`)}>Export CSV</Button>
                    </div>}
                />
                <SectionCard.Body>
                    <Note>Issues detected in the selected period: high-loss zones/buildings, zero readings, sudden spikes, negative values, missing readings and reconciliation mismatches. This register identifies problems and suggests a next step — it does not assign or track them.</Note>
                    <div className="overflow-auto rounded-control border border-line" style={{ maxHeight: rowsShown === "All" ? 560 : undefined }}>
                        <table className="w-full">
                            <caption className="sr-only">
                                {rows.length} exceptions detected for {year}, each with its category, the item affected, a severity band, the measured value and a suggested next step.
                            </caption>
                            <thead>
                                <tr><th scope="col" className={TH}>Category</th><th scope="col" className={TH}>Item</th><th scope="col" className={TH}>Severity</th><th scope="col" className={cn(TH, "text-right")}>Value</th><th scope="col" className={TH}>Remarks / Suggested Action</th></tr>
                            </thead>
                            <tbody className={TBODY}>
                                {limitRows(rows, rowsShown).map((r, i) => (
                                    <tr key={i}>
                                        <td className={cn(TD, "font-medium")}>{r.Category}</td>
                                        <th scope="row" className={cn(TD, "text-left font-normal")}>{r.Item}</th>
                                        <td className={TD}><Badge tone={severityTone(r.Severity)}>{r.Severity}</Badge></td>
                                        <td className={cn(TD, "meter text-right")}>{r.Value}</td>
                                        <td className={cn(TD, "text-muted")}>{r.Remarks}</td>
                                    </tr>
                                ))}
                                {!rows.length && <tr><td colSpan={5} className={cn(TD, "py-6 text-center text-muted")}>No exceptions detected for the selected period.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </SectionCard.Body>
            </SectionCard>
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

const MONTH_FULL: Record<string, string> = {
    Jan: "January", Feb: "February", Mar: "March", Apr: "April", May: "May", Jun: "June",
    Jul: "July", Aug: "August", Sep: "September", Oct: "October", Nov: "November", Dec: "December",
};

/** `"Jul-26"` → `"July 2026"` for the month-to-date provenance note. */
const formatDerivedMonth = (key: string): string => {
    const [mon, yy] = key.split("-");
    return `${MONTH_FULL[mon] ?? mon} 20${yy}`;
};

export function WaterMonthlyDashboard({
    waterMeters,
    derivedMonths = [],
}: {
    waterMeters: WaterMeter[];
    /** Months whose figures are month-to-date sums of daily readings, not the official monthly import. */
    derivedMonths?: DerivedMonth[];
}) {
    const data = useMemo(() => buildMonthlyData(waterMeters), [waterMeters]);
    const years = data.meta.years;
    const latestYear = years.length ? String(years[years.length - 1]) : "";

    // "Mon-YY" months that have data, for a given year.
    const monthsOfYear = useCallback(
        (yy: string) => data.meta.availableMonths.filter((m) => yearOf(m) === yy),
        [data],
    );
    const latestYearMonths = useMemo(() => monthsOfYear(latestYear), [monthsOfYear, latestYear]);
    // Every month with data, as ascending ISO keys — what the DateRangePicker lists.
    const monthKeys = useMemo(() => data.meta.availableMonths.map(toMonthKey).sort(), [data]);

    // The filter is driven by start/end "Mon-YY" months — the compute layer's
    // model — and translated to ISO month keys for the shared DateRangePicker.
    const [startMonth, setStartMonth] = useState(latestYearMonths[0] ?? "");
    const [endMonth, setEndMonth] = useState(latestYearMonths[latestYearMonths.length - 1] ?? "");
    const [tab, setTab] = useState<SectionKey>("overview");

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
    const endYear = endMonth ? yearOf(endMonth) : "";
    const year = endYear && data.meta.monthsWithData[endYear] ? endYear : latestYear;
    const nMonths = data.meta.monthsWithData[year] ?? 0;

    // Month-to-date months that fall inside the displayed year (usually just
    // the current month while its official import is pending).
    const derivedMonthsShown = useMemo(
        () => derivedMonths.filter((d) => yearOf(d.month) === year),
        [derivedMonths, year],
    );

    // Map the "Mon-YY" range onto Jan-first month indices for the compute layer.
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

    // The picker can express a range across two years; the water balance is
    // computed per calendar year (the "Mon-YY" model above), so a cross-year
    // pick snaps its start to the first data month of the end month's year.
    const handleRangeChange = useCallback((v: { start: string; end: string }) => {
        const end = fromMonthKey(v.end);
        let start = fromMonthKey(v.start);
        if (yearOf(start) !== yearOf(end)) start = monthsOfYear(yearOf(end))[0] ?? end;
        setStartMonth(start);
        setEndMonth(end);
    }, [monthsOfYear]);

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

    const exceptionRows = useMemo(() => buildExceptionRows(data, year, periodSel, period), [data, year, periodSel, period]);
    const sectionTabs = useMemo(
        () => SECTION_TABS.map((t) => (t.value === "exceptions" ? { ...t, count: exceptionRows.length } : t)),
        [exceptionRows.length],
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

    if (!years.length || !nMonths || monthKeys.length === 0) {
        return (
            <SectionCard>
                <SectionCard.Body className="flex items-center justify-center gap-2 py-6 text-body text-muted">
                    <Database size={16} strokeWidth={2} aria-hidden="true" /> No monthly water data is available yet.
                </SectionCard.Body>
            </SectionCard>
        );
    }

    const pickerValue = {
        start: toMonthKey(startMonth || (monthsOfYear(year)[0] ?? "")),
        end: toMonthKey(endMonth || (monthsOfYear(year).slice(-1)[0] ?? "")),
    };

    return (
        <div className="space-y-6">
            {/* KPI row first, then the ONE period control, then the section tabs
                (DESIGN_SYSTEM.md §5 / §7 — KPIs first, then Tabs, on every module page). */}
            <WaterSummary period={period} lossDelta={lossDelta} periodLabel={periodLabel} />

            <DateRangePicker months={monthKeys} value={pickerValue} onChange={handleRangeChange} />

            <p className="text-caption text-muted">
                NAMA Bulk Account {data.meta.mainAccount} · {data.meta.totalMeters} meters · {periodLabel}
            </p>

            {/* Provenance note for month-to-date months. The official monthly
                import for a month lands a few days into the next month; until
                then the month's figures are sums of the real daily readings.
                Shown only when a derived month sits in the displayed year, so
                browsing history stays quiet. */}
            {derivedMonthsShown.length > 0 && (
                <div role="note" className={cn(CALLOUT, "bg-info-tint text-info")}>
                    <CalendarClock size={16} strokeWidth={2} className="mt-px shrink-0" aria-hidden="true" />
                    <span>
                        {derivedMonthsShown.map((d, i) => (
                            <span key={d.month}>
                                {i > 0 && "; "}
                                <b>{formatDerivedMonth(d.month)} is month-to-date</b> — summed from the daily meter
                                readings through day {d.throughDay}
                            </span>
                        ))}
                        . The official monthly readings have not been imported yet; when they arrive they will
                        replace these figures automatically.
                    </span>
                </div>
            )}

            {anomaly && (
                <div role="alert" className={cn(CALLOUT, "bg-danger-tint text-danger")}>
                    <AlertTriangle size={16} strokeWidth={2} className="mt-px shrink-0" aria-hidden="true" />
                    <span>
                        <b>{MONTHS[safeStart]} {year} does not reconcile</b> — {anomalyReason}, which is not physically possible.
                        The cause has not been determined. Possible explanations include a source billing adjustment
                        (estimate or meter reset), a missing or mis-dated bulk reading, or meters read on different dates.
                        {period.missingMeters > 0 && <> {period.missingMeters} meter{period.missingMeters === 1 ? " has" : "s have"} no reading this month, which is consistent with the second.</>}
                        {" "}Treat this month&apos;s balance as unverified and prefer the year-to-date figure until it is checked.
                    </span>
                </div>
            )}

            <Tabs<SectionKey> aria-label="Water monthly sections" value={tab} onChange={setTab} tabs={sectionTabs} />

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
                    <ExceptionsView rows={exceptionRows} year={year} />
                </SectionBoundary>
            )}

            <footer className="text-caption text-muted">
                Water balance — <b>A1</b> Main Bulk (NAMA L1) → <b>A2</b> Zone Bulk + Direct Connections (L2 + DC) → <b>A3</b> Individual meters + DC
                (L3/L4, building bulks excluded to avoid double-counting). TSE irrigation excluded. Stage 1 loss = A1−A2 (trunk main); Stage 2 loss = A2−A3 (distribution &amp; in-building).
            </footer>
        </div>
    );
}

export default WaterMonthlyDashboard;
