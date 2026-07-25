"use client";

import { Suspense, useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
    PERIOD_BASIS_NOTE,
    useDashboardData,
    type RecentActivityItem,
} from "@/hooks/useDashboardData";
import { useModuleCoverage } from "@/hooks/useModuleCoverage";
import { useAppNotifications } from "@/components/NotificationProvider";
import { useAuth } from "@/components/auth/auth-provider";
import { CommandDeck, type DeckStat } from "@/components/dashboard/command-deck";
import { ModuleCoverageSection } from "@/components/dashboard/module-coverage";
import { YtdPanel } from "@/components/dashboard/ytd-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Activity,
    Droplets,
    Zap,
    AlertTriangle,
    ArrowUpRight,
    Info,
    LayoutDashboard,
    Recycle,
    TrendingUp,
    Wifi,
    WifiOff,
    Printer,
    DollarSign,
    XCircle,
    X,
    type LucideIcon,
} from "lucide-react";
import { AnimateOnScroll } from "@/components/shared/scroll-animation";
import { SectionBoundary } from "@/components/shared/section-boundary";

// Lazy-load charts — Recharts (~180 kB) deferred until after header + stats render
const DashboardCharts = dynamic(() => import("@/components/charts/dashboard-charts"), {
    loading: () => (
        <div className="grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 lg:grid-cols-7">
            <div className="card-elevated col-span-1 lg:col-span-4 h-[300px] motion-safe:animate-pulse rounded-xl bg-border/50 dark:bg-muted/50" />
            <div className="card-elevated col-span-1 lg:col-span-3 h-[300px] motion-safe:animate-pulse rounded-xl bg-border/50 dark:bg-muted/50" />
        </div>
    ),
    ssr: false,
});

type ActivityType = RecentActivityItem["type"];

/**
 * Severity → icon + label. Every severity gets its OWN glyph and a text label:
 * warning and info previously shared `ArrowUpRight` and differed by colour
 * alone, which is a WCAG 1.4.1 (Use of Color) failure. Mirrors the mapping in
 * components/alerts/alerts-feed.tsx so the two surfaces agree.
 */
const ACTIVITY_META: Record<ActivityType, { Icon: LucideIcon; label: string; tint: string; text: string }> = {
    critical: { Icon: XCircle, label: "Critical", tint: "bg-mb-danger/20", text: "text-mb-danger-text" },
    warning: { Icon: AlertTriangle, label: "Warning", tint: "bg-mb-warning/20", text: "text-mb-warning-text" },
    info: { Icon: Info, label: "Info", tint: "bg-mb-info/20", text: "text-mb-info-text" },
};

/** An activity row plus a key that is stable and unique across the feed. */
interface KeyedActivityItem extends RecentActivityItem {
    /** Generated titles collide (two modules can share a month label), so the
     *  source and its index are part of the key — never the title alone. */
    key: string;
}

