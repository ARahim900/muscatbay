import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Droplets } from 'lucide-react';
import { InspectionTicker, type TickerStat } from '@/components/shared/inspection';

/**
 * The ticker loop shifts the track by exactly half its width, so for the
 * viewport `V` to stay covered at the worst point of the cycle, one half must
 * be at least `V` wide. The strip used to satisfy that by holding STATIC when
 * one run was narrower than the viewport; since 2026-07-29 (owner request: a
 * news band should always be moving) it satisfies it by REPEATING the run —
 * `repeat = ceil(V / W)` copies per half — and always scrolling.
 *
 * These tests pin that geometry by controlling the two measurements directly.
 */

/** jsdom reports every element as 0×0, so widths have to be stubbed. */
function stubWidths({ viewport, run }: { viewport: number; run: number }) {
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
        configurable: true,
        get() { return this.classList.contains('mb-ticker-viewport') ? viewport : 0; },
    });
    Object.defineProperty(HTMLElement.prototype, 'scrollWidth', {
        configurable: true,
        get() { return this.classList.contains('mb-ticker-copy') ? run : 0; },
    });
}

const items: TickerStat[] = [
    { icon: Droplets, label: 'Water supplied today', value: '1,200 m³' },
    { icon: Droplets, label: 'Unaccounted water', value: '150 m³' },
];

function track(): HTMLElement {
    const el = document.querySelector('.mb-ticker-track');
    if (!el) throw new Error('ticker track not found');
    return el as HTMLElement;
}

function copies(): number {
    return document.querySelectorAll('.mb-ticker-copy').length;
}

afterEach(() => {
    vi.unstubAllGlobals();
    // @ts-expect-error — restoring the jsdom defaults we overrode above
    delete HTMLElement.prototype.clientWidth;
    // @ts-expect-error — same
    delete HTMLElement.prototype.scrollWidth;
});

describe('ticker loop geometry', () => {
    it('repeats a short run until half the track covers the viewport — and still scrolls', () => {
        // The old production numbers that used to force STATIC: a 1232px strip
        // holding a 440px run. ceil(1232/440) = 3 copies per half → 6 total.
        stubWidths({ viewport: 1232, run: 440 });
        render(<InspectionTicker caption="Estate briefing" items={items} />);

        expect(track().getAttribute('data-static')).toBeNull();
        expect(copies()).toBe(6);
        // One cycle travels half the track: 3 × 440px at 26px/s ≈ 50.77s.
        expect(track().style.getPropertyValue('--mb-ticker-duration')).toBe('50.77s');
    });

    it('uses a single copy per half when one run already covers the viewport', () => {
        stubWidths({ viewport: 400, run: 900 });
        render(<InspectionTicker caption="Estate briefing" items={items} />);

        expect(track().getAttribute('data-static')).toBeNull();
        expect(copies()).toBe(2);
    });

    it('scrolls at the exact boundary, where one copy per half is precisely enough', () => {
        stubWidths({ viewport: 600, run: 600 });
        render(<InspectionTicker caption="Estate briefing" items={items} />);

        expect(track().getAttribute('data-static')).toBeNull();
        expect(copies()).toBe(2);
    });

    it('derives duration from the travelled distance, so every strip moves at one pace', () => {
        stubWidths({ viewport: 400, run: 900 });
        render(<InspectionTicker caption="Estate briefing" items={items} />);

        // 1 copy per half → 900px at 26px/s ≈ 34.62s.
        expect(track().style.getPropertyValue('--mb-ticker-duration')).toBe('34.62s');
    });

    it('holds still only while unmeasurable, and never animates blindly', () => {
        // Hidden container / fonts not in: both measurements are zero.
        stubWidths({ viewport: 0, run: 0 });
        render(<InspectionTicker caption="Estate briefing" items={items} />);

        expect(track().getAttribute('data-static')).toBe('true');
        expect(track().style.getPropertyValue('--mb-ticker-duration')).toBe('');
    });

    it('marks every copy after the first as aria-hidden so stats are read aloud once', () => {
        stubWidths({ viewport: 1232, run: 440 });
        render(<InspectionTicker caption="Estate briefing" items={items} />);

        const runs = Array.from(document.querySelectorAll('.mb-ticker-copy'));
        expect(runs[0].getAttribute('aria-hidden')).toBeNull();
        for (const dup of runs.slice(1)) {
            expect(dup.getAttribute('aria-hidden')).toBe('true');
        }
        // Repetition must never mean silence — the visible stats still render.
        expect(screen.getAllByText('Water supplied today').length).toBeGreaterThan(0);
        expect(screen.getAllByText('1,200 m³').length).toBeGreaterThan(0);
    });
});
