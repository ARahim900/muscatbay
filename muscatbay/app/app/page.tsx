"use client";

import { useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useAuth } from "@/components/auth/auth-provider";
import { StatsGrid } from "@/components/shared/stats-grid";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Droplets, Zap, AlertTriangle, ArrowUpRight, Boxes, Recycle, TrendingUp, Wifi, WifiOff, Printer } from "lucide-react";
import { AnimateOnScroll } from "@/components/shared/scroll-animation";
import Link from "next/link";

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

function getGreeting() {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

export default function DashboardPage() {
    const { stats, chartData, stpChartData, recentActivity, loading, isLiveData, error } = useDashboardData();
    const [activityFilter, setActivityFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');
    const greeting = useMemo(() => getGreeting(), []);
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

    // Add icons and navigation hrefs to stats (memoized to avoid recalc on every render)
    const statsWithIcons = useMemo(() => stats.map(stat => ({
        ...stat,
        icon: stat.label.includes('WATER') ? Droplets :
            stat.label.includes('ELECTRICITY') ? Zap :
                stat.label.includes('STP INLET') ? Activity :
                    stat.label.includes('TSE') ? Recycle :
                        stat.label.includes('ECONOMIC') ? TrendingUp :
                            stat.label.includes('ASSETS') ? Boxes : Activity,
        href: stat.label.includes('WATER') ? '/water' :
            stat.label.includes('ELECTRICITY') ? '/electricity' :
                stat.label.includes('STP') || stat.label.includes('TSE') || stat.label.includes('ECONOMIC') ? '/stp' :
                    stat.label.includes('ASSETS') ? '/assets' :
                        stat.label.includes('CONTRACTOR') ? '/contractors' :
                            stat.label.includes('HVAC') ? '/hvac' :
                                stat.label.includes('PEST') ? '/pest-control' :
                                    stat.label.includes('FIRE') ? '/firefighting' : undefined
    })), [stats]);

    const handleFilterClick = useCallback((filter: 'all' | 'critical' | 'warning' | 'info') => {
        setActivityFilter(filter);
    }, []);

    // Map activity item titles to their section routes
    const getActivityHref = useCallback((title: string): string | undefined => {
        const t = title.toLowerCase();
        if (t.includes('water')) return '/water';
        if (t.includes('electricity')) return '/electricity';
        if (t.includes('stp') || t.includes('tse') || t.includes('inlet') || t.includes('revenue')) return '/stp';
        if (t.includes('contractor')) return '/contractors';
        if (t.includes('asset')) return '/assets';
        if (t.includes('hvac')) return '/hvac';
        if (t.includes('pest')) return '/pest-control';
        if (t.includes('fire')) return '/firefighting';
        return undefined;
    }, []);

    if (loading) {
        return (
            <div className="space-y-6 md:space-y-8 w-full">
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <div className="h-7 w-48 bg-muted rounded-lg motion-safe:animate-pulse" />
                        <div className="h-4 w-72 bg-muted rounded motion-safe:animate-pulse" />
                    </div>
                </div>
                <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="bg-card rounded-xl border border-border p-4 sm:p-5 motion-safe:animate-pulse">
                            <div className="flex justify-between items-start gap-2">
                                <div className="space-y-2 flex-1">
                                    <div className="h-3 w-20 bg-muted rounded" />
                                    <div className="h-8 w-32 bg-muted rounded" />
                                </div>
                                <div className="w-9 h-9 bg-muted rounded-lg flex-shrink-0" />
                            </div>
                            <div className="mt-3 h-3 w-24 bg-muted rounded" />
                        </div>
                    ))}
                </div>
                <div className="grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 lg:grid-cols-7">
                    <div className="col-span-1 lg:col-span-4 h-[300px] motion-safe:animate-pulse rounded-xl bg-muted" />
                    <div className="col-span-1 lg:col-span-3 h-[300px] motion-safe:animate-pulse rounded-xl bg-muted" />
                </div>
            </div>
        );
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
        <div className="space-y-6 md:space-y-8 w-full">
            <div className="flex items-center justify-between print:items-start">
                <PageHeader
                    title={headlineTitle}
                    description={headlineDescription}
                />
                <div className="flex items-center gap-2 print:hidden">
                    <button
                        onClick={() => window.print()}
                        aria-label="Print or save as PDF"
                        title="Print / Save as PDF"
                        className="inline-flex items-center justify-center gap-1.5 min-h-11 min-w-11 sm:min-h-0 sm:min-w-0 px-2 sm:px-3 sm:py-1.5 text-xs font-medium rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/60"
                    >
                        <Printer className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                        <span className="hidden sm:inline">Print</span>
                    </button>
                    <Badge variant={isLiveData ? "default" : "secondary"} className={`flex items-center gap-1.5 ${isLiveData ? "bg-mb-success text-primary-foreground" : "bg-mb-secondary text-mb-secondary-foreground"}`}>
                        {isLiveData ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                        <span className="sm:inline hidden">{isLiveData ? "Live Data" : "Demo Mode"}</span>
                        <span className="sm:hidden">{isLiveData ? "Live" : "Demo"}</span>
                    </Badge>
                </div>
            </div>

            <StatsGrid stats={statsWithIcons} />

            <DashboardCharts chartData={chartData} stpChartData={stpChartData} />

            {/* Recent Activity Card — hidden in board presentation mode and in print */}
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
                                        className={`px-3 py-2.5 min-h-[44px] text-xs font-medium rounded-md transition-colors capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/60 ${activityFilter === filter
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
                            {recentActivity
                                .filter(item => activityFilter === 'all' || item.type === activityFilter)
                                .map((item) => {
                                    const activityHref = getActivityHref(item.title);
                                    const content = (
                                        <>
                                            <div className={`shrink-0 rounded-full p-2 ${item.type === 'critical' ? 'bg-mb-danger/20 text-[var(--mb-danger-text)]' :
                                                item.type === 'warning' ? 'bg-mb-warning/20 text-[var(--mb-warning-text)]' :
                                                    'bg-mb-info/20 text-[var(--mb-info-text)]'
                                                }`}>
                                                {item.type === 'critical' ? <AlertTriangle className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                                            </div>
                                            <div className="space-y-1 min-w-0 flex-1">
                                                <p className="text-sm font-medium leading-none text-foreground">{item.title}</p>
                                                <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                                            </div>
                                            {activityHref && (
                                                <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-40 group-hover/activity:opacity-100 transition-opacity flex-shrink-0" />
                                            )}
                                        </>
                                    );

                                    const itemClassName = "flex items-center gap-3 p-3 rounded-lg bg-muted/60 border border-border hover:bg-card hover:border-border/80 group/activity motion-safe:hover:-translate-y-0.5 transition-[background-color,border-color,transform] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/60";

                                    return activityHref ? (
                                        <Link
                                            key={item.title}
                                            href={activityHref}
                                            className={itemClassName}
                                            aria-label={`${item.title}: ${item.description}`}
                                        >
                                            {content}
                                        </Link>
                                    ) : (
                                        <div key={item.title} className={itemClassName}>
                                            {content}
                                        </div>
                                    );
                                })}
                            {recentActivity.filter(item => activityFilter === 'all' || item.type === activityFilter).length === 0 && (
                                <div className="col-span-full flex flex-col items-center gap-2 py-8 text-center">
                                    <Activity className="w-8 h-8 text-muted-foreground/70 dark:text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground">
                                        Nothing to show for the &ldquo;{activityFilter}&rdquo; filter — try another type or clear the filter to see all recent activity.
                                    </p>
                                    <button
                                        onClick={() => setActivityFilter('all')}
                                        className="text-xs text-secondary hover:underline font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/60 rounded"
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
        </div >
    );
}
