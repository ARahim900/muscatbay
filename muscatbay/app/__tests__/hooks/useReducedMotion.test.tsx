import { describe, it, expect, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useReducedMotion, useChartMotion } from '@/hooks/useReducedMotion';
import { MOTION } from '@/lib/motion';

/**
 * jsdom ships no `matchMedia`, so each test installs one. The listener set is
 * real, which is the point: the hook has to re-render when the OS setting
 * flips mid-session, and a stubbed no-op listener would hide that.
 */
type Listener = () => void;

function installMatchMedia(matches: boolean) {
    const listeners = new Set<Listener>();
    const mql = {
        matches,
        media: '(prefers-reduced-motion: reduce)',
        addEventListener: (_: string, cb: Listener) => void listeners.add(cb),
        removeEventListener: (_: string, cb: Listener) => void listeners.delete(cb),
    };
    vi.stubGlobal('matchMedia', vi.fn(() => mql));
    return {
        /** Flip the OS setting and notify subscribers, as the browser would. */
        set(next: boolean) {
            mql.matches = next;
            listeners.forEach((cb) => cb());
        },
        listenerCount: () => listeners.size,
    };
}

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('useReducedMotion', () => {
    it('reports the current OS preference', () => {
        installMatchMedia(true);
        expect(renderHook(() => useReducedMotion()).result.current).toBe(true);

        installMatchMedia(false);
        expect(renderHook(() => useReducedMotion()).result.current).toBe(false);
    });

    it('re-renders when the preference changes mid-session', () => {
        const mm = installMatchMedia(false);
        const { result } = renderHook(() => useReducedMotion());
        expect(result.current).toBe(false);

        act(() => mm.set(true));
        expect(result.current).toBe(true);
    });

    it('unsubscribes on unmount so the listener does not leak', () => {
        const mm = installMatchMedia(false);
        const { unmount } = renderHook(() => useReducedMotion());
        expect(mm.listenerCount()).toBe(1);
        unmount();
        expect(mm.listenerCount()).toBe(0);
    });

    it('errs toward reduced motion when matchMedia is unavailable', () => {
        vi.stubGlobal('matchMedia', undefined);
        expect(renderHook(() => useReducedMotion()).result.current).toBe(true);
    });
});

describe('useChartMotion', () => {
    it('disables Recharts animation when the user asked for reduced motion', () => {
        installMatchMedia(true);
        const { result } = renderHook(() => useChartMotion());
        expect(result.current.isAnimationActive).toBe(false);
        // No stagger either — a delayed no-op still delays the render.
        expect(result.current.animationBegin).toBe(0);
    });

    it('enables animation on the shared duration when motion is allowed', () => {
        installMatchMedia(false);
        const { result } = renderHook(() => useChartMotion());
        expect(result.current.isAnimationActive).toBe(true);
        // Charts settle with the KPI roll-ups above them, not on Recharts' 1500ms.
        expect(result.current.animationDuration).toBe(MOTION.dur.count * 1000);
    });

    it('staggers by series index', () => {
        installMatchMedia(false);
        const step = MOTION.stagger.tight * 1000;
        expect(renderHook(() => useChartMotion(0)).result.current.animationBegin).toBe(0);
        expect(renderHook(() => useChartMotion(3)).result.current.animationBegin).toBe(3 * step);
    });

    it('caps the stagger so a many-series chart still settles promptly', () => {
        installMatchMedia(false);
        const step = MOTION.stagger.tight * 1000;
        // Water monthly runs 17 series; without the cap the last would start ~850ms late.
        expect(renderHook(() => useChartMotion(17)).result.current.animationBegin).toBe(6 * step);
    });
});
