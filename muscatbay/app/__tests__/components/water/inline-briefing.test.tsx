import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DailyBriefing } from '@/components/water/daily-report/inline-briefing';
import type { BriefingMetrics } from '@/components/water/daily-report/briefing-metrics';

const base: BriefingMetrics = {
    totalSupply: 1200, lossM3: 150, lossPct: 15,
    alarmCount: 0, alarmZones: [], vsYesterdayPct: 10, status: 'normal',
};

describe('DailyBriefing', () => {
    it('renders the four KPI labels', () => {
        render(<DailyBriefing metrics={base} month="Mar-26" day={15} />);
        expect(screen.getByText(/Total Supply/i)).toBeInTheDocument();
        expect(screen.getByText(/Distribution Loss/i)).toBeInTheDocument();
        expect(screen.getByText(/Zones in Alarm/i)).toBeInTheDocument();
        expect(screen.getByText(/vs\. Yesterday/i)).toBeInTheDocument();
    });

    it('shows the all-clear verdict when status is normal', () => {
        render(<DailyBriefing metrics={base} month="Mar-26" day={15} />);
        expect(screen.getByText(/within tolerance/i)).toBeInTheDocument();
    });

    it('names the alarm zones when status is warning', () => {
        const m: BriefingMetrics = { ...base, alarmCount: 2, alarmZones: ['Zone_03A', 'Zone_05'], status: 'warning' };
        render(<DailyBriefing metrics={m} month="Mar-26" day={15} />);
        expect(screen.getByText(/Zone_03A/)).toBeInTheDocument();
        expect(screen.getByText(/Zone_05/)).toBeInTheDocument();
    });

    it('renders an em dash for a null vs-yesterday value', () => {
        const m: BriefingMetrics = { ...base, vsYesterdayPct: null };
        render(<DailyBriefing metrics={m} month="Mar-26" day={1} />);
        expect(screen.getByText('—')).toBeInTheDocument();
    });
});
