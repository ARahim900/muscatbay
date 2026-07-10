import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { DateRangePicker } from '@/components/water/date-range-picker';

// Real STP-shaped data: contiguous months through the in-progress current one.
const MONTHS_2026 = ['Jan-26', 'Feb-26', 'Mar-26', 'Apr-26', 'May-26', 'Jun-26', 'Jul-26'];

function renderPicker(props: Partial<React.ComponentProps<typeof DateRangePicker>> = {}) {
    const onRangeChange = vi.fn();
    const onReset = vi.fn();
    render(
        <DateRangePicker
            startMonth="Jan-26"
            endMonth="Jul-26"
            availableMonths={MONTHS_2026}
            onRangeChange={onRangeChange}
            onReset={onReset}
            {...props}
        />,
    );
    return { onRangeChange, onReset };
}

function selectedText(select: HTMLSelectElement): string {
    return select.selectedIndex >= 0 ? (select.options[select.selectedIndex].textContent ?? '') : '';
}

describe('DateRangePicker', () => {
    it('populates the Start/End selects with the current selection (happy path)', () => {
        renderPicker();
        const start = screen.getByLabelText('Start month selector') as HTMLSelectElement;
        const end = screen.getByLabelText('End month selector') as HTMLSelectElement;

        expect(start.options.length).toBe(MONTHS_2026.length);
        expect(start.selectedIndex).toBeGreaterThanOrEqual(0);
        expect(selectedText(start)).toBe('January 2026');
        expect(selectedText(end)).toBe('July 2026');
    });

    it('never renders empty selects when endMonth is outside the (year-filtered) availableMonths', () => {
        // Regression: a stray future row (e.g. May-27) becomes endMonth while a
        // year filter scopes availableMonths to 2026. Previously displayYear
        // followed endMonth's year (2027), whose Jan–Dec axis had no data, so the
        // selects rendered zero options and appeared blank while the summary read
        // "January 2027". The selects must now stay populated with real months.
        renderPicker({ startMonth: 'Jan-27', endMonth: 'Jan-27', availableMonths: MONTHS_2026 });

        const start = screen.getByLabelText('Start month selector') as HTMLSelectElement;
        const end = screen.getByLabelText('End month selector') as HTMLSelectElement;

        // Options exist and correspond to the year that actually has data.
        expect(start.options.length).toBe(MONTHS_2026.length);
        expect(within(start).getAllByRole('option').length).toBeGreaterThan(0);

        // A value is actually selected (selectedIndex === -1 is the blank-box bug).
        expect(start.selectedIndex).toBeGreaterThanOrEqual(0);
        expect(end.selectedIndex).toBeGreaterThanOrEqual(0);
        expect(selectedText(start)).toMatch(/2026$/);
        expect(selectedText(end)).toMatch(/2026$/);

        // No stray 2027 leaks into the option list.
        expect(start.textContent).not.toMatch(/2027/);
    });

    it('keeps selects populated across a Dec → Jan year rollover', () => {
        // Range whose end is January of a new year that has data.
        const spanning = ['Nov-25', 'Dec-25', 'Jan-26', 'Feb-26'];
        renderPicker({ startMonth: 'Dec-25', endMonth: 'Jan-26', availableMonths: spanning });

        const end = screen.getByLabelText('End month selector') as HTMLSelectElement;
        // Axis follows the end year (2026), which has data → options render.
        expect(end.options.length).toBeGreaterThan(0);
        expect(end.selectedIndex).toBeGreaterThanOrEqual(0);
        expect(selectedText(end)).toMatch(/2026$/);
    });
});
