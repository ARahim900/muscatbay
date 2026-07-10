import { describe, it, expect, beforeEach } from 'vitest';
import { getPageCache, setPageCache, clearPageCache } from '@/lib/page-cache';

describe('page-cache', () => {
    beforeEach(() => clearPageCache());

    it('returns undefined on a cold miss', () => {
        expect(getPageCache('nope')).toBeUndefined();
    });

    it('round-trips a stored value', () => {
        setPageCache('water:meters', { meters: [1, 2, 3], dataSource: 'supabase' });
        expect(getPageCache('water:meters')).toEqual({ meters: [1, 2, 3], dataSource: 'supabase' });
    });

    it('overwrites on re-set (stale-while-revalidate refresh)', () => {
        setPageCache('k', 'stale');
        setPageCache('k', 'fresh');
        expect(getPageCache('k')).toBe('fresh');
    });

    it('clears a single key without touching others', () => {
        setPageCache('a', 1);
        setPageCache('b', 2);
        clearPageCache('a');
        expect(getPageCache('a')).toBeUndefined();
        expect(getPageCache('b')).toBe(2);
    });

    it('clears everything when called without a key', () => {
        setPageCache('a', 1);
        setPageCache('b', 2);
        clearPageCache();
        expect(getPageCache('a')).toBeUndefined();
        expect(getPageCache('b')).toBeUndefined();
    });
});
