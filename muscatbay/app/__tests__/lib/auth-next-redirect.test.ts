import { describe, it, expect } from 'vitest';
import { safeNext } from '@/lib/validation';

/**
 * `?next=` is attacker-controlled — anyone can send a user
 * /auth/callback?next=… — and it is handed to router.push(),
 * which follows an absolute URL straight off this origin. That
 * would be an open redirect out of the app's own sign-in, at
 * the moment the user has just authenticated.
 */

const TAB = String.fromCharCode(9);
const LF = String.fromCharCode(10);
const CR = String.fromCharCode(13);
const NUL = String.fromCharCode(0);

/** Stand-in for the app's own origin when resolving results. */
const ORIGIN = 'https://app.example';

describe('safeNext', () => {
    it('keeps ordinary internal paths', () => {
        expect(safeNext('/water')).toBe('/water');
        expect(safeNext('/auth/reset-password')).toBe('/auth/reset-password');
        expect(safeNext('/water?zone=A&tab=daily')).toBe('/water?zone=A&tab=daily');
        expect(safeNext('/assets#row-42')).toBe('/assets#row-42');
    });

    it('falls back to the dashboard when absent or empty', () => {
        expect(safeNext(null)).toBe('/');
        expect(safeNext('')).toBe('/');
    });

    it('normalises a path the URL parser would read differently', () => {
        // The parser strips tab/CR/LF from anywhere in a URL, so
        // never hand router.push() a string that still contains
        // them — what was validated must be what is navigated.
        expect(safeNext('/wa' + LF + 'ter')).toBe('/water');
    });

    // ── The security property ──────────────────────────
    // Not "equals '/'" — that is an implementation detail.
    // What must hold is that NOTHING can leave this origin.
    const hostile: Array<[string, string]> = [
        ['absolute http', 'http://evil.com'],
        ['absolute https', 'https://evil.com'],
        ['protocol-relative', '//evil.com'],
        ['backslash authority', '/\\evil.com'],
        ['double backslash', '/\\\\evil.com'],
        ['javascript scheme', 'javascript:alert(document.cookie)'],
        ['javascript, cased', 'JavaScript:alert(1)'],
        ['data scheme', 'data:text/html,<script>alert(1)</script>'],
        ['bare host', 'evil.com'],
        ['relative escape', '../../evil'],
        // Control characters the parser strips or trims, which a
        // naive prefix check reads as ordinary rooted paths.
        ['tab-split authority', '/' + TAB + '\\evil.com'],
        ['newline-split authority', '/' + LF + '//evil.com'],
        ['CR-split scheme', 'java' + CR + 'script:alert(1)'],
        ['NULsplit authority', '/' + NUL + '\\evil.com'],
        ['space-split authority', '/ \\evil.com'],
    ];

    it.each(hostile)('cannot leave this origin: %s', (_label, value) => {
        const result = safeNext(value);
        // Whatever it returns must resolve back onto this origin.
        // Asserting the exact string would be weaker AND wrong:
        // some of these normalise to same-origin paths that still
        // read `evil.com` as a path segment (`/%00/evil.com`),
        // which is harmless. The origin is the property.
        expect(new URL(result, ORIGIN).origin).toBe(ORIGIN);
    });
});
