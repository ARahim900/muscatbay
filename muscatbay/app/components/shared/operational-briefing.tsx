import type { LucideIcon } from "lucide-react";
import { type ReactNode, useId } from "react";

import { cn } from "@/lib/utils";

export type BriefingSeverity = "default" | "info" | "success" | "warning" | "danger";

export interface OperationalBriefingItem {
    label: string;
    value: ReactNode;
    icon: LucideIcon;
    severity?: BriefingSeverity;
    description?: string;
}

const SEVERITY_STYLE: Record<BriefingSeverity, { icon: string; value: string }> = {
    default: { icon: "text-primary", value: "text-foreground" },
    info: { icon: "text-[var(--status-info)]", value: "text-foreground" },
    success: { icon: "text-[var(--status-normal)]", value: "text-[var(--mb-success-text)]" },
    warning: { icon: "text-[var(--status-warning)]", value: "text-[var(--mb-warning-text)]" },
    danger: { icon: "text-[var(--status-danger)]", value: "text-[var(--mb-danger-text)]" },
};

/** A consistent 3–4 finding briefing that remains swipeable on small screens. */
export function OperationalBriefing({
    periodLabel,
    items,
    title = "Operational briefing",
    className,
}: {
    periodLabel: string;
    items: OperationalBriefingItem[];
    title?: string;
    className?: string;
}) {
    const visibleItems = items.slice(0, 4);
    const titleId = useId();

    return (
        <section className={cn("overflow-hidden rounded-[10.5px] border border-border bg-card shadow-card-standard", className)} aria-labelledby={titleId}>
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border/60 px-4 py-3 sm:px-5">
                <h2 id={titleId} className="text-sm font-semibold text-foreground">{title}</h2>
                <p className="text-xs font-medium text-muted-foreground">{periodLabel}</p>
            </div>
            <ul className="flex snap-x snap-mandatory list-none gap-px overflow-x-auto bg-border sm:grid sm:grid-cols-2 lg:grid-cols-4" aria-label={`${title} for ${periodLabel}`}>
                {visibleItems.map((item) => {
                    const style = SEVERITY_STYLE[item.severity ?? "default"];
                    return (
                        <li key={item.label} className="min-w-[78%] snap-start bg-card px-4 py-3.5 sm:min-w-0 sm:px-5">
                            <div className="flex items-center gap-2">
                                <item.icon className={cn("h-4 w-4 shrink-0", style.icon)} aria-hidden="true" />
                                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{item.label}</p>
                            </div>
                            <p className={cn("mt-1.5 text-lg font-semibold tracking-tight tabular-nums sm:text-xl", style.value)}>{item.value}</p>
                            {item.description && <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{item.description}</p>}
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}
