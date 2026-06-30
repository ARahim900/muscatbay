"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
    AlertTriangle,
    ArrowRight,
    BarChart3,
    Building2,
    CalendarDays,
    Database,
    Droplet,
    Gauge,
    Loader2,
    RefreshCw,
    Target,
    TrendingDown,
    type LucideIcon,
} from "lucide-react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    ComposedChart,
    Legend,
    Line,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getSupabaseClient } from "@/lib/supabase";
import { findLatestMonthWithData, getDynamicMonths, type WaterMeter } from "@/lib/water-data";
import {
    buildMonthlyData,
    computePeriod,
    fmt,
    LOSS_RATE_OMR,
    MONTHS,
    pct,
    TARGET_LOSS_PCT,
    type PeriodResult,
    type ZoneRow,
} from "@/lib/water-monthly-data";
import { DAILY_WATER_CONSUMPTION_SELECT_COLUMNS, type SupabaseDailyWaterConsumption } from "@/entities/water";
import { processReport, type ReportData } from "@/components/water/daily-report/inline-shared";

const BRAND = {
    primary: "#4E4456",
    accent: "#81D8D0",
    softAccent: "rgba(129, 216, 208, 0.16)",
    loss: "#B85C5C",
    warning: "#B5703A",
    muted: "var(--muted-foreground)",
    border: "var(--border)",
} as const;

const TARGET_EFFICIENCY = 100 - TARGET_LOSS_PCT;

type DailyState =
    | { status: "loading"; month: string | null; day: number | null; rows: SupabaseDailyWaterConsumption[]; report: null; error: null }
    | { status: "success"; month: string; day: number; rows: SupabaseDailyWaterConsumption[]; report: ReportData; error: null }
    | { status: "empty"; month: string | null; day: number | null; rows: SupabaseDailyWaterConsumption[]; report: null; error: null }
    | { status: "error"; month: string | null; day: number | null; rows: SupabaseDailyWaterConsumption[]; report: null; error: string };

interface WaterManagementDashboardProps {
    waterMeters: WaterMeter[];
}

interface KpiProps {
    label: string;
    value: ReactNode;
    unit?: string;
    caption: ReactNode;
    icon: LucideIcon;
    tone?: "normal" | "warning" | "critical" | "accent";
}

function kpiTone(tone: KpiProps["tone"]): { border: string; bg: string; icon: string } {
    if (tone === "critical") return { border: BRAND.loss, bg: "rgba(184, 92, 92, 0.12)", icon: BRAND.loss };
    if (tone === "warning") return { border: BRAND.warning, bg: "rgba(181, 112, 58, 0.12)", icon: BRAND.warning };
    if (tone === "accent") return { border: BRAND.accent, bg: BRAND.softAccent, icon: BRAND.primary };
    return { border: BRAND.primary, bg: "rgba(78, 68, 86, 0.08)", icon: BRAND.primary };
}

function KpiCard({ label, value, unit, caption, icon: Icon, tone = "normal" }: KpiProps) {
    const t = kpiTone(tone);
    return (
        <Card className="card-elevated overflow-hidden">
            <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
                        <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground tabular-nums">
                            {value}{unit && <span className="ml-1 text-xs font-medium text-muted-foreground">{unit}</span>}
                        </p>
                    </div>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: t.bg, color: t.icon }}>
                        <Icon className="h-5 w-5" />
                    </div>
                </div>
                <div className="mt-3 border-l-4 pl-3 text-[11px] leading-4 text-muted-foreground" style={{ borderColor: t.border }}>
                    {caption}
                </div>
            </CardContent>
        </Card>
    );
}

function Panel({ title, description, icon: Icon, right, children }: { title: string; description?: string; icon: LucideIcon; right?: ReactNode; children: ReactNode }) {
    return (
        <Card className="card-elevated">
            <CardContent className="p-4 sm:p-5">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: BRAND.softAccent, color: BRAND.primary }}>
                            <Icon className="h-4 w-4" />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold tracking-tight text-foreground">{title}</h3>
                            {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
                        </div>
                    </div>
                    {right}
                </div>
                {children}
            </CardContent>
        </Card>
    );
}

function WaterStep({ title, value, caption }: { title: string; value: number; caption: string }) {
    return (
        <div className="min-w-[160px] flex-1 rounded-2xl border border-border bg-background/70 p-4 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
            <p className="mt-1 text-xl font-bold text-foreground tabular-nums">{fmt(value)} <span className="text-xs font-medium text-muted-foreground">m³</span></p>
            <p className="mt-1 text-[11px] text-muted-foreground">{caption}</p>
        </div>
    );
}

