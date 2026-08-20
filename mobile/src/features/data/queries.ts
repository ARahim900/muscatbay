/**
 * Mobile read layer.
 *
 * Every Supabase read below is the web app's own function, imported through the
 * `@/` alias and executed unchanged — `functions/api/water.ts`,
 * `functions/api/electricity.ts`, `functions/api/stp.ts`,
 * `functions/api/contractors.ts`, `functions/api/assets.ts`,
 * `functions/api/fire-safety.ts`, `functions/api/gulf-expert.ts`. The only
 * platform seam is `metro.config.js` swapping the Supabase client leaf module.
 *
 * What this file adds is presentation shaping for a phone screen. It never
 * recomputes a figure the shared layer already derives, and it has no fallback
 * constants: where a value cannot come from live rows the field is `null` and
 * the UI renders "—".
 */
import type { Asset } from '@/entities/asset';
import type { ContractorTracker } from '@/entities/contractor';
import {
  getAssetSummaryFromSupabase,
  getAssetsFromSupabase,
  type AssetSummary,
} from '@/functions/api/assets';
import { getContractorTrackerData } from '@/functions/api/contractors';
import { getElectricityMetersFromSupabase } from '@/functions/api/electricity';
import {
  getFireEquipmentFromSupabase,
  getFireIssuesFromSupabase,
} from '@/functions/api/fire-safety';
import { getPpmFindings } from '@/functions/api/gulf-expert';
import { getSTPOperationsFromSupabase } from '@/functions/api/stp';
import { fetchWaterMeters, type WaterMetersResult } from '@/functions/api/water';
import type { MeterReading, STPOperation } from '@/lib/mock-data';
import {
  evaluateOperationalAlerts,
  parseTrackerDate,
  type OperationalAlert,
} from '@/lib/operational-alerts';
import type { WaterMeter } from '@/lib/water-data';
import {
  MONTHS,
  TARGET_LOSS_PCT,
  buildMonthlyData,
  computePeriod,
  type PeriodResult,
} from '@/lib/water-monthly-data';

const message = (caught: unknown): string =>
  caught instanceof Error ? caught.message : String(caught);

/* ------------------------------------------------------------------ */
/*  Water                                                              */
/* ------------------------------------------------------------------ */

export interface WaterZoneSummary {
  name: string;
  bulk: number;
  end: number;
  loss: number;
  lossPct: number;
  missing: number;
}

export interface WaterSummary {
  /** `"Mon-YY"` of the latest month whose balance can actually be computed. */
  period: string | null;
  supply: number | null;
  distributed: number | null;
  consumed: number | null;
  loss: number | null;
  lossPct: number | null;
  targetPct: number;
  zones: WaterZoneSummary[];
  meterCount: number;
  missingMeters: number | null;
  /** Readings the source reported as negative — surfaced, never rewritten. */
  negatives: number;
  error: string | null;
}

const EMPTY_WATER: WaterSummary = {
  period: null,
  supply: null,
  distributed: null,
  consumed: null,
  loss: null,
  lossPct: null,
  targetPct: TARGET_LOSS_PCT,
  zones: [],
  meterCount: 0,
  missingMeters: null,
  negatives: 0,
  error: null,
};

/**
 * Resolve the newest month whose main-bulk (A1) reading exists.
 *
 * Identical rule to `evaluateWaterLossAlerts` on the web: a month with no NAMA
 * reading cannot produce a loss figure and is skipped, rather than reported as
 * a fake 100% loss.
 */
function latestComputablePeriod(meters: WaterMeter[]): { key: string; period: PeriodResult } | null {
  if (meters.length === 0) return null;
  const data = buildMonthlyData(meters);

  for (let i = data.meta.availableMonths.length - 1; i >= 0; i--) {
    const key = data.meta.availableMonths[i];
    const [mon, yy] = key.split('-');
    const monthIndex = (MONTHS as readonly string[]).indexOf(mon);
    if (monthIndex === -1 || !yy) continue;

    const period = computePeriod(data, `20${yy}`, monthIndex);
    if (period.A1 > 0) return { key, period };
  }
  return null;
}

