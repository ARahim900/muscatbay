import { describe, it, expect } from 'vitest';
import {
    buildRenewalItems,
    evaluateRenewals,
    horizonFor,
    isAmbiguousSlashDate,
} from '@/lib/monitoring/renewals';
import { RENEWAL_HORIZON_DAYS } from '@/lib/monitoring/config';
import type { ContractorTracker } from '@/entities/contractor';

const at = (iso: string) => new Date(`${iso}T00:00:00.000Z`);
const NOW = at('2026-08-20');

function contract(partial: Partial<ContractorTracker>): ContractorTracker {
    return {
        Contractor: 'Test Co',
        'Service Provided': 'Testing',
        Status: 'Active',
        'Contract Type': 'AMC',
        'Start Date': '2024-01-01',
        'End Date': null,
        'Contract (OMR)/Month': null,
        'Contract Total (OMR)/Year': null,
        'Annual Value (OMR)': null,
        'Renewal Plan': null,
        Note: null,
        ...partial,
    };
}

describe('renewal horizons', () => {
    it('exposes the ladder the reports and the alert feed share', () => {
        expect([...RENEWAL_HORIZON_DAYS]).toEqual([90, 60, 30, 7]);
    });

    it('places a contract in the tightest horizon that still contains it', () => {
        expect(horizonFor(120)).toBeNull();
        expect(horizonFor(90)).toBe(90);
        expect(horizonFor(75)).toBe(90);
        expect(horizonFor(45)).toBe(60);
        expect(horizonFor(30)).toBe(30);
        expect(horizonFor(3)).toBe(7);
        expect(horizonFor(-1)).toBeNull();
    });
});

describe('renewal bands', () => {
    it('bands a contract by its recorded end date', () => {
        const items = buildRenewalItems([
            contract({ Contractor: 'Expired Co', 'End Date': '2026-07-01' }),
            contract({ Contractor: 'Soon Co', 'End Date': '2026-09-05' }),
            contract({ Contractor: 'Window Co', 'End Date': '2026-10-30' }),
            contract({ Contractor: 'Active Co', 'End Date': '2027-06-01' }),
        ], NOW);
        expect(items.map((i) => i.band)).toEqual(['expired', 'soon', 'window', 'active']);
        expect(items.map((i) => i.severity)).toEqual(['critical', 'high', 'watch', 'good']);
    });

    it('leaves a row the register has already closed alone', () => {
        const [item] = buildRenewalItems(
            [contract({ Contractor: 'Closed Co', Status: 'Expired', 'End Date': '2025-01-01' })],
            NOW,
        );
        expect(item.band).toBe('closed');
        expect(item.severity).toBe('good');
        expect(item.horizon).toBeNull();
    });

    it('does not claim a lapsed contract is "marked active" when the register says otherwise', () => {
        // Status is free text: the register holds "Retaining" alongside Active
        // and Expired. The band only tests "past end date and not closed", so
        // neither the label nor the headline may assert more than that.
        const { section, items } = evaluateRenewals(
            [contract({ Contractor: 'Retained Co', Status: 'Retaining', 'End Date': '2026-07-01' })],
            NOW,
        );
        expect(items[0].band).toBe('expired');
        expect(section.headline).not.toContain('marked active');
        expect(section.headline).toContain('1 past their end date and not closed');
        expect(section.breakdown.find((r) => r.key === 'expired')!.label).not.toContain('marked active');
    });

    it('reports an unreadable end date as unreadable, never as far-future', () => {
        const [item] = buildRenewalItems([contract({ 'End Date': 'when the job is done' })], NOW);
        expect(item.band).toBe('unreadable');
        expect(item.days).toBeNull();
        expect(item.severity).toBe('nodata');
    });
});

describe('renewal findings', () => {
    it('raises an expired-but-active contract as critical and says both readings of it', () => {
        const { findings } = evaluateRenewals(
            [contract({ Contractor: 'Gulf Expert', 'Service Provided': 'HVAC', 'End Date': '2026-07-01' })],
            NOW,
        );
        const expired = findings.find((f) => f.id.startsWith('renewal-expired'))!;
        expect(expired.severity).toBe('critical');
        expect(expired.confirmed).toContain('50 days ago');
        expect(expired.confirmed).toContain('still records the status as "Active"');
        expect(expired.recommendation).toContain('Confirm which of the two is true');
    });

    it('groups contracts by the horizon they have crossed into', () => {
        const { findings } = evaluateRenewals([
            contract({ Contractor: 'A Co', 'End Date': '2026-08-25' }), // 5 days → 7
            contract({ Contractor: 'B Co', 'End Date': '2026-09-10' }), // 21 days → 30
            contract({ Contractor: 'C Co', 'End Date': '2026-10-05' }), // 46 days → 60
            contract({ Contractor: 'D Co', 'End Date': '2027-01-01' }), // 134 days → none
        ], NOW);
        const horizons = findings
            .filter((f) => f.id.startsWith('renewal-horizon'))
            .map((f) => f.period);
        expect(horizons).toEqual(['7-day horizon', '30-day horizon', '60-day horizon']);
        expect(findings.every((f) => !f.confirmed.includes('D Co'))).toBe(true);
    });

    it('flags an end date the app’s two parsers read differently', () => {
        const { findings } = evaluateRenewals(
            [contract({ Contractor: 'Ambiguous Co', 'End Date': '3/4/2027' })],
            NOW,
        );
        const ambiguous = findings.find((f) => f.id.startsWith('renewal-ambiguous-date'))!;
        expect(ambiguous.severity).toBe('high');
        expect(ambiguous.confirmed).toContain('up to eleven months apart');
        expect(ambiguous.recommendation).toContain('ISO form');
    });

    it('does not call an unambiguous slash date ambiguous', () => {
        expect(isAmbiguousSlashDate('3/4/2027')).toBe(true);
        expect(isAmbiguousSlashDate('13/4/2027')).toBe(false); // 13 cannot be a month
        expect(isAmbiguousSlashDate('4/4/2027')).toBe(false);  // both readings agree
        expect(isAmbiguousSlashDate('2027-04-03')).toBe(false);
        expect(isAmbiguousSlashDate(null)).toBe(false);
    });

    it('separates "no end date recorded" from "end date unreadable"', () => {
        const { findings } = evaluateRenewals([
            contract({ Contractor: 'Blank Co', 'End Date': null }),
            contract({ Contractor: 'Garbled Co', 'End Date': 'TBC' }),
        ], NOW);
        expect(findings.find((f) => f.id.startsWith('renewal-undated'))!.confirmed).toContain('Blank Co');
        expect(findings.find((f) => f.id.startsWith('renewal-unreadable'))!.confirmed).toContain('Garbled Co');
    });

    it('says "unknown", not "clear", when the register could not be read', () => {
        const { section, findings, items } = evaluateRenewals(null, NOW);
        expect(section.severity).toBe('nodata');
        expect(section.unavailable).toContain('not confirmed clear');
        expect(findings).toHaveLength(0);
        expect(items).toHaveLength(0);
    });

    it('carries no owner, status or due-date field — identification only', () => {
        const { items, findings } = evaluateRenewals(
            [contract({ 'End Date': '2026-09-01' })],
            NOW,
        );
        const forbidden = ['owner', 'assignee', 'assignedTo', 'dueDate', 'closedAt', 'resolution'];
        for (const key of forbidden) {
            expect(Object.keys(items[0])).not.toContain(key);
            expect(Object.keys(findings[0])).not.toContain(key);
        }
    });
});
