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
        iconClass: "text-slate-400 dark:text-slate-500",
        bgClass: "bg-slate-100 dark:bg-slate-800/50",
    },
    "no-results": {
        icon: SearchX,
        iconClass: "text-amber-500 dark:text-amber-400",
        bgClass: "bg-amber-50 dark:bg-amber-900/20",
    },
    "filter-empty": {
        icon: FilterX,
        iconClass: "text-blue-500 dark:text-blue-400",
        bgClass: "bg-blue-50 dark:bg-blue-900/20",
    },
    "error": {
        icon: DatabaseZap,
        iconClass: "text-red-500 dark:text-red-400",
        bgClass: "bg-red-50 dark:bg-red-900/20",
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
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
                {title}
            </h3>
            {description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
                    {description}
                </p>
            )}
            {action && (
                <button
                    onClick={action.onClick}
                    className="mt-4 px-4 py-2 text-xs font-medium rounded-lg bg-[#4E4456] text-white hover:bg-[#3A3341] dark:bg-[#5a4f62] dark:hover:bg-[#4E4456] transition-colors duration-200"
                >
                    {action.label}
                </button>
            )}
        </div>
    );
}