/** Shape a already-fetched water read. Split out so the dashboard fetches once. */
export function toWaterSummary(result: WaterMetersResult): WaterSummary {
  const base: WaterSummary = {
    ...EMPTY_WATER,
    meterCount: result.meters.length,
    negatives: result.negatives.length,
    error: result.error,
  };
  if (result.error) return base;

  const latest = latestComputablePeriod(result.meters);
  if (!latest) return base;

  const { key, period } = latest;
  return {
    ...base,
    period: key,
    supply: period.A1,
    distributed: period.A2,
    consumed: period.A3,
    loss: period.loss,
    lossPct: period.lossPct,
    missingMeters: period.missingMeters,
    zones: period.zones
      .map((z) => ({
        name: z.name,
        bulk: z.bulk,
        end: z.end,
        loss: z.loss,
        lossPct: z.lossPct,
        missing: z.missing,
      }))
      .sort((a, b) => b.lossPct - a.lossPct),
  };
}

export async function loadWaterSummary(): Promise<WaterSummary> {
  try {
    return toWaterSummary(await fetchWaterMeters());
  } catch (caught) {
    return { ...EMPTY_WATER, error: message(caught) };
  }
}

/* ------------------------------------------------------------------ */
/*  Electricity                                                        */
/* ------------------------------------------------------------------ */

export interface ElectricityTopMeter {
  id: string;
  name: string;
  account: string;
  consumption: number;
}

export interface ElectricitySummary {
  /** Newest month label present across all meters, e.g. `"Apr-26"`. */
  period: string | null;
  totalKwh: number | null;
  meterCount: number;
  /** Meters with no reading in the newest month — a manual read is due. */
  metersMissingLatest: number | null;
  top: ElectricityTopMeter[];
  /** Chronologically ordered totals for the last 12 months with data. */
  trend: { label: string; value: number }[];
  error: string | null;
}

const EMPTY_ELECTRICITY: ElectricitySummary = {
  period: null,
  totalKwh: null,
  meterCount: 0,
  metersMissingLatest: null,
  top: [],
  trend: [],
  error: null,
};

const MONTH_INDEX = new Map((MONTHS as readonly string[]).map((m, i) => [m, i]));

/**
 * Order `"Mon-YY"` labels chronologically.
 *
 * The `month` column is TEXT, so a SQL sort is lexicographic — the web
 * electricity reader documents the same trap and sorts in JS for the same reason.
 */
function monthKeyRank(label: string): number {
  const [mon, yy] = label.split('-');
  const index = MONTH_INDEX.get(mon);
  if (index === undefined || !yy) return Number.NEGATIVE_INFINITY;
  return Number(`20${yy}`) * 12 + index;
}

export function toElectricitySummary(meters: MeterReading[]): ElectricitySummary {
  if (meters.length === 0) return EMPTY_ELECTRICITY;

  const monthTotals = new Map<string, number>();
  for (const meter of meters) {
    for (const [month, value] of Object.entries(meter.readings)) {
      monthTotals.set(month, (monthTotals.get(month) ?? 0) + value);
    }
  }

  const orderedMonths = [...monthTotals.keys()]
    .filter((m) => monthKeyRank(m) !== Number.NEGATIVE_INFINITY)
    .sort((a, b) => monthKeyRank(a) - monthKeyRank(b));

  const latest = orderedMonths.at(-1) ?? null;

  return {
    period: latest,
    totalKwh: latest ? (monthTotals.get(latest) ?? null) : null,
    meterCount: meters.length,
    // An absent month means "no reading", not "zero" — the web reader keeps the
    // two apart on purpose, so this counts absences rather than zeros.
    metersMissingLatest: latest
      ? meters.filter((m) => m.readings[latest] === undefined).length
      : null,
    top: latest
      ? meters
          .map((m) => ({
            id: m.id,
            name: m.name,
            account: m.account_number,
            consumption: m.readings[latest] ?? 0,
          }))
          .filter((m) => m.consumption > 0)
          .sort((a, b) => b.consumption - a.consumption)
          .slice(0, 8)
      : [],
    trend: orderedMonths.slice(-12).map((label) => ({
      label,
      value: monthTotals.get(label) ?? 0,
    })),
    error: null,
  };
}

