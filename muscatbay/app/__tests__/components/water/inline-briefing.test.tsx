import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DailyBriefing } from '@/components/water/daily-report/inline-briefing';
import type { BriefingMetrics } from '@/components/water/daily-report/briefing-metrics';

const base: BriefingMetrics = {
    totalSupply: 1200, l2Total: 1000, l3Total: 850, lossM3: 150, lossPct: 15,
    alarmCount: 0, alarmZones: [], zoneCount: 6, vsYesterdayPct: 10, status: 'normal',
};

// The briefing is a static card (the former ticker strip duplicated its stat
// run for a seamless loop; DESIGN_SYSTEM.md rule 7 retired tickers), so every
// stat appears exactly once. Stat queries still use getAllByText so a value
// that also appears elsewhere in the card cannot make a wording check flaky.
//
// These assertions pin the *wording*, not just the numbers. The labels were
// rewritten because the originals ("ΣL2 → ΣL3", a bare "+10.0%") were
// unreadable to anyone who is not a water engineer, so the plain-English
// phrasing is the feature and a regression to jargon should fail here.

describe('DailyBriefing', () => {
    it('renders the caption once and every stat label in the briefing', () => {
        render(<DailyBriefing metrics={base} month="Mar-26" day={15} />);
        expect(screen.getByText(/Briefing · Mar-26 · Day 15/)).toBeInTheDocument();
        for (const label of [
            'Water supplied today',
            'Recorded at meters',
            'Unaccounted water',
            'Zones needing attention',
            'Compared with yesterday',
        ]) {
            expect(screen.getAllByText(label).length).toBeGreaterThan(0);
        }
    });

    it('uses no engineering shorthand in any visible label', () => {
        render(<DailyBriefing metrics={base} month="Mar-26" day={15} />);
        for (const jargon of ['ΣL2', 'ΣL3', 'L2 →', 'Distribution total']) {
            expect(screen.queryAllByText(new RegExp(jargon))).toHaveLength(0);
        }
    });

    it('renders each stat exactly once — no ticker duplicate', () => {
        render(<DailyBriefing metrics={base} month="Mar-26" day={15} />);
        expect(screen.getAllByText('Water supplied today')).toHaveLength(1);
        // No marquee: nothing in the card is hidden from assistive technology.
        expect(document.querySelectorAll('[aria-hidden="true"] li')).toHaveLength(0);
    });

    it('states the loss in m³ and as a share of supply', () => {
        render(<DailyBriefing metrics={base} month="Mar-26" day={15} />);
        expect(screen.getAllByText(/150\.00 m³ lost · 15\.0% of supply/).length).toBeGreaterThan(0);
    });

    it('omits the percentage when it cannot be computed, rather than showing 0%', () => {
        const m: BriefingMetrics = { ...base, lossPct: null };
        render(<DailyBriefing metrics={m} month="Mar-26" day={15} />);
        expect(screen.getAllByText(/150\.00 m³ lost$/).length).toBeGreaterThan(0);
        expect(screen.queryAllByText(/of supply/)).toHaveLength(0);
    });

    it('gives the all-clear with the zone count, not a bare zero', () => {
        render(<DailyBriefing metrics={base} month="Mar-26" day={15} />);
        expect(screen.getAllByText('None — all 6 zones normal').length).toBeGreaterThan(0);
    });

    it('distinguishes "no zone data" from "all zones healthy"', () => {
        const m: BriefingMetrics = { ...base, zoneCount: 0 };
        render(<DailyBriefing metrics={m} month="Mar-26" day={15} />);
        expect(screen.getAllByText('No zone data today').length).toBeGreaterThan(0);
        expect(screen.queryAllByText(/zones normal/)).toHaveLength(0);
    });

    it('names the alarm zones (shortened) with the total for context', () => {
        const m: BriefingMetrics = { ...base, alarmCount: 2, alarmZones: ['Zone 3A', 'Village Square'], status: 'warning' };
        render(<DailyBriefing metrics={m} month="Mar-26" day={15} />);
        expect(screen.getAllByText(/2 of 6 · 3A, Village Square/).length).toBeGreaterThan(0);
    });

    it('spells out the direction of the day-over-day change', () => {
        render(<DailyBriefing metrics={base} month="Mar-26" day={15} />);
        expect(screen.getAllByText('10.0% more used').length).toBeGreaterThan(0);

        render(<DailyBriefing metrics={{ ...base, vsYesterdayPct: -4.2 }} month="Mar-26" day={15} />);
        expect(screen.getAllByText('4.2% less used').length).toBeGreaterThan(0);
    });

    it('says there is no comparison rather than rendering a bare dash', () => {
        const m: BriefingMetrics = { ...base, vsYesterdayPct: null };
        render(<DailyBriefing metrics={m} month="Mar-26" day={1} />);
        expect(screen.getAllByText('No reading yesterday').length).toBeGreaterThan(0);
    });

    it('reports an unchanged day as unchanged, not as a rounded zero movement', () => {
        const m: BriefingMetrics = { ...base, vsYesterdayPct: 0 };
        render(<DailyBriefing metrics={m} month="Mar-26" day={15} />);
        expect(screen.getAllByText('Same as yesterday').length).toBeGreaterThan(0);
    });
});
