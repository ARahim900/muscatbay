import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Droplets } from 'lucide-react';
import { StatsGrid, type StatItem } from '@/components/shared/stats-grid';

/**
 * Wiring test for the live value-change highlight.
 *
 * `useValueChanged` is unit-tested on its own, but that proves only that a
 * boolean flips. It says nothing about whether the KPI tile actually wears the
 * class — which is the part a refactor of `StatsGrid` would silently break.
 * These assertions fail if the hook is ever detached from the markup.
 */

/**
 * jsdom implements neither of these. `CountUp` and `useScrollAnimation` both
 * construct an IntersectionObserver on mount, so without a stub every render
 * of StatsGrid throws before a single assertion runs.
 */
class NoopIntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() { return []; }
    root = null;
    rootMargin = '';
    thresholds = [];
}
vi.stubGlobal('IntersectionObserver', NoopIntersectionObserver);

function installMatchMedia(reduced: boolean) {
    vi.stubGlobal('matchMedia', vi.fn(() => ({
        matches: reduced,
        media: '(prefers-reduced-motion: reduce)',
        addEventListener: () => {},
        removeEventListener: () => {},
    })));
}

const stat = (value: string): StatItem[] => [
    { label: 'Water Supply', value, icon: Droplets, variant: 'water' },
];

/** The tile is the nearest element carrying the grid's card class. */
function tileFor(label: string): HTMLElement {
    const el = screen.getByText(label).closest('.mb-glow');
    if (!el) throw new Error('KPI tile not found for ' + label);
    return el as HTMLElement;
}

afterEach(() => {
    // Keep the IntersectionObserver stub; only matchMedia varies per test.
    vi.stubGlobal('matchMedia', undefined);
});

describe('StatsGrid — live value change', () => {
    it('does not highlight a tile on first paint', () => {
        installMatchMedia(false);
        render(<StatsGrid stats={stat('1,200')} />);
        expect(tileFor('Water Supply').className).not.toContain('mb-value-changed');
    });

    it('highlights the tile and the figure when the value moves', () => {
        installMatchMedia(false);
        const { rerender } = render(<StatsGrid stats={stat('1,200')} />);
        rerender(<StatsGrid stats={stat('1,340')} />);

        expect(tileFor('Water Supply').className).toContain('mb-value-changed');
        // The number itself lifts to the info colour via its own class.
        const figure = tileFor('Water Supply').querySelector('h3');
        expect(figure?.className).toContain('mb-value-changed-ink');
    });

    it('stays quiet when a re-render carries the same value', () => {
        installMatchMedia(false);
        const { rerender } = render(<StatsGrid stats={stat('1,200')} />);
        rerender(<StatsGrid stats={stat('1,200')} />);
        expect(tileFor('Water Supply').className).not.toContain('mb-value-changed');
    });

    it('stays quiet under prefers-reduced-motion, but still shows the new value', () => {
        installMatchMedia(true);
        const { rerender } = render(<StatsGrid stats={stat('1,200')} />);
        rerender(<StatsGrid stats={stat('1,340')} />);

        expect(tileFor('Water Supply').className).not.toContain('mb-value-changed');
        // The point of the rule: the highlight is suppressed, the data is not.
        expect(screen.getAllByText('1,340').length).toBeGreaterThan(0);
    });

    it('highlights only the tile that moved, not the whole deck', () => {
        installMatchMedia(false);
        const two = (a: string, b: string): StatItem[] => [
            { label: 'Water Supply', value: a, icon: Droplets, variant: 'water' },
            { label: 'Electricity', value: b, icon: Droplets, variant: 'primary' },
        ];
        const { rerender } = render(<StatsGrid stats={two('1,200', '480')} />);
        rerender(<StatsGrid stats={two('1,340', '480')} />);

        expect(tileFor('Water Supply').className).toContain('mb-value-changed');
        expect(tileFor('Electricity').className).not.toContain('mb-value-changed');
    });
});
