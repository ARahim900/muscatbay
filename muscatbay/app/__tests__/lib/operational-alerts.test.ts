import { describe, it, expect } from 'vitest';
import {
    evaluateWaterLossAlerts,
    evaluateContractAlerts,
    evaluateContractDateConflictAlerts,
    evaluateSTPAlerts,
    evaluateOperationalAlerts,
    evaluateOperationalAlertsWithCoverage,
    parseTrackerDate,
} from '@/lib/operational-alerts';
import type { WaterMeter } from '@/lib/water-data';
import type { ContractorTracker } from '@/entities/contractor';
import type { STPOperation } from '@/lib/mock-data';

/** 13 Jul 2026 (UTC) — fixed clock for all day-based rules. */
const NOW = new Date(Date.UTC(2026, 6, 13));

/* ── fixtures ─────────────────────────────────────────────────────────── */

function meter(partial: Partial<WaterMeter> & { consumption: Record<string, number | null> }): WaterMeter {
    return {
        label: 'Test Meter',
        accountNumber: 'C0000',
        level: 'L3',
        zone: 'Zone_05',
        parentMeter: '',
        type: 'Residential (Villa)',
        ...partial,
    };
}

/** Water system where Mar-26 loss is 43.8% — 28.8 pp above the 15% target. */
function waterMetersWithLoss(): WaterMeter[] {
    return [
        meter({ label: 'NAMA Main', level: 'L1', zone: 'Main', consumption: { 'Mar-26': 1000 } }),
        meter({ label: 'Zone 5 Bulk', level: 'L2', consumption: { 'Mar-26': 700 } }),
        meter({ label: 'Villa 1', level: 'L3', consumption: { 'Mar-26': 562 } }),
    ];
}

function contractor(partial: Partial<ContractorTracker>): ContractorTracker {
    return {
        Contractor: 'Test Co',
        'Service Provided': 'Testing',
        Status: 'Active',
        'Contract Type': 'Contract',
        'Start Date': '1/1/2024',
        'End Date': null,
        'Contract (OMR)/Month': null,
        'Contract Total (OMR)/Year': null,
        'Annual Value (OMR)': null,
        'Renewal Plan': null,
        Note: null,
        ...partial,
    };
}

function stpOp(date: string, inlet: number | null, tse: number | null, trips: number | null = 2): STPOperation {
    return { id: date, date, inlet_sewage: inlet, tse_for_irrigation: tse, tanker_trips: trips };
}

/* ── water loss ───────────────────────────────────────────────────────── */

