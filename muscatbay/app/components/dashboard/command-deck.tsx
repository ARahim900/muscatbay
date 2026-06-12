"use client";

import { ReactNode, useRef, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";
import Link from "next/link";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { CountUp } from "@/components/motion/count-up";
import { MOTION, prefersReducedMotion, useIsomorphicLayoutEffect } from "@/lib/motion";
import type { StatItem, StatVariant } from "@/components/shared/stats-grid";

// Three.js stays out of the critical path — the deck paints instantly as
// brand-purple chrome and the water field fades in when the chunk lands.
const AmbientBay = dynamic(() => import("@/components/three/ambient-bay"), { ssr: false });

/** One module entry on the deck's status rail. Alert counts come from the
 * live activity feed — the rail reports "recent alerts", never invented
 * system health. */
export interface ModuleStatus {
    key: string;
    name: string;
    href: string;
    icon: LucideIcon;
    /** CSS value for the module accent, e.g. "var(--module-water)" */
    accent: string;
    critical: number;
    warning: number;
}

interface CommandDeckProps {
    title: string;
    description?: string;
    /** Right-aligned slot for live badges / actions — content preserved verbatim */
    actions?: ReactNode;
    /** Aggregate KPIs — same items the StatsGrid renders on module pages */
    stats: StatItem[];
    /** Module quick-nav rail with alert-feed status dots */
    modules?: ModuleStatus[];
    /** When the dashboard data finished loading — drives the freshness stamp */
    updatedAt?: Date;
    className?: string;
}

/* Icon accents tuned for the dark-purple deck surface: same semantic families
 * as StatsGrid, swapped to the elegant/light token variants that hold contrast
 * on var(--sidebar). Brand-purple icons would vanish here, so primary/default
 * read as brand teal / soft white instead. */
const deckIconColor: Record<StatVariant, string> = {
    primary: "var(--secondary)",
    secondary: "var(--secondary)",
    success: "var(--mb-success)",
    warning: "var(--mb-warning)",
    danger: "var(--sidebar-danger)",
    info: "var(--mb-info)",
    water: "var(--chart-1)",
    default: "var(--secondary)",
};

const MUSCAT_TZ = "Asia/Muscat";

const clockFormat = new Intl.DateTimeFormat("en-GB", {
    weekday: "short", day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit", hour12: false,
    timeZone: MUSCAT_TZ,
});

const timeFormat = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit", minute: "2-digit", hour12: false, timeZone: MUSCAT_TZ,
});

function subscribeToClock(onTick: () => void) {
    const id = setInterval(onTick, 30_000);
    return () => clearInterval(id);
}

/** Site-local (Gulf Standard Time) clock. useSyncExternalStore renders the
 * em-dash server snapshot during SSR/hydration, then the live minute — no
 * mismatch, no setState-in-effect. */
function DeckClock() {
    const label = useSyncExternalStore(
        subscribeToClock,
        () => `${clockFormat.format(new Date())} GST`,
        () => "—"
    );
    return <span className="tabular-nums">{label}</span>;
}

/** Status dot semantics: red = critical alerts, amber = warnings, teal =
 * quiet feed. Color is never the only carrier — the tooltip and aria-label
 * spell the counts out. */
function moduleAlertSummary(m: ModuleStatus): { color: string; text: string } {
    if (m.critical > 0) {
        return { color: "var(--status-danger)", text: `${m.critical} critical alert${m.critical > 1 ? "s" : ""}` };
    }
    if (m.warning > 0) {
        return { color: "var(--status-warning)", text: `${m.warning} warning${m.warning > 1 ? "s" : ""}` };
    }
    return { color: "var(--secondary)", text: "No recent alerts" };
}

/**
 * Executive command deck — the dashboard's opening statement. One monumental
 * brand-purple panel that fuses the greeting with the cross-module KPIs as a
 * hairline-divided statistics board over the ambient bay water field.
 *
 * Deliberately unlike the module pages: they keep the calm white-card
 * StatsGrid because they ARE the official per-system records; the deck is the
 * aggregation layer above them. Used on the dashboard only.
 */
