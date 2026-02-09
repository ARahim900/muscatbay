"use client";

import { useState, useMemo } from "react";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useDataRefresh } from "@/components/layout/data-refresh-context";
import { StatsGrid } from "@/components/shared/stats-grid";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Droplets, Zap, Users, AlertTriangle, ArrowUpRight, Boxes, Recycle, TrendingUp, Wifi, WifiOff, RefreshCw, Clock } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Legend } from "recharts";
import { LiquidTooltip } from "../components/charts/liquid-tooltip";
import { ChartContainer } from "../components/charts/chart-container";

export default function DashboardPage() {
    const { stats, chartData, stpChartData, loading, isLiveData, error, lastUpdated, refetch } = useDashboardData();
    const [activityFilter, setActivityFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Add icons to stats
    const statsWithIcons = stats.map(stat => ({
        ...stat,
        icon: stat.label.includes('WATER') ? Droplets :
            stat.label.includes('ELECTRICITY') ? Zap :
                stat.label.includes('STP INLET') ? Activity :
                    stat.label.includes('TSE') ? Recycle :
                        stat.label.includes('ECONOMIC') ? TrendingUp :
                            stat.label.includes('CONTRACTORS') ? Users :
                                stat.label.includes('ASSETS') ? Boxes : Activity
    }));

    // Generate dynamic activity items based on actual dashboard data
    const activityItems = useMemo(() => {
        const items: { title: string; time: string; type: 'critical' | 'warning' | 'info' }[] = [];

        if (stats.length > 0) {
            // Check STP trends for alerts
            const stpStat = stats.find(s => s.label === 'STP INLET FLOW');
            if (stpStat?.trend === 'down') {
                items.push({ title: "STP Inlet Flow Decreased", time: "Current period", type: "warning" });
            }

            // Check electricity trends
            const elecStat = stats.find(s => s.label === 'ELECTRICITY USAGE');
            if (elecStat?.trend === 'up') {
                items.push({ title: "Electricity Usage Trending Up", time: "Current period", type: "warning" });
            }

            // Check water production
            const waterStat = stats.find(s => s.label === 'WATER PRODUCTION');
            if (waterStat?.trend === 'down') {
                items.push({ title: "Water Production Decreased", time: "Current period", type: "critical" });
            } else if (waterStat?.trend === 'up') {
                items.push({ title: "Water Production Increased", time: "Current period", type: "info" });
            }

            // TSE output status
            const tseStat = stats.find(s => s.label === 'TSE OUTPUT');
            if (tseStat) {
                items.push({ title: "TSE Recycled Water Output Updated", time: "Current period", type: "info" });
            }

            // Economic impact
            const ecoStat = stats.find(s => s.label === 'STP ECONOMIC IMPACT');
            if (ecoStat?.trend === 'up') {
                items.push({ title: "STP Economic Impact Improved", time: "Current period", type: "info" });
            }
        }

        // Always show at least some items
        if (items.length === 0) {
            items.push(
                { title: "Dashboard Data Loaded", time: "Just now", type: "info" },
                { title: "All Systems Operational", time: "Current", type: "info" }
            );
        }

        return items;
    }, [stats]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await refetch();
        setIsRefreshing(false);
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
                        onClick={handleRefresh}
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
                <div className="flex items-center gap-3">
                    {/* Last Updated Timestamp */}
                    {lastUpdated && (
                        <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>Updated {lastUpdated.toLocaleTimeString()}</span>
                        </div>
                    )}
                    {/* Refresh Button */}
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                        title="Refresh dashboard data"
                    >
                        <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                        {isRefreshing ? 'Refreshing...' : 'Refresh'}
                    </button>
                    {/* Live/Demo Badge */}
                    <Badge variant={isLiveData ? "default" : "secondary"} className={`flex items-center gap-1.5 ${isLiveData ? "bg-mb-success text-white" : "bg-mb-secondary text-mb-secondary-foreground"}`}>
                        {isLiveData ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                        {isLiveData ? "Live Data" : "Demo Mode"}
                    </Badge>
                </div>
            </div>

            <StatsGrid stats={statsWithIcons} />

            <div className="grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 lg:grid-cols-7">
                <Card className="glass-card col-span-1 lg:col-span-4">
                    <CardHeader className="glass-card-header p-4 sm:p-5 md:p-6">
                        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                            <Droplets className="h-5 w-5 text-mb-secondary" />
                            Water Production Trend
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

                <Card className="glass-card col-span-1 lg:col-span-3">
                    <CardHeader className="glass-card-header p-4 sm:p-5 md:p-6">
                        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                            <Recycle className="h-5 w-5 text-mb-primary" />
                            STP Treatment Overview
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
            </div>

            {/* Recent Activity Card */}
            <Card className="glass-card">
                <CardHeader className="glass-card-header p-4 sm:p-5 md:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                        <div>
                            <CardTitle>Recent Activity</CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Latest operational alerts and logs
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
                        {activityItems
                            .filter(item => activityFilter === 'all' || item.type === activityFilter)
                            .map((item, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/30 dark:bg-slate-800/50 border border-mb-primary/5 dark:border-slate-700 hover:bg-white/50 dark:hover:bg-slate-700 transition-colors">
                                <div className={`rounded-full p-2 ${item.type === 'critical' ? 'bg-mb-danger/20 text-mb-danger' :
                                    item.type === 'warning' ? 'bg-mb-warning/20 text-mb-warning' :
                                        'bg-mb-info/20 text-mb-info'
                                    }`}>
                                    {item.type === 'critical' ? <AlertTriangle className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium leading-none text-mb-primary dark:text-slate-100">{item.title}</p>
                                    <p className="text-xs text-muted-foreground">{item.time}</p>
                                </div>
                            </div>
                        ))}
                        {activityItems.filter(item => activityFilter === 'all' || item.type === activityFilter).length === 0 && (
                            <div className="col-span-full text-center py-4 text-sm text-muted-foreground">
                                No {activityFilter} alerts at this time
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div >
    );
}
