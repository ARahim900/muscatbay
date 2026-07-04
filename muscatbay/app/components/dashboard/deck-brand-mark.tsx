"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { BrandMark } from "@/components/brand/brand-mark";
import { cn } from "@/lib/utils";
import { MOTION, prefersReducedMotion, useIsomorphicLayoutEffect } from "@/lib/motion";

/** Unit vector of the brand diagonal (335 × −354, normalized) — every glide
 *  in this file travels along it so motion always follows the mark's own axis. */
const AXIS = { x: 0.687, y: -0.726 };

interface DeckBrandMarkProps {
    className?: string;
}

/**
 * The command deck's animated brand mark — the dashboard hero's signature.
 *
 * Load: the mark assembles once — stripes glide in along the brand diagonal,
 * bars drop onto their shared cut line — then holds perfectly still. At rest
 * the logo is always the exact official mark.
 *
 * Scroll: one scrubbed ScrollTrigger, reversible in both directions, drives
 * (1) a light sweep along the stripes and (2) millimetre-scale drift of each
 * layer along its own axis while the deck leaves the viewport. Translations
 * only — the geometry itself never deforms at any scroll position.
 *
 * Honors prefers-reduced-motion by rendering the static mark untouched.
 */
export function DeckBrandMark({ className }: DeckBrandMarkProps) {
    const rootRef = useRef<HTMLDivElement>(null);

    useIsomorphicLayoutEffect(() => {
        const root = rootRef.current;
        if (!root || prefersReducedMotion()) return;

        gsap.registerPlugin(ScrollTrigger);
        const q = gsap.utils.selector(root);

        const ctx = gsap.context(() => {
            // Intro and scroll transforms live on separate nested nodes
            // ([data-mark-intro] inside [data-mark-scroll]) so the two
            // timelines can never contend for one element's transform.
            const introStripes = q('[data-mark-intro="stripe"]');
            const introBars = q('[data-mark-intro="bar"]');
            const scrollStripes = q('[data-mark-scroll^="stripe"]');
            const scrollBars = q('[data-mark-scroll^="bar"]');
            const sheen = q("[data-mark-sheen]");
            if (introStripes.length === 0 || introBars.length === 0) return;

            // ── Assembly — plays once on load ────────────────────────────
            gsap.set(introStripes, { x: -46 * AXIS.x, y: -46 * AXIS.y, autoAlpha: 0 });
            gsap.set(introBars, { y: -24, autoAlpha: 0 });
            gsap.timeline({ defaults: { ease: MOTION.ease.outExpo } })
                .to(introStripes, {
                    x: 0,
                    y: 0,
                    autoAlpha: 1,
                    duration: MOTION.dur.lg,
                    stagger: MOTION.stagger.base,
                })
                .to(introBars, {
                    y: 0,
                    autoAlpha: 1,
                    duration: MOTION.dur.lg,
                    stagger: MOTION.stagger.base,
                }, "-=0.55");

            // ── Scroll choreography — scrubbed, fully reversible ─────────
            const deck = root.closest("section") ?? root;
            const drift = (units: number) => ({ x: units * AXIS.x, y: units * AXIS.y });
            gsap.timeline({
                defaults: { ease: "none" },
                scrollTrigger: {
                    trigger: deck,
                    start: "top top",
                    end: "bottom top",
                    scrub: 0.6,
                    invalidateOnRefresh: true,
                },
            })
                .to(sheen, drift(1000), 0)
                .to(scrollStripes[0], drift(12), 0)
                .to(scrollStripes[1], drift(22), 0)
                .to(scrollStripes[2], drift(32), 0)
                .to(scrollBars[0], { y: -5 }, 0)
                .to(scrollBars[1], { y: -9 }, 0)
                .to(scrollBars[2], { y: -13 }, 0)
                .to(root, { y: 14 }, 0);
        }, root);

        return () => ctx.revert();
    }, []);

    return (
        <div
            ref={rootRef}
            aria-hidden="true"
            className={cn("pointer-events-none select-none", className)}
        >
            <BrandMark sheen className="h-full w-auto" />
        </div>
    );
}
