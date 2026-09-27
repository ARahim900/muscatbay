import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';

// A controllable query string standing in for the App Router's current URL.
let currentQuery = '';
vi.mock('next/navigation', () => ({
    useSearchParams: () => new URLSearchParams(currentQuery),
}));

import { SearchParamsListener } from '@/components/shared/search-params-listener';

describe('SearchParamsListener', () => {
    beforeEach(() => {
        currentQuery = '';
    });

    it('reports the params on mount', async () => {
        currentQuery = 'view=daily';
        const onChange = vi.fn();
        await act(async () => {
            render(<SearchParamsListener onChange={onChange} />);
        });
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0].get('view')).toBe('daily');
    });

    it('reports again when the query changes while mounted (the alert-tap case)', async () => {
        currentQuery = 'view=daily';
        const onChange = vi.fn();
        const { rerender } = render(<SearchParamsListener onChange={onChange} />);
        await act(async () => {});

        currentQuery = 'view=monthly&month=Aug-26';
        await act(async () => {
            rerender(<SearchParamsListener onChange={onChange} />);
        });
        expect(onChange).toHaveBeenCalledTimes(2);
        expect(onChange.mock.calls[1][0].get('month')).toBe('Aug-26');
    });

    it('does not re-fire on a re-render with the same query', async () => {
        currentQuery = 'tab=watch';
        const onChange = vi.fn();
        const { rerender } = render(<SearchParamsListener onChange={onChange} />);
        await act(async () => {});
        await act(async () => {
            rerender(<SearchParamsListener onChange={onChange} />);
        });
        expect(onChange).toHaveBeenCalledTimes(1);
    });
});
