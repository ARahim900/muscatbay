"use client";

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import gsap from "gsap";
import { MOTION, prefersReducedMotion, useIsomorphicLayoutEffect } from "@/lib/motion";

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
    ariaLabel?: string;
}

export function TabNavigation({ tabs, activeTab, onTabChange, className, variant = "primary", ariaLabel = "Navigation tabs" }: TabNavigationProps) {
    const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const listRef = useRef<HTMLDivElement>(null);
    const pillRef = useRef<HTMLDivElement>(null);
    // While false (SSR, pre-hydration, reduced motion) the active button keeps
    // its own background — the pill is purely an enhancement.
    const [pillReady, setPillReady] = useState(false);
    const hasAnimatedRef = useRef(false);

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

    // Slide the active pill under the selected tab. offsetLeft/offsetTop are
    // layout-based, so the pill stays correct in RTL and while the strip
    // scrolls horizontally.
    useIsomorphicLayoutEffect(() => {
        if (prefersReducedMotion()) return;

        const pill = pillRef.current;
        const list = listRef.current;
        const activeIndex = tabs.findIndex((t) => t.key === activeTab);
        const button = tabRefs.current[activeIndex];
        if (!pill || !list || !button) return;

        const place = (animate: boolean) => {
            const target = {
                left: button.offsetLeft,
                top: button.offsetTop,
                width: button.offsetWidth,
                height: button.offsetHeight,
            };
            if (animate) {
                gsap.to(pill, { ...target, duration: 0.45, ease: MOTION.ease.out, overwrite: "auto" });
            } else {
                gsap.set(pill, target);
            }
        };

        place(hasAnimatedRef.current);
        hasAnimatedRef.current = true;
        setPillReady(true);

        const resizeObserver = new ResizeObserver(() => place(false));
        resizeObserver.observe(list);
        return () => resizeObserver.disconnect();
    }, [activeTab, tabs, variant]);

    const pillClassName = variant === "secondary"
        ? "bg-card border border-border/80 shadow-md"
        : "bg-primary dark:bg-primary/80 shadow-md shadow-primary/20";

    return (
        <div className={cn("w-full max-w-full", className)}>
            {/* role="tablist" must be on a div, not nav — nav's landmark role
                would be overridden by tablist, removing it from AT navigation */}
            <div
                ref={listRef}
                className={cn(
                    "relative inline-flex items-center gap-1.5 sm:gap-3 p-1 sm:p-1.5 rounded-xl overflow-x-auto max-w-full",
                    "bg-muted/80",
                    "border border-border/60",
                    "shadow-sm"
                )}
                role="tablist"
                aria-label={ariaLabel}
            >
                {/* Sliding active indicator — sits under the buttons */}
                <div
                    ref={pillRef}
                    aria-hidden="true"
                    className={cn(
                        "absolute start-0 top-0 z-0 rounded-lg pointer-events-none",
                        pillClassName,
                        pillReady ? "opacity-100" : "opacity-0"
                    )}
                />
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
                                    "relative z-[1] flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2.5 sm:py-3 min-h-[44px] lg:min-h-0 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap",
                                    "transition-colors duration-200 ease-out",
                                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-1",
                                    isActive
                                        ? [
                                            "text-primary dark:text-foreground",
                                            // Static fallback styling until the pill takes over
                                            !pillReady && "bg-card shadow-md border border-border/80",
                                        ]
                                        : [
                                            "text-muted-foreground",
                                            "hover:text-primary dark:hover:text-foreground",
                                            "hover:bg-card/60",
                                        ]
                                )}
                            >
                                {tab.icon && (
                                    <tab.icon
                                        className={cn(
                                            "w-4 h-4 transition-colors duration-200",
                                            isActive ? "text-secondary" : "text-muted-foreground/70"
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
                                "relative z-[1] flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2.5 sm:py-3 min-h-[44px] lg:min-h-0 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap",
                                "transition-colors duration-200 ease-out",
                                "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-1",
                                isActive
                                    ? [
                                        "text-primary-foreground",
                                        // Static fallback styling until the pill takes over
                                        !pillReady && "bg-primary dark:bg-primary/80 shadow-md shadow-primary/20",
                                    ]
                                    : [
                                        "text-muted-foreground",
                                        "hover:bg-card/70",
                                        "hover:text-primary dark:hover:text-foreground",
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
