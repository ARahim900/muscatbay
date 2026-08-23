import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * The monitoring readers are where the module's honesty guarantees are actually
 * enforced. Everything downstream — the sections, the completeness percentages,
 * the "unknown" badges — is only as truthful as the `ok` / `empty` / `error` /
 * `not-configured` classification made here: a failed query that resolved to
 * `[]` would make a blind spot indistinguishable from a clean month, and the
 * report would confidently declare 100% coverage of a table it never read.
 *
 * These tests pin that classification, and the three places the monitoring
 * readers deliberately diverge from their dashboard counterparts — negative
 * daily water readings, NULL electricity consumption, unfiltered STP rows.
 * Each divergence is the entire reason the reader exists, so each is asserted
 * *against* the dashboard reader it replaces.
 *
 * Supabase is mocked at the module boundary (`functions/supabase-client`), so
 * the readers under test run unmodified — including the real `fetchWaterMeters`
 * and `getContractorTrackerData` they delegate to — against a fake PostgREST
 * chain. No network, no fixtures on disk.
 */

const supabase = vi.hoisted(() => ({
    isSupabaseConfigured: vi.fn<() => boolean>(),
    getSupabaseClient: vi.fn<() => SupabaseClient | null>(),
}));

vi.mock('@/functions/supabase-client', () => ({
    isSupabaseConfigured: supabase.isSupabaseConfigured,
    getSupabaseClient: supabase.getSupabaseClient,
    isValidSupabaseKey: () => true,
}));

import {
    getMonitoringWaterDaily,
    getMonitoringStpLog,
    getMonitoringElectricity,
    getMonitoringWaterMonthly,
    getMonitoringContractors,
    type SourceResult,
} from '@/functions/api/monitoring';
import { getDailyWaterConsumptionFromSupabase } from '@/functions/api/water';
import { getElectricityMetersFromSupabase } from '@/functions/api/electricity';

/* ------------------------------------------------------------------ */
/*  A fake PostgREST chain                                             */
/* ------------------------------------------------------------------ */

/** What a query resolves to, or — with `throws` — how it blows up instead. */
type QueuedResult =
    | { data: unknown; error: { message: string } | null; count?: number | null }
    | { throws: unknown };

/** One `from(...)` chain, recorded so the query plan can be asserted. */
interface QueryCall {
    table: string;
    ops: Array<{ method: string; args: unknown[] }>;
}

function createHarness() {
    const queues = new Map<string, QueuedResult[]>();
    const calls: QueryCall[] = [];
    /** Queries no test queued a response for — see the afterEach below. */
    const stray: string[] = [];

    const push = (table: string, result: QueuedResult) => {
        queues.set(table, [...(queues.get(table) ?? []), result]);
    };

    function next(table: string): QueuedResult {
        const pending = queues.get(table);
        const result = pending?.shift();
        if (!result) {
            stray.push(table);
            throw new Error(`No queued response for "${table}"`);
        }
        return result;
    }

    const client = {
        from(table: string) {
            const call: QueryCall = { table, ops: [] };
            calls.push(call);
            // Every builder method returns the chain; awaiting it drains the
            // table's queue. A Proxy rather than an enumerated stub so the
            // chain keeps working if a reader adds a filter.
            const chain: object = new Proxy(
                {},
                {
                    get(_target, prop) {
                        if (typeof prop !== 'string') return undefined;
                        if (prop === 'then') {
                            return (resolve: (value: QueuedResult) => void) => {
                                const result = next(table);
                                if ('throws' in result) throw result.throws;
                                resolve(result);
                            };
                        }
                        return (...args: unknown[]) => {
                            call.ops.push({ method: prop, args });
                            return chain;
                        };
                    },
                },
            );
            return chain;
        },
    };

    return {
        client: client as unknown as SupabaseClient,
        calls,
        stray,
        /** Queue one resolved response per awaited query on `table`, in order. */
        queue(table: string, ...results: Array<{ data: unknown; error?: { message: string } | null; count?: number | null }>) {
            for (const r of results) push(table, { data: r.data, error: r.error ?? null, count: r.count });
        },
        /** Queue a query that rejects — a network fault, not a PostgREST error. */
        queueThrow(table: string, err: unknown) {
            push(table, { throws: err });
        },
        callsFor: (table: string) => calls.filter((c) => c.table === table),
        argsOf: (call: QueryCall, method: string): unknown[] =>
            call.ops.find((op) => op.method === method)?.args ?? [],
    };
}

