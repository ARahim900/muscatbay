import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Droplets } from 'lucide-react';
import { InspectionTicker, type TickerStat } from '@/components/shared/inspection';

/**
 * The ticker loop holds two identical copies and shifts by exactly one copy's
 * width `W`. For the viewport `V` to stay covered at the worst point of the
 * cycle you need `W >= V`; below that the content slides away and leaves a gap
 * before snapping back, which is what made the strip look jammed on wide
 * screens while looking fine on a phone.
 *
 * These tests pin that rule by controlling the two measurements directly.
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

afterEach(() => {
    vi.unstubAllGlobals();
    // @ts-expect-error — restoring the jsdom defaults we overrode above
    delete HTMLElement.prototype.clientWidth;
    // @ts-expect-error — same
    delete HTMLElement.prototype.scrollWidth;
});

describe('ticker loop geometry', () => {
    it('holds still when the content already fits — the desktop case that looked jammed', () => {
        // The measured production numbers: a 1232px strip holding a 440px run.
        stubWidths({ viewport: 1232, run: 440 });
        render(<InspectionTicker caption="Estate briefing" items={items} />);

        expect(track().getAttribute('data-static')).toBe('true');
    });

    it('scrolls once one copy is at least as wide as the viewport', () => {
        stubWidths({ viewport: 400, run: 900 });
        render(<InspectionTicker caption="Estate briefing" items={items} />);

        expect(track().getAttribute('data-static')).toBeNull();
    });

    it('scrolls at the exact boundary, where the loop is still seamless', () => {
        stubWidths({ viewport: 600, run: 600 });
        render(<InspectionTicker caption="Estate briefing" items={items} />);

        expect(track().getAttribute('data-static')).toBeNull();
    });

    it('derives duration from width, so the strip moves at a constant pace', () => {
        stubWidths({ viewport: 400, run: 900 });
        render(<InspectionTicker caption="Estate briefing" items={items} />);

        // 900px at 26px/s ≈ 34.62s (speed lowered from 40 on the owner's
        // request, 2026-07-29). A fixed duration made short runs crawl.
        expect(track().style.getPropertyValue('--mb-ticker-duration')).toBe('34.62s');
    });

    it('sets no duration while static', () => {
        stubWidths({ viewport: 1232, run: 440 });
        render(<InspectionTicker caption="Estate briefing" items={items} />);

        expect(track().style.getPropertyValue('--mb-ticker-duration')).toBe('');
    });

    it('still renders every stat when the strip is static', () => {
        stubWidths({ viewport: 1232, run: 440 });
        render(<InspectionTicker caption="Estate briefing" items={items} />);

        // Not scrolling must never mean not showing.
        expect(screen.getAllByText('Water supplied today').length).toBeGreaterThan(0);
        expect(screen.getAllByText('1,200 m³').length).toBeGreaterThan(0);
    });
});
