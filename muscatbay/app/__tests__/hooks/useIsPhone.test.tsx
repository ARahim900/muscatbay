import { describe, it, expect, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIsPhone } from '@/hooks/useIsPhone';

/**
 * jsdom ships no `matchMedia`, so each test installs one with a real listener
 * set: the hook must re-render when the phone rotates past the breakpoint.
 */
type Listener = () => void;

function installMatchMedia(matches: boolean) {
    const listeners = new Set<Listener>();
    const mql = {
        matches,
        media: '(max-width: 639px)',
        addEventListener: (_: string, cb: Listener) => void listeners.add(cb),
        removeEventListener: (_: string, cb: Listener) => void listeners.delete(cb),
    };
    const matchMedia = vi.fn(() => mql);
    vi.stubGlobal('matchMedia', matchMedia);
    return {
        matchMedia,
        /** Cross the breakpoint and notify subscribers, as the browser would. */
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

describe('useIsPhone', () => {
    it('reports whether the viewport is below the sm breakpoint', () => {
        installMatchMedia(true);
        expect(renderHook(() => useIsPhone()).result.current).toBe(true);

        installMatchMedia(false);
        expect(renderHook(() => useIsPhone()).result.current).toBe(false);
    });

    it('queries the same 640px boundary as Tailwind sm', () => {
        const mm = installMatchMedia(false);
        renderHook(() => useIsPhone());
        expect(mm.matchMedia).toHaveBeenCalledWith('(max-width: 639px)');
    });

    it('re-renders when the viewport crosses the breakpoint', () => {
        const mm = installMatchMedia(false);
        const { result } = renderHook(() => useIsPhone());
        expect(result.current).toBe(false);

        act(() => mm.set(true));
        expect(result.current).toBe(true);
    });

    it('unsubscribes on unmount so the listener does not leak', () => {
        const mm = installMatchMedia(false);
        const { unmount } = renderHook(() => useIsPhone());
        expect(mm.listenerCount()).toBe(1);
        unmount();
        expect(mm.listenerCount()).toBe(0);
    });

    it('falls back to the desktop layout when matchMedia is unavailable', () => {
        vi.stubGlobal('matchMedia', undefined);
        expect(renderHook(() => useIsPhone()).result.current).toBe(false);
    });
});
