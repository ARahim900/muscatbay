import type { ReportData } from './inline-shared';

/** Round to 2 decimals (local copy — keeps this module free of UI deps). */
const r2 = (v: number) => Math.round(v * 100) / 100;

export interface BriefingMetrics {
    /** Total supply for the selected day (m³). */
    totalSupply: number;
    /** Distribution loss = zone bulk (L2) minus sum of sub-meters (L3), in m³. */
    lossM3: number;
    /** Loss as a percentage of L2 total; null when L2 total is 0. */
    lossPct: number | null;
    /** Number of zones flagged isHighLoss. */
    alarmCount: number;
    /** Names of the zones in alarm, in zone order. */
    alarmZones: string[];
    /** Day-over-day change in total supply (%); null when no comparable yesterday. */
    vsYesterdayPct: number | null;
    /** Overall verdict: 'warning' when any zone is in alarm, else 'normal'. */
    status: 'normal' | 'warning';
}

export function computeBriefing(today: ReportData, yesterday: ReportData | null): BriefingMetrics {
    const lossM3 = r2(today.l2Total - today.l3Total);
    const lossPct = today.l2Total === 0 ? null : r2((lossM3 / today.l2Total) * 100);

    const alarmZones = today.zoneRows.filter(z => z.isHighLoss).map(z => z.zoneName);

    const vsYesterdayPct =
        yesterday && yesterday.grandTotal !== 0
            ? r2(((today.grandTotal - yesterday.grandTotal) / yesterday.grandTotal) * 100)
            : null;

    return {
        totalSupply: today.grandTotal,
        lossM3,
        lossPct,
        alarmCount: alarmZones.length,
        alarmZones,
        vsYesterdayPct,
        status: alarmZones.length > 0 ? 'warning' : 'normal',
    };
}
