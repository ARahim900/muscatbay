"use client";

/**
 * @fileoverview Water 3D Map — side panels (network KPIs, zone summary, detail).
 *
 * Pure presentational pieces built entirely from shared primitives (StatsGrid,
 * HealthCard, SeverityChip, Sparkline) and design tokens, so the map reads as a
 * native part of the app. They consume the renderer-agnostic snapshot types, so
 * the accessible table fallback shows the exact same numbers as the 3D scene.
 *
 * @module components/water/map3d/map-panels
 */

import { Droplets, Gauge, Waves, TrendingDown, MapPin, X, AlertTriangle, HelpCircle } from "lucide-react";
import { StatsGrid, type StatItem } from "@/components/shared/stats-grid";
import { HealthCard, SeverityChip, worstFirst, type HealthMetric } from "@/components/shared/inspection";
import { cn } from "@/lib/utils";
import type { MapSnapshot, MapZoneDatum, MapMeterDatum } from "@/lib/water-map-data";

const fmt = (n: number | null | undefined): string =>
    n == null ? "–" : Math.round(n).toLocaleString("en-GB");
const fmt1 = (n: number | null | undefined): string =>
    n == null ? "–" : Number(n).toLocaleString("en-GB", { maximumFractionDigits: 1 });

/* ── Network KPIs ──────────────────────────────────────────────────────────── */

export function NetworkKpis({ snapshot }: { snapshot: MapSnapshot }) {
    const t = snapshot.totals;
    const stats: StatItem[] = [
        {
            label: t.distributionLevel ? "Zone Bulk Supply" : "Total Supply",
            value: fmt(t.bulk),
            unit: "m³",
            icon: Droplets,
            variant: "water",
            subtitle: t.distributionLevel ? "Σ zone bulk (L2)" : "Main bulk (NAMA)",
        },
        {
            label: "Downstream Use",
            value: fmt(t.downstream),
            unit: "m³",
            icon: Waves,
            variant: "info",
            subtitle: "Σ end-user meters",
        },
        {
            label: "Water Loss",
            value: fmt(t.loss),
            unit: "m³",
            icon: TrendingDown,
            variant: t.lossPct > 25 ? "danger" : t.lossPct > 15 ? "warning" : "success",
            subtitle: `${fmt1(t.lossPct)}% of supply`,
        },
        {
            label: "Efficiency",
            value: fmt1(t.efficiency),
            unit: "%",
            icon: Gauge,
            variant: t.efficiency >= 85 ? "success" : t.efficiency >= 75 ? "warning" : "danger",
            subtitle: "Target ≥ 85%",
        },
    ];
    return <StatsGrid stats={stats} />;
}

/* ── Zone summary (worst-first health cards) ───────────────────────────────── */