type Harness = ReturnType<typeof createHarness>;
let harness: Harness;

/** Narrow a reader's payload once the read is known to have succeeded. */
function payload<T>(result: SourceResult<T>): T {
    if (result.data === null) {
        throw new Error(`expected data, got state "${result.status.state}": ${result.status.message}`);
    }
    return result.data;
}

/** A `water_daily_consumption` row — only the day columns a test cares about. */
function dailyRow(days: Record<string, number | string | null>, over: Record<string, unknown> = {}) {
    return {
        id: 1,
        meter_name: 'Z3-42 Villa',
        account_number: '4300001',
        label: 'L3',
        zone: 'Zone 03',
        parent_meter: 'Z3 Bulk',
        type: 'Residential (Villa)',
        month: 'Aug-26',
        year: 2026,
        ...days,
        ...over,
    };
}

const METER = { id: 'm1', name: 'Building A', account_number: 'R51001', meter_type: 'Building' };

beforeEach(() => {
    harness = createHarness();
    supabase.isSupabaseConfigured.mockReturnValue(true);
    supabase.getSupabaseClient.mockReturnValue(harness.client);
    // The dashboard readers used as comparators log their own failures; the
    // tests assert the returned status instead, so keep the output readable.
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
    // A query no test queued means the reader's query plan changed — fail on
    // that explicitly, because the harness surfaces it as a rejected await and
    // the reader would otherwise dress it up as a plausible 'error' status.
    expect(harness.stray).toEqual([]);
    vi.restoreAllMocks();
});

/* ------------------------------------------------------------------ */

describe('monitoring readers — Supabase not configured', () => {
    it('reports every source as not-configured, with no data and no query', async () => {
        supabase.isSupabaseConfigured.mockReturnValue(false);

        const results = await Promise.all([
            getMonitoringWaterDaily(['Aug-26']),
            getMonitoringStpLog(),
            getMonitoringElectricity(['Aug-26']),
            getMonitoringWaterMonthly(),
            getMonitoringContractors(),
        ]);

        for (const result of results) {
            expect(result.status.state).toBe('not-configured');
            expect(result.data).toBeNull();
            expect(result.status.rows).toBeNull();
            expect(result.status.message).toMatch(/not configured/i);
        }
        expect(harness.calls).toEqual([]);
    });
});

describe('monitoring readers — a failed read is never an empty one', () => {
    it('maps a daily-water query error to state "error" with data null', async () => {
        harness.queue('water_daily_consumption', { data: null, error: { message: 'permission denied for relation' } });

        const result = await getMonitoringWaterDaily(['Aug-26']);

        expect(result.status.state).toBe('error');
        // The single most important guarantee in the module: a broken read must
        // not arrive downstream looking like "nothing wrong".
        expect(result.data).toBeNull();
        expect(result.data).not.toEqual([]);
        expect(result.status.rows).toBeNull();
        expect(result.status.message).toBe('permission denied for relation');
    });

    it('maps a network fault (a rejected query, not a PostgREST error) to state "error"', async () => {
        // A thrown string, not an Error — the reader stringifies whatever it caught
        // rather than reporting "undefined" for a failure it cannot name.
        harness.queueThrow('water_daily_consumption', 'Failed to fetch');

        const result = await getMonitoringWaterDaily(['Aug-26']);

        expect(result.status.state).toBe('error');
        expect(result.data).toBeNull();
        expect(result.status.message).toBe('Failed to fetch');
    });

    it('maps an STP query error to state "error" with data null', async () => {
        harness.queue('stp_operations', { data: null, error: { message: 'relation does not exist' } });

        const result = await getMonitoringStpLog();

        expect(result.status.state).toBe('error');
        expect(result.data).toBeNull();
        expect(result.status.message).toBe('relation does not exist');
    });

    it('maps an electricity meter query error to state "error" with data null', async () => {
        harness.queue('electricity_meters', { data: null, error: { message: 'JWT expired' } });

        const result = await getMonitoringElectricity(['Aug-26']);

        expect(result.status.state).toBe('error');
        expect(result.data).toBeNull();
        expect(result.status.message).toBe('JWT expired');
    });

    it('discards a partial electricity read when a later readings page fails', async () => {
        harness.queue('electricity_meters', { data: [METER] });
        harness.queue(
            'electricity_readings',
            { data: Array.from({ length: 1000 }, (_, i) => ({ id: `r${i}`, meter_id: 'm1', month: 'Aug-26', consumption: 1 })) },
            { data: null, error: { message: 'statement timeout' } },
        );

        const result = await getMonitoringElectricity(['Aug-26']);

        // The 1,000 rows already in hand are NOT returned: a truncated dataset
        // reported as complete would understate every month it touches.
        expect(result.status.state).toBe('error');
        expect(result.data).toBeNull();
        expect(result.status.message).toBe('statement timeout');
    });

    it('maps a contractor read that throws to state "error", quoting the reason', async () => {
        // getContractorTrackerData deliberately throws rather than returning [].
        harness.queue('Contractor_Tracker', { data: null, error: { message: 'connection reset' } });

        const result = await getMonitoringContractors();

        expect(result.status.state).toBe('error');
        expect(result.data).toBeNull();
        expect(result.status.message).toContain('connection reset');
        expect(result.status.message).toContain('AMC tracker');
    });

    it('maps a monthly-water read failure to state "error"', async () => {
        harness.queue('water_meters', { data: null, error: { message: 'permission denied' } });

        const result = await getMonitoringWaterMonthly();

        expect(result.status.state).toBe('error');
        expect(result.data).toBeNull();
        expect(result.status.message).toContain('permission denied');
    });
});

