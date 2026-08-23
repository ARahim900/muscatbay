/**
 * @fileoverview Monitoring readers — gather the inputs the completeness rules
 * need, and report per-source failure honestly.
 *
 * Every function here returns a `{ data, status }` pair rather than a bare
 * array. That shape exists for one reason: an operations monitor whose source
 * fell over must say "unknown", never "nothing wrong". A reader that swallowed
 * an error into `[]` would make a broken query indistinguishable from a clean
 * month — and a completeness report built on that would confidently declare
 * 100% coverage of a table it never read.
 *
 * Scoping keeps this cheap. `water_daily_consumption` is a wide table (one row
 * per meter per month), so a 7-day window touches at most two months ≈ 260
 * rows; `electricity_readings` is filtered to the trend months. Neither query
 * grows with the age of the database.
 *
 * Isomorphic — no `next/*`, no `window`, no `document` — because `functions/`
 * is bundled as-is by the Expo app in `mobile/`.
 *
 * @module functions/api/monitoring
 */

import { getSupabaseClient, isSupabaseConfigured } from '../supabase-client';
import { DAILY_WATER_CONSUMPTION_SELECT_COLUMNS, type SupabaseDailyWaterConsumption } from '@/entities/water';
import type { ContractorTracker } from '@/entities/contractor';
import type { ElectricityMeter, ElectricityReading } from '@/entities/electricity';
import type { SupabaseSTPOperation } from '@/entities/stp';
import type { SourceStatus } from '@/lib/monitoring/types';
import type { DailyMeterMonth, StpDayRecord } from '@/lib/monitoring/daily';
import type { ElectricityMeterRef, ElectricityReadingRef, WaterMeterRef } from '@/lib/monitoring/monthly';
import { getContractorTrackerData } from './contractors';
import { fetchWaterMeters } from './water';

/** A source's payload plus the status the report will print for it. */
export interface SourceResult<T> {
    /** `null` whenever the source could not be read — never an empty stand-in. */
    data: T | null;
    status: SourceStatus;
}

const PAGE = 1000;

function ok<T>(key: string, label: string, data: T, rows: number, emptyNote?: string): SourceResult<T> {
    return {
        data,
        status: {
            key,
            label,
            state: rows === 0 ? 'empty' : 'ok',
            rows,
            message: rows === 0 ? (emptyNote ?? 'No rows for the period requested.') : undefined,
        },
    };
}

function failure<T>(key: string, label: string, message: string): SourceResult<T> {
    return { data: null, status: { key, label, state: 'error', rows: null, message } };
}

function notConfigured<T>(key: string, label: string): SourceResult<T> {
    return {
        data: null,
        status: {
            key,
            label,
            state: 'not-configured',
            rows: null,
            message: 'Supabase is not configured, so this source cannot be checked.',
        },
    };
}

function messageOf(err: unknown): string {
    return err instanceof Error ? err.message : String(err);
}

/* ------------------------------------------------------------------ */
/*  Daily water readings                                               */
/* ------------------------------------------------------------------ */

/**
 * Wide daily rows for the given `Mon-YY` months, **exactly as stored**.
 *
 * Deliberately does not reuse `getDailyWaterConsumptionFromSupabase`: that
 * reader runs every value through `sanitizeDailyReading`, which rewrites a
 * negative reading to 0. For a dashboard that is a tidy chart; for a monitor it
 * would erase the very anomaly it exists to report.
 */
export async function getMonitoringWaterDaily(months: string[]): Promise<SourceResult<DailyMeterMonth[]>> {
    const key = 'water-daily';
    const label = 'Daily water readings';
    if (!isSupabaseConfigured()) return notConfigured(key, label);
    const client = getSupabaseClient();
    if (!client) return notConfigured(key, label);
    if (months.length === 0) return ok(key, label, [], 0, 'No months in the requested window.');

    const rows: SupabaseDailyWaterConsumption[] = [];
    try {
        for (let from = 0; ; from += PAGE) {
            const { data, error } = await client
                .from('water_daily_consumption')
                .select(DAILY_WATER_CONSUMPTION_SELECT_COLUMNS)
                .in('month', months)
                .order('id', { ascending: true })
                .range(from, from + PAGE - 1)
                .returns<SupabaseDailyWaterConsumption[]>();

            if (error) return failure(key, label, error.message);
            rows.push(...(data ?? []));
            if (!data || data.length < PAGE) break;
        }
    } catch (err) {
        return failure(key, label, messageOf(err));
    }

    const normalised = rows.map<DailyMeterMonth>((row) => ({
        account: row.account_number,
        meterName: row.meter_name ?? '',
        month: row.month,
        days: Array.from({ length: 31 }, (_, i) => {
            const raw = row[`day_${i + 1}` as keyof SupabaseDailyWaterConsumption];
            if (raw === null || raw === undefined) return null;
            const value = Number(raw);
            return Number.isFinite(value) ? value : null;
        }),
    }));

    return ok(key, label, normalised, normalised.length, `No daily rows exist for ${months.join(', ')}.`);
}

/* ------------------------------------------------------------------ */
/*  STP daily log                                                      */
/* ------------------------------------------------------------------ */

/**
 * The STP daily log, **unfiltered**.
 *
 * The STP page drops future-dated and unparseable rows before rendering (and
 * says how many it dropped). The monitor must see them: those rows are the
 * finding.
 */
