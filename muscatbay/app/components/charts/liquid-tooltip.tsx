"use client";

interface LiquidTooltipProps {
    active?: boolean;
    payload?: Array<{ color: string; name: string; value: number | string }>;
    label?: string;
}

export const LiquidTooltip = ({ active, payload, label }: LiquidTooltipProps) => {
    if (active && payload && payload.length) {
        return (
            <div className="px-4 py-3 border border-border shadow-xl rounded-xl bg-card">
                <p className="text-sm font-semibold text-foreground mb-2">{label}</p>
                {payload.map((entry, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-xs mb-1 last:mb-0">
                        <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-muted-foreground capitalize">
                            {entry.name}:
                        </span>
                        <span className="font-mono font-medium text-foreground">
                            {typeof entry.value === 'number'
                                ? entry.value >= 1000
                                    ? `${(entry.value / 1000).toFixed(1)}k`
                                    : entry.value.toLocaleString('en-US', { maximumFractionDigits: 1 })
                                : entry.value}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};