describe('monitoring readers — a genuinely empty table is empty, not broken', () => {
    it('maps zero daily-water rows to state "empty" with data [] — never "error"', async () => {
        harness.queue('water_daily_consumption', { data: [] });

        const result = await getMonitoringWaterDaily(['Aug-26']);

        // Inventing a failure that did not happen is its own dishonesty: the
        // table really was read, and it really had no rows for August.
        expect(result.status.state).toBe('empty');
        expect(result.data).toEqual([]);
        expect(result.status.rows).toBe(0);
        expect(result.status.message).toContain('Aug-26');
    });

    it('reports an empty month window as empty without querying at all', async () => {
        const result = await getMonitoringWaterDaily([]);

        expect(result.status.state).toBe('empty');
        expect(result.data).toEqual([]);
        expect(harness.calls).toEqual([]);
    });

    it('maps a zero-row STP log to state "empty" with data []', async () => {
        harness.queue('stp_operations', { data: [] });

        const result = await getMonitoringStpLog();

        expect(result.status.state).toBe('empty');
        expect(result.data).toEqual([]);
        expect(result.status.rows).toBe(0);
    });

    it('maps a register with no electricity meters to state "empty"', async () => {
        harness.queue('electricity_meters', { data: [] });
        harness.queue('electricity_readings', { data: [] });

        const result = await getMonitoringElectricity(['Aug-26']);

        expect(result.status.state).toBe('empty');
        expect(payload(result)).toEqual({ meters: [], readings: [] });
        expect(result.status.rows).toBe(0);
    });

    it('maps an empty contractor register and an empty water register to "empty"', async () => {
        harness.queue('Contractor_Tracker', { data: [] });
        harness.queue('water_meters', { data: [] });

        const contractors = await getMonitoringContractors();
        const water = await getMonitoringWaterMonthly();

        expect(contractors.status.state).toBe('empty');
        expect(contractors.data).toEqual([]);
        expect(water.status.state).toBe('empty');
        expect(payload(water)).toEqual({ meters: [], derivedMonths: [] });
    });
});