export function CommandDeck({ title, description, actions, stats, modules, updatedAt, className }: CommandDeckProps) {
    const deckRef = useRef<HTMLElement>(null);

    useIsomorphicLayoutEffect(() => {
        const deck = deckRef.current;
        if (!deck || prefersReducedMotion()) return;

        const items = deck.querySelectorAll<HTMLElement>("[data-deck-item]");
        const cells = deck.querySelectorAll<HTMLElement>("[data-deck-cell]");
        if (items.length === 0 && cells.length === 0) return;

        const ctx = gsap.context(() => {
            const tl = gsap.timeline();
            if (items.length > 0) {
                gsap.set(items, { autoAlpha: 0, y: 18 });
                tl.to(items, {
                    autoAlpha: 1,
                    y: 0,
                    duration: MOTION.dur.lg,
                    ease: MOTION.ease.outExpo,
                    stagger: MOTION.stagger.base,
                    clearProps: "opacity,visibility,transform",
                });
            }
            if (cells.length > 0) {
                gsap.set(cells, { autoAlpha: 0, y: 14 });
                tl.to(cells, {
                    autoAlpha: 1,
                    y: 0,
                    duration: MOTION.dur.md,
                    ease: MOTION.ease.out,
                    stagger: MOTION.stagger.tight,
                    clearProps: "opacity,visibility,transform",
                }, items.length > 0 ? "-=0.55" : 0);
            }
        }, deck);

        return () => ctx.revert();
    }, []);

    const count = stats.length;
    const lattice =
        count <= 4 ? "grid-cols-2 xl:grid-cols-4" :
        count <= 6 ? "grid-cols-2 sm:grid-cols-3 xl:grid-cols-6" :
        "grid-cols-2 sm:grid-cols-3 xl:grid-cols-4";

    return (
        <section
            ref={deckRef}
            aria-label="Operations command deck"
            className={cn(
                "relative overflow-hidden rounded-[var(--radius)] border border-white/10",
                "bg-[linear-gradient(140deg,var(--primary)_0%,var(--sidebar)_100%)]",
                "shadow-card-primary",
                "print:bg-none print:border-border print:shadow-none",
                className
            )}
        >
            {/* Ambient water field, teal dawn, and text-protection scrim */}
            <div className="absolute inset-0 print:hidden" aria-hidden="true">
                <AmbientBay className="absolute inset-0" intensity="bold" />
                <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_85%_-20%,color-mix(in_srgb,var(--secondary)_18%,transparent),transparent_60%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(to_bottom,color-mix(in_srgb,var(--sidebar)_35%,transparent),transparent_34%,color-mix(in_srgb,var(--sidebar)_30%,transparent))]" />
            </div>

            <div className="relative z-10 p-4 sm:p-6 md:p-8">
                {/* Briefing header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div className="min-w-0">
                        <div
                            data-deck-item
                            className="mb-2 print:hidden [&_a]:text-white/55 [&_a:hover]:text-white [&_svg]:text-white/45 [&_span]:text-white/80"
                        >
                            <Breadcrumbs />
                        </div>
                        <h1
                            data-deck-item
                            className="text-2xl sm:text-3xl md:text-[2.1rem] font-bold tracking-tight text-white print:text-(--primary)"
                        >
                            {title}
                        </h1>
                        {description && (
                            <p
                                data-deck-item
                                className="mt-1.5 text-xs sm:text-sm text-white/70 print:text-(--muted-foreground)"
                            >
                                {description}
                            </p>
                        )}
                    </div>
                    {actions && (
                        <div data-deck-item className="flex items-center gap-2 md:flex-shrink-0 md:pb-1">
                            {actions}
                        </div>
                    )}
                </div>

                {/* KPI lattice — one board, hairline-divided cells */}
                <div
                    className={cn(
                        "mt-5 sm:mt-6 grid gap-px rounded-xl overflow-hidden",
                        "border border-white/10 bg-white/10",
                        "print:border-border print:bg-border",
                        lattice
                    )}
                >
                    {stats.map((stat, index) => {
                        const variant = stat.variant || "primary";

                        const isGoodTrend = stat.trend === "neutral" ? false :
                            stat.invertTrend ? stat.trend === "down" : stat.trend === "up";
                        const isBadTrend = stat.trend === "neutral" ? false :
                            stat.invertTrend ? stat.trend === "up" : stat.trend === "down";

                        const cellContent = (
                            <>
                                <div className="flex items-start gap-1.5 min-w-0">
                                    <stat.icon
                                        aria-hidden="true"
                                        className="w-3.5 h-3.5 flex-shrink-0 mt-px"
                                        style={{ color: stat.color || deckIconColor[variant] }}
                                    />
                                    {/* Wraps to 2 lines so "STP ECONOMIC IMPACT" never clips, even at 6 columns */}
                                    <p className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.08em] leading-tight text-white/55 line-clamp-2 min-h-[2.1em] print:text-(--muted-foreground)">
                                        {stat.label}
                                    </p>
                                </div>
                                <p className="mt-2 sm:mt-2.5 text-xl sm:text-2xl font-semibold tabular-nums tracking-tight leading-none truncate text-white print:text-(--primary)">
                                    <CountUp value={stat.value} delay={0.3 + index * 0.06} />
                                </p>
                                {stat.trend && stat.trendValue && (
                                    <div className="mt-2 sm:mt-2.5 flex items-center text-[11px] sm:text-xs min-w-0">
                                        <span
                                            className="flex items-center font-medium flex-shrink-0"
                                            style={{
                                                color: isGoodTrend ? "var(--mb-success)" :
                                                    isBadTrend ? "var(--sidebar-danger)" :
                                                        "rgba(255,255,255,0.6)",
                                            }}
                                        >
                                            {stat.trend === "up" && <TrendingUp size={13} className="me-1" />}
                                            {stat.trend === "down" && <TrendingDown size={13} className="me-1" />}
                                            {stat.trend === "neutral" && <Minus size={13} className="me-1" />}
                                            {stat.trendValue}
                                        </span>
                                        <span className="ms-1.5 text-white/40 truncate">vs last month</span>
                                    </div>
                                )}
                                {stat.subtitle && !stat.trendValue && (
                                    <p className="mt-2 text-[11px] sm:text-xs text-white/50 truncate">{stat.subtitle}</p>
                                )}
                            </>
                        );

                        const cellClassName = cn(
                            "block min-w-0 p-3 sm:p-4",
                            "bg-[color-mix(in_srgb,var(--sidebar)_78%,transparent)]",
                            "print:bg-transparent"
                        );

                        return stat.href ? (
                            <Link
                                key={stat.label}
                                href={stat.href}
                                data-deck-cell
                                data-glow
                                aria-label={`${stat.label}: ${stat.value}. ${stat.trend === "up" ? "Up" : stat.trend === "down" ? "Down" : "No change"} ${stat.trendValue || ""} compared to last period. Click to view details.`}
                                className={cn(
                                    cellClassName,
                                    "mb-glow transition-colors duration-200",
                                    "hover:bg-[color-mix(in_srgb,var(--sidebar)_58%,transparent)]",
                                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/70 focus-visible:ring-inset"
                                )}
                            >
                                {cellContent}
                            </Link>
                        ) : (
                            <div key={stat.label} data-deck-cell className={cellClassName}>
                                {cellContent}
                            </div>
                        );
                    })}
                </div>

                {/* Live operations strip: module quick-nav rail + site clock,
                    systems count, and data freshness. Navigation/meta chrome —
                    excluded from print hand-outs. */}
                {(modules?.length || updatedAt) && (
                    <div
                        data-deck-item
                        className="mt-4 sm:mt-5 flex flex-col gap-2.5 print:hidden"
                    >
                        {modules && modules.length > 0 && (
                            <nav aria-label="Module status rail" className="min-w-0">
                                <ul className="flex items-center gap-1.5 flex-nowrap overflow-x-auto sm:flex-wrap sm:overflow-x-visible scrollbar-hide -mx-1 px-1 py-0.5">
                                    {modules.map((m) => {
                                        const alert = moduleAlertSummary(m);
                                        return (
                                            <li key={m.key} className="flex-shrink-0">
                                                <Link
                                                    href={m.href}
                                                    data-tooltip={`${m.name} — ${alert.text}`}
                                                    aria-label={`${m.name}: ${alert.text}. Open module.`}
                                                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white/[0.05] border border-white/[0.07] text-[11px] font-medium text-white/75 hover:text-white hover:bg-white/10 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/70"
                                                >
                                                    <m.icon aria-hidden="true" className="w-3.5 h-3.5" style={{ color: m.accent }} />
                                                    <span className="whitespace-nowrap">{m.name}</span>
                                                    <span
                                                        aria-hidden="true"
                                                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                                        style={{ backgroundColor: alert.color }}
                                                    />
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </nav>
                        )}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-white/50 whitespace-nowrap sm:justify-end">
                            <DeckClock />
                            {modules && modules.length > 0 && (
                                <>
                                    <span aria-hidden="true" className="w-px h-3 bg-white/15" />
                                    <span>{modules.length} utility systems</span>
                                </>
                            )}
                            {updatedAt && (
                                <>
                                    <span aria-hidden="true" className="w-px h-3 bg-white/15" />
                                    <span className="tabular-nums" suppressHydrationWarning>
                                        Updated {timeFormat.format(updatedAt)}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
