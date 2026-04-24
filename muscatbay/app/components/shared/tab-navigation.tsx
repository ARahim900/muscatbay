"use client";

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { useCallback, useRef } from "react";

interface TabItem {
    key: string;
    label: string;
    icon?: LucideIcon;
}

interface TabNavigationProps {
    tabs: TabItem[];
    activeTab: string;
    onTabChange: (key: string) => void;
    className?: string;
    variant?: "primary" | "secondary";
}

export function TabNavigation({ tabs, activeTab, onTabChange, className, variant = "primary" }: TabNavigationProps) {
    const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

    // ARIA tabs keyboard pattern: Arrow keys move focus and activate tabs
    const handleKeyDown = useCallback((e: React.KeyboardEvent, currentIndex: number) => {
        let nextIndex: number | null = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            nextIndex = (currentIndex + 1) % tabs.length;
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        } else if (e.key === 'Home') {
            nextIndex = 0;
        } else if (e.key === 'End') {
            nextIndex = tabs.length - 1;
        }

        if (nextIndex !== null) {
            e.preventDefault();
            onTabChange(tabs[nextIndex].key);
            tabRefs.current[nextIndex]?.focus();
        }
    }, [tabs, onTabChange]);

    return (
        <div className={cn("w-full max-w-full", className)}>
            {/* role="tablist" must be on a div, not nav — nav's landmark role
                would be overridden by tablist, removing it from AT navigation */}
            <div
                className={cn(
                    "inline-flex items-center gap-1.5 sm:gap-3 p-1 sm:p-1.5 rounded-xl overflow-x-auto max-w-full",
                    "bg-slate-100/80 dark:bg-slate-800/60",
                    "border border-slate-200/60 dark:border-slate-700/50",
                    "shadow-sm"
                )}
                role="tablist"
                aria-label="Navigation tabs"
            >
                {tabs.map((tab, index) => {
                    const isActive = activeTab === tab.key;

                    if (variant === "secondary") {
                        // Secondary variant: Outlined/bordered style for view switching
                        return (
                            <button
                                key={tab.key}
                                id={`tab-${tab.key}`}
                                ref={(el) => { tabRefs.current[index] = el; }}
                                onClick={() => onTabChange(tab.key)}
                                onKeyDown={(e) => handleKeyDown(e, index)}
                                role="tab"
                                aria-selected={isActive}
                                aria-controls={`panel-${tab.key}`}
                                tabIndex={isActive ? 0 : -1}
                                className={cn(
                                    "relative flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2.5 sm:py-3 min-h-[44px] lg:min-h-0 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap",
                                    "transition-colors duration-200 ease-out",
                                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-1",
                                    isActive
                                        ? [
                                            "bg-white dark:bg-slate-900",
                                            "text-primary dark:text-slate-100",
                                            "shadow-md",
                                            "border border-slate-200/80 dark:border-slate-600/50",
                                        ]
                                        : [
                                            "text-slate-500 dark:text-slate-400",
                                            "hover:text-primary dark:hover:text-slate-200",
                                            "hover:bg-white/60 dark:hover:bg-slate-700/50",
                                        ]
                                )}
                            >
                                {tab.icon && (
                                    <tab.icon
                                        className={cn(
                                            "w-4 h-4 transition-colors duration-200",
                                            isActive ? "text-secondary" : "text-slate-400 dark:text-slate-500"
                                        )}
                                    />
                                )}
                                {tab.label}
                                {/* Active indicator bar */}
                                {isActive && (
                                    <span
                                        className="absolute bottom-0 left-3 right-3 h-0.5 bg-secondary rounded-full"
                                        aria-hidden="true"
                                    />
                                )}
                            </button>
                        );
                    }

                    // Primary variant: Solid fill style for sub-navigation
                    return (
                        <button
                            key={tab.key}
                            id={`tab-${tab.key}`}
                            ref={(el) => { tabRefs.current[index] = el; }}
                            onClick={() => onTabChange(tab.key)}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                            role="tab"
                            aria-selected={isActive}
                            aria-controls={`panel-${tab.key}`}
                            tabIndex={isActive ? 0 : -1}
                            className={cn(
                                "relative flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2.5 sm:py-3 min-h-[44px] lg:min-h-0 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap",
                                "transition-colors duration-200 ease-out",
                                "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-1",
                                isActive
                                    ? [
                                        "bg-primary dark:bg-primary/80",
                                        "text-white",
                                        "shadow-md shadow-primary/20",
                                    ]
                                    : [
                                        "text-slate-600 dark:text-slate-400",
                                        "hover:bg-white/70 dark:hover:bg-slate-700/60",
                                        "hover:text-primary dark:hover:text-slate-200",
                                        "hover:shadow-sm",
                                    ]
                            )}
                        >
                            {tab.icon && (
                                <tab.icon
                                    className={cn(
                                        "w-4 h-4 transition-colors duration-200",
                                        isActive ? "text-secondary" : ""
                                    )}
                                />
                            )}
                            {tab.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
