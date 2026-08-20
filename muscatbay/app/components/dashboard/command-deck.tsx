"use client";

import { ReactNode, useRef } from "react";
import gsap from "gsap";
import Link from "next/link";
import { TrendingUp, TrendingDown, Minus, CheckCircle2, AlertTriangle, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { CountUp } from "@/components/motion/count-up";
import { DeckBrandMark } from "@/components/dashboard/deck-brand-mark";
import { MOTION, prefersReducedMotion, useIsomorphicLayoutEffect } from "@/lib/motion";
import type { StatItem, StatVariant } from "@/components/shared/stats-grid";

/** Target / threshold verdict for a KPI. `unknown` = not computable from the data we have. */
export type DeckTargetStatus = "normal" | "warning" | "danger" | "unknown";

export interface DeckStat extends StatItem {
    /**
     * Target or threshold context for this KPI, e.g. "Recovery 92% · target ≥ 90%".
     * Rendered as a labelled chip so "are we on target?" is answerable at a glance.
     * Omit when the metric genuinely has no agreed target — never invent one.
     */
    target?: { label: string; status: DeckTargetStatus };
}

interface CommandDeckProps {
    title: string;
    description?: string;
    /** Right-aligned slot for live badges / actions — content preserved verbatim */
    actions?: ReactNode;
    /** Aggregate KPIs — same items the StatsGrid renders on module pages */
    stats: DeckStat[];
    /**
     * Explains WHY the per-KPI period labels can differ (each module resolves
     * "latest month" by its own rule). Rendered under the lattice.
     */
    periodNote?: string;
    className?: string;
}

/**
 * Muted foreground on the brand-purple deck surface. Derived from the
 * --primary-foreground token rather than a hardcoded rgba(255,255,255,…),
 * so it follows the brand if that token ever moves.
 */
const DECK_MUTED = "color-mix(in srgb, var(--primary-foreground) 60%, transparent)";

/** Target chip colours — status tokens, each paired with an icon + text label. */
const targetStatusStyle: Record<DeckTargetStatus, { color: string; Icon: typeof CheckCircle2 }> = {
    normal: { color: "var(--mb-success)", Icon: CheckCircle2 },
    warning: { color: "var(--mb-warning)", Icon: AlertTriangle },
    danger: { color: "var(--sidebar-danger)", Icon: AlertTriangle },
    unknown: { color: DECK_MUTED, Icon: HelpCircle },
};

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

/**
 * Executive command deck — the dashboard's opening statement. One monumental
 * brand-purple panel that fuses the greeting with the cross-module KPIs as a
 * hairline-divided statistics board on a solid brand-purple surface. The only
 * decorative motion is the hero brand mark (DeckBrandMark): it assembles on
 * load and answers scroll with a scrubbed light sweep + layer drift, while
 * the panel itself stays a calm, static BMS backdrop.
 *
 * Deliberately unlike the module pages: they keep the calm white-card
 * StatsGrid because they ARE the official per-system records; the deck is the
 * aggregation layer above them. Used on the dashboard only.
 */
export function CommandDeck({ title, description, actions, stats, periodNote, className }: CommandDeckProps) {
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
        count === 5 ? "grid-cols-2 sm:grid-cols-3 xl:grid-cols-5" :
        // With the 220px sidebar, a six-column lattice at the 1280px `xl`
        // breakpoint leaves KPI values too narrow and truncates OMR figures.
        // Keep a readable 3×2 board until the 1536px `2xl` breakpoint.
        count <= 6 ? "grid-cols-2 sm:grid-cols-3 2xl:grid-cols-6" :
        "grid-cols-2 sm:grid-cols-3 xl:grid-cols-4";

    return (
        <section
            ref={deckRef}
            aria-label="Operations command deck"
            className={cn(
                "relative overflow-hidden rounded-[var(--radius)] border border-white/10",
                "bg-(--primary)",
                "shadow-card-primary",
                "print:bg-transparent print:border-border print:shadow-none",
                className
            )}
        >
            <div className="relative z-10 p-3 sm:p-5 md:p-6">
                {/* Briefing header */}
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div className="min-w-0">
                        <div
                            data-deck-item
                            className="mb-2 hidden print:hidden sm:block [&_a]:text-white/55 [&_a:hover]:text-white [&_svg]:text-white/45 [&_span]:text-white/80"
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
                    {/* Brand column — the animated mark rides above the actions on
                        md+, beside them on small screens. row-reverse keeps the
                        mark on the right edge in both arrangements. */}
                    <div className="flex flex-row-reverse items-end justify-between gap-4 md:flex-col md:items-end md:flex-shrink-0 print:hidden">
                        <DeckBrandMark className="h-10 sm:h-16 md:h-20 xl:h-24" />
                        {actions && (
                            <div data-deck-item className="flex items-center gap-2 md:pb-1">
                                {actions}
                            </div>
                        )}
                    </div>
                </div>

                {/* KPI lattice — one board, hairline-divided cells */}
                <div
                    className={cn(
                        "mt-4 grid gap-px overflow-hidden rounded-xl sm:mt-5",
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
                                    {/* Typography aligned to the shared StatsGrid standard
                                        (11px semibold label, text-xl sans value); kept white
                                        for the dark command-deck surface. Labels wrap to two
                                        lines on narrow cells instead of truncating mid-word
                                        ("WATER PRODUCTI…"). */}
                                    <p className="min-w-0 text-[11px] font-semibold uppercase tracking-[0.06em] leading-tight text-white/55 line-clamp-2 break-words print:text-(--muted-foreground)">
                                        {stat.label}
                                    </p>
                                </div>
                                <p className="mt-2 break-words text-lg font-semibold tabular-nums leading-tight text-white sm:mt-2.5 sm:text-xl print:text-(--primary)">
                                    <CountUp value={stat.value} delay={0.3 + index * 0.06} />
                                </p>
                                {/* The period label is ALWAYS rendered. It used to be
                                    suppressed whenever a trend existed — and every KPI
                                    has a trend — so the month was invisible on all of
                                    them, while water / electricity / STP each resolve
                                    "latest month" by a different rule. An unlabelled
                                    number from an unknown month is not a KPI. */}
                                {stat.subtitle && (
                                    <p className="mt-1.5 line-clamp-2 text-[11px] leading-snug text-white/55 sm:text-xs">{stat.subtitle}</p>
                                )}
                                {stat.trend && stat.trendValue && (
                                    <div className="mt-2 sm:mt-2.5 flex items-center text-[11px] sm:text-xs min-w-0">
                                        <span
                                            className="flex items-center font-medium flex-shrink-0"
                                            style={{
                                                color: isGoodTrend ? "var(--mb-success)" :
                                                    isBadTrend ? "var(--sidebar-danger)" :
                                                        DECK_MUTED,
                                            }}
                                        >
                                            {stat.trend === "up" && <TrendingUp size={13} className="me-1" aria-hidden="true" />}
                                            {stat.trend === "down" && <TrendingDown size={13} className="me-1" aria-hidden="true" />}
                                            {stat.trend === "neutral" && <Minus size={13} className="me-1" aria-hidden="true" />}
                                            {stat.trendValue}
                                        </span>
                                        <span className="ms-1.5 text-white/40 truncate">vs prev.</span>
                                    </div>
                                )}
                                {/* Target / threshold context — colour is always
                                    paired with an icon and a text label. */}
                                {stat.target && (() => {
                                    const { color, Icon } = targetStatusStyle[stat.target.status];
                                    return (
                                        <p
                                            className="mt-2 flex items-start gap-1 text-[11px] leading-snug"
                                            style={{ color }}
                                        >
                                            <Icon size={12} className="mt-px flex-shrink-0" aria-hidden="true" />
                                            <span className="min-w-0">{stat.target.label}</span>
                                        </p>
                                    );
                                })()}
                            </>
                        );

                        const cellClassName = cn(
                            "block min-w-0 p-2.5 sm:p-3.5",
                            "bg-[color-mix(in_srgb,var(--sidebar)_78%,transparent)]",
                            "print:bg-transparent"
                        );

                        return stat.href ? (
                            <Link
                                key={stat.label}
                                href={stat.href}
                                data-deck-cell
                                data-glow
                                aria-label={`${stat.label}: ${stat.value}${stat.subtitle ? `, ${stat.subtitle}` : ""}. ${stat.trend === "up" ? "Up" : stat.trend === "down" ? "Down" : "No change"} ${stat.trendValue || ""} compared to the previous period.${stat.target ? ` ${stat.target.label}.` : ""} Click to view details.`}
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

                {/* Why the period labels above can differ between KPIs — disclosed
                    rather than left for the reader to notice. */}
                {periodNote && (
                    <details className="group mt-2.5 text-[11px] leading-snug text-white/50 print:text-(--muted-foreground)">
                        <summary className="w-fit cursor-pointer list-none font-semibold text-white/65 marker:content-none">
                            How periods are calculated
                        </summary>
                        <p className="mt-1 max-w-4xl">{periodNote}</p>
                    </details>
                )}
            </div>
        </section>
    );
}
