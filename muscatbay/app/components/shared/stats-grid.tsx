"use client";

import { cn } from "@/lib/utils";
import {
    LucideIcon, TrendingUp, TrendingDown, Minus,
    AlertTriangle, CheckCircle2, Clock, HelpCircle, XCircle, ShieldAlert,
} from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { CountUp } from "@/components/motion/count-up";
import { useValueChanged } from "@/hooks/useValueChanged";
import Link from "next/link";

export type StatVariant = "primary" | "secondary" | "success" | "warning" | "danger" | "info" | "water" | "default";

export interface StatItem {
    label: string;
    value: string;
    /** Full, unabridged value announced to assistive technology. */
    accessibleValue?: string;
    /** Optional unit rendered small + static after the value (e.g. "m³", "OMR",
     *  "MWh") — matches the monthly Kpi tiles and keeps long numbers from
     *  truncating. Prefer this over baking the unit into `value`. */
    unit?: string;
    subtitle?: string;
    icon: LucideIcon;
    variant?: StatVariant;
    color?: string;
    bgColor?: string;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    trendContext?: string;
    href?: string;
    /**
     * Invert the good/bad meaning of the trend direction.
     * Use true for savings metrics (electricity, water) where DOWN = good (green).
     * Default false = standard logic where UP = good (green), DOWN = bad (red).
     */
    invertTrend?: boolean;
    status?: 'normal' | 'warning' | 'danger' | 'stale' | 'missing';
    lastUpdated?: string;
    dataQuality?: 'incomplete' | 'stale' | 'estimated' | 'under-review' | 'anomaly';
}

interface StatsGridProps {
    stats: StatItem[];
    className?: string;
}

const SCROLL_ANIMATION_CONFIG = { y: 30, duration: 0.5, stagger: 0.1 } as const;

const variantIconClass: Record<StatVariant, string> = {
    primary: "text-primary",
    secondary: "text-secondary",
    success: "text-[var(--status-normal)]",
    warning: "text-[var(--status-warning)]",
    danger: "text-[var(--status-danger)]",
    info: "text-[var(--status-info)]",
    water: "text-[var(--module-water)]",
    default: "text-muted-foreground",
};

// Status is never carried by colour alone (WCAG 1.4.1): the tile renders a
// shape-distinct icon plus the status word. Glyphs and --status-* tokens match
// data-table/status-badge.tsx, alerts-feed and module-coverage, so one status means
// one glyph + one hue app-wide.
type StatStatus = NonNullable<StatItem["status"]>;
const STATUS_UI: Record<StatStatus, { Icon: LucideIcon; token: string }> = {
    normal:  { Icon: CheckCircle2,  token: "var(--status-normal)" },
    warning: { Icon: AlertTriangle, token: "var(--status-warning)" },
    danger:  { Icon: XCircle,       token: "var(--status-danger)" },
    stale:   { Icon: Clock,         token: "var(--status-stale)" },
    missing: { Icon: HelpCircle,    token: "var(--status-missing)" },
};

// Soft tile background behind the icon, per variant — mirrors the water/monthly
// section's Kpi tiles (a chart-bg tint behind a colored icon). The standard
// reference for KPI cards across the app. Overridden by an explicit stat.bgColor.
const variantTileBg: Record<StatVariant, string> = {
    primary: "var(--chart-bg-purple)",
    secondary: "var(--chart-bg-cyan)",
    success: "var(--chart-bg-green)",
    warning: "var(--chart-bg-orange)",
    danger: "var(--chart-bg-red)",
    info: "var(--chart-bg-blue)",
    water: "var(--chart-bg-blue)",
    default: "var(--muted)",
};

const variantAccent: Record<StatVariant, string> = {
    primary: "var(--primary)",
    secondary: "var(--secondary)",
    success: "var(--status-normal)",
    warning: "var(--status-warning)",
    danger: "var(--status-danger)",
    info: "var(--status-info)",
    water: "var(--module-water)",
    default: "var(--muted-foreground)",
};

const DATA_QUALITY_LABEL: Record<NonNullable<StatItem["dataQuality"]>, string> = {
    incomplete: "Incomplete data",
    stale: "Stale data",
    estimated: "Estimated",
    "under-review": "Under review",
    anomaly: "Data anomaly",
};

export function StatsGrid({ stats, className }: StatsGridProps) {
    const gridRef = useScrollAnimation<HTMLDivElement>(SCROLL_ANIMATION_CONFIG);

    const count = stats.length;
    const gridCols =
        count === 3 ? "grid-cols-2 sm:grid-cols-3" :
        count <= 4 ? "grid-cols-2 sm:grid-cols-2 lg:grid-cols-4" :
        count === 5 ? "grid-cols-2 sm:grid-cols-3 xl:grid-cols-5" :
        count === 6 ? "grid-cols-2 sm:grid-cols-3 2xl:grid-cols-6" :
        "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4";

    return (
        <div ref={gridRef} className={cn(
            "grid gap-3 sm:gap-4 w-full",
            gridCols,
            className
        )}>
            {stats.map((stat, index) => (
                <StatTile key={stat.label} stat={stat} index={index} />
            ))}
        </div>
    );
}

/**
 * One KPI tile.
 *
 * Split out of the grid so each tile can watch its own value: `useValueChanged`
 * is a hook, and the grid renders these in a map. Extracting the tile is what
 * lets a single figure mark itself when it moves, instead of the whole deck.
 */
