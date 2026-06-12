"use client";

import { ReactNode, useRef } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { cn } from "@/lib/utils";
import { Breadcrumbs } from "./breadcrumbs";
import { MOTION, prefersReducedMotion, useIsomorphicLayoutEffect } from "@/lib/motion";

// Three.js stays out of the critical path — the band paints instantly as a
// brand-purple gradient and the water field fades in when the chunk lands.
const AmbientBay = dynamic(() => import("@/components/three/ambient-bay"), { ssr: false });

interface HeroBandProps {
    title: string;
    description?: string;
    /** Right-aligned slot for live badges / actions — content is preserved verbatim */
    actions?: ReactNode;
    showBreadcrumbs?: boolean;
    className?: string;
}

/**
 * Executive landing band: deep brand-purple chrome (same family as the
 * sidebar) with the ambient bay water field behind the greeting. Used on the
 * dashboard only — module pages keep their calmer PageHeader so urgency and
 * hierarchy stay honest.
 */
export function HeroBand({ title, description, actions, showBreadcrumbs = true, className }: HeroBandProps) {
    const bandRef = useRef<HTMLElement>(null);

    useIsomorphicLayoutEffect(() => {
        const band = bandRef.current;
        if (!band || prefersReducedMotion()) return;

        const items = band.querySelectorAll<HTMLElement>("[data-hero-item]");
        if (items.length === 0) return;

        const ctx = gsap.context(() => {
            gsap.set(items, { autoAlpha: 0, y: 18 });
            gsap.to(items, {
                autoAlpha: 1,
                y: 0,
                duration: MOTION.dur.lg,
                ease: MOTION.ease.outExpo,
                stagger: MOTION.stagger.base,
                clearProps: "opacity,visibility,transform",
            });
        }, band);

        return () => ctx.revert();
    }, []);

    return (
        <section
            ref={bandRef}
            className={cn(
                "relative overflow-hidden rounded-[var(--radius)] border border-white/10",
                "bg-[linear-gradient(140deg,var(--primary)_0%,var(--sidebar)_100%)]",
                "shadow-card-standard",
                "print:bg-none print:border-border print:shadow-none",
                className
            )}
        >
            {/* Ambient water field + a faint teal dawn along the top edge */}
            <div className="absolute inset-0 print:hidden" aria-hidden="true">
                <AmbientBay className="absolute inset-0" intensity="subtle" />
                <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_85%_-20%,color-mix(in_srgb,var(--secondary)_16%,transparent),transparent_60%)]" />
                {/* Text-protection scrim — keeps the greeting WCAG-readable when a
                    wave crest passes behind it (most visible on narrow screens) */}
                <div className="absolute inset-0 bg-[linear-gradient(to_bottom,color-mix(in_srgb,var(--sidebar)_30%,transparent),transparent_38%,color-mix(in_srgb,var(--sidebar)_52%,transparent))]" />
            </div>

            <div className="relative z-10 flex flex-col gap-4 p-5 sm:p-6 md:p-8 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                    {showBreadcrumbs && (
                        <div
                            data-hero-item
                            className="mb-2 print:hidden [&_a]:text-white/55 [&_a:hover]:text-white [&_svg]:text-white/45 [&_span]:text-white/80"
                        >
                            <Breadcrumbs />
                        </div>
                    )}
                    <h1
                        data-hero-item
                        className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white print:text-(--primary)"
                    >
                        {title}
                    </h1>
                    {description && (
                        <p
                            data-hero-item
                            className="mt-1 text-xs sm:text-sm text-white/70 print:text-(--muted-foreground)"
                        >
                            {description}
                        </p>
                    )}
                </div>
                {actions && (
                    <div data-hero-item className="flex items-center gap-2 md:flex-shrink-0">
                        {actions}
                    </div>
                )}
            </div>
        </section>
    );
}
