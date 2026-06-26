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

import { useCallback, useMemo, useState, type ReactNode } from "react";
import {
    ResponsiveContainer, ComposedChart, BarChart, Bar, Line, Area, AreaChart,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ReferenceLine,
} from "recharts";
import {
    Droplet, TrendingDown, TrendingUp, AlertTriangle, Activity,
    Gauge, Building2, Plug, Search, Layers, ArrowRight, MapPin, CheckCircle2,
    Filter, Download, ClipboardList, XCircle, Target, FileSpreadsheet,
    BarChart3, Database, type LucideIcon,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TabNavigation } from "@/components/shared/tab-navigation";
import { DateRangePicker } from "@/components/water/date-range-picker";
import type { WaterMeter } from "@/lib/water-data";
import {
    buildMonthlyData, computePeriod, MONTHS, TARGET_LOSS_PCT, LOSS_RATE_OMR, TYPECOL,
    fmt, fmt1, pct, isRangeSel, periodValue, monthInSelection, sev, statusFromLoss,
    actionFromLoss, lastReadingLabel, downloadRows, meterFlags,
    type WaterData, type PeriodResult, type Sel, type ZoneRow,
} from "@/lib/water-monthly-data";

/* ---------- Muscat Bay Brand & Design System (mapped to app tokens) ---------- */
const C = {
    primary: "var(--primary)",
    accent: "var(--secondary)",
    accentActive: "#8AAFA5",
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
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: RADIUS.card, boxShadow: SHADOW }} className="p-4 transition-all">
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
                    <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: delta.up ? "#B85C5C" : "#5E8C77" }}>
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
}
function Panel({ title, icon: Icon, right, children, note, className, bodyClassName }: PanelProps) {
    return (
        <div className={className} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: RADIUS.card, boxShadow: SHADOW }}>
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
                <div className="flex items-center gap-2">
                    {Icon && <Icon className="w-4 h-4" style={{ color: C.heading }} />}
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
    value: string;
    setValue: (v: string) => void;
    options: string[];
}
function Select({ icon: Icon, value, setValue, options }: SelectProps) {
    return (
        <div className="flex items-center gap-1.5 px-2.5 py-2" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: RADIUS.md }}>
            <Icon className="w-4 h-4" style={{ color: C.muted }} />
            <select value={value} onChange={(e) => setValue(e.target.value)} className="text-sm outline-none" style={{ color: C.ink, background: C.card }}>
                {options.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
        </div>
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
    return (
        <div className="flex flex-col items-center">
            <svg viewBox={`0 0 ${S} ${S}`} width="100%" style={{ maxWidth: 160 }}>
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
            <span className="px-1.5 py-0.5 rounded text-[11px] font-bold mt-1 whitespace-nowrap" style={{ background: "#FDECEC", color: "#D12E2E" }}>−{fmt(v)} m³</span>
            <span className="text-[10px] mt-0.5 whitespace-nowrap font-semibold" style={{ color: "#D12E2E" }}>{label} · {p}%</span>
        </div>
    );
}

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
    const trend = monthly.map((p, i) => ({ m: MONTHS[i], A1: p.A1, A3: p.A3, loss: p.loss, lossPct: p.lossPct, target: TARGET_LOSS_PCT }));
    const selM = isRangeSel(sel) ? `${MONTHS[sel[0]]}–${MONTHS[sel[1]]}` : sel != null ? MONTHS[sel] : null;
    const selectedLineMonths = isRangeSel(sel) ? [sel[0], sel[1]] : sel != null ? [sel] : [];
    const efficiency = pct(t.A3, t.A1);
    const lossCost = Math.max(0, t.loss) * LOSS_RATE_OMR;

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                <Kpi icon={Droplet} label="Total Supply (A1)" value={fmt(t.A1)} unit="m³" bg="var(--chart-bg-blue)" ic="#3B7ED2" sub={periodLabel} />
                <Kpi icon={Droplet} label="Distribution (A2)" value={fmt(t.A2)} unit="m³" bg="var(--chart-bg-cyan)" ic="#6B9AC4" sub="Zone bulk + direct" />
                <Kpi icon={CheckCircle2} label="Consumption (A3)" value={fmt(t.A3)} unit="m³" bg="var(--chart-bg-green)" ic="#5E8C77" sub="Billed at end-user" />
                <Kpi icon={Gauge} label="Efficiency" value={`${efficiency}%`} bg="var(--chart-bg-green)" ic="#5E8C77" sub={`Target ≥ ${100 - TARGET_LOSS_PCT}%`} />
                <Kpi icon={AlertTriangle} label="Total Loss" value={fmt(t.loss)} unit="m³" bg="var(--chart-bg-red)" ic="#B85C5C" sub={`${t.lossPct}% of supply`} delta={lossDelta} />
                <Kpi icon={FileSpreadsheet} label="Loss Cost Estimate" value={fmt(lossCost)} unit="OMR" bg="var(--chart-bg-orange)" ic="#B5703A" sub={`${LOSS_RATE_OMR} OMR / m³ assumption`} />
            </div>

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
                    <div className="flex items-center gap-3 px-4 py-2 rounded-lg" style={{ background: t.lossPct > TARGET_LOSS_PCT ? "#FBE2E2" : "#EAF3EE", border: `1px solid ${t.lossPct > TARGET_LOSS_PCT ? "#EEAEAE" : "#BFE1CD"}` }}>
                        <Target className="w-5 h-5 shrink-0" style={{ color: t.lossPct > TARGET_LOSS_PCT ? "#D12E2E" : "#5E8C77" }} />
                        <div className="leading-tight">
                            <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#4E4456" }}>Total System Loss vs 15% Target</p>
                            <p className="text-lg font-bold" style={{ color: "#4E4456" }}>{fmt(t.loss)} <span className="text-xs font-medium">m³</span> · {t.lossPct}% · {t.lossPct <= TARGET_LOSS_PCT ? "Within target" : `${(t.lossPct - TARGET_LOSS_PCT).toFixed(1)} pp above target`}</p>
                        </div>
                    </div>
                </div>
            </Panel>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
                <Panel className="h-full flex flex-col" bodyClassName="flex-1 flex flex-col" title="Monthly Supply vs Consumption vs Loss" icon={Activity} note={selM ? `Highlighted: ${selM}.` : "Full year series."}>
                    <div className="flex-1 min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={trend} margin={{ top: 6, right: 8, left: -10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--wm-track)" />
                                <XAxis dataKey="m" tick={{ fontSize: 11, fill: C.muted }} />
                                <YAxis tick={{ fontSize: 11, fill: C.muted }} />
                                <Tooltip formatter={(v, n) => [fmt(Number(v)) + (n === "target" ? "%" : " m³"), n]} contentStyle={TIP} />
                                <Legend wrapperStyle={{ fontSize: 11, color: "var(--wm-ink)" }} />
                                {selectedLineMonths.map((i) => <ReferenceLine key={i} x={MONTHS[i]} stroke={C.primary} strokeDasharray="4 4" />)}
                                <Bar dataKey="A1" name="Supply" fill={C.supply} radius={[3, 3, 0, 0]} barSize={14} />
                                <Bar dataKey="A3" name="Consumption" fill={C.cons} radius={[3, 3, 0, 0]} barSize={14} />
                                <Line dataKey="loss" name="Loss" stroke={C.loss} strokeWidth={2.5} dot={{ r: 2 }} />
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

            <Panel title="Monthly Loss %" icon={TrendingDown} note={`Loss as a share of supply, month by month. Red line = ${TARGET_LOSS_PCT}% management target.`}>
                <ResponsiveContainer width="100%" height={190}>
                    <AreaChart data={trend} margin={{ top: 6, right: 8, left: -10, bottom: 0 }}>
                        <defs><linearGradient id="wm-lg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.loss} stopOpacity={0.5} /><stop offset="100%" stopColor={C.loss} stopOpacity={0.05} /></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--wm-track)" />
                        <XAxis dataKey="m" tick={{ fontSize: 11, fill: C.muted }} />
                        <YAxis tick={{ fontSize: 11, fill: C.muted }} unit="%" />
                        <Tooltip formatter={(v) => [v + "%", "Loss"]} contentStyle={TIP} />
                        {selectedLineMonths.map((i) => <ReferenceLine key={i} x={MONTHS[i]} stroke={C.primary} strokeDasharray="4 4" />)}
                        <ReferenceLine y={TARGET_LOSS_PCT} stroke="#D12E2E" strokeDasharray="5 5" label={{ value: "15% target", position: "insideTopRight", fill: "#D12E2E", fontSize: 11 }} />
                        <Area dataKey="lossPct" stroke={C.loss} strokeWidth={2} fill="url(#wm-lg)" />
                    </AreaChart>
                </ResponsiveContainer>
            </Panel>
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
    const real = period.zones;

    const picker = (
        <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-sm font-semibold tracking-tight" style={{ color: C.heading }}>Zone</span>
            <div className="flex items-center gap-1.5 px-2.5 py-2" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: RADIUS.md }}>
                <MapPin className="w-4 h-4" style={{ color: C.muted }} />
                <select value={zoneSel} onChange={(e) => setZoneSel(e.target.value)} className="text-sm font-medium outline-none cursor-pointer" style={{ color: C.ink, background: C.card }}>
                    <option value="all">All zones (overview)</option>
                    {real.map((z) => <option key={z.zone} value={z.zone}>{z.name}</option>)}
                </select>
            </div>
            {zoneSel !== "all" && (
                <button onClick={() => setZoneSel("all")} className="text-[12px] font-semibold px-2.5 py-2" style={{ color: C.accentActive }}>← all zones</button>
            )}
        </div>
    );

    /* ---------- single-zone drill-down ---------- */
    if (zoneSel !== "all") {
        const z: ZoneRow = real.find((x) => x.zone === zoneSel) || { zone: zoneSel, bulk: 0, end: 0, loss: 0, lossPct: 0, name: zoneSel, meters: 0 };
        const s = sev(z.lossPct);
        const supply = z.bulk, cons = z.end, loss = z.loss;
        const consPct = supply ? Math.min(100, (cons / supply) * 100) : 0;
        const lossBar = supply ? Math.max(0, (loss / supply) * 100) : 0;
        const zmonthly = monthly.map((p, i) => {
            const m = p.zones.find((x) => x.zone === zoneSel);
            return { m: MONTHS[i], Supply: m ? m.bulk : 0, Consumption: m ? m.end : 0, loss: m ? m.loss : 0 };
        });
        const meters = data.meters
            .filter((m) => { const c = m.y[year]; return c && (c.label === "L3" || c.label === "L4") && c.typ !== "D_Building_Bulk" && c.zone === zoneSel; })
            .map((m) => { const c = m.y[year]; const v = periodValue(c, sel); return { name: m.name, typ: (c.typ || "").replace("Residential ", ""), val: v }; })
            .sort((a, b) => b.val - a.val);
        const blds = period.buildings.filter((b) => b.zone === z.name);
        const pctOf = (v: number) => (supply ? ((v / supply) * 100).toFixed(1) : "0.0");

        return (
            <div className="space-y-5">
                {picker}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <Kpi icon={Droplet} label="Zone Supply" value={fmt(supply)} unit="m³" bg="var(--chart-bg-blue)" ic={C.dist} sub="L2 bulk meter" />
                    <Kpi icon={CheckCircle2} label="Individual Use" value={fmt(cons)} unit="m³" bg="var(--chart-bg-green)" ic="#5E8C77" sub={`${z.meters} meters`} />
                    <Kpi icon={AlertTriangle} label="Zone Loss" value={fmt(loss)} unit="m³" bg="var(--chart-bg-red)" ic="#D12E2E" sub="supply − individual" />
                    <Kpi icon={Gauge} label="Loss %" value={`${z.lossPct}%`} bg={s.bg} ic={s.c} sub={s.label} />
                </div>

                <Panel title={`${z.name} — Supply vs Individual Consumption`} icon={Droplet}
                    note="Green is water recorded by individual meters; red is what entered the zone but no meter recorded — the loss.">
                    <div className="flex justify-between text-[11px] mb-1">
                        <span style={{ color: "#5E8C77" }}>Consumption {fmt(cons)} m³ · {Math.round(consPct)}%</span>
                        <span className="font-semibold" style={{ color: "#D12E2E" }}>Loss {fmt(loss)} m³ · {z.lossPct}%</span>
                    </div>
                    <div className="w-full h-8 rounded-md overflow-hidden flex" style={{ background: "var(--wm-track)" }}>
                        <div style={{ width: `${consPct}%`, background: C.cons }} title={`Consumption ${fmt(cons)} m³`} />
                        <div style={{ width: `${lossBar}%`, background: "#D12E2E" }} title={`Loss ${fmt(loss)} m³`} />
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
                                <Tooltip formatter={(v, n) => [fmt(Number(v)) + " m³", n]} contentStyle={TIP} />
                                <Legend wrapperStyle={{ fontSize: 11, color: "var(--wm-ink)" }} />
                                {(isRangeSel(sel) ? [sel[0], sel[1]] : sel != null ? [sel] : []).map((i) => <ReferenceLine key={i} x={MONTHS[i]} stroke={C.primary} strokeDasharray="4 4" />)}
                                <Bar dataKey="Supply" fill={C.dist} radius={[3, 3, 0, 0]} barSize={14} />
                                <Bar dataKey="Consumption" fill={C.cons} radius={[3, 3, 0, 0]} barSize={14} />
                                <Line dataKey="loss" name="Loss" stroke="#D12E2E" strokeWidth={2.5} dot={{ r: 2 }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </Panel>
                    <Panel title="Top Individual Consumers" icon={Layers} note="Largest end-user meters in this zone for the period.">
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={meters.slice(0, 10).map((m) => ({ name: m.name.length > 18 ? m.name.slice(0, 18) + "…" : m.name, val: m.val }))} layout="vertical" margin={{ top: 4, right: 30, left: 10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--wm-track)" horizontal={false} />
                                <XAxis type="number" tick={{ fontSize: 10, fill: C.muted }} />
                                <YAxis type="category" dataKey="name" tick={{ fontSize: 9.5, fill: C.ink }} width={120} />
                                <Tooltip formatter={(v) => [fmt(Number(v)) + " m³", "Consumption"]} contentStyle={TIP} />
                                <Bar dataKey="val" fill={C.cons} radius={[0, 4, 4, 0]} barSize={13} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Panel>
                </div>

                <Panel title={`Individual Meters in ${z.name} (${meters.length})`} icon={Layers} note="Zone supply = Σ individual consumption + loss.">
                    <div className="overflow-auto" style={{ maxHeight: 380 }}>
                        <table className="w-full text-[12px]">
                            <thead className="sticky top-0 z-10" style={{ background: C.primary, color: "#fff" }}>
                                <tr>
                                    <th className="text-left px-3 py-2">#</th>
                                    <th className="text-left px-2 py-2">Meter</th>
                                    <th className="text-left px-2 py-2">Type</th>
                                    <th className="text-right px-2 py-2">Consumption (m³)</th>
                                    <th className="text-right px-3 py-2">% of supply</th>
                                </tr>
                            </thead>
                            <tbody>
                                {meters.map((m, i) => (
                                    <tr key={m.name + i} style={{ background: i % 2 ? "var(--wm-zebra)" : "var(--wm-card)" }}>
                                        <td className="px-3 py-1.5" style={{ color: C.muted }}>{i + 1}</td>
                                        <td className="px-2 py-1.5 font-semibold whitespace-nowrap" style={{ color: C.ink }}>{m.name}</td>
                                        <td className="px-2 py-1.5 whitespace-nowrap" style={{ color: C.muted }}>{m.typ}</td>
                                        <td className="px-2 py-1.5 text-right" style={{ color: C.ink }}>{fmt1(m.val)}</td>
                                        <td className="px-3 py-1.5 text-right" style={{ color: C.muted }}>{pctOf(m.val)}%</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr style={{ borderTop: `2px solid ${C.border}` }}>
                                    <td colSpan={3} className="px-3 py-1.5 font-semibold" style={{ color: "#5E8C77" }}>Σ Individual consumption</td>
                                    <td className="px-2 py-1.5 text-right font-bold" style={{ color: "#5E8C77" }}>{fmt1(cons)}</td>
                                    <td className="px-3 py-1.5 text-right font-bold" style={{ color: "#5E8C77" }}>{Math.round(consPct)}%</td>
                                </tr>
                                <tr>
                                    <td colSpan={3} className="px-3 py-1.5 font-semibold" style={{ color: "#D12E2E" }}>Unaccounted (loss)</td>
                                    <td className="px-2 py-1.5 text-right font-bold" style={{ color: "#D12E2E" }}>{fmt1(loss)}</td>
                                    <td className="px-3 py-1.5 text-right font-bold" style={{ color: "#D12E2E" }}>{z.lossPct}%</td>
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

                {blds.length > 0 && (
                    <Panel title={`Building Losses in ${z.name}`} icon={Building2} note="Where a building bulk meter exceeds the sum of its apartments — likely in-building leaks or meter issues.">
                        <div className="overflow-x-auto">
                            <table className="w-full text-[12px]">
                                <thead><tr style={{ color: C.muted }} className="text-left border-b">
                                    <th className="py-2 pr-2">Building</th><th className="text-right pr-2">Bulk</th><th className="text-right pr-2">Apts</th><th className="text-right pr-2">Loss</th><th className="text-right">%</th>
                                </tr></thead>
                                <tbody>
                                    {blds.map((b) => { const bs = sev(b.lossPct); return (
                                        <tr key={b.name} className="border-b" style={{ borderColor: "var(--wm-border)" }}>
                                            <td className="py-1.5 pr-2 font-semibold" style={{ color: C.ink }}>{b.name.replace(" Building Bulk Meter", "")}</td>
                                            <td className="text-right pr-2" style={{ color: C.ink }}>{fmt(b.bulk)}</td>
                                            <td className="text-right pr-2" style={{ color: C.ink }}>{fmt(b.sub)}</td>
                                            <td className="text-right pr-2 font-medium" style={{ color: C.ink }}>{fmt(b.loss)}</td>
                                            <td className="text-right font-bold" style={{ color: bs.c }}>{b.lossPct}%</td>
                                        </tr>); })}
                                </tbody>
                            </table>
                        </div>
                    </Panel>
                )}
            </div>
        );
    }

    /* ---------- all-zones overview ---------- */
    const bar = real.map((z) => ({ name: z.name, lossPct: z.lossPct, loss: z.loss, fill: sev(z.lossPct).c }));
    const heat = real.map((z) => ({
        zone: z.zone, name: z.name, yr: z.lossPct,
        months: monthly.map((p) => { const m = p.zones.find((x) => x.zone === z.zone); return m ? m.lossPct : 0; }),
        lossM: monthly.map((p) => { const m = p.zones.find((x) => x.zone === z.zone); return m ? m.loss : 0; }),
    }));

    return (
        <div className="space-y-5">
            {picker}
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
                        <button key={z.zone} onClick={() => setZoneSel(z.zone)} className="text-left p-4 transition-all hover:shadow-md"
                            style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: RADIUS.card, borderLeft: `4px solid ${s.c}`, boxShadow: SHADOW }}>
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
                                <div className="h-2 rounded-full" style={{ width: `${Math.min(100, Math.max(0, z.lossPct))}%`, background: s.c }} />
                            </div>
                        </button>
                    );
                })}
            </div>

            <Panel title="Zone Loss % — Monthly Heatmap" icon={Gauge} note="Each cell is one month's loss for that zone. Redder = worse. Selected month is ringed.">
                <div className="overflow-x-auto">
                    <table className="w-full text-[11px] border-collapse">
                        <thead>
                            <tr>
                                <th className="text-left px-2 py-1.5 sticky left-0" style={{ color: C.muted, background: C.card }}>Zone</th>
                                {MONTHS.slice(0, nMonths).map((m, i) => (
                                    <th key={m} className="px-1.5 py-1.5 text-center font-semibold" style={{ color: monthInSelection(sel, i) ? C.primary : C.muted, textDecoration: monthInSelection(sel, i) ? "underline" : "none" }}>{m}</th>
                                ))}
                                <th className="px-2 py-1.5 text-center" style={{ color: C.muted }}>Yr</th>
                            </tr>
                        </thead>
                        <tbody>
                            {heat.map((z) => (
                                <tr key={z.zone}>
                                    <td className="px-2 py-1 font-semibold sticky left-0 whitespace-nowrap" style={{ color: C.ink, background: C.card }}>{z.name}</td>
                                    {z.months.map((lp, i) => {
                                        const s = sev(lp);
                                        return (
                                            <td key={i} className="text-center px-1.5 py-1 font-medium" title={`${MONTHS[i]}: ${fmt(z.lossM[i])} m³`}
                                                style={{ background: s.bg, color: s.c, borderRadius: 4, outline: monthInSelection(sel, i) ? `2px solid ${C.primary}` : "none", outlineOffset: -1 }}>{lp}</td>
                                        );
                                    })}
                                    <td className="text-center px-2 py-1 font-bold" style={{ color: sev(z.yr).c }}>{z.yr}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Panel>
        </div>
    );
}

/* ================= BUILDINGS / DIRECT / COMMON ================= */
function AssetsView({ period }: { period: PeriodResult }) {
    const topB = period.buildings.slice(0, 12);
    const dcs = period.dcs;
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Panel title="Buildings, Direct & Common Connections — Building Losses" icon={Building2} note="Building bulk meter minus the sum of its apartment meters.">
                <div className="overflow-x-auto">
                    <table className="w-full text-[12px]">
                        <thead><tr style={{ color: C.muted }} className="text-left border-b">
                            <th className="py-2 pr-2">Building</th><th className="pr-2">Zone</th><th className="text-right pr-2">Bulk</th><th className="text-right pr-2">Apts</th><th className="text-right pr-2">Loss</th><th className="text-right">%</th>
                        </tr></thead>
                        <tbody>
                            {topB.length === 0 && <tr><td colSpan={6} className="py-3 text-center" style={{ color: C.muted }}>No building data for this period.</td></tr>}
                            {topB.map((b) => { const s = sev(b.lossPct); return (
                                <tr key={b.name} className="border-b" style={{ borderColor: "var(--wm-border)" }}>
                                    <td className="py-1.5 pr-2 font-semibold" style={{ color: C.ink }}>{b.name.replace(" Building Bulk Meter", "")}</td>
                                    <td className="pr-2" style={{ color: C.muted }}>{b.zone}</td>
                                    <td className="text-right pr-2" style={{ color: C.ink }}>{fmt(b.bulk)}</td><td className="text-right pr-2" style={{ color: C.ink }}>{fmt(b.sub)}</td>
                                    <td className="text-right pr-2 font-medium" style={{ color: C.ink }}>{fmt(b.loss)}</td><td className="text-right font-bold" style={{ color: s.c }}>{b.lossPct}%</td>
                                </tr>); })}
                        </tbody>
                    </table>
                </div>
            </Panel>
            <Panel title="Direct Connections" icon={Plug} note="Meters fed straight from the main inlet, bypassing the zones.">
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dcs.slice(0, 10).map((d) => ({ name: d.name.length > 24 ? d.name.slice(0, 24) + "…" : d.name, total: d.total }))} layout="vertical" margin={{ top: 4, right: 30, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--wm-track)" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 10, fill: C.muted }} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 9.5, fill: C.ink }} width={140} />
                        <Tooltip formatter={(v) => [fmt(Number(v)) + " m³", "Consumption"]} contentStyle={TIP} />
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

    const yearMeters = useMemo(() => data.meters.filter((m) => m.y[year]).map((m) => {
        const c = m.y[year];
        const shown = periodValue(c, sel);
        const avg = c.vals?.length ? c.vals.reduce((a, b) => a + (Number(b) || 0), 0) / c.vals.length : 0;
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
        .sort((a, b) => b.shown - a.shown), [yearMeters, zone, level, typ, q]);

    const exportData = rows.map((m) => ({
        Meter: m.name,
        Account: m.acct,
        Zone: m.zoneName,
        Level: m.label,
        Type: m.typ,
        Total_m3: fmt1(m.total),
        Selected_m3: fmt1(m.shown),
        Flags: m.flags,
        Last_Updated: m.lastUpdated,
        ...Object.fromEntries(MONTHS.slice(0, nMonths).map((mo, i) => [mo, m.vals[i] ?? ""])),
    }));

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-2" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 7 }}>
                    <Search className="w-4 h-4" style={{ color: C.muted }} />
                    <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search meter name or account number…" className="text-sm outline-none w-64" style={{ background: "transparent", color: C.ink }} />
                </div>
                <Select icon={MapPin} value={zone} setValue={setZone} options={zoneOpts} />
                <Select icon={Filter} value={level} setValue={setLevel} options={levelOpts} />
                <Select icon={Layers} value={typ} setValue={setTyp} options={typeOpts} />
                <button onClick={() => downloadRows(exportData, `water-meter-explorer-${year}.csv`)} className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold" style={{ background: C.primary, color: "#fff", borderRadius: RADIUS.md }}><Download className="w-4 h-4" />Export CSV</button>
                <button onClick={() => downloadRows(exportData, `water-meter-explorer-${year}-excel.csv`)} className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold" style={{ background: C.accent, color: C.primary, borderRadius: RADIUS.md }}><FileSpreadsheet className="w-4 h-4" />Excel-ready</button>
                <span className="text-[12px] ml-auto font-medium" style={{ color: C.muted }}>
                    {rows.length} meters · {sel == null ? "period total" : isRangeSel(sel) ? `${MONTHS[sel[0]]}–${MONTHS[sel[1]]} highlighted` : `${MONTHS[sel]} highlighted`}
                </span>
            </div>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: RADIUS.card, boxShadow: SHADOW }} className="overflow-hidden">
                <div className="overflow-auto" style={{ maxHeight: 600 }}>
                    <table className="text-[11px] border-collapse w-full">
                        <thead className="sticky top-0 z-10" style={{ background: C.primary, color: "#fff" }}>
                            <tr>
                                <th className="text-left px-3 py-2 sticky left-0" style={{ background: C.primary }}>Meter</th>
                                <th className="px-2 py-2 text-left">Account</th>
                                <th className="px-2 py-2 text-left">Zone</th><th className="px-2 py-2">Lvl</th><th className="px-2 py-2 text-left">Type</th>
                                <th className="px-2 py-2 text-right">Selected</th><th className="px-2 py-2 text-left">Flag</th><th className="px-2 py-2 text-left">Last update</th>
                                {MONTHS.slice(0, nMonths).map((m, i) => (<th key={m} className="px-2 py-2 text-right" style={{ background: monthInSelection(sel, i) ? C.accent : C.primary, color: monthInSelection(sel, i) ? C.primary : "#fff" }}>{m}</th>))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((m, i) => {
                                const lvlc = ({ L1: "#3B7ED2", L2: "#6B9AC4", L3: "#4D445D", L4: "#9B86A8", DC: "#DF9A5B" } as Record<string, string>)[m.label] || "#6B7280";
                                const isAlert = m.flags !== "Normal";
                                const bgr = i % 2 ? "var(--wm-zebra)" : "var(--wm-card)";
                                return (
                                    <tr key={m.acct + i} style={{ background: bgr }}>
                                        <td className="px-3 py-1.5 font-semibold whitespace-nowrap sticky left-0" style={{ color: C.ink, background: bgr }}>{m.name}</td>
                                        <td className="px-2 py-1.5 whitespace-nowrap font-mono" style={{ color: C.muted }}>{m.acct}</td>
                                        <td className="px-2 py-1.5 whitespace-nowrap" style={{ color: C.muted }}>{m.zoneName}</td>
                                        <td className="px-2 py-1.5 text-center"><span className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white" style={{ background: lvlc }}>{m.label}</span></td>
                                        <td className="px-2 py-1.5 whitespace-nowrap" style={{ color: C.muted }}>{(m.typ || "").replace("Residential ", "")}</td>
                                        <td className="px-2 py-1.5 text-right font-bold" style={{ color: C.ink }}>{fmt1(m.shown)}</td>
                                        <td className="px-2 py-1.5 whitespace-nowrap"><span className="px-2 py-0.5 rounded-full font-semibold" style={{ background: isAlert ? "#FDECEC" : "#EAF3EE", color: isAlert ? "#B85C5C" : "#5E8C77" }}>{m.flags}</span></td>
                                        <td className="px-2 py-1.5 whitespace-nowrap" style={{ color: C.muted }}>{m.lastUpdated}</td>
                                        {m.vals.map((v, j) => (<td key={j} className="px-2 py-1.5 text-right" style={{ color: v ? C.ink : "#CBD5E1", background: monthInSelection(sel, j) ? "rgba(161,209,213,0.22)" : "transparent", fontWeight: monthInSelection(sel, j) ? 700 : 400 }}>{v ? fmt1(v) : "·"}</td>))}
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

/* ================= EXCEPTIONS & ACTIONS ================= */
interface ExceptionRow {
    Category: string;
    Item: string;
    Severity: string;
    Value: string;
    Owner: string;
    Status: string;
    Remarks: string;
    /** All columns are strings; the index signature lets rows feed `downloadRows`. */
    [key: string]: string;
}
function ExceptionsView({ data, year, sel, period }: { data: WaterData; year: string; sel: Sel; period: PeriodResult }) {
    const rows = useMemo<ExceptionRow[]>(() => {
        const out: ExceptionRow[] = [];
        period.zones.filter((z) => z.lossPct > TARGET_LOSS_PCT).forEach((z) => out.push({
            Category: "High-loss zone", Item: z.name, Severity: statusFromLoss(z.lossPct).label, Value: `${z.lossPct}% · ${fmt(z.loss)} m³`, Owner: "O&M / FM", Status: z.lossPct > 25 ? "Open" : "Watch", Remarks: actionFromLoss(z.lossPct),
        }));
        period.buildings.filter((b) => b.lossPct > TARGET_LOSS_PCT && b.loss > 0).slice(0, 12).forEach((b) => out.push({
            Category: "High-loss building", Item: b.name.replace(" Building Bulk Meter", ""), Severity: statusFromLoss(b.lossPct).label, Value: `${b.lossPct}% · ${fmt(b.loss)} m³`, Owner: "FM / Building team", Status: b.lossPct > 25 ? "Open" : "Watch", Remarks: "Compare bulk meter with apartment meters; inspect common area leakage.",
        }));
        data.meters.forEach((m) => {
            const c = m.y[year]; if (!c || c.label === "N/A") return;
            const shown = periodValue(c, sel);
            const avg = c.vals?.length ? c.vals.reduce((a, b) => a + (Number(b) || 0), 0) / c.vals.length : 0;
            const flags = meterFlags(c, shown, avg).filter((f) => f !== "Normal");
            flags.forEach((f) => out.push({
                Category: f, Item: `${m.name} (${m.acct})`, Severity: f.includes("Negative") || f.includes("Missing") || f.includes("spike") ? "Critical" : "Watch", Value: `${fmt1(shown)} m³`, Owner: ["L1", "L2"].includes(c.label) ? "O&M / NAMA check" : "FM / Meter reader", Status: "Open", Remarks: f.includes("spike") ? "Verify reading/photo and inspect for leak." : f.includes("Zero") ? "Check occupancy, valve status, and meter operation." : "Validate source reading before billing/reporting.",
            }));
        });
        period.zones.filter((z) => Math.abs(z.bulk - z.end) > 0 && z.lossPct > TARGET_LOSS_PCT).slice(0, 8).forEach((z) => out.push({
            Category: "Bulk/individual mismatch", Item: z.name, Severity: statusFromLoss(z.lossPct).label, Value: `${fmt(z.bulk)} − ${fmt(z.end)} = ${fmt(z.loss)} m³`, Owner: "O&M analyst", Status: "Open", Remarks: "Reconcile L2 bulk vs L3/L4 total; check missing meters and physical leakage.",
        }));
        return out.sort((a, b) => (a.Severity === "Critical" ? 0 : 1) - (b.Severity === "Critical" ? 0 : 1));
    }, [data, year, sel, period]);

    const critical = rows.filter((r) => r.Severity === "Critical").length;
    const watch = rows.filter((r) => r.Severity === "Watch").length;

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Kpi icon={ClipboardList} label="Open Exceptions" value={rows.length} bg="var(--chart-bg-purple)" ic="#4D445D" sub="Auto-generated from selected period" />
                <Kpi icon={XCircle} label="Critical" value={critical} bg="var(--chart-bg-red)" ic="#B85C5C" sub="Immediate validation/action" />
                <Kpi icon={AlertTriangle} label="Watch" value={watch} bg="var(--chart-bg-orange)" ic="#B5703A" sub="Monitor or verify" />
            </div>
            <Panel title="Exceptions & Actions Register" icon={ClipboardList} note="Operational action queue: high-loss zones/buildings, zero readings, sudden spikes, negative values, missing readings and reconciliation mismatches.">
                <div className="flex justify-end mb-2">
                    <button onClick={() => downloadRows(rows, `water-exceptions-actions-${year}.csv`)} className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold" style={{ background: C.primary, color: "#fff", borderRadius: RADIUS.md }}><Download className="w-4 h-4" />Export Actions</button>
                </div>
                <div className="overflow-auto" style={{ maxHeight: 560 }}>
                    <table className="w-full text-[12px]">
                        <thead className="sticky top-0 z-10" style={{ background: C.primary, color: "#fff" }}>
                            <tr><th className="text-left px-3 py-2">Category</th><th className="text-left px-2 py-2">Item</th><th className="text-left px-2 py-2">Severity</th><th className="text-right px-2 py-2">Value</th><th className="text-left px-2 py-2">Owner</th><th className="text-left px-2 py-2">Status</th><th className="text-left px-3 py-2">Remarks / Suggested Action</th></tr>
                        </thead>
                        <tbody>
                            {rows.map((r, i) => { const st = r.Severity === "Critical" ? { c: "#B85C5C", bg: "#F7E4E4" } : r.Severity === "Watch" ? { c: "#9A7B1F", bg: "#FBF3DD" } : { c: "#5E8C77", bg: "#EAF3EE" }; return (
                                <tr key={i} style={{ background: i % 2 ? "var(--wm-zebra)" : "var(--wm-card)" }}>
                                    <td className="px-3 py-1.5 font-semibold" style={{ color: C.ink }}>{r.Category}</td>
                                    <td className="px-2 py-1.5" style={{ color: C.ink }}>{r.Item}</td>
                                    <td className="px-2 py-1.5"><span className="px-2 py-0.5 rounded-full text-[11px] font-bold" style={{ background: st.bg, color: st.c }}>{r.Severity}</span></td>
                                    <td className="px-2 py-1.5 text-right font-mono" style={{ color: C.ink }}>{r.Value}</td>
                                    <td className="px-2 py-1.5" style={{ color: C.muted }}>{r.Owner}</td>
                                    <td className="px-2 py-1.5"><span className="px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ background: "var(--wm-comp)", color: C.heading }}>{r.Status}</span></td>
                                    <td className="px-3 py-1.5" style={{ color: C.muted }}>{r.Remarks}</td>
                                </tr>
                            );})}
                            {!rows.length && <tr><td colSpan={7} className="text-center py-6" style={{ color: C.muted }}>No exceptions detected for the selected period.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </Panel>
        </div>
    );
}

/* ================= ROOT ================= */
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

    const anomaly = singleMonthSelection && (period.A1 <= 0 || period.lossPct < 0 || period.lossPct > 100);

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
                <div className="flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg" style={{ background: "#FDECEC", color: "#B23B3B", border: "1px solid #F5C2C2" }}>
                    <AlertTriangle className="w-4 h-4 shrink-0" /> {MONTHS[safeStart]} {year} contains source billing adjustments (estimate/reset), so this month&apos;s balance isn&apos;t reliable — use Year-to-date for an accurate figure.
                </div>
            )}
            {partial && periodSel == null && (
                <div className="flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg" style={{ background: "#FEFCE8", color: "#854D0E", border: "1px solid #FDE68A" }}>
                    <AlertTriangle className="w-4 h-4" /> {year} has {nMonths} months of data. Showing year-to-date — use the date range control to narrow the view.
                </div>
            )}

            {tab === "overview" && <Overview data={data} period={period} monthly={monthly} sel={periodSel} year={year} nMonths={nMonths} lossDelta={lossDelta} periodLabel={periodLabel} />}
            {tab === "zones" && <ZonesView data={data} period={period} monthly={monthly} sel={periodSel} nMonths={nMonths} year={year} />}
            {tab === "assets" && <AssetsView period={period} />}
            {tab === "meters" && <MetersView data={data} year={year} sel={periodSel} nMonths={nMonths} />}
            {tab === "exceptions" && <ExceptionsView data={data} year={year} sel={periodSel} period={period} />}

            <footer className="pt-2 text-[11px]" style={{ color: "var(--wm-muted)" }}>
                Water balance — <b>A1</b> Main Bulk (NAMA L1) → <b>A2</b> Zone Bulk + Direct Connections (L2 + DC) → <b>A3</b> Individual meters + DC
                (L3/L4, building bulks excluded to avoid double-counting). TSE irrigation excluded. Stage 1 loss = A1−A2 (trunk main); Stage 2 loss = A2−A3 (distribution &amp; in-building).
            </footer>
        </div>
    );
}

export default WaterMonthlyDashboard;
