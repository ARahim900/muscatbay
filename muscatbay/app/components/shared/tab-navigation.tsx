"use client";

import { cn } from "@/lib/utils";
import { ChevronDown, LucideIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
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
    const pillReadyRef = useRef(false);
    const hasAnimatedRef = useRef(false);
    const activeIndex = tabs.findIndex((t) => t.key === activeTab);
    const tabKeys = tabs.map((tab) => tab.key).join("|");

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
    // layout-based, so the pill stays correct while the strip scrolls
    // horizontally, and they are PHYSICAL (left-origin) in both writing
    // directions — which is why the pill is anchored at `left-0` and moved by
    // translation. Anchoring it at `start-0` made the offsets fight the
    // inset-inline-start in RTL, where an over-constrained left/right/width
    // box resolves in favour of `right`.
    //
    // The slide animates TRANSFORMS ONLY (x/y/scaleX/scaleY). It used to tween
    // left/top/width/height, which forces a layout pass on every frame of
    // every tab change. The box is morphed by scaling from the pill's own
    // unscaled layout box, then snapped to the target's real width/height on
    // completion, so the corner radius is never left stretched at rest.
    useIsomorphicLayoutEffect(() => {
        if (prefersReducedMotion()) return;

        const pill = pillRef.current;
        const list = listRef.current;
        const button = tabRefs.current[activeIndex];
        if (!pill || !list || !button) return;

        type PillBox = { left: number; top: number; width: number; height: number };
        const boxOf = (el: HTMLElement): PillBox => ({
            left: el.offsetLeft,
            top: el.offsetTop,
            width: el.offsetWidth,
            height: el.offsetHeight,
        });

        /** Resting state: exact geometry, no residual scale. */
        const snap = (box: PillBox) => {
            gsap.set(pill, {
                width: box.width,
                height: box.height,
                x: box.left,
                y: box.top,
                scaleX: 1,
                scaleY: 1,
                transformOrigin: "0 0",
            });
        };

        // Held so an unmount (or a resize landing mid-slide) can stop the
        // tween instead of leaving it animating a detached node.
        let slide: gsap.core.Tween | null = null;

        const place = (animate: boolean) => {
            const box = boxOf(button);
            if (!animate) {
                slide?.kill();
                slide = null;
                pill.classList.remove("gsap-lift");
                snap(box);
                return;
            }
            // offsetWidth/Height ignore transforms, so this is the pill's
            // unscaled layout box — the base every scale factor is relative
            // to. It cannot change mid-flight (only snap() writes width /
            // height), so interrupting one slide with the next stays
            // continuous: GSAP tweens on from the live scale.
            const baseWidth = pill.offsetWidth || box.width;
            const baseHeight = pill.offsetHeight || box.height;
            // Hint held for the length of the slide only — a permanent
            // will-change on the pill would cost a layer for the whole session.
            pill.classList.add("gsap-lift");
            slide = gsap.to(pill, {
                x: box.left,
                y: box.top,
                scaleX: box.width / baseWidth,
                scaleY: box.height / baseHeight,
                duration: 0.45,
                ease: MOTION.ease.out,
                overwrite: "auto",
                onComplete: () => {
                    // Re-measure: the strip may have reflowed during the slide.
                    snap(boxOf(button));
                    pill.classList.remove("gsap-lift");
                },
            });
        };

        place(hasAnimatedRef.current);
        hasAnimatedRef.current = true;
        if (!pillReadyRef.current) {
            pillReadyRef.current = true;
            setPillReady(true);
        }

        // ResizeObserver fires once immediately on observe(). That first
        // callback reports the size we have just measured, so honouring it
        // would kill the slide the line above may have started. Skip it and
        // react only to real reflows (font swap, container resize, rotation).
        let sawInitialResize = false;
        const resizeObserver = new ResizeObserver(() => {
            if (!sawInitialResize) {
                sawInitialResize = true;
                return;
            }
            place(false);
        });
        resizeObserver.observe(list);
        return () => {
            resizeObserver.disconnect();
            // kill() leaves the current transform in place, so re-running the
            // effect for the next tab picks the slide up from where this one
            // stopped instead of jumping.
            slide?.kill();
            pill.classList.remove("gsap-lift");
        };
    }, [activeIndex, tabKeys, variant]);

    // On narrow screens, keep the selected tab visible after click, keyboard
    // navigation, or a route-driven tab change. This also makes the remaining
    // horizontally scrollable choices discoverable without truncating labels.
    useEffect(() => {
        const button = tabRefs.current[activeIndex];
        if (!button) return;
        button.scrollIntoView({
            block: "nearest",
            inline: "center",
            behavior: prefersReducedMotion() ? "auto" : "smooth",
        });
    }, [activeIndex]);

    const pillClassName = variant === "secondary"
        ? "bg-card border border-border/80 shadow-md"
        : "bg-primary dark:bg-primary/80 shadow-md shadow-primary/20";
    const useMobileSelect = tabs.length > 3;

    return (
        <div className={cn("w-full max-w-full", className)}>
            {useMobileSelect && (
                <label className="relative block sm:hidden">
                    <span className="sr-only">{ariaLabel}</span>
                    <select
                        value={activeTab}
                        onChange={(event) => onTabChange(event.target.value)}
                        aria-label={ariaLabel}
                        className="min-h-11 w-full appearance-none rounded-xl border border-border bg-card px-3 pe-10 text-sm font-semibold text-foreground shadow-sm outline-none transition-colors focus:border-secondary focus:ring-2 focus:ring-secondary/30"
                    >
                        {tabs.map((tab) => (
                            <option key={tab.key} value={tab.key}>{tab.label}</option>
                        ))}
                    </select>
                    <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 end-3 flex items-center text-muted-foreground">
                        <ChevronDown className="h-4 w-4" />
                    </span>
                </label>
            )}
            {/* role="tablist" must be on a div, not nav — nav's landmark role
                would be overridden by tablist, removing it from AT navigation */}
            <div
                ref={listRef}
                className={cn(
                    "relative inline-flex items-center gap-1.5 sm:gap-3 p-1 sm:p-1.5 rounded-xl overflow-x-auto max-w-full scroll-px-4",
                    "bg-muted/80",
                    "border border-border/60",
                    "shadow-sm",
                    useMobileSelect && "hidden sm:inline-flex"
                )}
                role="tablist"
                aria-label={ariaLabel}
            >
                {/* Sliding active indicator — sits under the buttons */}
                <div
                    ref={pillRef}
                    aria-hidden="true"
                    className={cn(
                        "absolute left-0 top-0 z-0 rounded-lg pointer-events-none",
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