function BalanceArrow({ label, value, total }: { label: string; value: number; total: number }) {
    const ratio = total ? Math.abs((value / total) * 100) : 0;
    const colour = value > 0 ? BRAND.loss : value < 0 ? BRAND.warning : BRAND.accent;
    return (
        <div className="flex shrink-0 flex-col items-center justify-center px-1">
            <ArrowRight className="hidden h-5 w-5 text-muted-foreground sm:block" />
            <div className="mt-2 rounded-xl border px-3 py-2 text-center" style={{ borderColor: colour, background: `color-mix(in srgb, ${colour} 12%, transparent)` }}>
                <p className="whitespace-nowrap text-sm font-bold tabular-nums" style={{ color: colour }}>{fmt(value)} m³</p>
                <p className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-wide" style={{ color: colour }}>{label} · {ratio.toFixed(1)}%</p>
            </div>
        </div>
    );
}

function statusLabel(lossPct: number | null): { label: string; tone: KpiProps["tone"] } {
    if (lossPct == null || Number.isNaN(lossPct)) return { label: "No data", tone: "warning" };
    if (lossPct < 0) return { label: "Check data", tone: "warning" };
    if (lossPct <= TARGET_LOSS_PCT) return { label: "Within target", tone: "accent" };
    if (lossPct <= 25) return { label: "Watch", tone: "warning" };
    return { label: "Critical", tone: "critical" };
}

function valueFromDay(row: SupabaseDailyWaterConsumption, day: number): number | null {
    const key = `day_${day}` as keyof SupabaseDailyWaterConsumption;
    const raw = row[key];
    if (raw === null || raw === undefined) return null;
    const numeric = Number(raw);
    return Number.isFinite(numeric) ? numeric : null;
}

function latestPopulatedDay(rows: SupabaseDailyWaterConsumption[]): number | null {
    for (let day = 31; day >= 1; day -= 1) {
        if (rows.some((row) => valueFromDay(row, day) !== null)) return day;
    }
    return null;
}

function reportForDay(rows: SupabaseDailyWaterConsumption[], day: number): ReportData {
    const readings: Record<string, number | null> = {};
    for (const row of rows) readings[row.account_number] = valueFromDay(row, day);
    return processReport(readings);
}

function money(v: number): string {
    return Math.round(v).toLocaleString("en-GB");
}

function decimal(v: number | null | undefined): string {
    if (v == null || Number.isNaN(v)) return "—";
    return v.toFixed(1);
}

function tooltipM3(value: unknown, name: unknown): [string, string] {
    return [`${fmt(Number(value))} m³`, String(name)];
}

function tooltipPct(value: unknown, name: unknown): [string, string] {
    return [`${decimal(Number(value))}%`, String(name)];
}

