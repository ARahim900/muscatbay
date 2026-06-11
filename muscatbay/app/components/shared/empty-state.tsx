"use client";

import { cn } from "@/lib/utils";
import { LucideIcon, SearchX, DatabaseZap, FilterX, PackageOpen } from "lucide-react";

type EmptyVariant = "no-data" | "no-results" | "filter-empty" | "error";

interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    variant?: EmptyVariant;
    className?: string;
}

const variantDefaults: Record<EmptyVariant, { icon: LucideIcon; iconClass: string; bgClass: string }> = {
    "no-data": {
        icon: PackageOpen,
        iconClass: "text-muted-foreground/70",
        bgClass: "bg-muted",
    },
    "no-results": {
        icon: SearchX,
        iconClass: "text-mb-warning",
        bgClass: "bg-mb-warning-light",
    },
    "filter-empty": {
        icon: FilterX,
        iconClass: "text-mb-info",
        bgClass: "bg-mb-info-light",
    },
    "error": {
        icon: DatabaseZap,
        iconClass: "text-mb-danger",
        bgClass: "bg-mb-danger-light",
    },
};

export function EmptyState({
    icon,
    title,
    description,
    action,
    variant = "no-data",
    className,
}: EmptyStateProps) {
    const defaults = variantDefaults[variant];
    const Icon = icon || defaults.icon;

    return (
        <div className={cn("flex flex-col items-center justify-center py-12 px-6 text-center", className)}>
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-4", defaults.bgClass)}>
                <Icon className={cn("w-7 h-7", defaults.iconClass)} />
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1">
                {title}
            </h3>
            {description && (
                <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                    {description}
                </p>
            )}
            {action && (
                <button
                    onClick={action.onClick}
                    className="mt-4 px-4 py-2 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/80 dark:bg-primary/80 dark:hover:bg-primary transition-colors duration-200"
                >
                    {action.label}
                </button>
            )}
        </div>
    );
}