export async function loadElectricitySummary(): Promise<ElectricitySummary> {
  try {
    return toElectricitySummary(await getElectricityMetersFromSupabase());
  } catch (caught) {
    return { ...EMPTY_ELECTRICITY, error: message(caught) };
  }
}

/* ------------------------------------------------------------------ */
/*  STP                                                                */
/* ------------------------------------------------------------------ */

export interface StpSummary {
  latestLogDate: string | null;
  /** Totals over the most recent 30 LOGGED days (not the last 30 calendar days). */
  windowDays: number;
  inlet: number | null;
  tse: number | null;
  recoveryPct: number | null;
  tankerTrips: number | null;
  daily: { date: string; inlet: number; tse: number }[];
  error: string | null;
}

const EMPTY_STP: StpSummary = {
  latestLogDate: null,
  windowDays: 0,
  inlet: null,
  tse: null,
  recoveryPct: null,
  tankerTrips: null,
  daily: [],
  error: null,
};

export function toStpSummary(operations: STPOperation[]): StpSummary {
  const days = operations
    .map((op) => ({
      date: op.date,
      time: new Date(op.date).getTime(),
      inlet: Number(op.inlet_sewage) || 0,
      tse: Number(op.tse_for_irrigation) || 0,
      trips: Number(op.tanker_trips) || 0,
    }))
    .filter((d) => !Number.isNaN(d.time))
    .sort((a, b) => a.time - b.time);

  if (days.length === 0) return EMPTY_STP;

  const window = days.slice(-30);
  const inlet = window.reduce((sum, d) => sum + d.inlet, 0);
  const tse = window.reduce((sum, d) => sum + d.tse, 0);

  return {
    latestLogDate: days[days.length - 1].date,
    windowDays: window.length,
    inlet,
    tse,
    recoveryPct: inlet > 0 ? +((tse / inlet) * 100).toFixed(1) : null,
    tankerTrips: window.reduce((sum, d) => sum + d.trips, 0),
    daily: window.map((d) => ({ date: d.date, inlet: d.inlet, tse: d.tse })),
    error: null,
  };
}

export async function loadStpSummary(): Promise<StpSummary> {
  try {
    return toStpSummary(await getSTPOperationsFromSupabase());
  } catch (caught) {
    return { ...EMPTY_STP, error: message(caught) };
  }
}

/* ------------------------------------------------------------------ */
/*  Contractors                                                        */
/* ------------------------------------------------------------------ */

export interface ContractRow {
  contractor: string;
  service: string;
  status: string;
  endDate: Date | null;
  daysRemaining: number | null;
}

export interface ContractorsSummary {
  total: number;
  active: number;
  /** Active contracts already past their end date. */
  expired: number;
  /** Active contracts ending within 60 days. */
  expiringSoon: number;
  annualValueOmr: number | null;
  rows: ContractRow[];
  error: string | null;
}

const EMPTY_CONTRACTORS: ContractorsSummary = {
  total: 0,
  active: 0,
  expired: 0,
  expiringSoon: 0,
  annualValueOmr: null,
  rows: [],
  error: null,
};

/** One of the renewal horizons in `lib/monitoring/config.ts` (RENEWAL_HORIZON_DAYS). */
const CONTRACT_WARN_DAYS = 60;

