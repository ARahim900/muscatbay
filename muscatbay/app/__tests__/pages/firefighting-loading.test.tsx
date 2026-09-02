import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import FirefightingPage from '@/app/firefighting/page';
import { clearPageCache } from '@/lib/page-cache';

// The single fire-safety reader never settles, so the page stays in its loading
// branch for the whole assertion — the state a blanket <PageSkeleton /> used to
// cover by replacing the real heading with an anonymous grey bar.
vi.mock('@/actions/fire-safety', () => ({
    fetchFireSafetyDataAction: () => new Promise(() => {}),
}));

vi.mock('@/hooks/useSupabaseRealtime', () => ({
    useSupabaseRealtime: () => ({ isLive: false }),
}));

describe('/firefighting — loading state', () => {
    beforeEach(() => {
        clearPageCache();
    });

    it('keeps the real page title on screen while the data loads', () => {
        render(<FirefightingPage />);

        expect(
            screen.getByRole('heading', { level: 1, name: 'Fire Safety Management' }),
        ).toBeInTheDocument();
    });

    it('announces the still-loading region instead of an anonymous page', () => {
        render(<FirefightingPage />);

        expect(
            screen.getByRole('status', { name: 'Loading fire safety data' }),
        ).toHaveAttribute('aria-busy', 'true');
    });

    it('holds the two 260px chart boxes open so the page does not jump', () => {
        render(<FirefightingPage />);

        // The loading branch reuses the very fallback the lazy chart chunk
        // shows, so the skeleton and the real cards are the same size.
        const region = screen.getByRole('status', { name: 'Loading fire safety data' });
        expect(region.querySelectorAll('.h-\\[260px\\]')).toHaveLength(2);
    });
});
