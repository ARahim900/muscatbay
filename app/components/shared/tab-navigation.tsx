"use client";

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

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
    return (
        <div className={cn("inline-flex", className)}>
            {/* Visual container wrapper */}
            <nav
                className={cn(
                    "inline-flex items-center gap-3 p-1.5 rounded-xl overflow-x-auto scrollbar-hide",
                    "bg-slate-100/80 dark:bg-slate-800/60",
                    "border border-slate-200/60 dark:border-slate-700/50",
                    "shadow-sm"
                )}
                role="tablist"
                aria-label="Navigation tabs"
            >
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.key;

                    if (variant === "secondary") {
                        // Secondary variant: Outlined/bordered style for view switching
                        return (
                            <button
                                key={tab.key}
                                onClick={() => onTabChange(tab.key)}
                                role="tab"
                                aria-selected={isActive}
                                aria-controls={`panel-${tab.key}`}
                                tabIndex={isActive ? 0 : -1}
                                className={cn(
                                    "relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap",
                                    "transition-all duration-200 ease-out",
                                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4E4456]/50 focus-visible:ring-offset-1",
                                    isActive
                                        ? [
                                            "bg-white dark:bg-slate-900",
                                            "text-[#4E4456] dark:text-slate-100",
                                            "shadow-md",
                                            "border border-slate-200/80 dark:border-slate-600/50",
                                        ]
                                        : [
                                            "text-slate-500 dark:text-slate-400",
                                            "hover:text-[#4E4456] dark:hover:text-slate-200",
                                            "hover:bg-white/60 dark:hover:bg-slate-700/50",
                                            "active:scale-[0.98]",
                                        ]
                                )}
                            >
                                {tab.icon && (
                                    <tab.icon
                                        className={cn(
                                            "w-4 h-4 transition-colors duration-200",
                                            isActive ? "text-[#81D8D0]" : "text-slate-400 dark:text-slate-500"
                                        )}
                                    />
                                )}
                                {tab.label}
                                {/* Active indicator bar */}
                                {isActive && (
                                    <span
                                        className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#81D8D0] rounded-full"
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
                            onClick={() => onTabChange(tab.key)}
                            role="tab"
                            aria-selected={isActive}
                            aria-controls={`panel-${tab.key}`}
                            tabIndex={isActive ? 0 : -1}
                            className={cn(
                                "relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap",
                                "transition-all duration-200 ease-out",
                                "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4E4456]/50 focus-visible:ring-offset-1",
                                isActive
                                    ? [
                                        "bg-[#4E4456] dark:bg-[#5a4f62]",
                                        "text-white",
                                        "shadow-md shadow-[#4E4456]/20",
                                    ]
                                    : [
                                        "text-slate-600 dark:text-slate-400",
                                        "hover:bg-white/70 dark:hover:bg-slate-700/60",
                                        "hover:text-[#4E4456] dark:hover:text-slate-200",
                                        "hover:shadow-sm",
                                        "active:scale-[0.98]",
                                    ]
                            )}
                        >
                            {tab.icon && (
                                <tab.icon
                                    className={cn(
                                        "w-4 h-4 transition-colors duration-200",
                                        isActive ? "text-[#81D8D0]" : ""
                                    )}
                                />
                            )}
                            {tab.label}
                        </button>
                    );
                })}
            </nav>
        </div>
    );
}