export function toContractorsSummary(tracker: ContractorTracker[], now: Date): ContractorsSummary {
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

  let active = 0;
  let expired = 0;
  let expiringSoon = 0;
  let annualValue = 0;
  let sawValue = false;

  const rows: ContractRow[] = tracker.map((c) => {
    const status = (c.Status ?? '').trim();
    const isExpired = status.toLowerCase().includes('expired');
    const end = parseTrackerDate(c['End Date']);
    const daysRemaining = end ? Math.floor((end.getTime() - today) / 86_400_000) : null;

    if (!isExpired) {
      active += 1;
      if (daysRemaining !== null) {
        if (daysRemaining < 0) expired += 1;
        else if (daysRemaining <= CONTRACT_WARN_DAYS) expiringSoon += 1;
      }
    }

    const value = c['Annual Value (OMR)'];
    if (typeof value === 'number' && Number.isFinite(value)) {
      annualValue += value;
      sawValue = true;
    }

    return {
      contractor: c.Contractor ?? 'Unknown contractor',
      service: c['Service Provided'] ?? '',
      status: status || 'Not recorded',
      endDate: end,
      daysRemaining,
    };
  });

  rows.sort((a, b) => {
    if (a.daysRemaining === null) return 1;
    if (b.daysRemaining === null) return -1;
    return a.daysRemaining - b.daysRemaining;
  });

  return {
    total: tracker.length,
    active,
    expired,
    expiringSoon,
    annualValueOmr: sawValue ? annualValue : null,
    rows,
    error: null,
  };
}

export async function loadContractorsSummary(): Promise<ContractorsSummary> {
  try {
    return toContractorsSummary(await getContractorTrackerData(), new Date());
  } catch (caught) {
    return { ...EMPTY_CONTRACTORS, error: message(caught) };
  }
}

/* ------------------------------------------------------------------ */
/*  Assets / Fire / HVAC                                               */
/* ------------------------------------------------------------------ */

export interface AssetsSummaryResult {
  summary: AssetSummary | null;
  error: string | null;
}

export async function loadAssetsSummary(): Promise<AssetsSummaryResult> {
  try {
    return { summary: await getAssetSummaryFromSupabase(), error: null };
  } catch (caught) {
    return { summary: null, error: message(caught) };
  }
}

export interface FireSummary {
  equipment: number | null;
  openIssues: number | null;
  error: string | null;
}

export async function loadFireSummary(): Promise<FireSummary> {
  try {
    const [equipment, issues] = await Promise.all([
      getFireEquipmentFromSupabase(),
      getFireIssuesFromSupabase(),
    ]);
    const open = issues.filter((i) => {
      const status = (i.status ?? '').toLowerCase();
      return !status.includes('closed') && !status.includes('resolved');
    }).length;
    return { equipment: equipment.length, openIssues: open, error: null };
  } catch (caught) {
    return { equipment: null, openIssues: null, error: message(caught) };
  }
}

export interface HvacSummary {
  findings: number | null;
  openFindings: number | null;
  recurring: number | null;
  /** True when the paged read hit its safety ceiling — the numbers are partial. */
  truncated: boolean;
  error: string | null;
}

export async function loadHvacSummary(): Promise<HvacSummary> {
  try {
    const result = await getPpmFindings();
    const open = result.rows.filter((f) => {
      const status = (f.status ?? '').toLowerCase();
      return !status.includes('closed') && !status.includes('complete');
    }).length;
    return {
      findings: result.total,
      openFindings: open,
      recurring: result.rows.filter((f) => f.is_recurring).length,
      truncated: result.truncated,
      error: null,
    };
  } catch (caught) {
    return { findings: null, openFindings: null, recurring: null, truncated: false, error: message(caught) };
  }
}

/* ------------------------------------------------------------------ */
/*  Alerts                                                             */
/* ------------------------------------------------------------------ */

