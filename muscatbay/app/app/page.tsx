"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useDashboardData } from "@/hooks/useDashboardData";
import { StatsGrid } from "@/components/shared/stats-grid";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Droplets, Zap, AlertTriangle, ArrowUpRight, Boxes, Recycle, TrendingUp, Wifi, WifiOff } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Legend } from "recharts";
import { LiquidTooltip } from "../components/charts/liquid-tooltip";
import { ChartContainer } from "../components/charts/chart-container";
import { AnimateOnScroll } from "@/components/shared/scroll-animation";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
    const router = useRouter();
    const { stats, chartData, stpChartData, recentActivity, loading, isLiveData, error } = useDashboardData();
    const [activityFilter, setActivityFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');

    // Add icons and navigation hrefs to stats
    const statsWithIcons = stats.map(stat => ({
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
    }));

    // Map activity item titles to their section routes
    const getActivityHref = (title: string): string | undefined => {
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
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center space-y-4">
                    <p className="text-red-500 text-sm">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-mb-primary text-white rounded-lg hover:bg-mb-primary/90 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 sm:space-y-7 md:space-y-8 w-full">
            <div className="flex items-center justify-between">
                <PageHeader
                    title="Dashboard"
                    description="Overview of all operations and key metrics"
                />
                <div className="flex items-center gap-2">

                    <Badge variant={isLiveData ? "default" : "secondary"} className={`flex items-center gap-1.5 ${isLiveData ? "bg-mb-success text-white" : "bg-mb-secondary text-mb-secondary-foreground"}`}>
                        {isLiveData ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                        {isLiveData ? "Live Data" : "Demo Mode"}
                    </Badge>
                </div>
            </div>

            <StatsGrid stats={statsWithIcons} />

            <AnimateOnScroll className="grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 lg:grid-cols-7">
                <Card
                    className="glass-card col-span-1 lg:col-span-4 cursor-pointer group/chart transition-shadow duration-200 hover:shadow-[0_8px_30px_-4px_rgba(6,81,237,0.15)]"
                    onClick={() => router.push('/water')}
                >
                    <CardHeader className="glass-card-header p-4 sm:p-5 md:p-6">
                        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                            <Droplets className="h-5 w-5 text-mb-secondary" />
                            Water Production Trend
                            <ArrowUpRight className="h-4 w-4 ml-auto text-muted-foreground opacity-0 group-hover/chart:opacity-100 transition-opacity" />
                        </CardTitle>
                        <p className="text-xs sm:text-sm text-muted-foreground">Monthly water production in thousand m³</p>
                    </CardHeader>
                    <ChartContainer height="100%" className="h-[200px] sm:h-[250px] md:h-[300px]">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorWater" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#81D8D0" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#81D8D0" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" opacity={0.5} />
                            <XAxis dataKey="month" className="text-xs" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} dy={10} />
                            <YAxis className="text-xs" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} label={{ value: 'k m³', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6B7280', fontSize: 11 } }} />
                            <Tooltip content={<LiquidTooltip />} cursor={{ stroke: 'rgba(0,0,0,0.1)', strokeWidth: 2 }} />
                            <Legend iconType="circle" wrapperStyle={{ paddingTop: 10 }} />
                            <Area type="monotone" dataKey="water" stroke="#81D8D0" fill="url(#colorWater)" name="Water (k m³)" strokeWidth={3} activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }} animationDuration={1500} />
                        </AreaChart>
                    </ChartContainer>
                </Card>

                <Card
                    className="glass-card col-span-1 lg:col-span-3 cursor-pointer group/chart transition-shadow duration-200 hover:shadow-[0_8px_30px_-4px_rgba(6,81,237,0.15)]"
                    onClick={() => router.push('/stp')}
                >
                    <CardHeader className="glass-card-header p-4 sm:p-5 md:p-6">
                        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                            <Recycle className="h-5 w-5 text-mb-primary" />
                            STP Treatment Overview
                            <ArrowUpRight className="h-4 w-4 ml-auto text-muted-foreground opacity-0 group-hover/chart:opacity-100 transition-opacity" />
                        </CardTitle>
                        <p className="text-xs sm:text-sm text-muted-foreground">Monthly inlet vs TSE output (k m³)</p>
                    </CardHeader>
                    <ChartContainer height="100%" className="h-[200px] sm:h-[250px] md:h-[300px]">
                        <BarChart data={stpChartData}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" opacity={0.5} />
                            <XAxis dataKey="month" className="text-xs" tick={{ fontSize: 10, fill: "#6B7280" }} axisLine={false} tickLine={false} dy={10} />
                            <YAxis className="text-xs" tick={{ fontSize: 10, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                            <Tooltip content={<LiquidTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)', radius: 4 }} />
                            <Legend iconType="circle" />
                            <Bar dataKey="inlet" name="Inlet" fill="#4E4456" radius={[4, 4, 0, 0]} animationDuration={1500} />
                            <Bar dataKey="tse" name="TSE Output" fill="#81D8D0" radius={[4, 4, 0, 0]} animationDuration={1500} />
                        </BarChart>
                    </ChartContainer>
                </Card>
            </AnimateOnScroll>

            {/* Recent Activity Card */}
            <AnimateOnScroll>
                <Card className="glass-card">
                    <CardHeader className="glass-card-header p-4 sm:p-5 md:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                            <div>
                                <CardTitle>Latest Updates</CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    Live data from all operational systems
                                </p>
                            </div>
                            <div className="flex items-center gap-1 bg-white/50 dark:bg-slate-800/50 p-1 rounded-lg">
                                {(['all', 'critical', 'warning', 'info'] as const).map(filter => (
                                    <button
                                        key={filter}
                                        onClick={() => setActivityFilter(filter)}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${activityFilter === filter
                                            ? filter === 'critical' ? 'bg-mb-danger text-white'
                                                : filter === 'warning' ? 'bg-mb-warning text-white'
                                                    : filter === 'info' ? 'bg-mb-info text-white'
                                                        : 'bg-mb-primary text-white'
                                            : 'text-muted-foreground hover:bg-white/50 dark:hover:bg-slate-700/50 dark:text-slate-400'
                                            }`}
                                    >
                                        {filter}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-5 md:p-6 pt-0">
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

                                    const itemClassName = "flex items-center gap-3 p-3 rounded-lg bg-white/30 dark:bg-slate-800/50 border border-mb-primary/5 dark:border-slate-700 hover:bg-white/50 dark:hover:bg-slate-700 transition-colors group/activity";

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
                        </div>
                    </CardContent>
                </Card>
            </AnimateOnScroll>
        </div >
    );
}