function StatTile({ stat, index }: { stat: StatItem; index: number }) {
    const justChanged = useValueChanged(stat.value);

    const variant = stat.variant || "primary";
    const iconClass = variantIconClass[variant];
    const tileBg = stat.bgColor ?? variantTileBg[variant];
    const accent = stat.color ?? variantAccent[variant];

    const isGoodTrend = stat.trend === 'neutral' ? false :
        stat.invertTrend ? stat.trend === 'down' : stat.trend === 'up';
    const isBadTrend = stat.trend === 'neutral' ? false :
        stat.invertTrend ? stat.trend === 'up' : stat.trend === 'down';

    const cardContent = (
        <>
            <span className="absolute inset-x-0 top-0 h-[3px]" style={{ backgroundColor: accent }} aria-hidden="true" />
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="mb-1 text-[10px] font-semibold uppercase leading-tight tracking-[0.08em] text-muted-foreground sm:text-[11px]">
                        {stat.label}
                    </p>
                    <h3 className={cn(
                        "break-words text-lg font-semibold tabular-nums leading-tight tracking-tight text-foreground sm:text-xl md:text-2xl",
                        justChanged && "mb-value-changed-ink"
                    )}>
                        {stat.accessibleValue && stat.accessibleValue !== stat.value ? (
                            <>
                                <span aria-hidden="true"><CountUp value={stat.value} delay={index * 0.06} /></span>
                                <span className="sr-only">{stat.accessibleValue}</span>
                            </>
                        ) : <CountUp value={stat.value} delay={index * 0.06} />}
                        {stat.unit && <span className="ml-1 text-xs font-medium text-muted-foreground sm:text-sm">{stat.unit}</span>}
                    </h3>
                    {stat.subtitle && (
                        <p className="mt-1.5 line-clamp-2 text-[11px] leading-snug text-muted-foreground sm:text-xs">{stat.subtitle}</p>
                    )}
                </div>
                <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 ease-out motion-safe:group-hover/stat:-rotate-3 motion-safe:group-hover/stat:scale-105"
                    style={{ background: tileBg }}
                >
                    <stat.icon
                        className={cn("h-5 w-5", !stat.color && iconClass)}
                        style={stat.color ? { color: stat.color } : undefined}
                        aria-hidden="true"
                    />
                </div>
            </div>

            <div className="mt-auto flex min-h-6 items-end justify-between gap-2 pt-3 text-xs">
                <div className="min-w-0">
                    {stat.status && (() => {
                        const { Icon: StatusIcon, token } = STATUS_UI[stat.status];
                        return (
                            <span className="inline-flex items-center gap-1.5 font-medium capitalize text-muted-foreground">
                                <StatusIcon aria-hidden="true" className="h-3.5 w-3.5 shrink-0" style={{ color: token }} />
                                {stat.status}
                            </span>
                        );
                    })()}
                    {stat.dataQuality && (
                        <span className="inline-flex items-center gap-1.5 font-medium text-[var(--mb-warning-text)]">
                            <ShieldAlert className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            {DATA_QUALITY_LABEL[stat.dataQuality]}
                        </span>
                    )}
                    {stat.lastUpdated && !stat.status && !stat.dataQuality && (
                        <span className="text-[11px] tabular-nums text-muted-foreground">Updated {stat.lastUpdated}</span>
                    )}
                </div>
                {stat.trend && stat.trendValue && stat.trendValue !== "—" && (
                    <span className={cn(
                        "ml-auto inline-flex shrink-0 items-center font-semibold",
                        isGoodTrend ? "text-[var(--mb-success-text)]" :
                        isBadTrend ? "text-[var(--mb-danger-text)]" : "text-muted-foreground"
                    )}>
                        {stat.trend === 'up' && <TrendingUp className="me-1 h-3.5 w-3.5" aria-hidden="true" />}
                        {stat.trend === 'down' && <TrendingDown className="me-1 h-3.5 w-3.5" aria-hidden="true" />}
                        {stat.trend === 'neutral' && <Minus className="me-1 h-3.5 w-3.5" aria-hidden="true" />}
                        {stat.trendValue}
                        {(stat.trendContext ?? "vs last month") && <span className="ms-1 hidden font-normal text-muted-foreground xl:inline">{stat.trendContext ?? "vs last month"}</span>}
                    </span>
                )}
            </div>
        </>
    );

    const baseCardClassName = cn(
        "mb-glow group/stat relative flex min-h-32 flex-col overflow-hidden rounded-xl border border-border bg-card p-4 shadow-card-standard transition-[box-shadow,border-color,transform] duration-200 ease-out hover:border-secondary/40 hover:shadow-md motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0",
        justChanged && "mb-value-changed"
    );

    const accessibleValue = stat.accessibleValue ?? `${stat.value}${stat.unit ? ` ${stat.unit}` : ''}`;
    return stat.href ? (
        <Link
            href={stat.href}
            data-glow
            aria-label={`${stat.label}: ${accessibleValue}. View details.`}
            className={cn(baseCardClassName, "cursor-pointer")}
        >
            {cardContent}
        </Link>
    ) : (
        <div data-glow role="group" aria-label={`${stat.label}: ${accessibleValue}`} className={baseCardClassName}>
            {cardContent}
        </div>
    );
}