export interface AlertsResult {
  alerts: OperationalAlert[];
  /** Sources that could not be read — the feed says so instead of "all clear". */
  failedSources: string[];
  evaluatedAt: Date;
}

/**
 * Run the web app's alert rules engine, unchanged.
 *
 * `lib/operational-alerts.ts` is pure and takes `now` injected, so it ports to
 * React Native with zero modification — the notification feed on the website and
 * the Alerts tab here cannot disagree, because they are the same code.
 *
 * A source that fails to read is reported, never treated as "nothing wrong".
 */
export async function loadAlerts(): Promise<AlertsResult> {
  const [waterResult, contractorsResult, stpResult] = await Promise.allSettled([
    fetchWaterMeters(),
    getContractorTrackerData(),
    getSTPOperationsFromSupabase(),
  ]);

  const failedSources: string[] = [];

  let waterMeters: WaterMeter[] | null = null;
  if (waterResult.status === 'fulfilled' && !waterResult.value.error) {
    waterMeters = waterResult.value.meters;
  } else {
    failedSources.push('Water');
  }

  let contractors: ContractorTracker[] | null = null;
  if (contractorsResult.status === 'fulfilled') contractors = contractorsResult.value;
  else failedSources.push('Contractors');

  let stpOperations: STPOperation[] | null = null;
  if (stpResult.status === 'fulfilled') stpOperations = stpResult.value;
  else failedSources.push('STP');

  const evaluatedAt = new Date();
  return {
    alerts: evaluateOperationalAlerts({ waterMeters, contractors, stpOperations, now: evaluatedAt }),
    failedSources,
    evaluatedAt,
  };
}

/* ------------------------------------------------------------------ */
/*  Search                                                             */
/* ------------------------------------------------------------------ */

export type SearchKind = 'water-meter' | 'electricity-meter' | 'asset';

export interface SearchResult {
  id: string;
  kind: SearchKind;
  title: string;
  subtitle: string;
  /** Account / asset reference — rendered in the mono face. */
  reference: string;
  moduleKey: 'water' | 'electricity' | 'assets';
}

export interface MeterIndex {
  entries: SearchResult[];
  errors: string[];
}

/**
 * Build the meter lookup index once, then filter on-device.
 *
 * The two meter registers together are a couple of thousand rows; pulling them
 * once gives instant keystroke response instead of a Supabase round-trip per
 * character over a mobile connection. The asset register is far larger, so
 * assets are searched server-side per query instead (see `searchAssets`).
 */
export async function loadMeterIndex(): Promise<MeterIndex> {
  const errors: string[] = [];
  const entries: SearchResult[] = [];

  const [water, electricity] = await Promise.allSettled([
    fetchWaterMeters(),
    getElectricityMetersFromSupabase(),
  ]);

  if (water.status === 'fulfilled' && !water.value.error) {
    for (const meter of water.value.meters) {
      entries.push({
        id: `water:${meter.accountNumber || meter.label}`,
        kind: 'water-meter',
        title: meter.label,
        subtitle: [meter.zone, meter.type, meter.level].filter(Boolean).join(' · '),
        reference: meter.accountNumber,
        moduleKey: 'water',
      });
    }
  } else {
    errors.push(
      water.status === 'fulfilled'
        ? (water.value.error ?? 'Water meters could not be read.')
        : 'Water meters could not be read.',
    );
  }

  if (electricity.status === 'fulfilled') {
    for (const meter of electricity.value) {
      entries.push({
        id: `elec:${meter.id}`,
        kind: 'electricity-meter',
        title: meter.name,
        subtitle: meter.type ?? '',
        reference: meter.account_number,
        moduleKey: 'electricity',
      });
    }
  } else {
    errors.push('Electricity meters could not be read.');
  }

  return { entries, errors };
}

