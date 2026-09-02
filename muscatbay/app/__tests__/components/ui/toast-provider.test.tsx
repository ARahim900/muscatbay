import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ToastProvider, useToast } from '@/components/ui/toast-provider';

function Trigger() {
    const toast = useToast();
    return (
        <button type="button" onClick={() => toast.info('Reading stale', 'Zone 3 bulk meter')}>
            raise
        </button>
    );
}

function renderWithToast() {
    render(
        <ToastProvider>
            <Trigger />
        </ToastProvider>
    );
    act(() => {
        fireEvent.click(screen.getByRole('button', { name: 'raise' }));
    });
}

describe('ToastItem dismiss button', () => {
    it('carries a ≥44px touch target in BOTH axes on coarse pointers', () => {
        renderWithToast();
        const dismiss = screen.getByRole('button', { name: 'Dismiss' });

        // Icon-only control: the coarse-pointer rule in globals.css floors only
        // block size, so the width floor is declared on the control (WCAG 2.5.5).
        expect(dismiss.className).toContain('pointer-coarse:min-h-11');
        expect(dismiss.className).toContain('pointer-coarse:min-w-11');
    });

    it('keeps its dense mouse padding and still dismisses the toast', () => {
        renderWithToast();
        const dismiss = screen.getByRole('button', { name: 'Dismiss' });
        expect(dismiss.className).toContain('p-1');

        expect(screen.getByText('Reading stale')).toBeInTheDocument();
        act(() => {
            fireEvent.click(dismiss);
        });
        expect(screen.queryByText('Reading stale')).toBeNull();
    });
});