describe('evaluateWaterLossAlerts', () => {
    it('raises a CRITICAL alert quoting the pp-above-target figure (the 28.8 pp case)', () => {
        const alerts = evaluateWaterLossAlerts(waterMetersWithLoss());
        expect(alerts).toHaveLength(1);
        expect(alerts[0].id).toBe('water-loss:Mar-26');
        expect(alerts[0].level).toBe('error'); // 43.8% > 25% critical band
        expect(alerts[0].message).toContain('43.8%');
        expect(alerts[0].message).toContain('28.8 pp above the 15% target');
        expect(alerts[0].href).toBe('/water');
    });

    it('raises a WARNING between target and the critical band', () => {
        const meters = [
            meter({ level: 'L1', zone: 'Main', consumption: { 'Mar-26': 1000 } }),
            meter({ level: 'L2', consumption: { 'Mar-26': 900 } }),
            meter({ level: 'L3', consumption: { 'Mar-26': 800 } }), // 20% loss
        ];
        const alerts = evaluateWaterLossAlerts(meters);
        expect(alerts).toHaveLength(1);
        expect(alerts[0].level).toBe('warning');
    });

    it('stays silent when loss is at or below target and zones are healthy', () => {
        const meters = [
            meter({ level: 'L1', zone: 'Main', consumption: { 'Mar-26': 1000 } }),
            meter({ level: 'L2', consumption: { 'Mar-26': 950 } }),
            meter({ level: 'L3', consumption: { 'Mar-26': 900 } }), // 10% loss
        ];
        expect(evaluateWaterLossAlerts(meters)).toHaveLength(0);
    });

    it('lists critical zones inside the exceedance message', () => {
        const alerts = evaluateWaterLossAlerts([
            meter({ level: 'L1', zone: 'Main', consumption: { 'Mar-26': 1000 } }),
            meter({ level: 'L2', zone: 'Zone_05', consumption: { 'Mar-26': 800 } }),
            meter({ level: 'L3', zone: 'Zone_05', consumption: { 'Mar-26': 300 } }), // zone 62.5%
        ]);
        expect(alerts).toHaveLength(1);
        expect(alerts[0].message).toContain('Worst zones');
        expect(alerts[0].message).toContain('62.5%');
    });

    it('flags critical zones even when the system total is within target', () => {
        const alerts = evaluateWaterLossAlerts([
            meter({ level: 'L1', zone: 'Main', consumption: { 'Mar-26': 1000 } }),
            // Zone 5 leaks badly but is small; a big direct connection keeps A3 high.
            meter({ level: 'L2', zone: 'Zone_05', consumption: { 'Mar-26': 100 } }),
            meter({ level: 'L3', zone: 'Zone_05', consumption: { 'Mar-26': 40 } }), // zone 60%
            meter({ label: 'DC | Hotel', level: 'DC', zone: 'Main', type: 'Retail', consumption: { 'Mar-26': 850 } }),
        ]);
        expect(alerts).toHaveLength(1);
        expect(alerts[0].id).toBe('water-zone-loss:Mar-26');
        expect(alerts[0].level).toBe('warning');
    });

    it('warns on a negative balance (consumption above supply)', () => {
        const alerts = evaluateWaterLossAlerts([
            meter({ level: 'L1', zone: 'Main', consumption: { 'Mar-26': 500 } }),
            meter({ level: 'L2', consumption: { 'Mar-26': 700 } }),
            meter({ level: 'L3', consumption: { 'Mar-26': 700 } }),
        ]);
        expect(alerts).toHaveLength(1);
        expect(alerts[0].id).toBe('water-loss-negative:Mar-26');
        expect(alerts[0].level).toBe('warning');
    });

    it('skips months whose main bulk (A1) reading is missing instead of faking 100% loss', () => {
        const meters = [
            // No Apr-26 NAMA reading yet — the June-26 gap scenario.
            meter({ level: 'L1', zone: 'Main', consumption: { 'Mar-26': 1000 } }),
            meter({ level: 'L2', consumption: { 'Mar-26': 700, 'Apr-26': 650 } }),
            meter({ level: 'L3', consumption: { 'Mar-26': 562, 'Apr-26': 500 } }),
        ];
        const alerts = evaluateWaterLossAlerts(meters);
        expect(alerts).toHaveLength(1);
        expect(alerts[0].id).toBe('water-loss:Mar-26'); // evaluated Mar, not Apr
    });

    it('returns nothing for empty input', () => {
        expect(evaluateWaterLossAlerts(null)).toHaveLength(0);
        expect(evaluateWaterLossAlerts([])).toHaveLength(0);
    });
});

/* ── contracts ────────────────────────────────────────────────────────── */

describe('parseTrackerDate', () => {
    it('parses the tracker US format and ISO', () => {
        expect(parseTrackerDate('6/30/2026')?.toISOString().slice(0, 10)).toBe('2026-06-30');
        expect(parseTrackerDate('2026-06-30')?.toISOString().slice(0, 10)).toBe('2026-06-30');
    });

    it('rejects garbage and rolled-over components', () => {
        expect(parseTrackerDate(null)).toBeNull();
        expect(parseTrackerDate('')).toBeNull();
        expect(parseTrackerDate('Schedule of rates')).toBeNull();
        expect(parseTrackerDate('13/40/2026')).toBeNull(); // month 13, day 40
    });
});

