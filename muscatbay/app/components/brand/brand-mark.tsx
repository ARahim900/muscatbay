"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * Muscat Bay brand mark — exact flat vector reconstruction of the official
 * logo, measured px-by-px from the flat brand source (og-image master):
 *
 *   · 335 × 354 rectangle; the stripe system runs corner-to-corner along the
 *     anti-diagonal (slope −354/335 ≈ 46.6°, deliberately steeper than 45°).
 *   · Bars are 46 units wide on a 107 pitch, all cut by one diagonal — the
 *     line through the third bar's top-right corner, which is what turns
 *     that bar into a perfect triangle.
 *   · Stripe A's top edge IS the anti-diagonal; stripe B and the corner
 *     triangle repeat down-right, clipped by the mark's bottom/right edges.
 *
 * Do not "tidy" these coordinates to 45° or equal bar/gap widths — the
 * official mark is not built that way, and any rounding visibly changes it.
 *
 * Layer contract for animation (see DeckBrandMark):
 *   [data-mark-scroll] — outer wrappers, reserved for scroll-scrub transforms
 *   [data-mark-intro]  — inner elements, reserved for the entrance timeline
 *   [data-mark-sheen]  — light-sweep mover inside a static stripe clip
 * Keeping the channels on separate nodes means the two timelines can never
 * fight over the same transform.
 */

const BARS = [
    "M0 0 H46 V226.1 L0 274.7 Z",
    "M107 0 H153 V113.1 L107 161.7 Z",
    "M214 0 H260 L214 48.6 Z",
] as const;

const STRIPES = [
    "M335 0 V61.6 L58.3 354 H0 Z",
    "M335 146.2 V207.8 L196.7 354 H138.4 Z",
    "M335 290.1 V354 H274.5 Z",
] as const;

interface BrandMarkProps {
    className?: string;
    /** Accessible name. Omit (default) to render as decorative (aria-hidden). */
    title?: string;
    /**
     * Adds the [data-mark-sheen] light-sweep layer, clipped to the stripes.
     * Inert until an animation moves it — parked off-canvas at rest.
     */
    sheen?: boolean;
}

export function BrandMark({ className, title, sheen = false }: BrandMarkProps) {
    const uid = useId();
    const clipId = `mb-mark-stripes-${uid}`;
    const sheenGradId = `mb-mark-sheen-${uid}`;

    return (
        <svg
            viewBox="0 0 335 354"
            xmlns="http://www.w3.org/2000/svg"
            className={cn("block", className)}
            role={title ? "img" : "presentation"}
            aria-hidden={title ? undefined : true}
            focusable="false"
        >
            {title && <title>{title}</title>}

            {STRIPES.map((d, i) => (
                <g key={d} data-mark-scroll={`stripe-${i + 1}`}>
                    <path data-mark-intro="stripe" d={d} className="fill-white" />
                </g>
            ))}

            {BARS.map((d, i) => (
                <g key={d} data-mark-scroll={`bar-${i + 1}`}>
                    <path data-mark-intro="bar" d={d} className="fill-(--secondary)" />
                </g>
            ))}

            {sheen && (
                <>
                    <defs>
                        {/* Beam axis runs along the brand diagonal (unit ≈ 0.687, −0.726). */}
                        <linearGradient
                            id={sheenGradId}
                            gradientUnits="userSpaceOnUse"
                            x1="-206"
                            y1="572"
                            x2="-27.4"
                            y2="383.2"
                        >
                            {/* Brand-teal beam: white stripes tint toward the accent as the
                                light passes (white-on-white would be invisible). */}
                            <stop offset="0" stopColor="var(--secondary)" stopOpacity="0" />
                            <stop offset="0.5" stopColor="var(--secondary)" stopOpacity="0.55" />
                            <stop offset="1" stopColor="var(--secondary)" stopOpacity="0" />
                        </linearGradient>
                        <clipPath id={clipId}>
                            {STRIPES.map((d) => (
                                <path key={d} d={d} />
                            ))}
                        </clipPath>
                    </defs>
                    {/* Outer g: static clip. Inner g: the mover — translating it slides
                        both the rect and its user-space gradient under the clip. */}
                    <g clipPath={`url(#${clipId})`}>
                        <g data-mark-sheen>
                            <rect x="-600" y="-600" width="1600" height="1600" fill={`url(#${sheenGradId})`} />
                        </g>
                    </g>
                </>
            )}
        </svg>
    );
}
