import { describe, it, expect, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useValueChanged } from '@/hooks/useValueChanged';

/**
 * jsdom ships no `matchMedia`, and the hook reads it through `useReducedMotion`.
 * Each test installs one so both the motion-allowed and reduced paths are real
 * rather than falling through the "unavailable" guard.
 */
function installMatchMedia(reduced: boolean) {
    vi.stubGlobal('matchMedia', vi.fn(() => ({
        matches: reduced,
        media: '(prefers-reduced-motion: reduce)',
        addEventListener: () => {},
        removeEventListener: () => {},
    })));
}

afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
});

describe('useValueChanged', () => {
    it('does not fire on first render', () => {
        installMatchMedia(false);
        // A figure appearing for the first time has not changed — flashing every
        // tile on load would train people to ignore the signal.
        const { result } = renderHook(() => useValueChanged('1,200'));
        expect(result.current).toBe(false);
    });

    it('fires when the value changes', () => {
        installMatchMedia(false);
        const { result, rerender } = renderHook(({ v }) => useValueChanged(v), {
            initialProps: { v: '1,200' },
        });
        expect(result.current).toBe(false);

        rerender({ v: '1,340' });
        expect(result.current).toBe(true);
    });

    it('stays quiet when a re-render carries the same value', () => {
        installMatchMedia(false);
        const { result, rerender } = renderHook(({ v }) => useValueChanged(v), {
            initialProps: { v: '1,200' },
        });
        rerender({ v: '1,200' });
        expect(result.current).toBe(false);
    });

    it('clears itself after the hold window', () => {
        vi.useFakeTimers();
        installMatchMedia(false);
        const { result, rerender } = renderHook(({ v }) => useValueChanged(v, 1400), {
            initialProps: { v: '1,200' },
        });

        rerender({ v: '1,340' });
        expect(result.current).toBe(true);

        act(() => { vi.advanceTimersByTime(1500); });
        expect(result.current).toBe(false);
    });

    it('never fires under prefers-reduced-motion', () => {
        installMatchMedia(true);
        const { result, rerender } = renderHook(({ v }) => useValueChanged(v), {
            initialProps: { v: '1,200' },
        });
        rerender({ v: '1,340' });
        // The figure still updates; only the highlight is suppressed.
        expect(result.current).toBe(false);
    });

    it('handles a value arriving from null without flashing the load', () => {
        installMatchMedia(false);
        // Tiles render null before the first fetch resolves. That first real
        // value IS a change, and should be marked — but only once.
        const { result, rerender } = renderHook(({ v }) => useValueChanged(v), {
            initialProps: { v: null as string | null },
        });
        expect(result.current).toBe(false);
        rerender({ v: '1,200' });
        expect(result.current).toBe(true);
    });
});