export async function getMonitoringStpLog(limit = 1500): Promise<SourceResult<StpDayRecord[]>> {
    const key = 'stp-daily';
    const label = 'STP daily log';
    if (!isSupabaseConfigured()) return notConfigured(key, label);
    const client = getSupabaseClient();
    if (!client) return notConfigured(key, label);

    try {
        const { data, error } = await client
            .from('stp_operations')
            .select('id, date, inlet_sewage, tse_for_irrigation, tanker_trips')
            .order('date', { ascending: false })
            .limit(limit)
            .returns<Pick<SupabaseSTPOperation, 'id' | 'date' | 'inlet_sewage' | 'tse_for_irrigation' | 'tanker_trips'>[]>();

        if (error) return failure(key, label, error.message);

        const rows = (data ?? []).map<StpDayRecord>((row) => ({
            date: row.date,
            inlet: row.inlet_sewage === null || row.inlet_sewage === undefined ? null : Number(row.inlet_sewage),
            tse: row.tse_for_irrigation === null || row.tse_for_irrigation === undefined ? null : Number(row.tse_for_irrigation),
            tankers: row.tanker_trips === null || row.tanker_trips === undefined ? null : Number(row.tanker_trips),
        }));
        return ok(key, label, rows, rows.length, 'The STP operations table has no rows.');
    } catch (err) {
        return failure(key, label, messageOf(err));
    }
}

/* ------------------------------------------------------------------ */
/*  Electricity                                                        */
/* ------------------------------------------------------------------ */

export interface ElectricityMonitoringData {
    meters: ElectricityMeterRef[];
    readings: ElectricityReadingRef[];
}

/**
 * Electricity meters plus their readings for the requested months.
 *
 * Unlike `getElectricityMetersFromSupabase`, rows whose `consumption` is NULL
 * are **kept**. A NULL means "closed / not in service" that month — an answer,
 * not an absence — and the monitor has to be able to tell it apart from a row
 * that was never entered.
 */
export async function getMonitoringElectricity(months: string[]): Promise<SourceResult<ElectricityMonitoringData>> {
    const key = 'electricity-monthly';
    const label = 'Electricity meters & readings';
    if (!isSupabaseConfigured()) return notConfigured(key, label);
    const client = getSupabaseClient();
    if (!client) return notConfigured(key, label);

    try {
        const { data: meterRows, error: meterError } = await client
            .from('electricity_meters')
            .select('id, name, account_number, meter_type')
            .order('name')
            .returns<ElectricityMeter[]>();

        if (meterError) return failure(key, label, meterError.message);

        const meters = (meterRows ?? []).map<ElectricityMeterRef>((m) => ({
            id: m.id,
            name: m.name,
            accountNumber: m.account_number ?? '',
            type: m.meter_type ?? 'Unspecified',
        }));

        const readings: ElectricityReadingRef[] = [];
        if (months.length > 0) {
            for (let from = 0; ; from += PAGE) {
                const { data, error } = await client
                    .from('electricity_readings')
                    .select('id, meter_id, month, consumption')
                    .in('month', months)
                    .order('id', { ascending: true })
                    .range(from, from + PAGE - 1)
                    .returns<ElectricityReading[]>();

                if (error) return failure(key, label, error.message);
                for (const row of data ?? []) {
                    readings.push({
                        meterId: row.meter_id,
                        month: row.month,
                        consumption:
                            row.consumption === null || row.consumption === undefined
                                ? null
                                : Number(row.consumption),
                    });
                }
                if (!data || data.length < PAGE) break;
            }
        }

        return ok(key, label, { meters, readings }, meters.length, 'No electricity meters are registered.');
    } catch (err) {
        return failure(key, label, messageOf(err));
    }
}

/* ------------------------------------------------------------------ */
/*  Water monthly + contractors                                        */
/* ------------------------------------------------------------------ */

export interface WaterMonthlyMonitoringData {
    meters: WaterMeterRef[];
    /** Month keys whose figures are month-to-date daily sums, not billing reads. */
    derivedMonths: string[];
}

/** Monthly water reads, reusing the reader that already reports its own failures. */
export async function getMonitoringWaterMonthly(): Promise<SourceResult<WaterMonthlyMonitoringData>> {
    const key = 'water-monthly';
    const label = 'Monthly water reads';
    if (!isSupabaseConfigured()) return notConfigured(key, label);

    try {
        const result = await fetchWaterMeters();
        if (result.error) return failure(key, label, result.error);

        const meters = result.meters.map<WaterMeterRef>((m) => ({
            account: m.accountNumber,
            label: m.label,
            level: m.level,
            consumption: m.consumption,
        }));
        return ok(
            key,
            label,
            { meters, derivedMonths: result.derivedMonths.map((d) => d.month) },
            meters.length,
            'No water meters are registered.',
        );
    } catch (err) {
        return failure(key, label, messageOf(err));
    }
}

/** The contractor register — the renewal ladder's only source. */
export async function getMonitoringContractors(): Promise<SourceResult<ContractorTracker[]>> {
    const key = 'contractors';
    const label = 'Contractor register';
    if (!isSupabaseConfigured()) return notConfigured(key, label);

    try {
        const rows = await getContractorTrackerData();
        return ok(key, label, rows, rows.length, 'The contractor register has no rows.');
    } catch (err) {
        return failure(key, label, messageOf(err));
    }
}
