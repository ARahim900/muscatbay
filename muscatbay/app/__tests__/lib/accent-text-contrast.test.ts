import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Guards the accent-as-text token, --mb-secondary-text.
 *
 * The brand accent (--secondary / --accent / --mb-secondary, #A1D1D5) is a
 * background TINT. Used as text on a light surface it measures ~1.6:1, far
 * below the WCAG AA body-text floor of 4.5:1 — which is why CLAUDE.md's
 * severity colour model says "Text on a tint → --mb-*-text, never --mb-*".
 *
 * These tests read the real values out of app/globals.css and compute the real
 * WCAG 2.x relative-luminance contrast, so retuning either the token or any of
 * the surfaces it lands on fails here rather than in production.
 */

const AA_TEXT = 4.5;
const AA_NON_TEXT = 3;

// Vitest's root is muscatbay/app (vitest.config.ts lives there), so these
// paths are the same ones the tsconfig `@/` alias resolves against.
const source = (relative: string): string =>
    readFileSync(resolve(process.cwd(), relative), "utf8");

const css = source("app/globals.css");

// ── WCAG 2.x relative luminance and contrast ──────────────────────────────────

type Rgb = readonly [number, number, number];

function parseHex(hex: string): Rgb {
    const value = hex.trim().replace("#", "");
    if (!/^[0-9a-fA-F]{6}$/.test(value)) throw new Error(`not a 6-digit hex colour: ${hex}`);
    return [
        Number.parseInt(value.slice(0, 2), 16),
        Number.parseInt(value.slice(2, 4), 16),
        Number.parseInt(value.slice(4, 6), 16),
    ];
}

function relativeLuminance([r, g, b]: Rgb): number {
    const channel = (raw: number): number => {
        const s = raw / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(a: Rgb, b: Rgb): number {
    const [lighter, darker] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
    return (lighter + 0.05) / (darker + 0.05);
}

/** Composite an alpha-blended overlay (e.g. `bg-secondary/10`) onto a surface. */
function over(overlay: Rgb, surface: Rgb, alpha: number): Rgb {
    return [
        Math.round(overlay[0] * alpha + surface[0] * (1 - alpha)),
        Math.round(overlay[1] * alpha + surface[1] * (1 - alpha)),
        Math.round(overlay[2] * alpha + surface[2] * (1 - alpha)),
    ];
}

// ── Token extraction ──────────────────────────────────────────────────────────

/** The declaration body of the light (`:root`) or dark (`.dark`) theme block. */
function themeBlock(theme: "light" | "dark"): string {
    const start = css.indexOf(theme === "light" ? ":root {" : ".dark {");
    if (start < 0) throw new Error(`${theme} theme block missing from app/globals.css`);
    const end = css.indexOf("\n}", start);
    return css.slice(start, end < 0 ? undefined : end);
}

/** Read a token's hex value, anchored to the line so `--mb-x` can't shadow `--x`. */
function token(name: string, theme: "light" | "dark"): Rgb {
    const match = new RegExp(`^[ \\t]*${name}\\s*:\\s*(#[0-9a-fA-F]{6})`, "m").exec(themeBlock(theme));
    if (!match) throw new Error(`${name} is not defined as a hex colour in the ${theme} theme`);
    return parseHex(match[1]);
}

describe("--mb-secondary-text (accent-as-text token)", () => {
    it("is registered in @theme inline so a Tailwind utility resolves it", () => {
        const start = css.indexOf("@theme inline {");
        expect(start).toBeGreaterThan(-1);
        expect(css.slice(start, css.indexOf("\n}", start)))
            .toContain("--color-mb-secondary-text: var(--mb-secondary-text);");
    });

    it("is defined in both themes", () => {
        expect(() => token("--mb-secondary-text", "light")).not.toThrow();
        expect(() => token("--mb-secondary-text", "dark")).not.toThrow();
    });

    it("clears WCAG AA text contrast on every light surface it lands on", () => {
        const ink = token("--mb-secondary-text", "light");
        const background = token("--background", "light");
        const card = token("--card", "light");
        const accent = token("--secondary", "light");

        const surfaces: ReadonlyArray<readonly [string, Rgb]> = [
            ["--background", background],
            ["--card", card],
            ["--popover", token("--popover", "light")],
            ["--muted", token("--muted", "light")],
            ["--mb-secondary-light", token("--mb-secondary-light", "light")],
            // The electricity "Meter:" chip is bg-secondary/10 over the card.
            ["bg-secondary/10 on --card", over(accent, card, 0.1)],
            ["bg-secondary/10 on --background", over(accent, background, 0.1)],
        ];

        for (const [label, surface] of surfaces) {
            expect(contrast(ink, surface), `--mb-secondary-text on ${label}`).toBeGreaterThanOrEqual(AA_TEXT);
        }
    });

    it("clears WCAG AA text contrast on every dark surface it lands on", () => {
        const ink = token("--mb-secondary-text", "dark");
        const background = token("--background", "dark");
        const card = token("--card", "dark");
        const accent = token("--secondary", "dark");

        const surfaces: ReadonlyArray<readonly [string, Rgb]> = [
            ["--background", background],
            ["--card", card],
            ["--popover", token("--popover", "dark")],
            ["--muted", token("--muted", "dark")],
            ["bg-secondary/10 on --card", over(accent, card, 0.1)],
            ["bg-secondary/10 on --background", over(accent, background, 0.1)],
        ];

        for (const [label, surface] of surfaces) {
            expect(contrast(ink, surface), `--mb-secondary-text on ${label}`).toBeGreaterThanOrEqual(AA_TEXT);
        }
    });

    it("stays recognisably brand teal rather than drifting to another hue", () => {
        // The light value is brand teal with hue and saturation held and only
        // lightness lowered, so blue leads and green trails it closely.
        const [r, g, b] = token("--mb-secondary-text", "light");
        expect(b).toBeGreaterThan(r);
        expect(g).toBeGreaterThan(r);
        expect(Math.abs(b - g)).toBeLessThanOrEqual(12);
    });

    it("records why raw --secondary and --ring are not text colours", () => {
        const background = token("--background", "light");

        // The defect this token exists to fix.
        const accent = token("--secondary", "light");
        expect(contrast(accent, background)).toBeLessThan(2);
        expect(contrast(accent, token("--card", "light"))).toBeLessThan(2);

        // --ring clears the 3:1 non-text floor but not the 4.5:1 text floor,
        // so it is not a substitute.
        const ring = token("--ring", "light");
        expect(contrast(ring, background)).toBeGreaterThanOrEqual(AA_NON_TEXT);
        expect(contrast(ring, background)).toBeLessThan(AA_TEXT);
    });
});

describe("accent call sites use the token, not the raw tint", () => {
    it("topbar renders the user-role label in --mb-secondary-text", () => {
        const topbar = source("components/layout/topbar.tsx");
        expect(topbar).toContain("text-mb-secondary-text");
        expect(topbar).not.toMatch(/text-secondary(?![\w-])/);
    });

    it("the secondary-variant active tab icon uses --mb-secondary-text", () => {
        expect(source("components/shared/tab-navigation.tsx"))
            .toContain('isActive ? "text-mb-secondary-text" : "text-muted-foreground/70"');
    });

    it("keeps raw --secondary for the primary tab icon, which sits on the purple pill", () => {
        // Brand teal is well past AA on --primary; the deepened text token would
        // be dark-on-dark there, so this call site must NOT be converted.
        expect(source("components/shared/tab-navigation.tsx")).toContain('isActive ? "text-secondary" : ""');
        expect(contrast(token("--secondary", "light"), token("--primary", "light"))).toBeGreaterThanOrEqual(AA_TEXT);
    });

    it("the electricity meter filter chip colours its icon and label with the token", () => {
        const page = source("app/electricity/page.tsx");
        expect(page).toContain('<Filter className="w-3.5 h-3.5 text-mb-secondary-text"');
        expect(page).toContain('<span className="text-xs font-medium text-mb-secondary-text">Meter:</span>');
    });
});
