"use client";

import { ReactNode } from "react";
import { ResponsiveContainer } from "recharts";

interface ChartContainerProps {
    children: ReactNode;
    height?: string | number;
    className?: string;
    minHeight?: number;
}

/**
 * A wrapper component that ensures ResponsiveContainer gets proper dimensions
 * using debounce and explicit min-height styling.
 */
export function ChartContainer({
    children,
    height = "100%",
    className = "",
    minHeight = 200,
}: ChartContainerProps) {
    return (
        <div
            className={`w-full ${className}`}
            style={{
                height,
                minHeight,
                position: 'relative',
            }}
        >
            <ResponsiveContainer
                width="100%"
                height="100%"
                debounce={100}
            >
                {children}
            </ResponsiveContainer>
        </div>
    );
}