describe('evaluateContractAlerts', () => {
    it('raises an ERROR for contracts past End Date but still marked Active', () => {
        const alerts = evaluateContractAlerts(
            [contractor({ Contractor: 'Muna Noor International LLC', 'Service Provided': 'Pest Control Services', 'End Date': '6/30/2026' })],
            NOW,
        );
        expect(alerts).toHaveLength(1);
        expect(alerts[0].level).toBe('error');
        expect(alerts[0].title).toContain('expired but still marked active');
        expect(alerts[0].message).toContain('Muna Noor International LLC');
        expect(alerts[0].message).toContain('30 Jun 2026');
        expect(alerts[0].href).toBe('/contractors');
    });

    it('raises a WARNING for contracts expiring within 60 days', () => {
        const alerts = evaluateContractAlerts(
            [contractor({ Contractor: 'Soon Co', 'End Date': '8/1/2026' })], // 19 days out
            NOW,
        );
        expect(alerts).toHaveLength(1);
        expect(alerts[0].level).toBe('warning');
        expect(alerts[0].message).toContain('19 days');
    });

    it('ignores rows already marked Expired (administratively closed)', () => {
        const alerts = evaluateContractAlerts(
            [contractor({ Status: 'Expired', 'End Date': '1/15/2025' })],
            NOW,
        );
        expect(alerts).toHaveLength(0);
    });

    it('ignores rows with no parseable End Date and far-future contracts', () => {
        const alerts = evaluateContractAlerts(
            [
                contractor({ 'End Date': null }),
                contractor({ Contractor: 'Long Co', 'End Date': '5/6/2030' }),
            ],
            NOW,
        );
        expect(alerts).toHaveLength(0);
    });

    it('raises one incident PER agreement, longest-expired first', () => {
        const alerts = evaluateContractAlerts(
            [
                contractor({ agreement_id: 'AMC-B', Contractor: 'B Co', 'End Date': '6/2/2026' }),
                contractor({ agreement_id: 'AMC-A', Contractor: 'A Co', 'End Date': '12/31/2025' }),
            ],
            NOW,
        );
        expect(alerts).toHaveLength(2);
        expect(alerts.map((a) => a.id)).toEqual(['contract-expiry:AMC-A', 'contract-expiry:AMC-B']);
        expect(alerts[0].message).toContain('A Co');
    });

    // The defect: the fingerprint used to be the joined set of contractor
    // names, so an eleventh expiry re-keyed the incident covering the other ten
    // and discarded every acknowledgement on it.
    it('keeps each agreement fingerprint stable when another contract expires', () => {
        const one = contractor({ agreement_id: 'AMC-A', Contractor: 'A Co', 'End Date': '12/31/2025' });
        const two = contractor({ agreement_id: 'AMC-B', Contractor: 'B Co', 'End Date': '6/2/2026' });

        const before = evaluateContractAlerts([one], NOW).map((a) => a.id);
        const after = evaluateContractAlerts([one, two], NOW).map((a) => a.id);

        expect(before).toEqual(['contract-expiry:AMC-A']);
        expect(after).toContain('contract-expiry:AMC-A');
    });

    // Warning → error is the same contract escalating, not a new incident.
    it('keeps one fingerprint as a contract crosses its End Date', () => {
        const row = contractor({ agreement_id: 'AMC-A', 'End Date': '7/20/2026' });
        const warning = evaluateContractAlerts([row], NOW)[0];
        const error = evaluateContractAlerts([row], new Date(Date.UTC(2026, 6, 25)))[0];

        expect(warning.level).toBe('warning');
        expect(error.level).toBe('error');
        expect(error.id).toBe(warning.id);
    });

    it('falls back to contractor + service when the register has no agreement ID', () => {
        const alerts = evaluateContractAlerts(
            [contractor({ Contractor: 'Legacy Co', 'Service Provided': 'Pest Control', 'End Date': '12/31/2025' })],
            NOW,
        );
        expect(alerts[0].id).toBe('contract-expiry:name:legacy co|pest control');
    });
});

describe('evaluateContractDateConflictAlerts', () => {
    it('surfaces both date sources and does not select a canonical conflicting date', () => {
        const alerts = evaluateContractDateConflictAlerts({
            unreferenced: [],
            contracts: [{
                contractRef: 'GE-2025-HVAC', canonicalStartDate: '2024-07-01',
                canonicalEndDate: null, conflictFields: ['end_date'],
                evidence: [
                    { source: 'amc_register', recordId: 'AMC-1', contractor: 'Gulf Expert', service: 'HVAC', contractRef: 'GE-2025-HVAC', startDate: '2024-07-01', endDate: '2028-06-30', evidenceAnchor: 'Contract' },
                    { source: 'gulf_expert_contracts', recordId: '1', contractor: 'Gulf Expert', service: 'HVAC', contractRef: 'GE-2025-HVAC', startDate: '2024-07-01', endDate: '2027-06-30', evidenceAnchor: 'Register' },
                ],
            }],
        });
        expect(alerts).toHaveLength(1);
        expect(alerts[0].message).toContain('2028-06-30');
        expect(alerts[0].message).toContain('2027-06-30');
        expect(alerts[0].message).toContain('no date was overwritten');
    });
});

