import { describe, it, expect } from 'vitest';
import { safeNext } from '@/lib/validation';

/**
 * `?next=` is attacker-controlled — anyone can send a user
 * /auth/callback?next=… — and it is handed to router.push(),
 * which follows an absolute URL straight off this origin. That
 * would be an open redirect out of the app's own sign-in, at
 * the moment the user has just authenticated.
 */
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

    it.each([
        ['absolute http', 'http://evil.com'],
        ['absolute https', 'https://evil.com'],
        ['protocol-relative', '//evil.com'],
        ['protocol-relative, backslash', '/\\evil.com'],
        ['javascript scheme', 'javascript:alert(document.cookie)'],
        ['javascript, cased', 'JavaScript:alert(1)'],
        ['data scheme', 'data:text/html,<script>alert(1)</script>'],
        ['bare host', 'evil.com'],
        ['relative escape', '../../evil'],
    ])('refuses %s', (_label, hostile) => {        expect(safeNext(hostile)).toBe('/');
    });
});
