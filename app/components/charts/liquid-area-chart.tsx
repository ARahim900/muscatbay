"use strict";

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    TooltipProps,
    LabelList,
} from "recharts";

interface LiquidAreaChartProps {
    data: any[];
    categories: string[];
    index: string;
    colors?: string[]; // Hex codes
    height?: number;
    showGrid?: boolean;
    elementId?: string; // For gradient definitions
    showLabels?: boolean;
}

const DEFAULT_COLORS = ["#4E4456", "#81D8D0", "#5BA88B"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="glass-card px-4 py-3 border border-white/50 shadow-xl !rounded-xl !bg-white/80 dark:!bg-slate-900/80 backdrop-blur-md">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">{label}</p>
                {payload.map((entry: { color: string; name: string; value: number }, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-xs mb-1 last:mb-0">
                        <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-slate-500 dark:text-slate-400 capitalize">
                            {entry.name}:
                        </span>
                        <span className="font-mono font-medium text-slate-700 dark:text-slate-200">
                            {Number(entry.value).toLocaleString()}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export function LiquidAreaChart({
    data,
    categories,
    index,
    colors = DEFAULT_COLORS,
    height = 350,
    showGrid = false,
    elementId = "liquid-area",
    showLabels = false,
}: LiquidAreaChartProps) {
    // Format value for display - using any to satisfy Recharts LabelFormatter type
    const formatLabel = (value: any): string => {
        if (value === undefined || value === null) return '';
        const numValue = typeof value === 'string' ? parseFloat(value) : Number(value);
        if (isNaN(numValue)) return String(value);
        if (numValue >= 1000000) return `${(numValue / 1000000).toFixed(1)}M`;
        if (numValue >= 1000) return `${(numValue / 1000).toFixed(1)}k`;
        return numValue.toLocaleString();
    };

    return (
        <div style={{ width: "100%", height, minHeight: 200 }}>
            <ResponsiveContainer>
                <AreaChart data={data} margin={{ top: showLabels ? 25 : 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                        {categories.map((cat, i) => {
                            const color = colors[i % colors.length];
                            const id = `${elementId}-gradient-${i}`;
                            return (
                                <linearGradient key={cat} id={id} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={color} stopOpacity={0.6} />
                                    <stop offset="95%" stopColor={color} stopOpacity={0.1} />
                                </linearGradient>
                            );
                        })}
                    </defs>
                    {showGrid && (
                        <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="rgba(0,0,0,0.05)"
                        />
                    )}
                    <XAxis
                        dataKey={index}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#6B7280", fontSize: 12 }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#6B7280", fontSize: 12 }}
                        tickFormatter={(value) =>
                            value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value
                        }
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(0,0,0,0.1)", strokeWidth: 2 }} />
                    {categories.map((cat, i) => (
                        <Area
                            key={cat}
                            type="monotone"
                            dataKey={cat}
                            stroke={colors[i % colors.length]}
                            strokeWidth={3}
                            fill={`url(#${elementId}-gradient-${i})`}
                            animationDuration={1500}
                            dot={{ r: 4, strokeWidth: 2, fill: "#fff", stroke: colors[i % colors.length] }}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                        >
                            {showLabels && (
                                <LabelList
                                    dataKey={cat}
                                    position="top"
                                    formatter={formatLabel}
                                    style={{
                                        fill: "#374151",
                                        fontSize: 9,
                                        fontWeight: 600,
                                    }}
                                />
                            )}
                        </Area>
                    ))}
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