/* ── STP ──────────────────────────────────────────────────────────────── */

describe('evaluateSTPAlerts', () => {
    it('stays silent on a healthy recent log', () => {
        const ops = [
            stpOp('2026-07-10', 500, 490),
            stpOp('2026-07-11', 520, 500),
            stpOp('2026-07-12', 510, 495),
        ];
        expect(evaluateSTPAlerts(ops, NOW)).toHaveLength(0);
    });

    it('raises an ERROR when reuse stops while sewage arrives', () => {
        const ops = [
            stpOp('2026-07-11', 500, 480),
            stpOp('2026-07-12', 500, 0),
        ];
        const alerts = evaluateSTPAlerts(ops, NOW);
        const zero = alerts.find((a) => a.id.startsWith('stp-zero-output'));
        expect(zero?.level).toBe('error');
        expect(zero?.message).toContain('zero TSE output');
    });

    it('raises an ERROR below the 80% recovery band and a WARNING below 90%', () => {
        const critical = evaluateSTPAlerts(
            [stpOp('2026-07-11', 1000, 700), stpOp('2026-07-12', 1000, 800)], // 75%
            NOW,
        );
        expect(critical.some((a) => a.id === 'stp-recovery-below-target' && a.level === 'error')).toBe(true);

        const watch = evaluateSTPAlerts(
            [stpOp('2026-07-11', 1000, 850), stpOp('2026-07-12', 1000, 850)], // 85%
            NOW,
        );
        expect(watch.some((a) => a.id === 'stp-recovery-below-target' && a.level === 'warning')).toBe(true);
    });

    // The defect: `stp-low-recovery:<date>` and `stp-watch-recovery:<date>` were
    // different fingerprints, so a plant drifting across the 80% band closed the
    // acknowledged critical incident and opened a fresh un-acknowledged warning.
    it('keeps ONE recovery fingerprint across the critical/watch boundary', () => {
        const critical = evaluateSTPAlerts([stpOp('2026-07-11', 1000, 700), stpOp('2026-07-12', 1000, 800)], NOW)
            .find((a) => a.category === 'process_performance');
        const watch = evaluateSTPAlerts([stpOp('2026-07-11', 1000, 850), stpOp('2026-07-12', 1000, 850)], NOW)
            .find((a) => a.category === 'process_performance');

        expect(critical?.level).toBe('error');
        expect(watch?.level).toBe('warning');
        expect(critical?.id).toBe(watch?.id);
    });

    // The defect: the fingerprint carried the last occurrence date, so every
    // further day of the SAME outage resolved yesterday's incident and raised a
    // new un-acknowledged one.
    it('keeps STP fingerprints stable while a fault continues into a new day', () => {
        const dayOne = evaluateSTPAlerts([stpOp('2026-07-11', 500, 480), stpOp('2026-07-12', 500, 0)], NOW);
        const dayTwo = evaluateSTPAlerts(
            [stpOp('2026-07-11', 500, 480), stpOp('2026-07-12', 500, 0), stpOp('2026-07-13', 500, 0)],
            new Date(Date.UTC(2026, 6, 13, 23)),
        );
        const idsOf = (alerts: ReturnType<typeof evaluateSTPAlerts>, prefix: string) =>
            alerts.filter((a) => a.id.startsWith(prefix)).map((a) => a.id);

        expect(idsOf(dayOne, 'stp-zero-output')).toEqual(['stp-zero-output']);
        expect(idsOf(dayTwo, 'stp-zero-output')).toEqual(['stp-zero-output']);
        // The moving date belongs in the message, where it informs without re-keying.
        expect(dayTwo.find((a) => a.id === 'stp-zero-output')?.message).toContain('13 Jul 2026');
    });

    it('keeps the data-quality fingerprints stable as the most recent bad day moves', () => {
        const first = evaluateSTPAlerts([stpOp('2026-07-11', 100, 150), stpOp('2026-07-12', 100, 90)], NOW);
        const later = evaluateSTPAlerts([stpOp('2026-07-11', 100, 150), stpOp('2026-07-12', 100, 160)], NOW);

        expect(first.find((a) => a.category === 'data_quality')?.id).toBe('stp-impossible-readings');
        expect(later.find((a) => a.category === 'data_quality')?.id).toBe('stp-impossible-readings');
    });

    it('warns when the daily log goes stale (monitoring is blind)', () => {
        const ops = [stpOp('2026-07-01', 500, 490)];
        const alerts = evaluateSTPAlerts(ops, NOW);
        const stale = alerts.find((a) => a.id.startsWith('stp-stale-log'));
        expect(stale?.level).toBe('warning');
        expect(stale?.message).toContain('1 Jul 2026');
    });

    it('ignores future-dated rows (the stray 2027 Airtable row scenario)', () => {
        const ops = [stpOp('2026-07-12', 500, 490), stpOp('2027-05-06', 500, 0)];
        const alerts = evaluateSTPAlerts(ops, NOW);
        expect(alerts.find((a) => a.id.startsWith('stp-zero-output'))).toBeUndefined();
        expect(alerts.find((a) => a.id.startsWith('stp-stale-log'))).toBeUndefined();
    });

    it('separates missing evidence from a genuine zero-output process alert', () => {
        const missing = evaluateSTPAlerts([stpOp('2026-07-12', 500, null)], NOW);
        expect(missing.some((a) => a.category === 'data_quality' && a.id.startsWith('stp-missing-readings'))).toBe(true);
        expect(missing.some((a) => a.id.startsWith('stp-zero-output'))).toBe(false);

        const zero = evaluateSTPAlerts([stpOp('2026-07-12', 500, 0)], NOW);
        expect(zero.some((a) => a.category === 'process_performance' && a.id.startsWith('stp-zero-output'))).toBe(true);
    });

    it('flags output above inlet as data quality and excludes it from recovery performance', () => {
        const alerts = evaluateSTPAlerts([
            stpOp('2026-07-11', 100, 90),
            stpOp('2026-07-12', 100, 150),
        ], NOW);
        expect(alerts.some((a) => a.category === 'data_quality' && a.message.includes('>100% recovery'))).toBe(true);
        expect(alerts.some((a) => a.id === 'stp-recovery-below-target')).toBe(false);
    });
});