function getGreeting() {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

/**
 * The dashboard reads `?present=1` via useSearchParams, which suspends during
 * streaming — without this boundary the whole route would be forced into
 * client-side rendering (the login page already wraps its own reader).
 */
export default function DashboardPage() {
    return (
        <Suspense fallback={<DashboardSkeleton />}>
            <DashboardContent />
        </Suspense>
    );
}

/**
 * Loading placeholder shaped like the real page: command deck, chart pair,
 * YTD strip, coverage strip, updates. Previously it rendered only a deck block
 * and one chart row, so everything below jumped into place on load.
 */
function DashboardSkeleton() {
    return (
        <div className="space-y-6 sm:space-y-7 md:space-y-8 w-full" aria-busy="true" aria-live="polite">
            <span className="sr-only">Loading dashboard…</span>
            <div className="h-56 sm:h-64 rounded-[var(--radius)] bg-muted motion-safe:animate-pulse" />
            <div className="grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 lg:grid-cols-7">
                <div className="col-span-1 lg:col-span-4 h-[300px] motion-safe:animate-pulse rounded-xl bg-muted" />
                <div className="col-span-1 lg:col-span-3 h-[300px] motion-safe:animate-pulse rounded-xl bg-muted" />
            </div>
            <div className="h-[220px] rounded-xl bg-muted motion-safe:animate-pulse" />
            <div className="h-[260px] rounded-xl bg-muted motion-safe:animate-pulse" />
            <div className="h-[240px] rounded-xl bg-muted motion-safe:animate-pulse" />
        </div>
    );
}

function DashboardContent() {
    const { stats, chartData, stpChartData, recentActivity, ytd, loading, isLiveData, error } = useDashboardData();
    const { modules: coverageModules, loading: coverageLoading } = useModuleCoverage();
    const { operationalAlerts } = useAppNotifications();
    const [activityFilter, setActivityFilter] = useState<'all' | ActivityType>('all');
    const greeting = useMemo(() => getGreeting(), []);

    // Live operational alerts (loss exceedance, contract expiry, critical
    // failures) lead the Latest Updates feed — previously nothing could ever
    // produce a 'critical' item, so that filter was a dead control and the
    // dashboard read as healthy regardless of the data.
    //
    // Acknowledged alerts are filtered OUT here, matching alerts-feed.tsx.
    // Without this, acknowledging an alert in the bell silenced the badge but
    // left the item on the dashboard forever, with no way to clear it.
    const activityItems = useMemo<KeyedActivityItem[]>(() => {
        const alertItems: KeyedActivityItem[] = operationalAlerts
            .filter((a) => !a.acknowledged)
            .map((a) => ({
                key: `alert:${a.id}`,
                title: a.title,
                description: a.message,
                type: a.level === 'error' ? 'critical' : a.level === 'warning' ? 'warning' : 'info',
                href: a.href,
            }));
        const activityRows: KeyedActivityItem[] = recentActivity.map((item, index) => ({
            ...item,
            key: `activity:${index}:${item.title}`,
        }));
        return [...alertItems, ...activityRows];
    }, [operationalAlerts, recentActivity]);

    const visibleActivity = useMemo(
        () => activityItems.filter((item) => activityFilter === 'all' || item.type === activityFilter),
        [activityItems, activityFilter],
    );

    const { profile } = useAuth();
    const searchParams = useSearchParams();
    const isPresentMode = searchParams?.get("present") === "1";

    // First name for warmer greeting in daily mode
    const firstName = useMemo(() => {
        const full = profile?.full_name?.trim();
        if (!full) return "";
        return full.split(" ")[0];
    }, [profile?.full_name]);

    // Board-friendly date scope for presentation mode
    const presentScope = useMemo(() => {
        return new Date().toLocaleDateString("en-GB", {
            weekday: "long", day: "numeric", month: "long", year: "numeric",
        });
    }, []);

    // Headline string varies by mode
    const headlineTitle = isPresentMode
        ? "Muscat Bay — Operations Snapshot"
        : firstName ? `${greeting}, ${firstName}` : greeting;
    const headlineDescription = isPresentMode
        ? `Board briefing · ${presentScope}`
        : "Water, Electricity, and STP performance at a glance";

    // Icons + routes for the KPI deck. Only the metrics useDashboardData
    // actually emits are mapped — the previous CONTRACTOR / HVAC / PEST / FIRE
    // branches were unreachable (no such stat is ever produced). Those modules
    // are surfaced properly by the Module coverage section below.
    const statsWithIcons = useMemo<DeckStat[]>(() => stats.map(stat => ({
        ...stat,
        icon: stat.label.includes('COST') ? DollarSign :
            stat.label.includes('WATER') ? Droplets :
                stat.label.includes('ELECTRICITY') ? Zap :
                    stat.label.includes('STP INLET') ? Activity :
                        stat.label.includes('TSE') ? Recycle :
                            stat.label.includes('ECONOMIC') ? TrendingUp : Activity,
        href: stat.label.includes('WATER') ? '/water' :
            stat.label.includes('ELECTRICITY') ? '/electricity' :
                stat.label.includes('STP') || stat.label.includes('TSE') || stat.label.includes('ECONOMIC') ? '/stp' :
                    undefined,
    })), [stats]);

    const handleFilterClick = useCallback((filter: 'all' | ActivityType) => {
        setActivityFilter(filter);
    }, []);

    // Map activity item titles to their section routes. Only routes the feed can
    // actually produce titles for — alerts carry an explicit `href` anyway.
    const getActivityHref = useCallback((title: string): string | undefined => {
        const t = title.toLowerCase();
        if (t.includes('water')) return '/water';
        if (t.includes('electricity')) return '/electricity';
        if (t.includes('stp') || t.includes('tse') || t.includes('inlet') || t.includes('revenue')) return '/stp';
        if (t.includes('contractor')) return '/contractors';
        return undefined;
    }, []);

    if (loading) {
        return <DashboardSkeleton />;
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div role="alert" className="text-center space-y-4">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-mb-danger-light flex items-center justify-center">
                        <AlertTriangle className="w-7 h-7 text-destructive" aria-hidden="true" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground">Unable to load dashboard</p>
                        <p className="text-xs text-muted-foreground max-w-xs mx-auto">{error}</p>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/80 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                    >
                        Try again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 sm:space-y-7 md:space-y-8 w-full">
            <SectionBoundary title="Command deck">
                <CommandDeck
                    title={headlineTitle}
                    description={headlineDescription}
                    stats={statsWithIcons}
                    periodNote={PERIOD_BASIS_NOTE}
                    actions={
                        <div className="flex items-center gap-2 print:hidden">
                            {/* Board mode was reachable only through ⌘K and had no
                                way out once entered. Both directions are now visible
                                controls. */}
                            <Link
                                href={isPresentMode ? "/" : "/?present=1"}
                                aria-label={isPresentMode ? "Exit board presentation mode" : "Enter board presentation mode"}
                                title={isPresentMode ? "Exit board mode" : "Board mode — hides the updates feed for presenting"}
                                className="inline-flex items-center justify-center gap-1.5 min-h-11 min-w-11 sm:min-h-0 sm:min-w-0 px-2 sm:px-3 sm:py-1.5 text-xs font-medium rounded-md border border-white/20 text-white/80 hover:bg-white/10 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/60"
                            >
                                {isPresentMode
                                    ? <X className="h-4 w-4 sm:h-3.5 sm:w-3.5" aria-hidden="true" />
                                    : <LayoutDashboard className="h-4 w-4 sm:h-3.5 sm:w-3.5" aria-hidden="true" />}
                                <span className="hidden sm:inline">{isPresentMode ? "Exit board mode" : "Board mode"}</span>
                            </Link>
                            <button
                                onClick={() => window.print()}
                                aria-label="Print or save as PDF"
                                title="Print / Save as PDF"
                                className="inline-flex items-center justify-center gap-1.5 min-h-11 min-w-11 sm:min-h-0 sm:min-w-0 px-2 sm:px-3 sm:py-1.5 text-xs font-medium rounded-md border border-white/20 text-white/80 hover:bg-white/10 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/60"
                            >
                                <Printer className="h-4 w-4 sm:h-3.5 sm:w-3.5" aria-hidden="true" />
                                <span className="hidden sm:inline">Print</span>
                            </button>
                            <Badge variant={isLiveData ? "default" : "secondary"} className={`flex items-center gap-1.5 ${isLiveData ? "bg-mb-success text-primary-foreground" : "bg-mb-secondary text-mb-secondary-foreground"}`}>
                                {isLiveData ? <Wifi className="h-3 w-3" aria-hidden="true" /> : <WifiOff className="h-3 w-3" aria-hidden="true" />}
                                <span className="sm:inline hidden">{isLiveData ? "Live Data" : "Demo Mode"}</span>
                                <span className="sm:hidden">{isLiveData ? "Live" : "Demo"}</span>
                            </Badge>
                        </div>
                    }
                />
            </SectionBoundary>

            <SectionBoundary title="Trend charts">
                <DashboardCharts chartData={chartData} stpChartData={stpChartData} />
            </SectionBoundary>

            <SectionBoundary title="Year to date">
                <AnimateOnScroll>
                    <YtdPanel metrics={ytd} />
                </AnimateOnScroll>
            </SectionBoundary>

            <SectionBoundary title="Module coverage">
                <AnimateOnScroll>
                    <ModuleCoverageSection modules={coverageModules} loading={coverageLoading} />
                </AnimateOnScroll>
            </SectionBoundary>

            {/* Recent Activity Card — hidden in board presentation mode and in print */}
            <SectionBoundary title="Latest updates">
                <AnimateOnScroll className={isPresentMode ? "hidden" : "print:hidden"}>
                    <Card className="card-elevated">
                        <CardHeader className="card-elevated-header p-4 sm:p-5 md:p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                                <CardTitle>Latest Updates</CardTitle>
                                <div role="group" aria-label="Filter updates by type" className="flex items-center gap-1 bg-muted p-1 rounded-lg">
                                    {(['all', 'critical', 'warning', 'info'] as const).map(filter => (
                                        <button
                                            key={filter}
                                            onClick={() => handleFilterClick(filter)}
                                            aria-pressed={activityFilter === filter}
                                            className={`px-3 py-2.5 min-h-[44px] text-xs font-medium rounded-md transition-colors capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${activityFilter === filter
                                                ? filter === 'critical' ? 'bg-destructive text-primary-foreground'
                                                    : filter === 'warning' ? 'bg-mb-warning text-primary-foreground'
                                                        : filter === 'info' ? 'bg-mb-info text-primary-foreground'
                                                            : 'bg-primary text-primary-foreground'
                                                : 'text-muted-foreground hover:bg-card hover:text-foreground'
                                                }`}
                                        >
                                            {filter}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-5 md:p-6 pt-0">
                            <div aria-live="polite" aria-atomic="false">
                                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                    {visibleActivity.map((item) => {
                                        const activityHref = item.href ?? getActivityHref(item.title);
                                        const meta = ACTIVITY_META[item.type];
                                        const SeverityIcon = meta.Icon;
                                        const content = (
                                            <>
                                                <div className={`shrink-0 rounded-full p-2 ${meta.tint} ${meta.text}`}>
                                                    <SeverityIcon className="h-4 w-4" aria-hidden="true" />
                                                </div>
                                                <div className="space-y-1 min-w-0 flex-1">
                                                    {/* Severity is stated in text, not implied by colour alone */}
                                                    <p className={`text-[10px] font-semibold uppercase tracking-wide ${meta.text}`}>
                                                        {meta.label}
                                                    </p>
                                                    <p className="text-sm font-medium leading-none text-foreground">{item.title}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                                                </div>
                                                {activityHref && (
                                                    <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-40 group-hover/activity:opacity-100 transition-opacity flex-shrink-0" aria-hidden="true" />
                                                )}
                                            </>
                                        );

                                        const itemClassName = "flex items-center gap-3 p-3 rounded-lg bg-muted/60 border border-border hover:bg-card hover:border-border/80 group/activity motion-safe:hover:-translate-y-0.5 transition-[background-color,border-color,transform] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

                                        return activityHref ? (
                                            <Link
                                                key={item.key}
                                                href={activityHref}
                                                className={itemClassName}
                                                aria-label={`${meta.label}: ${item.title}. ${item.description}`}
                                            >
                                                {content}
                                            </Link>
                                        ) : (
                                            <div key={item.key} className={itemClassName}>
                                                {content}
                                            </div>
                                        );
                                    })}
                                    {visibleActivity.length === 0 && (
                                        <div className="col-span-full flex flex-col items-center gap-2 py-8 text-center">
                                            <Activity className="w-8 h-8 text-muted-foreground/70 dark:text-muted-foreground" aria-hidden="true" />
                                            <p className="text-sm text-muted-foreground">
                                                Nothing to show for the &ldquo;{activityFilter}&rdquo; filter — try another type or clear the filter to see all recent activity.
                                            </p>
                                            <button
                                                onClick={() => setActivityFilter('all')}
                                                className="text-xs text-secondary hover:underline font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                                            >
                                                Show all updates
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </AnimateOnScroll>
            </SectionBoundary>
        </div>
    );
}
