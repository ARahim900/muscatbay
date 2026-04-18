"use client";

import { useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { useDashboardData } from "@/hooks/useDashboardData";
import { StatsGrid } from "@/components/shared/stats-grid";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Droplets, Zap, AlertTriangle, ArrowUpRight, Boxes, Recycle, TrendingUp, Wifi, WifiOff } from "lucide-react";
import { AnimateOnScroll } from "@/components/shared/scroll-animation";
import Link from "next/link";

// Lazy-load charts — Recharts (~180 kB) deferred until after header + stats render
const DashboardCharts = dynamic(() => import("@/components/charts/dashboard-charts"), {
    loading: () => (
        <div className="grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 lg:grid-cols-7">
            <div className="card-elevated col-span-1 lg:col-span-4 h-[300px] motion-safe:animate-pulse rounded-xl bg-slate-200/50 dark:bg-slate-800/50" />
            <div className="card-elevated col-span-1 lg:col-span-3 h-[300px] motion-safe:animate-pulse rounded-xl bg-slate-200/50 dark:bg-slate-800/50" />
        </div>
    ),
    ssr: false,
});

export default function DashboardPage() {
    const { stats, chartData, stpChartData, recentActivity, loading, isLiveData, error } = useDashboardData();
    const [activityFilter, setActivityFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');

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
                        <div className="h-7 w-48 bg-slate-200 dark:bg-slate-700 rounded-lg motion-safe:animate-pulse" />
                        <div className="h-4 w-72 bg-slate-200 dark:bg-slate-700 rounded motion-safe:animate-pulse" />
                    </div>
                </div>
                <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 motion-safe:animate-pulse">
                            <div className="flex justify-between items-start gap-2">
                                <div className="space-y-2 flex-1">
                                    <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
                                    <div className="h-6 w-28 bg-slate-200 dark:bg-slate-700 rounded" />
                                </div>
                                <div className="w-9 h-9 bg-slate-200 dark:bg-slate-700 rounded-lg flex-shrink-0" />
                            </div>
                            <div className="mt-3 h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
                        </div>
                    ))}
                </div>
                <div className="grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 lg:grid-cols-7">
                    <div className="col-span-1 lg:col-span-4 h-[300px] motion-safe:animate-pulse rounded-xl bg-slate-200/50 dark:bg-slate-800/50" />
                    <div className="col-span-1 lg:col-span-3 h-[300px] motion-safe:animate-pulse rounded-xl bg-slate-200/50 dark:bg-slate-800/50" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center space-y-4">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                        <AlertTriangle className="w-7 h-7 text-red-500" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Unable to load dashboard</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">{error}</p>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors duration-200"
                    >
                        Try again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 md:space-y-8 w-full">
            <div className="flex items-center justify-between">
                <PageHeader
                    title={`${new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening'}`}
                    description="Water, Electricity, and STP performance at a glance"
                />
                <div className="flex items-center gap-2">

                    <Badge variant={isLiveData ? "default" : "secondary"} className={`flex items-center gap-1.5 ${isLiveData ? "bg-mb-success text-white" : "bg-mb-secondary text-mb-secondary-foreground"}`}>
                        {isLiveData ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                        {isLiveData ? "Live Data" : "Demo Mode"}
                    </Badge>
                </div>
            </div>

            <StatsGrid stats={statsWithIcons} />

            <DashboardCharts chartData={chartData} stpChartData={stpChartData} />

            {/* Recent Activity Card */}
            <AnimateOnScroll>
                <Card className="card-elevated">
                    <CardHeader className="card-elevated-header p-4 sm:p-5 md:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                            <CardTitle>Latest Updates</CardTitle>
                            <div className="flex items-center gap-1 bg-white/50 dark:bg-slate-800/50 p-1 rounded-lg">
                                {(['all', 'critical', 'warning', 'info'] as const).map(filter => (
                                    <button
                                        key={filter}
                                        onClick={() => handleFilterClick(filter)}
                                        aria-pressed={activityFilter === filter}
                                        className={`px-3 py-2.5 min-h-[44px] text-xs font-medium rounded-md transition-colors capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/60 ${activityFilter === filter
                                            ? filter === 'critical' ? 'bg-mb-danger text-white'
                                                : filter === 'warning' ? 'bg-mb-warning text-white'
                                                    : filter === 'info' ? 'bg-mb-info text-white'
                                                        : 'bg-primary text-white'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
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
                                .map((item, i) => {
                                    const activityHref = getActivityHref(item.title);
                                    const content = (
                                        <>
                                            <div className={`shrink-0 rounded-full p-2 ${item.type === 'critical' ? 'bg-mb-danger/20 text-mb-danger' :
                                                item.type === 'warning' ? 'bg-mb-warning/20 text-mb-warning' :
                                                    'bg-mb-info/20 text-mb-info'
                                                }`}>
                                                {item.type === 'critical' ? <AlertTriangle className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                                            </div>
                                            <div className="space-y-1 min-w-0 flex-1">
                                                <p className="text-sm font-medium leading-none text-mb-primary dark:text-slate-100">{item.title}</p>
                                                <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                                            </div>
                                            {activityHref && (
                                                <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover/activity:opacity-100 transition-opacity flex-shrink-0" />
                                            )}
                                        </>
                                    );

                                    const itemClassName = "flex items-center gap-3 p-3 rounded-lg bg-white/30 dark:bg-slate-800/50 border border-mb-primary/5 dark:border-slate-700 hover:bg-white/50 dark:hover:bg-slate-700 transition-colors group/activity hover:-translate-y-0.5 transition-transform duration-150";

                                    return activityHref ? (
                                        <Link key={i} href={activityHref} className={itemClassName}>
                                            {content}
                                        </Link>
                                    ) : (
                                        <div key={i} className={itemClassName}>
                                            {content}
                                        </div>
                                    );
                                })}
                            {recentActivity.filter(item => activityFilter === 'all' || item.type === activityFilter).length === 0 && (
                                <div className="col-span-full flex flex-col items-center gap-2 py-8 text-center">
                                    <Activity className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                                    <p className="text-sm text-slate-500 dark:text-slate-400">No records for the selected period.</p>
                                    <button
                                        onClick={() => setActivityFilter('all')}
                                        className="text-xs text-secondary hover:underline font-medium"
                                    >
                                        Clear filters
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