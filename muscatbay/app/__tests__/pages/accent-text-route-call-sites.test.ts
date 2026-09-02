import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * Accent-as-text call sites on the Fire Safety, Contractors and Assets routes.
 *
 * The brand teal (--secondary, #A1D1D5) is a background TINT: as text on a
 * light surface it measures ~1.6:1 against the AA floor of 4.5:1. CLAUDE.md's
 * severity colour model states the rule — "text on a tint → --mb-*-text, never
 * --mb-*" — and __tests__/lib/accent-text-contrast.test.ts proves the token
 * itself clears AA in both themes. This file pins the three route pages that
 * were still colouring words and meaning-bearing icons with the raw tint.
 *
 * Teal is deliberately LEFT ALONE where it is a fill, border, chart series,
 * hover wash or focus ring — those uses are correct, and swapping them would
 * change the design rather than fix a contrast failure.
 */

const source = (relative: string): string =>
    readFileSync(resolve(process.cwd(), relative), 'utf8');

/** `text-secondary` as a colour, not the `text-secondary-foreground` token. */
const RAW_TEAL_AS_TEXT = /text-secondary(?![\w-])/;

describe('Fire Safety renders accent text with the AA token', () => {
    const src = source('app/firefighting/page.tsx');

    it('colours the completed-cycle label with --mb-secondary-text', () => {
        expect(src).toContain('text-[11px] font-semibold text-mb-secondary-text');
    });

    it('colours a zone with no open issues with --mb-secondary-text', () => {
        expect(src).toContain('zoneIssues > 0 ? "text-destructive" : "text-mb-secondary-text"');
    });

    it('colours the BEC contact email link with --mb-secondary-text', () => {
        expect(src).toContain('text-[11px] text-mb-secondary-text hover:underline');
    });

    it('puts the teal fill\'s own foreground on the cycle chip, not white', () => {
        // White on #A1D1D5 is ~1.67:1; --secondary-foreground (#1F2937) is ~10:1.
        // The grey fill in the other branch keeps white, which is correct there.
        expect(src).toContain('done ? "bg-secondary text-secondary-foreground" : "bg-muted-foreground/60 text-primary-foreground"');
    });
});

describe('Contractors and Assets keep no raw teal as text', () => {
    it.each([
        'app/contractors/page.tsx',
        'app/assets/page.tsx',
    ])('%s uses the token rather than the tint for foreground colour', (file) => {
        const src = source(file);

        expect(src).not.toMatch(RAW_TEAL_AS_TEXT);
        // …while the fills, washes and focus rings that are correct stay put.
        expect(src).toMatch(/bg-secondary|ring-secondary/);
    });

    it('contractors colours the contract-PDF affordance with the token', () => {
        // Icon-only in the two tables, icon + label on the mobile cards — meaning
        // is carried by colour and glyph together, so it has to be legible. The
        // hover wash stays raw teal: a background, not a foreground.
        const src = source('app/contractors/page.tsx');

        expect(src).toContain("c.contract_pdf_url ? 'text-mb-secondary-text' : 'text-muted-foreground'");
        expect(src).toContain("? 'text-mb-secondary-text hover:bg-secondary/10'");
        expect(src).toContain('className="text-xs text-mb-secondary-text flex items-center gap-1 mt-2"');
    });

    it('assets colours a healthy remaining-life figure with the token', () => {
        expect(source('app/assets/page.tsx')).toContain("'text-[var(--mb-secondary-text)]'");
    });
});
