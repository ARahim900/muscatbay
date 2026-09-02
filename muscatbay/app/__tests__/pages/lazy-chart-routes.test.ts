import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * Guards the Recharts code-split on the three routes that used to ship it
 * eagerly.
 *
 * Recharts is ~330 kB of client JS. None of these routes paints a chart first:
 * Fire Safety opens on a header, KPI cards and two registers, Contractors lands
 * on the AMC Tracker table, and Assets lands on the register. All three also
 * hold their charts behind a Supabase fetch, so the chunk has time to arrive.
 * Dashboard, STP, Electricity and HVAC already did this; these three did not,
 * and a single static import is all it takes to undo it — which is what this
 * file exists to catch.
 *
 * The measured effect of the split, from `.next` after `npm run build`:
 * first-load client JS fell 315 → 201 kB gzip on /firefighting, 350 → 241 kB on
 * /contractors and 343 → 231 kB on /assets.
 */

// Vitest's root is muscatbay/app (vitest.config.ts lives there), so these paths
// are the same ones the tsconfig `@/` alias resolves against.
const source = (relative: string): string =>
    readFileSync(resolve(process.cwd(), relative), 'utf8');

/** A static `import … from "recharts"`. A dynamic `import("recharts")` has no `from`. */
const STATIC_RECHARTS = /import[^;]*?from\s+["']recharts["']/;

const ROUTES = [
    'app/firefighting/page.tsx',
    'app/contractors/page.tsx',
    'app/assets/page.tsx',
] as const;

describe('chart-bearing routes keep Recharts out of first-load JS', () => {
    it.each(ROUTES)('%s never imports Recharts at module scope', (file) => {
        expect(source(file)).not.toMatch(STATIC_RECHARTS);
    });

    it.each(ROUTES)('%s defers every chart behind next/dynamic', (file) => {
        const src = source(file);
        // `ssr: false` appears once per dynamic() options object and, unlike the
        // word "dynamic", never in the prose around them.
        const lazyCount = src.match(/ssr: false/g)?.length ?? 0;

        expect(src).toMatch(/import dynamic from ["']next\/dynamic["']/);
        expect(lazyCount).toBeGreaterThan(0);
        // Every deferred chart carries a size-matched fallback — an unsized one
        // just moves the layout shift rather than removing it.
        expect(src.match(/loading:/g) ?? []).toHaveLength(lazyCount);
    });

    it('firefighting loads its Overview chart module lazily', () => {
        const src = source('app/firefighting/page.tsx');

        // Both overview-charts and the shared chart container import Recharts,
        // so a static import of either here puts the library straight back into
        // the page chunk.
        expect(src).not.toMatch(/import[^;]*?from\s+["']@\/components\/firefighting\/overview-charts["']/);
        expect(src).not.toMatch(/import[^;]*?from\s+["']@\/components\/charts\/chart-container["']/);
        expect(src).toContain('import("@/components/firefighting/overview-charts")');
    });

    it('the firefighting chart module lives under components/, not beside the route', () => {
        // CLAUDE.md: `app/` holds routes only, and every module has exactly one
        // home under `components/<module>/`.
        const charts = source('components/firefighting/overview-charts.tsx');

        expect(charts).toMatch(STATIC_RECHARTS);
        // …and mounts through the shared container, never Recharts' own.
        expect(charts).toContain('ChartContainer minHeight={260}');
        // The rendered element, not the word — the comment above it names
        // ResponsiveContainer to explain why it is not used.
        expect(charts).not.toMatch(/<ResponsiveContainer/);
    });

    it('contractors loads the yearly cost chart lazily', () => {
        const src = source('app/contractors/page.tsx');

        expect(src).not.toMatch(/import[^;]*?from\s+["']@\/components\/contractors\/yearly-chart["']/);
        expect(src).toContain('import("@/components/contractors/yearly-chart")');
    });

    it('assets loads BOTH asset-charts exports lazily, not just the charting one', () => {
        const src = source('app/assets/page.tsx');

        // AssetAttention draws no chart, but it shares a module with the three
        // distribution charts — a static import of it drags LiquidBarChart, and
        // therefore Recharts, back into the page chunk.
        expect(src).not.toMatch(/import[^;]*?from\s+["']@\/components\/assets\/asset-charts["']/);
        expect(src).toContain('m.AssetAttention');
        expect(src).toContain('m.AssetRegisterProfile');
    });
});