export function ZoneSummaryPanel({
    snapshot,
    selectedZoneId,
    onSelectZone,
}: {
    snapshot: MapSnapshot;
    selectedZoneId: string | null;
    onSelectZone: (id: string) => void;
}) {
    const metrics: HealthMetric[] = worstFirst(snapshot.zones).map((z) => ({
        key: z.id,
        title: z.name,
        severity: z.severity,
        headline: z.hasData ? `${fmt1(z.efficiency)}%` : "No data",
        headlineNote: z.hasData ? `efficiency · ${fmt1(z.lossPct)}% loss` : "no reading this period",
        facts: [
            { label: "Bulk", value: `${fmt(z.bulk)} m³` },
            { label: "Loss", value: `${fmt(z.loss)} m³` },
        ],
        subtitle: `${z.meterCount} meters · ${z.missingCount} missing · ${z.abnormalCount} abnormal`,
    }));

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Zones · {snapshot.periodLabel}</h3>
                {selectedZoneId && (
                    <button
                        type="button"
                        onClick={() => onSelectZone(selectedZoneId)}
                        className="text-[11px] font-medium text-secondary hover:underline"
                    >
                        clear focus
                    </button>
                )}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {metrics.map((m) => (
                    <div
                        key={m.key}
                        className={cn(
                            "rounded-[10.5px] transition-shadow",
                            selectedZoneId === m.key && "ring-2 ring-secondary/60",
                        )}
                    >
                        <HealthCard metric={m} onInspect={onSelectZone} />
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ── Detail panel (zone or meter) ──────────────────────────────────────────── */

function Field({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-baseline justify-between gap-3 border-b border-border/50 py-1.5 last:border-0">
            <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</dt>
            <dd className="text-right text-[13px] font-semibold tabular-nums text-foreground">{value}</dd>
        </div>
    );
}

function DetailShell({
    title,
    subtitle,
    icon: Icon,
    onClose,
    children,
}: {
    title: string;
    subtitle: string;
    icon: typeof MapPin;
    onClose: () => void;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-[10.5px] border border-border bg-card p-4 shadow-card-standard">
            <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-2">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-secondary" aria-hidden="true" />
                    <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold text-foreground">{title}</h3>
                        <p className="truncate text-[11px] text-muted-foreground">{subtitle}</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close detail"
                    className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/60"
                >
                    <X className="h-4 w-4" aria-hidden="true" />
                </button>
            </div>
            {children}
        </div>
    );
}

export function ZoneDetailPanel({ zone, onClose }: { zone: MapZoneDatum; onClose: () => void }) {
    return (
        <DetailShell title={zone.name} subtitle="Zone balance" icon={MapPin} onClose={onClose}>
            <div className="mb-3 flex items-center gap-2">
                <SeverityChip severity={zone.severity} />
                <span className="text-[11px] text-muted-foreground">{zone.hasData ? "live" : "no reading"}</span>
            </div>
            <dl>
                <Field label="Bulk supply" value={`${fmt(zone.bulk)} m³`} />
                <Field label="Downstream" value={`${fmt(zone.downstream)} m³`} />
                <Field label="Water loss" value={`${fmt(zone.loss)} m³`} />
                <Field label="Loss %" value={`${fmt1(zone.lossPct)}%`} />
                <Field label="Efficiency" value={`${fmt1(zone.efficiency)}%`} />
                <Field label="Active meters" value={String(zone.meterCount)} />
                <Field label="Missing readings" value={String(zone.missingCount)} />
                <Field label="Abnormal readings" value={String(zone.abnormalCount)} />
            </dl>
        </DetailShell>
    );
}

export function MeterDetailPanel({ meter, onClose }: { meter: MapMeterDatum; onClose: () => void }) {
    const change =
        meter.changePct == null ? "–" : `${meter.changePct > 0 ? "+" : ""}${fmt1(meter.changePct)}%`;
    const abnormal = meter.flags.filter((f) => f !== "Normal");
    return (
        <DetailShell
            title={meter.name}
            subtitle={`${meter.level || "meter"} · ${meter.zoneName}`}
            icon={MapPin}
            onClose={onClose}
        >
            <div className="mb-3 flex flex-wrap items-center gap-2">
                <SeverityChip severity={meter.severity} />
                {abnormal.map((f) => (
                    <span
                        key={f}
                        className="inline-flex items-center gap-1 rounded-full bg-mb-warning-light px-2 py-0.5 text-[11px] font-medium text-mb-warning-text"
                    >
                        <AlertTriangle className="h-2.5 w-2.5" aria-hidden="true" />
                        {f}
                    </span>
                ))}
            </div>
            <dl>
                <Field label="Account" value={meter.account} />
                <Field label="Meter level" value={meter.level || "—"} />
                <Field label="Type" value={meter.type || "—"} />
                <Field label="Parent" value={meter.parent || "—"} />
                <Field label="Consumption" value={meter.value == null ? "missing" : `${fmt1(meter.value)} m³`} />
                <Field label="Previous period" value={meter.prevValue == null ? "–" : `${fmt1(meter.prevValue)} m³`} />
                <Field label="Change" value={change} />
                <Field label="Trailing avg" value={meter.avg == null ? "–" : `${fmt1(meter.avg)} m³`} />
                <Field label="Zone contribution" value={meter.contributionPct == null ? "–" : `${fmt1(meter.contributionPct)}%`} />
            </dl>
        </DetailShell>
    );
}

/* ── Legend + provisional notice ───────────────────────────────────────────── */

const LEGEND: { sev: MapMeterDatum["severity"]; label: string }[] = [
    { sev: "good", label: "Healthy (<10% loss)" },
    { sev: "watch", label: "Watch (10–25%)" },
    { sev: "high", label: "High (25–50%)" },
    { sev: "critical", label: "Critical (≥50%)" },
    { sev: "nodata", label: "No data" },
];

const LEGEND_COLOR: Record<MapMeterDatum["severity"], string> = {
    good: "var(--mb-success)",
    watch: "var(--mb-warning)",
    high: "var(--mb-danger)",
    critical: "var(--mb-danger)",
    nodata: "var(--mb-stale)",
};

export function MapLegend() {
    return (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-[7px] border border-border/60 bg-card/70 px-3 py-2 text-[11px] text-muted-foreground">
            {LEGEND.map((l) => (
                <span key={l.sev} className="inline-flex items-center gap-1.5">
                    <span
                        className="h-2.5 w-2.5 rounded-sm border border-border/40"
                        style={{ background: LEGEND_COLOR[l.sev] }}
                        aria-hidden="true"
                    />
                    {l.label}
                </span>
            ))}
        </div>
    );
}

export function ProvisionalNotice() {
    return (
        <div className="flex items-start gap-2 rounded-[7px] border border-border/60 bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground">
            <HelpCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-secondary" aria-hidden="true" />
            <p>
                <span className="font-semibold text-foreground">Zone positions are surveyed.</span> Zone
                bulk meters use real coordinates; individual meters within a zone are placed illustratively
                around their zone until per-meter survey data exists. All consumption, loss and efficiency
                values are live from Supabase.
            </p>
        </div>
    );
}
