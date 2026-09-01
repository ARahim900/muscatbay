import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DailyBriefing } from '@/components/water/daily-report/inline-briefing';
import type { BriefingMetrics } from '@/components/water/daily-report/briefing-metrics';

const base: BriefingMetrics = {
    totalSupply: 1200, l2Total: 1000, l3Total: 850, lossM3: 150, lossPct: 15,
    alarmCount: 0, alarmZones: [], zoneCount: 6, vsYesterdayPct: 10, status: 'normal',
};

describe('DailyBriefing', () => {
    it('uses the shared four-finding briefing structure and period label', () => {
        render(<DailyBriefing metrics={base} month="Mar-26" day={15} />);

        expect(screen.getByRole('heading', { name: 'Water briefing' })).toBeInTheDocument();
        expect(screen.getByText('Mar-26 · Day 15')).toBeInTheDocument();
        for (const label of ['Water supplied', 'Recorded at meters', 'Unaccounted water', 'Zones needing attention']) {
            expect(screen.getByText(label)).toBeInTheDocument();
        }
        expect(screen.getAllByRole('listitem')).toHaveLength(4);
    });

    it('uses plain-language labels without engineering shorthand', () => {
        render(<DailyBriefing metrics={base} month="Mar-26" day={15} />);
        for (const jargon of ['ΣL2', 'ΣL3', 'L2 →', 'Distribution total']) {
            expect(screen.queryByText(new RegExp(jargon))).not.toBeInTheDocument();
        }
    });

    it('shows loss volume and percentage without inventing a percentage', () => {
        const { rerender } = render(<DailyBriefing metrics={base} month="Mar-26" day={15} />);
        expect(screen.getByText('150.00 m³ · 15.0%')).toBeInTheDocument();

        rerender(<DailyBriefing metrics={{ ...base, lossPct: null }} month="Mar-26" day={15} />);
        expect(screen.getByText('150.00 m³')).toBeInTheDocument();
        expect(screen.queryByText(/150\.00 m³ · 0(?:\.0)?%/)).not.toBeInTheDocument();
    });

    it('distinguishes a healthy zone set, missing zone data and alarms', () => {
        const { rerender } = render(<DailyBriefing metrics={base} month="Mar-26" day={15} />);
        expect(screen.getByText('None')).toBeInTheDocument();
        expect(screen.getByText('All 6 zones normal')).toBeInTheDocument();

        rerender(<DailyBriefing metrics={{ ...base, zoneCount: 0 }} month="Mar-26" day={15} />);
        expect(screen.getByText('No zone data')).toBeInTheDocument();

        rerender(<DailyBriefing metrics={{ ...base, alarmCount: 2, alarmZones: ['Zone 3A', 'Village Square'], status: 'warning' }} month="Mar-26" day={15} />);
        expect(screen.getByText('2 of 6')).toBeInTheDocument();
        expect(screen.getByText('3A, Village Square')).toBeInTheDocument();
    });

    it('states comparison direction and missing comparison plainly', () => {
        const { rerender } = render(<DailyBriefing metrics={base} month="Mar-26" day={15} />);
        expect(screen.getByText('10.0% more used')).toBeInTheDocument();

        rerender(<DailyBriefing metrics={{ ...base, vsYesterdayPct: -4.2 }} month="Mar-26" day={15} />);
        expect(screen.getByText('4.2% less used')).toBeInTheDocument();

        rerender(<DailyBriefing metrics={{ ...base, vsYesterdayPct: null }} month="Mar-26" day={1} />);
        expect(screen.getByText('No comparable reading')).toBeInTheDocument();

        rerender(<DailyBriefing metrics={{ ...base, vsYesterdayPct: 0 }} month="Mar-26" day={15} />);
        expect(screen.getByText('Same as yesterday')).toBeInTheDocument();
    });
});
