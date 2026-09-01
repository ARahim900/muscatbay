import { act, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ChartContainer, ChartShell } from '@/components/charts/chart-container';

let resizeCallback: ResizeObserverCallback | null = null;

class TestResizeObserver {
    constructor(callback: ResizeObserverCallback) {
        resizeCallback = callback;
    }
    observe() {}
    unobserve() {}
    disconnect() {}
}

vi.stubGlobal('ResizeObserver', TestResizeObserver);
vi.stubGlobal('matchMedia', vi.fn(() => ({
    matches: true,
    media: '(prefers-reduced-motion: reduce)',
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
})));
vi.mock('recharts', () => ({
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
}));

describe('ChartContainer', () => {
    it('does not mount a chart until ResizeObserver reports positive dimensions', () => {
        let width = 0;
        const height = 240;
        vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({
            width,
            height,
            top: 0,
            right: width,
            bottom: height,
            left: 0,
            x: 0,
            y: 0,
            toJSON: () => ({}),
        }));

        render(<ChartContainer minHeight={240}><svg data-testid="plot" /></ChartContainer>);
        expect(screen.queryByTestId('plot')).not.toBeInTheDocument();

        width = 480;
        act(() => resizeCallback?.([], {} as ResizeObserver));
        expect(screen.getByTestId('plot')).toBeInTheDocument();
    });
});

describe('ChartShell', () => {
    it('renders consistent empty and management interpretation states', () => {
        const { rerender } = render(
            <ChartShell title="Consumption trend" state="empty"><span>plot</span></ChartShell>,
        );
        expect(screen.getByText('No data is available for this period.')).toBeInTheDocument();

        rerender(
            <ChartShell title="Consumption trend" interpretation="Consumption is stable."><span>plot</span></ChartShell>,
        );
        expect(screen.getByText('Management note:')).toBeInTheDocument();
        expect(screen.getByText('Consumption is stable.')).toBeInTheDocument();
    });
});