export function WaterManagementDashboard({ waterMeters }: WaterManagementDashboardProps) {
    const monthlyData = useMemo(() => buildMonthlyData(waterMeters), [waterMeters]);
    const latestYear = monthlyData.meta.years.length ? String(monthlyData.meta.years[monthlyData.meta.years.length - 1]) : "";
    const nMonths = latestYear ? monthlyData.meta.monthsWithData[latestYear] ?? 0 : 0;
    const latestMonthIndex = Math.max(0, nMonths - 1);

    const monthly = useMemo<PeriodResult[]>(
        () => (latestYear && nMonths ? Array.from({ length: nMonths }, (_, i) => computePeriod(monthlyData, latestYear, i)) : []),
        [monthlyData, latestYear, nMonths],
    );

    const latestMonth = useMemo<PeriodResult>(() => {
        if (!latestYear) return computePeriod(monthlyData, "", null);
        return nMonths ? computePeriod(monthlyData, latestYear, latestMonthIndex) : computePeriod(monthlyData, latestYear, null);
    }, [monthlyData, latestYear, latestMonthIndex, nMonths]);

    const ytd = useMemo<PeriodResult>(() => (latestYear ? computePeriod(monthlyData, latestYear, null) : computePeriod(monthlyData, "", null)), [monthlyData, latestYear]);

    const [daily, setDaily] = useState<DailyState>({ status: "loading", month: null, day: null, rows: [], report: null, error: null });

    const monthHasData = useCallback(async (month: string): Promise<boolean> => {
        const client = getSupabaseClient();
        if (!client) return false;
        const { count, error } = await client
            .from("water_daily_consumption")
            .select("id", { count: "exact", head: true })
            .eq("month", month);
        if (error) throw new Error(error.message);
        return (count ?? 0) > 0;
    }, []);

    const fetchDailySnapshot = useCallback(async () => {
        setDaily((current) => ({ status: "loading", month: current.month, day: current.day, rows: current.rows, report: null, error: null }));
        try {
            const client = getSupabaseClient();
            if (!client) throw new Error("Supabase is not configured.");

            const latestDailyMonth = await findLatestMonthWithData(getDynamicMonths(), monthHasData);
            if (!latestDailyMonth) {
                setDaily({ status: "empty", month: null, day: null, rows: [], report: null, error: null });
                return;
            }

            const { data, error } = await client
                .from("water_daily_consumption")
                .select(DAILY_WATER_CONSUMPTION_SELECT_COLUMNS)
                .eq("month", latestDailyMonth);

            if (error) throw new Error(error.message);

            const rows = (data ?? []) as unknown as SupabaseDailyWaterConsumption[];
            const day = latestPopulatedDay(rows);
            if (!rows.length || day == null) {
                setDaily({ status: "empty", month: latestDailyMonth, day: null, rows, report: null, error: null });
                return;
            }

            setDaily({ status: "success", month: latestDailyMonth, day, rows, report: reportForDay(rows, day), error: null });
        } catch (error) {
            setDaily({ status: "error", month: null, day: null, rows: [], report: null, error: error instanceof Error ? error.message : String(error) });
        }
    }, [monthHasData]);

    useEffect(() => {
        void fetchDailySnapshot();
    }, [fetchDailySnapshot]);

    const monthlyTrend = useMemo(
        () => monthly.map((p, i) => ({ month: MONTHS[i], supply: p.A1, consumption: p.A3, loss: p.loss, lossPct: p.lossPct, target: TARGET_LOSS_PCT })),
        [monthly],
    );

    const dailyZoneRows = useMemo(() => {
        if (daily.status !== "success") return [];
        return daily.report.zoneRows.map((z) => {
            const loss = z.diff ?? 0;
            const lossPct = z.l2Value ? (loss / z.l2Value) * 100 : 0;
            return {
                name: z.zoneName,
                supply: z.l2Value ?? 0,
                consumption: z.l3Sum,
                loss,
                lossPct: Number(lossPct.toFixed(1)),
            };
        }).sort((a, b) => b.loss - a.loss);
    }, [daily]);

    const ytdZones = useMemo<ZoneRow[]>(() => [...ytd.zones].sort((a, b) => b.loss - a.loss), [ytd.zones]);
    const worstZone = ytdZones[0];
    const bestZone = useMemo(() => [...ytd.zones].filter((z) => z.bulk > 0).sort((a, b) => a.lossPct - b.lossPct)[0], [ytd.zones]);
    const topBuilding = ytd.buildings[0];
    const efficiency = pct(ytd.A3, ytd.A1);
    const monthlyStatus = statusLabel(ytd.lossPct);
    const monthlyLossCost = Math.max(0, ytd.loss) * LOSS_RATE_OMR;

    const dailyLoss = daily.status === "success" ? daily.report.l2Total - daily.report.l3Total : null;
    const dailyLossPct = daily.status === "success" && daily.report.l2Total ? ((daily.report.l2Total - daily.report.l3Total) / daily.report.l2Total) * 100 : null;
    const dailyConsumption = daily.status === "success" ? daily.report.l3Total + daily.report.dcTotal : null;
    const missingDailyReadings = daily.status === "success"
        ? daily.rows.filter((row) => row.label !== "N/A" && daily.day != null && valueFromDay(row, daily.day) === null).length
        : null;
    const dailyStatus = statusLabel(dailyLossPct);

    const monthCaption = latestYear && nMonths ? `${MONTHS[latestMonthIndex]} ${latestYear}` : "No monthly data";
    const ytdCaption = latestYear && nMonths ? `Jan–${MONTHS[latestMonthIndex]} ${latestYear}` : "No monthly data";
    const dailyCaption = daily.status === "success" ? `Day ${daily.day} · ${daily.month}` : daily.status === "loading" ? "Loading latest daily data" : "No daily snapshot";

    return (
        <div className="space-y-5 motion-safe:animate-in motion-safe:fade-in duration-200">
            <Card className="card-elevated overflow-hidden">
                <CardContent className="p-5 sm:p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1 text-xs font-semibold text-muted-foreground">
                                <Target className="h-3.5 w-3.5" /> Senior management view
                            </div>
                            <h2 className="text-2xl font-semibold tracking-tight text-foreground">Water consumption, losses and discrepancies</h2>
                            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
                                Combines the latest daily meter snapshot with monthly water balance: water entering the zones, measured consumption, unaccounted difference, efficiency and estimated loss cost in OMR.
                            </p>
                        </div>
                        <Button variant="outline" onClick={fetchDailySnapshot} disabled={daily.status === "loading"} className="w-full shrink-0 sm:w-auto">
                            {daily.status === "loading" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                            Refresh daily snapshot
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
                <KpiCard icon={Droplet} label="YTD Main Input" value={fmt(ytd.A1)} unit="m³" tone="accent" caption={ytdCaption} />
                <KpiCard icon={Gauge} label="YTD Consumption" value={fmt(ytd.A3)} unit="m³" tone="normal" caption="End-user meters plus direct connections" />
                <KpiCard icon={TrendingDown} label="YTD Loss" value={fmt(ytd.loss)} unit="m³" tone={monthlyStatus.tone} caption={`${decimal(ytd.lossPct)}% · ${monthlyStatus.label}`} />
                <KpiCard icon={Target} label="Efficiency" value={`${decimal(efficiency)}%`} tone={efficiency >= TARGET_EFFICIENCY ? "accent" : "warning"} caption={`Target ≥ ${TARGET_EFFICIENCY}%`} />
                <KpiCard icon={AlertTriangle} label="Loss Cost" value={money(monthlyLossCost)} unit="OMR" tone={monthlyStatus.tone} caption={`${LOSS_RATE_OMR} OMR/m³ estimate`} />
                <KpiCard icon={Database} label="Missing Daily" value={missingDailyReadings ?? "—"} tone={(missingDailyReadings ?? 0) > 0 ? "warning" : "accent"} caption={dailyCaption} />
            </div>

            <Panel title="Management water balance" icon={Gauge} description={`Latest monthly balance: ${monthCaption}. YTD balance: ${ytdCaption}.`}>
                <div className="flex flex-col items-stretch gap-3 overflow-x-auto sm:flex-row sm:items-center">
                    <WaterStep title="Main input" value={latestMonth.A1} caption="L1 NAMA bulk meter" />
                    <BalanceArrow label="trunk gap" value={latestMonth.stage1} total={latestMonth.A1} />
                    <WaterStep title="Distributed" value={latestMonth.A2} caption="L2 zone bulk + direct" />
                    <BalanceArrow label="usage gap" value={latestMonth.stage2} total={latestMonth.A1} />
                    <WaterStep title="Measured use" value={latestMonth.A3} caption="end-user consumption" />
                </div>
            </Panel>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                <Panel title="Monthly input vs consumption vs loss" icon={BarChart3} description="Shows whether the gap is reducing or increasing month by month.">
                    <div className="h-[330px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={monthlyTrend} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                                <Tooltip formatter={tooltipM3} contentStyle={{ borderRadius: 10, border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)" }} />
                                <Legend wrapperStyle={{ fontSize: 11 }} />
                                <Bar dataKey="supply" name="Input" fill={BRAND.primary} radius={[4, 4, 0, 0]} barSize={16} />
                                <Bar dataKey="consumption" name="Consumption" fill={BRAND.accent} radius={[4, 4, 0, 0]} barSize={16} />
                                <Line dataKey="loss" name="Loss" stroke={BRAND.loss} strokeWidth={2.5} dot={{ r: 2 }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </Panel>

                <Panel title="Latest daily zone discrepancy" icon={CalendarDays} description="Daily difference between zone bulk input and total L3 consumption.">
                    {daily.status === "loading" && (
                        <div className="flex h-[330px] items-center justify-center text-sm text-muted-foreground">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading latest daily data…
                        </div>
                    )}
                    {daily.status === "error" && (
                        <div className="flex h-[330px] items-center justify-center rounded-xl border border-border bg-background/60 p-4 text-center text-sm text-muted-foreground">
                            Could not load daily data: {daily.error}
                        </div>
                    )}
                    {daily.status === "empty" && (
                        <div className="flex h-[330px] items-center justify-center rounded-xl border border-border bg-background/60 p-4 text-center text-sm text-muted-foreground">
                            No populated daily consumption month was found.
                        </div>
                    )}
                    {daily.status === "success" && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                                <KpiCard icon={Droplet} label="Daily Input" value={fmt(daily.report.grandTotal)} unit="m³" tone="accent" caption={dailyCaption} />
                                <KpiCard icon={Gauge} label="Daily Usage" value={fmt(dailyConsumption)} unit="m³" caption="L3 usage + direct" />
                                <KpiCard icon={TrendingDown} label="Daily Gap" value={fmt(dailyLoss)} unit="m³" tone={dailyStatus.tone} caption={`${decimal(dailyLossPct)}% · ${dailyStatus.label}`} />
                                <KpiCard icon={AlertTriangle} label="Zone Alarms" value={daily.report.zoneRows.filter((z) => z.isHighLoss).length} tone={daily.report.zoneRows.some((z) => z.isHighLoss) ? "critical" : "accent"} caption="Daily zones above threshold" />
                            </div>
                            <div className="h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={dailyZoneRows} layout="vertical" margin={{ top: 4, right: 28, left: 18, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                                        <XAxis type="number" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                                        <YAxis type="category" dataKey="name" width={105} tick={{ fontSize: 11, fill: "var(--foreground)" }} />
                                        <Tooltip formatter={tooltipM3} contentStyle={{ borderRadius: 10, border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)" }} />
                                        <Bar dataKey="loss" name="Daily gap" radius={[0, 4, 4, 0]} barSize={18}>
                                            {dailyZoneRows.map((row) => <Cell key={row.name} fill={row.loss > 20 ? BRAND.loss : row.loss > 0 ? BRAND.warning : BRAND.accent} />)}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </Panel>
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
                <Panel title="Zone performance ranking" icon={Target} description="YTD ranking by physical/measurement gap inside each zone.">
                    <div className="overflow-x-auto">
                        <table className="w-full text-[12px]">
                            <thead>
                                <tr className="border-b border-border text-left text-muted-foreground">
                                    <th className="py-2 pr-2">Zone</th>
                                    <th className="py-2 pr-2 text-right">Input</th>
                                    <th className="py-2 pr-2 text-right">Usage</th>
                                    <th className="py-2 pr-2 text-right">Loss</th>
                                    <th className="py-2 text-right">%</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ytdZones.map((z) => {
                                    const s = statusLabel(z.lossPct);
                                    const colour = s.tone === "critical" ? BRAND.loss : s.tone === "warning" ? BRAND.warning : BRAND.accent;
                                    return (
                                        <tr key={z.zone} className="border-b border-border/70">
                                            <td className="py-2 pr-2 font-semibold text-foreground">{z.name}</td>
                                            <td className="py-2 pr-2 text-right tabular-nums text-muted-foreground">{fmt(z.bulk)}</td>
                                            <td className="py-2 pr-2 text-right tabular-nums text-muted-foreground">{fmt(z.end)}</td>
                                            <td className="py-2 pr-2 text-right tabular-nums text-foreground">{fmt(z.loss)}</td>
                                            <td className="py-2 text-right font-bold tabular-nums" style={{ color: colour }}>{decimal(z.lossPct)}%</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </Panel>

                <Panel title="Loss % against target" icon={TrendingDown} description={`Red line = ${TARGET_LOSS_PCT}% management threshold.`}>
                    <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={monthlyTrend} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                                <YAxis unit="%" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                                <Tooltip formatter={tooltipPct} contentStyle={{ borderRadius: 10, border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)" }} />
                                <ReferenceLine y={TARGET_LOSS_PCT} stroke={BRAND.loss} strokeDasharray="5 5" />
                                <Line dataKey="lossPct" name="Loss %" stroke={BRAND.primary} strokeWidth={2.5} dot={{ r: 2 }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </Panel>

                <Panel title="Management attention" icon={Building2} description="Fast answer on where action should start.">
                    <div className="space-y-3">
                        <div className="rounded-2xl border border-border bg-background/70 p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Worst zone</p>
                            <p className="mt-1 text-lg font-semibold text-foreground">{worstZone?.name ?? "—"}</p>
                            <p className="mt-1 text-sm text-muted-foreground">{worstZone ? `${fmt(worstZone.loss)} m³ loss · ${decimal(worstZone.lossPct)}%` : "No zone data"}</p>
                        </div>
                        <div className="rounded-2xl border border-border bg-background/70 p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Best zone</p>
                            <p className="mt-1 text-lg font-semibold text-foreground">{bestZone?.name ?? "—"}</p>
                            <p className="mt-1 text-sm text-muted-foreground">{bestZone ? `${decimal(bestZone.lossPct)}% loss` : "No zone data"}</p>
                        </div>
                        <div className="rounded-2xl border border-border bg-background/70 p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Highest building gap</p>
                            <p className="mt-1 text-lg font-semibold text-foreground">{topBuilding?.name?.replace(" Building Bulk Meter", "") ?? "—"}</p>
                            <p className="mt-1 text-sm text-muted-foreground">{topBuilding ? `${fmt(topBuilding.loss)} m³ · ${decimal(topBuilding.lossPct)}%` : "No building data"}</p>
                        </div>
                    </div>
                </Panel>
            </div>
        </div>
    );
}
