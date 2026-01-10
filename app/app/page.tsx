"use client";

import { useState } from "react";
import { useDashboardData } from "@/hooks/useDashboardData";
import { StatsGrid } from "@/components/shared/stats-grid";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Droplets, Zap, Users, AlertTriangle, ArrowUpRight, Boxes, Recycle, TrendingUp, Wifi, WifiOff } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";
import { LiquidTooltip } from "../components/charts/liquid-tooltip";

export default function DashboardPage() {
    const { stats, chartData, stpChartData, loading, isLiveData, error } = useDashboardData();
    const [activityFilter, setActivityFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');

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

    if (loading) {
        return <LoadingSpinner />;
    }

    if (error) {
        return (
            <div className="flex-1 space-y-8 p-4 sm:p-6 lg:p-8 pt-6">
                <div className="text-center">
                    <p className="text-red-500">{error}</p>
                    <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-8 p-4 sm:p-6 lg:p-8 pt-6">
            <div className="flex items-center justify-between">
                <PageHeader
                    title="Dashboard"
                    description="Overview of all operations and key metrics"
                />
                <Badge variant={isLiveData ? "default" : "secondary"} className={`flex items-center gap-1.5 ${isLiveData ? "bg-mb-success text-white" : "bg-mb-secondary text-mb-secondary-foreground"}`}>
                    {isLiveData ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                    {isLiveData ? "Live Data" : "Demo Mode"}
                </Badge>
            </div>

            <StatsGrid stats={statsWithIcons} />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="glass-card col-span-4">
                    <CardHeader className="glass-card-header">
                        <CardTitle className="flex items-center gap-2">
                            <Droplets className="h-5 w-5 text-mb-secondary" />
                            Water Production Trend
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">Monthly water production in thousand m³</p>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorWater" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#81D8D0" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#81D8D0" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" opacity={0.5} />
                                    <XAxis dataKey="month" className="text-xs" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} dy={10} />
                                    <YAxis className="text-xs" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                                    <Tooltip content={<LiquidTooltip />} cursor={{ stroke: 'rgba(0,0,0,0.1)', strokeWidth: 2 }} />
                                    <Area type="monotone" dataKey="water" stroke="#81D8D0" fill="url(#colorWater)" name="Water (k m³)" strokeWidth={3} activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }} animationDuration={1500} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card col-span-3">
                    <CardHeader className="glass-card-header">
                        <CardTitle className="flex items-center gap-2">
                            <Recycle className="h-5 w-5 text-mb-primary" />
                            STP Treatment Overview
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">Monthly inlet vs TSE output (k m³)</p>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stpChartData}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" opacity={0.5} />
                                    <XAxis dataKey="month" className="text-xs" tick={{ fontSize: 10, fill: "#6B7280" }} axisLine={false} tickLine={false} dy={10} />
                                    <YAxis className="text-xs" tick={{ fontSize: 10, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                                    <Tooltip content={<LiquidTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)', radius: 4 }} />
                                    <Legend iconType="circle" />
                                    <Bar dataKey="inlet" name="Inlet" fill="#4E4456" radius={[4, 4, 0, 0]} animationDuration={1500} />
                                    <Bar dataKey="tse" name="TSE Output" fill="#81D8D0" radius={[4, 4, 0, 0]} animationDuration={1500} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity Card */}
            <Card className="glass-card">
                <CardHeader className="glass-card-header">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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
                                        : 'text-muted-foreground hover:bg-white/50 dark:hover:bg-slate-700/50'
                                        }`}
                                >
                                    {filter}
                                </button>
                            ))}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {[
                            { title: "High Water Loss Detected", time: "2 hours ago", type: "critical" },
                            { title: "STP Pump Station Maintenance", time: "5 hours ago", type: "warning" },
                            { title: "New Contractor Onboarded", time: "1 day ago", type: "info" },
                            { title: "Monthly Reports Generated", time: "2 days ago", type: "info" },
                        ].filter(item => activityFilter === 'all' || item.type === activityFilter).map((item, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/30 dark:bg-slate-800/30 border border-mb-primary/5 hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors">
                                <div className={`rounded-full p-2 ${item.type === 'critical' ? 'bg-mb-danger/20 text-mb-danger' :
                                    item.type === 'warning' ? 'bg-mb-warning/20 text-mb-warning' :
                                        'bg-mb-info/20 text-mb-info' // Info/Normal items use Light Teal
                                    }`}>
                                    {item.type === 'critical' ? <AlertTriangle className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium leading-none text-mb-primary dark:text-mb-primary-light">{item.title}</p>
                                    <p className="text-xs text-muted-foreground">{item.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}