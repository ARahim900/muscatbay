import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import HvacPage from '@/app/hvac/page';
import { clearPageCache } from '@/lib/page-cache';

// The four readers never settle, so the page stays in its loading branch for
// the whole assertion — the state a blanket <PageSkeleton /> used to cover by
// replacing the real heading with an anonymous grey bar.
vi.mock('@/functions/supabase-client', () => ({
    isSupabaseConfigured: () => true,
}));

vi.mock('@/functions/api/gulf-expert', () => ({
    getPpmFindings: () => new Promise(() => {}),
    getRecurringIssues: () => new Promise(() => {}),
    getGulfExpertContracts: () => new Promise(() => {}),
    getGulfExpertCommunications: () => new Promise(() => {}),
    GULF_EXPERT_REALTIME_TABLES: [],
}));

vi.mock('@/hooks/useSupabaseRealtime', () => ({
    useSupabaseRealtime: () => ({ isLive: false }),
}));

describe('/hvac — loading state', () => {
    beforeEach(() => {
        clearPageCache();
    });

    it('keeps the real page title on screen while the data loads', () => {
        render(<HvacPage />);

        expect(
            screen.getByRole('heading', { level: 1, name: 'HVAC System' }),
        ).toBeInTheDocument();
    });

    it('announces the still-loading region instead of an anonymous page', () => {
        render(<HvacPage />);

        expect(
            screen.getByRole('status', { name: 'Loading HVAC data' }),
        ).toHaveAttribute('aria-busy', 'true');
    });
});
