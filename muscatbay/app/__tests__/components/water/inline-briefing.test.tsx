import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DailyBriefing } from '@/components/water/daily-report/inline-briefing';
import type { BriefingMetrics } from '@/components/water/daily-report/briefing-metrics';

const base: BriefingMetrics = {
    totalSupply: 1200, l2Total: 1000, l3Total: 850, lossM3: 150, lossPct: 15,
    alarmCount: 0, alarmZones: [], vsYesterdayPct: 10, status: 'normal',
};

describe('DailyBriefing', () => {
    it('renders the strip labels', () => {
        render(<DailyBriefing metrics={base} month="Mar-26" day={15} />);
        expect(screen.getByText('Distribution total')).toBeInTheDocument();
        expect(screen.getByText('ΣL2 → ΣL3')).toBeInTheDocument();
        expect(screen.getByText('Loss')).toBeInTheDocument();
        expect(screen.getByText('Zones in alarm')).toBeInTheDocument();
        expect(screen.getByText('vs. yesterday')).toBeInTheDocument();
        expect(screen.getByText(/Mar-26 · Day 15/)).toBeInTheDocument();
    });

    it('shows the loss in m³ and percent', () => {
        render(<DailyBriefing metrics={base} month="Mar-26" day={15} />);
        expect(screen.getByText(/150\.00 m³ · 15\.0%/)).toBeInTheDocument();
    });

    it('shows the all-clear verdict when status is normal', () => {
        render(<DailyBriefing metrics={base} month="Mar-26" day={15} />);
        expect(screen.getByText(/within tolerance/i)).toBeInTheDocument();
    });

    it('names the alarm zones (shortened) when status is warning', () => {
        const m: BriefingMetrics = { ...base, alarmCount: 2, alarmZones: ['Zone 3A', 'Village Square'], status: 'warning' };
        render(<DailyBriefing metrics={m} month="Mar-26" day={15} />);
        expect(screen.getByText(/2 · 3A, Village Square/)).toBeInTheDocument();
    });

    it('renders an em dash for a null vs-yesterday value', () => {
        const m: BriefingMetrics = { ...base, vsYesterdayPct: null };
        render(<DailyBriefing metrics={m} month="Mar-26" day={1} />);
        expect(screen.getByText('—')).toBeInTheDocument();
    });
});
