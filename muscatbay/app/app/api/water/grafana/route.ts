/**
 * @fileoverview Grafana Water Data Proxy
 * Server-side proxy that queries the Grafana MSSQL datasource for daily
 * water meter readings and returns a flat accountNumber → value map.
 *
 * GET /api/water/grafana?month=Mar-26&day=15
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAllReportAccounts } from '@/lib/water-accounts';

const GRAFANA_BASE = 'https://grafana.nec-oman.com';
const DATASOURCE_UID = 'esu8hjVHk';

// ─── Month conversion: "Mar-26" → "032026" ───────────────────────────────────

const MONTH_MAP: Record<string, string> = {
    Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
    Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
};

function toMMYYYY(month: string): string {
    const [mon, yr] = month.split('-');
    const mm = MONTH_MAP[mon];
    if (!mm || !yr) throw new Error(`Invalid month format: "${month}". Expected e.g. "Mar-26".`);
    return `${mm}20${yr}`;
}

// ─── Auth header builder ───────────────────────────────────────────────────────

function buildAuthHeader(): string | null {
    const apiKey = process.env.GRAFANA_API_KEY;
    if (apiKey) return `Bearer ${apiKey}`;

    const user = process.env.GRAFANA_USERNAME;
    const pass = process.env.GRAFANA_PASSWORD;
    if (user && pass) {
        return `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}`;
    }

    return null; // No auth — Grafana may still allow anonymous access
}

// ─── SQL builder ──────────────────────────────────────────────────────────────

function escapeSql(value: string): string {
    return value.replace(/'/g, "''");
}

function buildSQL(dd: string, mmYYYY: string, accountList: string): string {
    return `SELECT ACCOUNT_NUMBER, ADDRESS, [${dd}] FROM (
  SELECT ACCOUNT_NUMBER, ADDRESS, READING_MNTH,
    FORMAT(READING_DATE,'dd') READING_DAY, SUM(CONSUMPTION) CONSUMPTION
  FROM Dashboard_NWS.dbo.[CM_MCT_DLY_READINGS_CSTMR]
  WHERE READING_MNTH = '${mmYYYY}'
    AND ACCOUNT_NUMBER IN (${accountList})
  GROUP BY ACCOUNT_NUMBER, ADDRESS, FORMAT(READING_DATE,'dd'), READING_MNTH
) MAIN
PIVOT (SUM(CONSUMPTION) FOR READING_DAY IN ([${dd}])) PVT_MAIN`;
}

// ─── Grafana response types ───────────────────────────────────────────────────

interface GrafanaField { name: string }
interface GrafanaFrame {
    schema?: { fields: GrafanaField[] };
    data?: { values: (string | number | null)[][] };
}
interface GrafanaResponse {
    results?: { A?: { frames?: GrafanaFrame[] } };
}

// ─── Response parser ──────────────────────────────────────────────────────────

function parseFrames(frames: GrafanaFrame[], dd: string): Record<string, number | null> {
    const result: Record<string, number | null> = {};
    if (!frames.length) return result;

    const frame = frames[0];
    const fields = frame.schema?.fields ?? [];
    const values = frame.data?.values ?? [];

    const acctIdx = fields.findIndex(f => f.name === 'ACCOUNT_NUMBER');
    const dayIdx = fields.findIndex(f => f.name === dd);

    if (acctIdx === -1 || dayIdx === -1) return result;

    const accounts = values[acctIdx] as string[];
    const readings = values[dayIdx] as (number | null)[];

    for (let i = 0; i < accounts.length; i++) {
        const acc = String(accounts[i]).trim();
        const raw = readings[i];
        result[acc] = raw == null ? null : Number(raw);
    }

    return result;
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(request: NextRequest): Promise<NextResponse> {
    const { searchParams } = request.nextUrl;
    const month = searchParams.get('month'); // e.g. "Mar-26"
    const dayStr = searchParams.get('day');  // e.g. "15"

    if (!month || !dayStr) {
        return NextResponse.json(
            { error: 'Missing required query params: month, day' },
            { status: 400 }
        );
    }

    const day = parseInt(dayStr, 10);
    if (isNaN(day) || day < 1 || day > 31) {
        return NextResponse.json(
            { error: `Invalid day "${dayStr}". Must be 1–31.` },
            { status: 400 }
        );
    }

    let mmYYYY: string;
    try {
        mmYYYY = toMMYYYY(month);
    } catch (e) {
        return NextResponse.json(
            { error: (e as Error).message },
            { status: 400 }
        );
    }

    const dd = String(day).padStart(2, '0');
    const accounts = getAllReportAccounts();
    if (accounts.length === 0) {
        return NextResponse.json(
            { error: 'No accounts configured for water report' },
            { status: 500 }
        );
    }
    const accountList = accounts.map(a => `'${escapeSql(a)}'`).join(',');
    const sql = buildSQL(dd, mmYYYY, accountList);

    const authHeader = buildAuthHeader();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authHeader) headers['Authorization'] = authHeader;

    const payload = {
        queries: [{
            refId: 'A',
            datasource: { type: 'mssql', uid: DATASOURCE_UID },
            rawSql: sql,
            format: 'table',
            maxDataPoints: 1000,
            intervalMs: 60000,
        }],
        from: '1605429966952',
        to: '1859791566952',
    };

    try {
        const grafanaRes = await fetch(`${GRAFANA_BASE}/api/ds/query`, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(30_000),
        });

        if (!grafanaRes.ok) {
            const text = await grafanaRes.text().catch(() => '');
            return NextResponse.json(
                { error: `Grafana returned ${grafanaRes.status}: ${text.slice(0, 300)}` },
                { status: 502 }
            );
        }

        const json = (await grafanaRes.json()) as GrafanaResponse;
        const frames = json?.results?.A?.frames ?? [];

        if (frames.length === 0) {
            return NextResponse.json(
                { error: `No data returned from Grafana for ${month}, day ${day}. Check that READING_MNTH='${mmYYYY}' has data.` },
                { status: 404 }
            );
        }

        const readings = parseFrames(frames, dd);

        return NextResponse.json(
            { readings, month, day, mmYYYY },
            { headers: { 'Cache-Control': 'no-store' } }
        );
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return NextResponse.json({ error: `Request failed: ${msg}` }, { status: 500 });
    }
}
