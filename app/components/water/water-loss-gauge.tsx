"use client";

import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer, Cell } from "recharts";
import { cn } from "@/lib/utils";

interface WaterLossGaugeProps {
    score: number; // 0 to 100
    label: string;
    subLabel?: string;
    size?: number;
    className?: string;
}

export function WaterLossGauge({ score, label, subLabel, size = 200, className }: WaterLossGaugeProps) {
    // Normalize score between 0 and 100
    const normalizedScore = Math.max(0, Math.min(100, score));

    // Determine color based on score (Efficiency)
    // High score (90+) = Good (Green)
    // Mid score (70-90) = Warning (Yellow/Orange)
    // Low score (<70) = Bad (Red)
    let color = "#ef4444"; // Red (Bad)
    let statusText = "Critical Loss";

    if (normalizedScore >= 95) {
        color = "#22c55e"; // Green (Excellent)
        statusText = "Excellent";
    } else if (normalizedScore >= 90) {
        color = "#84cc16"; // Lime (Good)
        statusText = "Good";
    } else if (normalizedScore >= 80) {
        color = "#eab308"; // Yellow (Warning)
        statusText = "Moderate Loss";
    } else if (normalizedScore >= 70) {
        color = "#f97316"; // Orange (High Loss)
        statusText = "High Loss";
    }

    const data = [{ name: "score", value: normalizedScore }];

    return (
        <div className={cn("flex flex-col items-center justify-center p-4 rounded-xl backdrop-blur-md bg-card/30 border border-white/10 shadow-xl", className)}>
            <div className="relative" style={{ width: size, height: size }}>
                <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                        cx="50%"
                        cy="50%"
                        innerRadius="70%"
                        outerRadius="100%"
                        barSize={12}
                        data={data}
                        startAngle={90}
                        endAngle={-270}
                    >
                        <PolarAngleAxis
                            type="number"
                            domain={[0, 100]}
                            angleAxisId={0}
                            tick={false}
                        />
                        <RadialBar
                            background
                            dataKey="value"
                            cornerRadius={30} // Rounded caps
                            fill={color}
                        >
                            {/* Add a glow effect defs if needed or handle via CSS filter on parent */}
                        </RadialBar>
                    </RadialBarChart>
                </ResponsiveContainer>

                {/* Center Text overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-bold tracking-tighter" style={{ color }}>
                        {normalizedScore.toFixed(1)}%
                    </span>
                    <span className="text-xs text-muted-foreground uppercase tracking-widest mt-1 font-medium">
                        Efficiency
                    </span>
                </div>
            </div>

            <div className="mt-2 text-center">
                <h3 className="text-lg font-semibold text-foreground tracking-tight">{label}</h3>
                {subLabel && <p className="text-sm text-muted-foreground">{subLabel}</p>}
                <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground border border-border/50">
                    {statusText}
                </div>
            </div>
        </div>
    );
}
