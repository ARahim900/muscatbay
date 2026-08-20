import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useMonitoringAgent } from '@/hooks/useMonitoringAgent';
import { waterDailyExpectations } from '@/lib/monitoring/expectations';
import type { StpDayRecord } from '@/lib/monitoring/daily';
import type { SourceStatus } from '@/lib/monitoring/types';

/**
 * The agent's two month-filtered queries are scoped to the window the clock
 * produced, so the rules they feed have to run on that same clock. These tests
 * pin that: the readers hand back a PERFECT dataset for exactly the months they
 * are asked for, the page is left open across a period rollover, and the report
 * must never state that an upload is missing for a period nothing ever queried.
 */

const readers = vi.hoisted(() => ({
    waterDaily: vi.fn(),
    stp: vi.fn(),
    electricity: vi.fn(),
    waterMonthly: vi.fn(),
    contractors: vi.fn(),
}));

vi.mock('@/functions/api/monitoring', () => ({
    getMonitoringWaterDaily: readers.waterDaily,
    getMonitoringStpLog: readers.stp,
    getMonitoringElectricity: readers.electricity,
    getMonitoringWaterMonthly: readers.waterMonthly,
    getMonitoringContractors: readers.contractors,
}));

// The realtime channel is the other refetch path — stubbed so the only thing
// moving in these tests is the clock.
vi.mock('@/hooks/useSupabaseRealtime', () => ({
    useSupabaseRealtime: () => ({ isLive: false }),
}));

const MS_PER_DAY = 86_400_000;
const HOUR = 60 * 60 * 1000;

const status = (key: string, rows: number): SourceStatus =>
    ({ key, label: key, state: rows === 0 ? 'empty' : 'ok', rows });

const METER = { id: 'm1', name: 'Building meter', accountNumber: 'R1', type: 'Building' };

/** Readers that always return a complete dataset for what they were asked for. */
function installReaders() {
    readers.waterDaily.mockImplementation(async (months: string[]) => {
        const rows = months.flatMap((month) =>
            waterDailyExpectations().map((e) => ({
                account: e.account,
                meterName: e.label,
                month,
                days: Array.from({ length: 31 }, () => 10),
            })),
        );
        return { data: rows, status: status('water-daily', rows.length) };
    });

    readers.stp.mockImplementation(async () => {
        // One row per day up to yesterday on whatever clock the agent is
        // reading with — a log that is never behind and never future-dated.
        const today = new Date(Date.now());
        const end = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()) - MS_PER_DAY;
        const rows: StpDayRecord[] = [];
        for (let t = Date.UTC(2026, 6, 1); t <= end; t += MS_PER_DAY) {
            rows.push({ date: new Date(t).toISOString().slice(0, 10), inlet: 500, tse: 480, tankers: 2 });
        }
        return { data: rows, status: status('stp-daily', rows.length) };
    });

    readers.electricity.mockImplementation(async (months: string[]) => ({
        data: {
            meters: [METER],
            readings: months.map((month) => ({ meterId: METER.id, month, consumption: 1000 })),
        },
        status: status('electricity-monthly', 1),
    }));

    readers.waterMonthly.mockImplementation(async () => ({
        data: { meters: [], derivedMonths: [] },
        status: status('water-monthly', 0),
    }));

    readers.contractors.mockImplementation(async () => ({ data: [], status: status('contractors', 0) }));
}

/** Let the gather promises land. */
async function settle() {
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
}

/** Months passed to a reader on its most recent call. */
function lastMonths(reader: { mock: { calls: unknown[][] } }): string[] {
    return (reader.mock.calls.at(-1)?.[0] ?? []) as string[];
}

beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    installReaders();
});

afterEach(() => {
    vi.useRealTimers();
});

describe('monitoring agent — fetch scope and evaluation clock', () => {
    it('composes every report on the clock its sources were read with', async () => {
        vi.setSystemTime(new Date('2026-09-01T23:45:00.000Z'));
        const { result } = renderHook(() => useMonitoringAgent());
        await settle();

        expect(result.current.status).toBe('ready');
        expect(lastMonths(readers.waterDaily)).toEqual(['Aug-26']);
        expect(result.current.daily?.generatedAt).toBe(result.current.fetchedAt?.toISOString());

        // The page is left open across UTC midnight — a wall-mounted dashboard.
        await act(async () => { await vi.advanceTimersByTimeAsync(HOUR); });

        expect(result.current.daily?.generatedAt).toBe(result.current.fetchedAt?.toISOString());
        expect(result.current.monthly?.generatedAt).toBe(result.current.fetchedAt?.toISOString());
    });

    it('re-scopes the daily query at a month rollover instead of reporting the upload as never landed', async () => {
        vi.setSystemTime(new Date('2026-09-01T23:45:00.000Z'));
        const { result } = renderHook(() => useMonitoringAgent());
        await settle();
        expect(result.current.daily?.completeness).toBe(100);

        await act(async () => { await vi.advanceTimersByTimeAsync(HOUR); });

        // 1 Sep is now due, and its rows were fetched by the same pass that
        // widened the window to include it.
        expect(lastMonths(readers.waterDaily)).toContain('Sep-26');
        expect(result.current.daily?.findings.filter((f) => f.id.startsWith('water-daily-missing'))).toEqual([]);
        expect(result.current.daily?.findings.some((f) => f.kind === 'cross-check')).toBe(false);
        expect(result.current.daily?.completeness).toBe(100);
    });

    it('re-scopes the monthly query when a month becomes due while the page is open', async () => {
        // Aug-26 becomes due at 00:00 on 6 Sep (the 5-day import grace).
        vi.setSystemTime(new Date('2026-09-05T23:45:00.000Z'));
        const { result } = renderHook(() => useMonitoringAgent());
        await settle();
        expect(result.current.monthly?.monthKey).toBe('Jul-26');

        await act(async () => { await vi.advanceTimersByTimeAsync(HOUR); });

        expect(result.current.monthly?.monthKey).toBe('Aug-26');
        expect(lastMonths(readers.electricity)).toContain('Aug-26');
        const electricity = result.current.monthly?.sections.find((s) => s.key === 'electricity-monthly');
        expect(electricity?.severity).toBe('good');
        expect(result.current.monthly?.findings.filter((f) => f.id.startsWith('electricity-monthly-missing'))).toEqual([]);
    });
});
