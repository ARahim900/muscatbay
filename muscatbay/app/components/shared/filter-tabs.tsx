
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
    red: { bg: "bg-mb-danger", text: "text-primary-foreground" },
    orange: { bg: "bg-mb-warning", text: "text-primary-foreground" },
    green: { bg: "bg-mb-success", text: "text-primary-foreground" },
    blue: { bg: "bg-mb-info", text: "text-primary-foreground" },
    // bg-secondary is light in both themes — pair with its dedicated foreground token
    teal: { bg: "bg-secondary", text: "text-secondary-foreground" },
};

export function FilterTabs({ label, options, value, onChange, className }: FilterTabsProps) {
    return (
        <div className={cn("flex items-center gap-3", className)}>
            {label && <span className="text-sm text-muted-foreground hidden sm:inline-block">{label}:</span>}
            <div className="flex p-1 bg-muted/80 dark:bg-muted/60 rounded-lg border border-border/60 dark:border-border/50">
                {options.map((option) => {
                    const isSelected = value === option.value;
                    const colorStyle = option.color && colorMap[option.color];
                    return (
                        <button
                            key={option.value}
                            onClick={() => onChange(option.value)}
                            className={cn(
                                "px-3 py-2.5 sm:py-1.5 text-xs font-medium rounded-md transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                                isSelected
                                    ? colorStyle
                                        ? `${colorStyle.bg} ${colorStyle.text} shadow-sm`
                                        : "bg-primary text-primary-foreground shadow-sm"
                                    : "text-muted-foreground hover:bg-card/70 dark:hover:bg-muted/60 hover:text-foreground dark:hover:text-foreground"
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