/* ── combined ─────────────────────────────────────────────────────────── */

describe('evaluateOperationalAlerts', () => {
    it('combines all rules, most severe first', () => {
        const alerts = evaluateOperationalAlerts({
            waterMeters: waterMetersWithLoss(),
            contractors: [contractor({ Contractor: 'Soon Co', 'End Date': '8/1/2026' })],
            stpOperations: [stpOp('2026-07-12', 500, 0)],
            now: NOW,
        });
        expect(alerts.length).toBeGreaterThanOrEqual(3);
        const levels = alerts.map((a) => a.level);
        expect(levels[0]).toBe('error');
        // No error may appear after a warning/info — severity ordering holds.
        const lastError = levels.lastIndexOf('error');
        const firstNonError = levels.findIndex((l) => l !== 'error');
        expect(firstNonError === -1 || lastError < firstNonError).toBe(true);
    });

    it('produces nothing when no data is supplied (never fabricates)', () => {
        expect(evaluateOperationalAlerts({ now: NOW })).toHaveLength(0);
    });
});

/* ── evidence coverage ────────────────────────────────────────────────── */

describe('evaluateOperationalAlertsWithCoverage', () => {
    /** Water fixture whose Mar-26 balance is computable and fully evidenced. */
    const completeWater = () => waterMetersWithLoss();
    const completeContractors = () => [
        contractor({ agreement_id: 'AMC-1', Contractor: 'Soon Co', 'End Date': '8/1/2026' }),
    ];
    const completeReconciliation = { contracts: [], unreferenced: [] };
    const completeStp = () => [stpOp('2026-07-12', 500, 450, 2)];

    it('grants resolution authority only to modules with complete evidence', () => {
        const result = evaluateOperationalAlertsWithCoverage({
            waterMeters: completeWater(),
            contractors: completeContractors(),
            contractDateReconciliation: completeReconciliation,
            stpOperations: completeStp(),
            now: NOW,
        });
        expect(result.evaluatedModules.sort()).toEqual(['contractors', 'stp', 'water']);
        expect(result.resolvableModules.sort()).toEqual(['contractors', 'stp', 'water']);
        expect(result.withheldResolution).toEqual({});
    });

    it('reports a module that was never read as neither evaluated nor resolvable', () => {
        const result = evaluateOperationalAlertsWithCoverage({ waterMeters: completeWater(), now: NOW });
        expect(result.evaluatedModules).toEqual(['water']);
        expect(result.resolvableModules).toEqual(['water']);
    });

    // The reviewer's final edge case: a meter with the month key ABSENT is as
    // unevidenced as one holding an explicit null, but only the null was caught,
    // so a half-reported month could still close an open loss incident.
    it('withholds water resolution when a meter has no reading for the evaluated month', () => {
        const meters = completeWater();
        meters.push(meter({ label: 'Villa 2', consumption: {} }));
        const result = evaluateOperationalAlertsWithCoverage({ waterMeters: meters, now: NOW });

        expect(result.evaluatedModules).toContain('water');
        expect(result.resolvableModules).not.toContain('water');
        expect(result.withheldResolution.water).toContain('Mar-26');
    });

    it('withholds water resolution for an explicit null reading too', () => {
        const meters = completeWater();
        meters.push(meter({ label: 'Villa 2', consumption: { 'Mar-26': null } }));
        const result = evaluateOperationalAlertsWithCoverage({ waterMeters: meters, now: NOW });
        expect(result.resolvableModules).not.toContain('water');
    });

    it('withholds STP resolution when a window day is missing a reading', () => {
        const result = evaluateOperationalAlertsWithCoverage({
            stpOperations: [stpOp('2026-07-11', 500, 450), stpOp('2026-07-12', 500, null)],
            now: NOW,
        });
        expect(result.evaluatedModules).toContain('stp');
        expect(result.resolvableModules).not.toContain('stp');
    });

    // Incomplete evidence withholds the authority to CLOSE, never the duty to
    // RAISE — the earlier fix dropped the data-quality alert along with it.
    it('still returns the alerts detected on incomplete evidence', () => {
        const result = evaluateOperationalAlertsWithCoverage({
            stpOperations: [stpOp('2026-07-11', 500, 450), stpOp('2026-07-12', 500, null)],
            now: NOW,
        });
        expect(result.resolvableModules).not.toContain('stp');
        expect(result.alerts.some((a) => a.id === 'stp-missing-readings')).toBe(true);
    });

    it('withholds contractor resolution when a row carries no agreement ID', () => {
        const result = evaluateOperationalAlertsWithCoverage({
            contractors: [contractor({ Contractor: 'Legacy Co', 'End Date': '8/1/2026' })],
            contractDateReconciliation: completeReconciliation,
            now: NOW,
        });
        expect(result.resolvableModules).not.toContain('contractors');
        expect(result.withheldResolution.contractors).toContain('agreement ID');
    });

    it('withholds contractor resolution when an active row has no End Date', () => {
        const result = evaluateOperationalAlertsWithCoverage({
            contractors: [
                ...completeContractors(),
                contractor({ agreement_id: 'AMC-2', 'End Date': 'Schedule of rates' }),
            ],
            contractDateReconciliation: completeReconciliation,
            now: NOW,
        });
        expect(result.resolvableModules).not.toContain('contractors');
        expect(result.withheldResolution.contractors).toContain('End Date');
    });

    it('withholds contractor resolution when date reconciliation was unavailable', () => {
        const result = evaluateOperationalAlertsWithCoverage({
            contractors: completeContractors(),
            contractDateReconciliation: null,
            now: NOW,
        });
        expect(result.resolvableModules).not.toContain('contractors');
        expect(result.withheldResolution.contractors).toContain('reconciliation');
    });
});
