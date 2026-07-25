import type { ReportData } from './inline-shared';

/** Round to 2 decimals (local copy — keeps this module free of UI deps). */
const r2 = (v: number) => Math.round(v * 100) / 100;

export interface BriefingMetrics {
    /**
     * Distribution-level total for the selected day (m³): zone bulk (L2) +
     * direct connections. NOT the network supply — the daily data has no
     * L1/NAMA main-bulk account, so a true A1 figure does not exist here.
     */
    totalSupply: number;
    /** Σ zone bulk meters (L2) for the day (m³). */
    l2Total: number;
    /** Σ individual zone meters (L3) for the day (m³). */
    l3Total: number;
    /** Distribution loss = zone bulk (L2) minus sum of sub-meters (L3), in m³. */
    lossM3: number;
    /** Loss as a percentage of L2 total; null when L2 total is 0. */
    lossPct: number | null;
    /** Number of zones flagged isHighLoss. */
    alarmCount: number;
    /** Names of the zones in alarm, in zone order. */
    alarmZones: string[];
    /**
     * Total zones reported on for the day. The ticker needs the denominator to
     * say "all 6 zones normal" rather than a bare "0", which reads as a missing
     * value rather than a clean result.
     */
    zoneCount: number;
    /** Day-over-day change in the distribution total (%); null when no comparable yesterday. */
    vsYesterdayPct: number | null;
    /** Overall verdict: 'warning' when any zone is in alarm, else 'normal'. */
    status: 'normal' | 'warning';
}

export function computeBriefing(today: ReportData, yesterday: ReportData | null): BriefingMetrics {
    // Keep the raw delta for the percentage; only round for the displayed m³ value.
    const rawLoss = today.l2Total - today.l3Total;
    const lossM3 = r2(rawLoss);
    const lossPct = today.l2Total === 0 ? null : r2((rawLoss / today.l2Total) * 100);

    const alarmZones = today.zoneRows.filter(z => z.isHighLoss).map(z => z.zoneName);

    const vsYesterdayPct =
        yesterday && yesterday.grandTotal !== 0
            ? r2(((today.grandTotal - yesterday.grandTotal) / yesterday.grandTotal) * 100)
            : null;

    return {
        totalSupply: today.grandTotal,
        l2Total: today.l2Total,
        l3Total: today.l3Total,
        lossM3,
        lossPct,
        alarmCount: alarmZones.length,
        alarmZones,
        zoneCount: today.zoneRows.length,
        vsYesterdayPct,
        status: alarmZones.length > 0 ? 'warning' : 'normal',
    };
}
