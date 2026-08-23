import { describe, it, expect } from 'vitest';
import {
    SEVERITY_ORDER,
    classifyCoverage,
    coverage,
    formatCoverage,
    formatPct,
    sumCoverage,
    worstSeverity,
} from '@/lib/monitoring/coverage';

describe('coverage', () => {
    it('reports an unknown as null, never as a reassuring 100%', () => {
        const stat = coverage(0, 0);
        expect(stat.pct).toBeNull();
        expect(formatPct(stat.pct)).toBe('—');
        expect(classifyCoverage(stat)).toBe('nodata');
    });

    it('counts explicit not-applicable entries as accounted for, not as gaps', () => {
        const stat = coverage(10, 7, 3);
        expect(stat.missing).toBe(0);
        expect(stat.pct).toBe(100);
        expect(formatCoverage(stat)).toBe('7 of 10 recorded, 3 recorded as not in service');
    });

    it('never lets recorded exceed expected', () => {
        const stat = coverage(5, 9);
        expect(stat.missing).toBe(0);
        expect(stat.pct).toBe(100);
    });

    it('classifies the bands', () => {
        expect(classifyCoverage(coverage(100, 100))).toBe('good');
        expect(classifyCoverage(coverage(100, 97))).toBe('watch');
        expect(classifyCoverage(coverage(100, 85))).toBe('high');
        expect(classifyCoverage(coverage(100, 60))).toBe('critical');
    });

    it('escalates to critical when a blocking meter is missing, whatever the percentage', () => {
        // 119 of 120 read is 99.2% — a watch on numbers alone, but the one
        // missing meter is the main bulk, so the day has no balance at all.
        expect(classifyCoverage(coverage(120, 119))).toBe('watch');
        expect(classifyCoverage(coverage(120, 119), 1)).toBe('critical');
    });

    it('sums stats without losing the not-applicable split', () => {
        const total = sumCoverage([coverage(10, 8, 1), coverage(10, 10, 0)]);
        expect(total).toMatchObject({ expected: 20, recorded: 18, notApplicable: 1, missing: 1 });
    });

    it('takes the worst severity of a set', () => {
        expect(worstSeverity(['good', 'watch', 'critical', 'nodata'])).toBe('critical');
        expect(worstSeverity(['good', 'good'])).toBe('good');
        expect(worstSeverity([])).toBe('nodata');
    });

    it('ranks an unreadable section above a healthy one — unknown is not fine', () => {
        expect(worstSeverity(['good', 'nodata'])).toBe('nodata');
        expect(worstSeverity(['nodata', 'watch'])).toBe('watch');
        expect(SEVERITY_ORDER).toEqual(['critical', 'high', 'watch', 'nodata', 'good']);
    });

    it('never rounds an incomplete set up to 100%', () => {
        // 2,499 of 2,500 recorded is 99.96% — "100.0%" would report a gap as a
        // full house, which is the exact failure this module exists to catch.
        expect(formatPct(coverage(2500, 2499).pct)).toBe('99.9%');
        expect(formatPct(100)).toBe('100%');
        expect(formatPct(0)).toBe('0%');
        expect(formatPct(null)).toBe('—');
    });
});
