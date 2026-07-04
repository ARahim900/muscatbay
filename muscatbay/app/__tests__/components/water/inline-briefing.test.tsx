import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DailyBriefing } from '@/components/water/daily-report/inline-briefing';
import type { BriefingMetrics } from '@/components/water/daily-report/briefing-metrics';

const base: BriefingMetrics = {
    totalSupply: 1200, l2Total: 1000, l3Total: 850, lossM3: 150, lossPct: 15,
    alarmCount: 0, alarmZones: [], vsYesterdayPct: 10, status: 'normal',
};

// The ticker renders the stat run twice (the duplicate makes the loop
// seamless), so stat queries use getAllByText; the caption appears once.

describe('DailyBriefing', () => {
    it('renders the caption once and every stat label in the ticker', () => {
        render(<DailyBriefing metrics={base} month="Mar-26" day={15} />);
        expect(screen.getByText(/Briefing · Mar-26 · Day 15/)).toBeInTheDocument();
        for (const label of ['Distribution total', 'ΣL2 → ΣL3', 'Loss', 'Zones in alarm', 'vs. yesterday']) {
            expect(screen.getAllByText(label).length).toBeGreaterThan(0);
        }
    });

    it('duplicates the stat run exactly once for the seamless loop', () => {
        render(<DailyBriefing metrics={base} month="Mar-26" day={15} />);
        expect(screen.getAllByText('Distribution total')).toHaveLength(2);
    });

    it('shows the loss in m³ and percent', () => {
        render(<DailyBriefing metrics={base} month="Mar-26" day={15} />);
        expect(screen.getAllByText(/150\.00 m³ · 15\.0%/).length).toBeGreaterThan(0);
    });

    it('shows the all-clear verdict when status is normal', () => {
        render(<DailyBriefing metrics={base} month="Mar-26" day={15} />);
        expect(screen.getAllByText(/within tolerance/i).length).toBeGreaterThan(0);
    });

    it('names the alarm zones (shortened) when status is warning', () => {
        const m: BriefingMetrics = { ...base, alarmCount: 2, alarmZones: ['Zone 3A', 'Village Square'], status: 'warning' };
        render(<DailyBriefing metrics={m} month="Mar-26" day={15} />);
        expect(screen.getAllByText(/2 · 3A, Village Square/).length).toBeGreaterThan(0);
    });

    it('renders an em dash for a null vs-yesterday value', () => {
        const m: BriefingMetrics = { ...base, vsYesterdayPct: null };
        render(<DailyBriefing metrics={m} month="Mar-26" day={1} />);
        expect(screen.getAllByText('—').length).toBeGreaterThan(0);
    });
});
