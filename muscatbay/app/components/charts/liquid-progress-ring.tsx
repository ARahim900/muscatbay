"use client";

import React from 'react';
import { CHART_PALETTE } from "@/lib/tokens";

interface LiquidProgressRingProps {
    value: number;
    max?: number;
    size?: number;
    strokeWidth?: number;
    color?: string;
    label?: string;
    sublabel?: string;
    showPercentage?: boolean;
    elementId?: string;
    unit?: string;
    statusBadge?: string;
    statusColor?: string;
    displayValue?: number;
}

export function LiquidProgressRing({
    value,
    max = 100,
    size = 120,
    strokeWidth = 10,
    color = CHART_PALETTE[1],
    label,
    sublabel,
    showPercentage = true,
    elementId = "ring-grad",
    unit,
    statusBadge,
    statusColor,
    displayValue = value,
}: LiquidProgressRingProps) {
    const percentage = Math.min(Math.max(value / max, 0), 1);
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - percentage * circumference;

    const formatValue = (v: number) => {
        const sign = v < 0 ? '-' : '';
        const absValue = Math.abs(v);
        if (absValue >= 10000) return `${sign}${(absValue / 1000).toFixed(1)}k`;
        if (absValue >= 1000) return `${sign}${(absValue / 1000).toFixed(1)}k`;
        if (absValue === 0) return '0';
        if (absValue < 10) return `${sign}${absValue.toFixed(1)}`;
        return `${sign}${Math.round(absValue).toLocaleString('en-US')}`;
    };

    return (
        <div className="flex flex-col items-center">
            <div className="relative" style={{ width: size, height: size }}>
                <svg
                    width={size}
                    height={size}
                    viewBox={`0 0 ${size} ${size}`}
                    className="transform -rotate-90 origin-center"
                >
                    <defs>
                        <linearGradient id={`${elementId}-gradient`} x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor={color} stopOpacity="1" />
                            <stop offset="100%" stopColor={color} stopOpacity="0.6" />
                        </linearGradient>
                        <filter id={`${elementId}-glow`} x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="3" result="blur" />
                            <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Background Circle — var(--chart-grid) flips with theme, no dark: override needed */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke="var(--chart-grid)"
                        strokeWidth={strokeWidth}
                        fill="none"
                    />

                    {/* Progress Circle with glow */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke={`url(#${elementId}-gradient)`}
                        strokeWidth={strokeWidth}
                        fill="none"
                        strokeLinecap="round"
                        filter={`url(#${elementId}-glow)`}
                        style={{
                            strokeDasharray: circumference,
                            strokeDashoffset: offset,
                            transition: "stroke-dashoffset 1s ease-in-out",
                        }}
                    />
                </svg>

                {/* Center Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    {showPercentage ? (
                        <span className="text-2xl font-bold text-foreground">
                            {Math.round(percentage * 100)}%
                        </span>
                    ) : (
                        <>
                            <span className="text-2xl font-bold text-foreground">
                                {formatValue(displayValue)}
                            </span>
                            {unit && (
                                <span className="text-[10px] font-medium text-muted-foreground/70 -mt-0.5">
                                    {unit}
                                </span>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Labels */}
            {(label || sublabel || statusBadge) && (
                <div className="mt-2 text-center">
                    {label && (
                        <p className="text-sm font-medium text-muted-foreground">
                            {label}
                        </p>
                    )}
                    {sublabel && (
                        <p className="text-xs text-muted-foreground/70 mt-0.5">
                            {sublabel}
                        </p>
                    )}
                    {statusBadge && (
                        <span
                            className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold text-white"
                            style={{ backgroundColor: statusColor || 'var(--chart-axis)' }}
                        >
                            {statusBadge}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