describe('getMonitoringWaterDaily — values arrive exactly as stored', () => {
    it('normalises the wide day_1..day_31 columns to a 31-slot array', async () => {
        harness.queue('water_daily_consumption', { data: [dailyRow({ day_1: 4, day_31: 9 })] });

        const [row] = payload(await getMonitoringWaterDaily(['Aug-26']));

        expect(row.days).toHaveLength(31);
        expect(row.days[0]).toBe(4);
        expect(row.days[30]).toBe(9);
        expect(row.account).toBe('4300001');
        expect(row.month).toBe('Aug-26');
    });

    it('keeps a NULL day null and a recorded zero zero — missing is not zero', async () => {
        harness.queue('water_daily_consumption', { data: [dailyRow({ day_2: null, day_3: 0 })] });

        const [row] = payload(await getMonitoringWaterDaily(['Aug-26']));

        expect(row.days[1]).toBeNull();
        expect(row.days[1]).not.toBe(0);
        // day_3 was genuinely read as 0 m³ — a fact, and distinct from day_2.
        expect(row.days[2]).toBe(0);
        // A day column absent from the payload is unread, not zero.
        expect(row.days[9]).toBeNull();
    });

    it('keeps a negative reading negative, where the dashboard reader clamps it to 0', async () => {
        const row = dailyRow({ day_5: -12.4 });
        harness.queue('water_daily_consumption', { data: [row] }, { data: [row] });

        const monitoring = payload(await getMonitoringWaterDaily(['Aug-26']));
        const dashboard = await getDailyWaterConsumptionFromSupabase('Aug-26');

        // This difference is the whole reason getMonitoringWaterDaily exists and
        // does not reuse the dashboard reader: sanitizeDailyReading rewrites a
        // negative to 0, which tidies a chart but erases the anomaly the monitor
        // is there to report.
        expect(monitoring[0].days[4]).toBe(-12.4);
        expect(dashboard[0].dailyReadings[5]).toBe(0);
    });

    it('coerces PostgREST numeric strings, and refuses to read an unreadable value as 0', async () => {
        harness.queue('water_daily_consumption', { data: [dailyRow({ day_1: '3.25', day_2: '-1.5', day_4: 'n/a' }, { meter_name: null })] });

        const [row] = payload(await getMonitoringWaterDaily(['Aug-26']));

        expect(row.days[0]).toBe(3.25);
        expect(row.days[1]).toBe(-1.5);
        expect(row.days[3]).toBeNull();
        expect(row.meterName).toBe('');
    });

    it('scopes the query to the months asked for', async () => {
        harness.queue('water_daily_consumption', { data: [] });

        await getMonitoringWaterDaily(['Jul-26', 'Aug-26']);

        const [call] = harness.callsFor('water_daily_consumption');
        expect(harness.argsOf(call, 'in')).toEqual(['month', ['Jul-26', 'Aug-26']]);
    });
});

describe('getMonitoringElectricity — a NULL consumption is an answer, not an absence', () => {
    it('keeps NULL-consumption rows that the dashboard reader drops', async () => {
        const rows = [
            { id: 'r1', meter_id: 'm1', month: 'Jul-26', consumption: null },
            { id: 'r2', meter_id: 'm1', month: 'Aug-26', consumption: 1200 },
        ];
        harness.queue('electricity_meters', { data: [METER] }, { data: [METER] });
        harness.queue('electricity_readings', { data: rows }, { data: rows });

        const monitoring = payload(await getMonitoringElectricity(['Jul-26', 'Aug-26']));
        const dashboard = await getElectricityMetersFromSupabase();

        // NULL means "closed / not in service" that month. The monitor has to be
        // able to tell that apart from a row that was never entered, so it keeps
        // the row; the dashboard reader drops it from the meter's map.
        expect(monitoring.readings).toEqual([
            { meterId: 'm1', month: 'Jul-26', consumption: null },
            { meterId: 'm1', month: 'Aug-26', consumption: 1200 },
        ]);
        expect(Object.keys(dashboard[0].readings)).toEqual(['Aug-26']);
    });

    it('coerces numeric strings without turning them into zeroes', async () => {
        harness.queue('electricity_meters', { data: [METER] });
        harness.queue('electricity_readings', { data: [{ id: 'r1', meter_id: 'm1', month: 'Aug-26', consumption: '840.5' }] });

        const { readings } = payload(await getMonitoringElectricity(['Aug-26']));

        expect(readings[0].consumption).toBe(840.5);
    });

    it('labels an unclassified meter rather than inventing a category', async () => {
        harness.queue('electricity_meters', { data: [{ id: 'm2', name: 'Pump', meter_type: null, account_number: null }] });
        harness.queue('electricity_readings', { data: [] });

        const { meters } = payload(await getMonitoringElectricity(['Aug-26']));

        expect(meters[0]).toEqual({ id: 'm2', name: 'Pump', accountNumber: '', type: 'Unspecified' });
    });

    it('skips the readings query entirely when no months are in scope', async () => {
        harness.queue('electricity_meters', { data: [METER] });

        const result = await getMonitoringElectricity([]);

        expect(payload(result).readings).toEqual([]);
        expect(payload(result).meters).toHaveLength(1);
        expect(result.status.state).toBe('ok');
        expect(harness.callsFor('electricity_readings')).toEqual([]);
    });
});