export function filterMeters(index: SearchResult[], query: string, limit = 40): SearchResult[] {
  const needle = query.trim().toLowerCase();
  if (needle.length < 2) return [];
  const matches: SearchResult[] = [];
  for (const entry of index) {
    if (
      entry.title.toLowerCase().includes(needle) ||
      entry.reference.toLowerCase().includes(needle) ||
      entry.subtitle.toLowerCase().includes(needle)
    ) {
      matches.push(entry);
      if (matches.length >= limit) break;
    }
  }
  return matches;
}

/** Server-side asset lookup — the register is too large to hold on-device. */
export async function searchAssets(query: string, limit = 25): Promise<SearchResult[]> {
  const needle = query.trim();
  if (needle.length < 2) return [];

  const { data } = await getAssetsFromSupabase(1, limit, needle);
  return data.map((asset: Asset) => ({
    id: `asset:${asset.id}`,
    kind: 'asset' as const,
    title: asset.name || asset.id,
    subtitle: [asset.category, asset.location, asset.status].filter(Boolean).join(' · '),
    reference: asset.assetTag ?? asset.id,
    moduleKey: 'assets' as const,
  }));
}

/* ------------------------------------------------------------------ */
/*  Dashboard composite                                                */
/* ------------------------------------------------------------------ */

export interface DashboardData {
  water: WaterSummary;
  electricity: ElectricitySummary;
  stp: StpSummary;
  contractors: ContractorsSummary;
  assets: AssetsSummaryResult;
  alerts: OperationalAlert[];
  /** Sources the alert pass could not read — surfaced, never silently ignored. */
  alertSourcesFailed: string[];
  loadedAt: Date;
}

/**
 * One parallel pass for the whole dashboard.
 *
 * Each source is fetched exactly ONCE and then feeds both the KPI deck and the
 * alert engine, so the tiles and the alert list always describe the same
 * snapshot rather than two different moments in time.
 */
export async function loadDashboard(): Promise<DashboardData> {
  const [waterRead, electricityRead, stpRead, contractorRead, assetsRead] = await Promise.allSettled([
    fetchWaterMeters(),
    getElectricityMetersFromSupabase(),
    getSTPOperationsFromSupabase(),
    getContractorTrackerData(),
    getAssetSummaryFromSupabase(),
  ]);

  const now = new Date();
  const alertSourcesFailed: string[] = [];

  const waterResult: WaterMetersResult =
    waterRead.status === 'fulfilled'
      ? waterRead.value
      : { meters: [], error: message(waterRead.reason), negatives: [], derivedMonths: [] };
  if (waterResult.error) alertSourcesFailed.push('Water');

  const stpOperations = stpRead.status === 'fulfilled' ? stpRead.value : null;
  if (stpOperations === null) alertSourcesFailed.push('STP');

  const contractorRows = contractorRead.status === 'fulfilled' ? contractorRead.value : null;
  if (contractorRows === null) alertSourcesFailed.push('Contractors');

  return {
    water: toWaterSummary(waterResult),
    electricity:
      electricityRead.status === 'fulfilled'
        ? toElectricitySummary(electricityRead.value)
        : { ...EMPTY_ELECTRICITY, error: message(electricityRead.reason) },
    stp:
      stpOperations !== null
        ? toStpSummary(stpOperations)
        : { ...EMPTY_STP, error: message(stpRead.status === 'rejected' ? stpRead.reason : 'unknown') },
    contractors:
      contractorRows !== null
        ? toContractorsSummary(contractorRows, now)
        : {
            ...EMPTY_CONTRACTORS,
            error: message(contractorRead.status === 'rejected' ? contractorRead.reason : 'unknown'),
          },
    assets:
      assetsRead.status === 'fulfilled'
        ? { summary: assetsRead.value, error: null }
        : { summary: null, error: message(assetsRead.reason) },
    alerts: evaluateOperationalAlerts({
      waterMeters: waterResult.error ? null : waterResult.meters,
      contractors: contractorRows,
      stpOperations,
      now,
    }),
    alertSourcesFailed,
    loadedAt: now,
  };
}
