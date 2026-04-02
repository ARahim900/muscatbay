
import { cn } from "@/lib/utils";

interface FilterOption {
    value: string;
    label: string;
    color?: string;
}

interface FilterTabsProps {
    label?: string;
    options: FilterOption[];
    value: string;
    onChange: (value: string) => void;
    className?: string;
}

const colorMap: Record<string, { bg: string; text: string }> = {
    red: { bg: "bg-red-500 dark:bg-red-600", text: "text-white" },
    orange: { bg: "bg-amber-500 dark:bg-amber-600", text: "text-white" },
    green: { bg: "bg-emerald-500 dark:bg-emerald-600", text: "text-white" },
    blue: { bg: "bg-blue-500 dark:bg-blue-600", text: "text-white" },
    teal: { bg: "bg-teal-500 dark:bg-teal-600", text: "text-white" },
};

export function FilterTabs({ label, options, value, onChange, className }: FilterTabsProps) {
    return (
        <div className={cn("flex items-center gap-3", className)}>
            {label && <span className="text-sm text-muted-foreground hidden sm:inline-block">{label}:</span>}
            <div className="flex p-1 bg-slate-100/80 dark:bg-slate-800/60 rounded-lg border border-slate-200/60 dark:border-slate-700/50">
                {options.map((option) => {
                    const isSelected = value === option.value;
                    const colorStyle = option.color && colorMap[option.color];
                    return (
                        <button
                            key={option.value}
                            onClick={() => onChange(option.value)}
                            className={cn(
                                "px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200",
                                isSelected
                                    ? colorStyle
                                        ? `${colorStyle.bg} ${colorStyle.text} shadow-sm`
                                        : "bg-primary text-white shadow-sm"
                                    : "text-muted-foreground hover:bg-white/70 dark:hover:bg-slate-700/60 hover:text-slate-700 dark:hover:text-slate-200"
                            )}
                        >
                            {option.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