describe('getMonitoringStpLog — the log arrives unfiltered', () => {
    it('returns future-dated and unparseable rows instead of dropping them', async () => {
        harness.queue('stp_operations', {
            data: [
                { id: 3, date: '2099-01-01', inlet_sewage: 500, tse_for_irrigation: 480, tanker_trips: 2 },
                { id: 2, date: 'not a date', inlet_sewage: 510, tse_for_irrigation: 495, tanker_trips: 3 },
                { id: 1, date: '2026-08-19', inlet_sewage: null, tse_for_irrigation: null, tanker_trips: null },
            ],
        });

        const rows = payload(await getMonitoringStpLog());

        // The STP page drops these two before rendering. The monitor must see
        // them: a date in 2099 and a date that will not parse ARE the finding.
        expect(rows).toHaveLength(3);
        expect(rows.map((r) => r.date)).toEqual(['2099-01-01', 'not a date', '2026-08-19']);
        expect(rows[2]).toEqual({ date: '2026-08-19', inlet: null, tse: null, tankers: null });
        expect(rows[0].inlet).toBe(500);
    });

    it('asks for the newest rows first, and passes the caller\'s limit through', async () => {
        harness.queue('stp_operations', { data: [] }, { data: [] });

        await getMonitoringStpLog();
        await getMonitoringStpLog(50);

        const [byDefault, custom] = harness.callsFor('stp_operations');
        expect(harness.argsOf(byDefault, 'order')).toEqual(['date', { ascending: false }]);
        expect(harness.argsOf(byDefault, 'limit')).toEqual([1500]);
        expect(harness.argsOf(custom, 'limit')).toEqual([50]);
    });
});

describe('monitoring readers — pagination', () => {
    const page = (n: number, from = 0) =>
        Array.from({ length: n }, (_, i) => dailyRow({ day_1: 1 }, { id: from + i }));

    it('requests a second page when the first comes back exactly full', async () => {
        harness.queue('water_daily_consumption', { data: page(1000) }, { data: page(3, 1000) });

        const rows = payload(await getMonitoringWaterDaily(['Aug-26']));

        // PostgREST caps a response at 1,000 rows, so a full page means "there
        // may be more" — stopping there would silently truncate the month.
        expect(rows).toHaveLength(1003);
        const ranges = harness.callsFor('water_daily_consumption').map((c) => harness.argsOf(c, 'range'));
        expect(ranges).toEqual([[0, 999], [1000, 1999]]);
    });

    it('stops after a short page', async () => {
        harness.queue('water_daily_consumption', { data: page(999) });

        const rows = payload(await getMonitoringWaterDaily(['Aug-26']));

        expect(rows).toHaveLength(999);
        expect(harness.callsFor('water_daily_consumption')).toHaveLength(1);
    });

    it('pages electricity readings on the same rule', async () => {
        const readingPage = (n: number, from: number) =>
            Array.from({ length: n }, (_, i) => ({ id: `r${from + i}`, meter_id: 'm1', month: 'Aug-26', consumption: 1 }));
        harness.queue('electricity_meters', { data: [METER] });
        harness.queue('electricity_readings', { data: readingPage(1000, 0) }, { data: readingPage(7, 1000) });

        const { readings } = payload(await getMonitoringElectricity(['Aug-26']));

        expect(readings).toHaveLength(1007);
        const ranges = harness.callsFor('electricity_readings').map((c) => harness.argsOf(c, 'range'));
        expect(ranges).toEqual([[0, 999], [1000, 1999]]);
    });
});

describe('monitoring readers — query shape', () => {
    it('never selects *', async () => {
        harness.queue('water_daily_consumption', { data: [] });
        harness.queue('stp_operations', { data: [] });
        harness.queue('electricity_meters', { data: [] });
        harness.queue('electricity_readings', { data: [] });
        harness.queue('water_meters', { data: [] });
        harness.queue('Contractor_Tracker', { data: [] });

        await Promise.all([
            getMonitoringWaterDaily(['Aug-26']),
            getMonitoringStpLog(),
            getMonitoringElectricity(['Aug-26']),
            getMonitoringWaterMonthly(),
            getMonitoringContractors(),
        ]);

        const selects = harness.calls.map((c) => harness.argsOf(c, 'select')[0]);
        expect(selects.length).toBeGreaterThan(0);
        for (const columns of selects) {
            expect(typeof columns).toBe('string');
            expect(columns).not.toContain('*');
        }
    });
});
