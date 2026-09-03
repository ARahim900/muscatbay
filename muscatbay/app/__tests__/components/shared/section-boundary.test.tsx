import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SectionBoundary, isChunkLoadError } from '@/components/shared/section-boundary';

/**
 * Stale-build recovery.
 *
 * Sections loaded with `next/dynamic` throw a chunk-load error when the tab is
 * still running a build whose files a newer deployment has replaced. Retrying
 * the subtree re-requests the same missing file, so the boundary must reload
 * the page instead — once, and only once, so a genuinely broken build cannot
 * loop. An ordinary render error keeps the plain Retry card.
 */

function Boom({ error }: { error: Error }): never {
    throw error;
}

function chunkError(): Error {
    const e = new Error('Loading chunk 4821 failed.');
    e.name = 'ChunkLoadError';
    return e;
}

describe('SectionBoundary', () => {
    beforeEach(() => {
        window.sessionStorage.clear();
        // React logs every caught error; keep the test output readable.
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
        window.sessionStorage.clear();
    });

    it('recognises the chunk-load error shapes browsers and bundlers produce', () => {
        expect(isChunkLoadError(chunkError())).toBe(true);
        expect(isChunkLoadError(new TypeError('Failed to fetch dynamically imported module: /x.js'))).toBe(true);
        expect(isChunkLoadError(new Error('Loading chunk app-pages-browser_components_hvac failed'))).toBe(true);
        expect(isChunkLoadError(new TypeError("Cannot read properties of undefined (reading 'filter')"))).toBe(false);
        expect(isChunkLoadError(null)).toBe(false);
    });

    it('keeps the plain Retry card for an ordinary render error and never reloads', () => {
        const reload = vi.fn();
        render(
            <SectionBoundary title="HVAC Overview" reload={reload}>
                <Boom error={new TypeError('bad payload')} />
            </SectionBoundary>,
        );
        expect(screen.getByText('HVAC Overview could not be displayed')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
        expect(reload).not.toHaveBeenCalled();
    });

    it('reloads the page once when a lazy section cannot fetch its chunk', () => {
        const reload = vi.fn();
        render(
            <SectionBoundary title="HVAC Overview" reload={reload}>
                <Boom error={chunkError()} />
            </SectionBoundary>,
        );
        expect(reload).toHaveBeenCalledTimes(1);
        // The flag is what stops a second automatic reload on this route.
        expect(window.sessionStorage.getItem(`mb:chunk-reload:${window.location.pathname}`)).not.toBeNull();
        expect(screen.getByText('HVAC Overview needs the latest version of the app')).toBeInTheDocument();
    });

    it('never reloads automatically when sessionStorage is blocked — the claim could not be recorded', () => {
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
            throw new Error('SecurityError: storage is disabled');
        });
        const reload = vi.fn();
        render(
            <SectionBoundary title="Plant Watch" reload={reload}>
                <Boom error={chunkError()} />
            </SectionBoundary>,
        );
        expect(reload).not.toHaveBeenCalled();
        expect(screen.getByRole('button', { name: /reload page/i })).toBeInTheDocument();
    });

    it('offers a manual reload instead of looping when the automatic one is already spent', () => {
        window.sessionStorage.setItem(`mb:chunk-reload:${window.location.pathname}`, String(Date.now()));
        const reload = vi.fn();
        render(
            <SectionBoundary title="Plant Watch" reload={reload}>
                <Boom error={chunkError()} />
            </SectionBoundary>,
        );
        expect(reload).not.toHaveBeenCalled();
        const button = screen.getByRole('button', { name: /reload page/i });
        expect(screen.queryByRole('button', { name: /^retry$/i })).toBeNull();
        fireEvent.click(button);
        expect(reload).toHaveBeenCalledTimes(1);
    });
});
