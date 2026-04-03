"use strict";

interface LiquidTooltipProps {
    active?: boolean;
    payload?: Array<{ color: string; name: string; value: number | string }>;
    label?: string;
}

export const LiquidTooltip = ({ active, payload, label }: LiquidTooltipProps) => {
    if (active && payload && payload.length) {
        return (
            <div className="px-4 py-3 border border-slate-200 dark:border-slate-700 shadow-xl rounded-xl bg-white dark:bg-slate-900">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">{label}</p>
                {payload.map((entry, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-xs mb-1 last:mb-0">
                        <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-slate-500 dark:text-slate-400 capitalize">
                            {entry.name}:
                        </span>
                        <span className="font-mono font-medium text-slate-700 dark:text-slate-200">
                            {typeof entry.value === 'number'
                                ? entry.value >= 1000
                                    ? `${(entry.value / 1000).toFixed(1)}k`
                                    : entry.value.toLocaleString()
                                : entry.value}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};
