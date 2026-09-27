import { describe, it, expect, afterEach } from 'vitest';
import {
    consumeSearchParams,
    contractorsHref,
    isSamePageHref,
    parseContractorTab,
    parseStpLink,
    parseStpTab,
    parseMonthKey,
    parseWaterMonthlyLink,
    parseWaterView,
    stpHref,
    waterMonthlyHref,
    waterViewHref,
} from '@/lib/deep-links';

/** The query string of an href, as the page's URL listener would receive it. */
function paramsOf(href: string): URLSearchParams {
    return new URL(href, 'https://muscatbay.work').searchParams;
}

describe('water links', () => {
    it('builds a monthly link pinned to a month and section', () => {
        expect(waterMonthlyHref({ month: 'Aug-26', section: 'zones' })).toBe(
            '/water?view=monthly&month=Aug-26&section=zones',
        );
        expect(waterMonthlyHref()).toBe('/water?view=monthly');
    });

    it('drops a malformed month instead of emitting a link the page would ignore', () => {
        expect(waterMonthlyHref({ month: '2026-08' })).toBe('/water?view=monthly');
    });

    it('round-trips: what the alert links to is what the page parses', () => {
        const params = paramsOf(waterMonthlyHref({ month: 'Mar-26', section: 'overview' }));
        expect(parseWaterView(params.get('view'))).toBe('monthly');
        expect(parseWaterMonthlyLink(params)).toEqual({ month: 'Mar-26', section: 'overview' });
    });

    it('builds a fixed-view link', () => {
        expect(waterViewHref('daily')).toBe('/water?view=daily');
        expect(parseWaterView(paramsOf(waterViewHref('satellite')).get('view'))).toBe('satellite');
    });

    it('parses only known views', () => {
        expect(parseWaterView('daily')).toBe('daily');
        expect(parseWaterView('readings')).toBe('readings');
        expect(parseWaterView('Monthly')).toBeNull();
        expect(parseWaterView('')).toBeNull();
        expect(parseWaterView(null)).toBeNull();
    });

    it('accepts "Mon-YY" months only', () => {
        expect(parseMonthKey('Aug-26')).toBe('Aug-26');
        expect(parseMonthKey('Foo-26')).toBeNull();
        expect(parseMonthKey('aug-26')).toBeNull();
        expect(parseMonthKey('Aug-2026')).toBeNull();
        expect(parseMonthKey(undefined)).toBeNull();
    });

    it('returns no monthly link for a plain visit or unknown params', () => {
        expect(parseWaterMonthlyLink(paramsOf('/water'))).toBeNull();
        expect(parseWaterMonthlyLink(paramsOf('/water?view=monthly'))).toBeNull();
        expect(parseWaterMonthlyLink(paramsOf('/water?section=nope&month=bad'))).toBeNull();
    });

    it('keeps the valid half of a partly valid link', () => {
        expect(parseWaterMonthlyLink(paramsOf('/water?section=exceptions&month=bad'))).toEqual({
            month: null,
            section: 'exceptions',
        });
    });
});

describe('STP and contractor links', () => {
    it('builds and parses STP tabs', () => {
        expect(stpHref('watch')).toBe('/stp?tab=watch');
        expect(parseStpTab(paramsOf(stpHref('dashboard')).get('tab'))).toBe('dashboard');
        // Stale key from the old layout must not select a tab that no longer exists.
        expect(parseStpTab('details')).toBeNull();
    });

    it('carries the month an STP alert is about, and round-trips it', () => {
        expect(stpHref('dashboard', { month: 'Sep-26' })).toBe('/stp?tab=dashboard&month=Sep-26');
        expect(stpHref('dashboard', { month: '2026-09' })).toBe('/stp?tab=dashboard');
        expect(parseStpLink(paramsOf(stpHref('dashboard', { month: 'Sep-26' })))).toEqual({
            tab: 'dashboard',
            month: 'Sep-26',
        });
        expect(parseStpLink(paramsOf('/stp'))).toBeNull();
        expect(parseStpLink(paramsOf('/stp?tab=details&month=bad'))).toBeNull();
    });

    it('builds and parses contractor tabs', () => {
        expect(contractorsHref('renewals')).toBe('/contractors?tab=renewals');
        expect(parseContractorTab(paramsOf(contractorsHref('tracker')).get('tab'))).toBe('tracker');
        expect(parseContractorTab('expiry')).toBeNull();
        expect(parseContractorTab(null)).toBeNull();
    });
});

describe('isSamePageHref', () => {
    it('matches on pathname only, ignoring query and hash', () => {
        expect(isSamePageHref('/stp?tab=watch', '/stp')).toBe(true);
        expect(isSamePageHref('/water?view=monthly#x', '/water')).toBe(true);
        expect(isSamePageHref('/stp?tab=watch', '/water')).toBe(false);
        expect(isSamePageHref('/stp', null)).toBe(false);
    });
});

describe('consumeSearchParams', () => {
    afterEach(() => {
        window.history.replaceState(null, '', '/');
    });

    it('removes only the named params and keeps the rest of the URL', () => {
        window.history.pushState(null, '', '/water?view=monthly&month=Aug-26&section=zones#top');
        const lengthBefore = window.history.length;
        consumeSearchParams(['month', 'section']);
        expect(window.location.pathname + window.location.search + window.location.hash).toBe(
            '/water?view=monthly#top',
        );
        // Rewrites the entry rather than adding one — back still leaves the page.
        expect(window.history.length).toBe(lengthBefore);
    });

    it('leaves the history untouched when there is nothing to consume', () => {
        window.history.pushState({ marker: 1 }, '', '/stp');
        consumeSearchParams(['tab']);
        expect(window.history.state).toEqual({ marker: 1 });
    });
});
