/**
 * @fileoverview Water System Data Module - Muscat Bay
 * 
 * This module contains the complete water meter database for Muscat Bay,
 * including meter definitions, consumption data, and analysis functions.
 * 
 * @module lib/water-data
 * 
 * ## Meter Hierarchy (Levels)
 * 
 * The water system uses a hierarchical meter structure:
 * 
 * - **L1 (Main Source)**: Main bulk meter from NAMA
 * - **L2 (Zone Bulk)**: Zone-level bulk meters
 * - **L3 (Individual/Building)**: Individual unit or building bulk meters
 * - **L4 (Sub-meters)**: Apartment meters within buildings
 * - **DC (Direct Connection)**: Meters directly connected to main source
 * 
 * ## Zone Configuration
 * 
 * Zones include: Zone FM, Zone 3A, Zone 3B, ZEN Project, Zone 5, Zone 8,
 * and Village Square.
 * Each zone has a bulk meter account for loss calculation.
 * 
 * ## Analysis Functions
 * 
 * - `calculateMonthlyAnalysis()` - System-wide loss analysis for a month
 * - `calculateZoneAnalysis()` - Zone-specific efficiency metrics
 * - `calculateBuildingAnalysis()` - Building-level loss tracking
 * - `getConsumptionByType()` - Consumption breakdown by usage type
 * 
 * @see {@link ./supabase.ts} for live data integration
 */

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface WaterMeter {
  id?: string;
  label: string;
  accountNumber: string;
  level: 'L1' | 'L2' | 'L3' | 'L4' | 'DC' | 'N/A';
  zone: string;
  parentMeter: string;
  type: string;
  consumption: Record<string, number | null>;
}

export interface ZoneConfig {
  code: string;
  name: string;
  bulkMeterAccount: string;
  hasBuildings: boolean;
}

// The WaterAnalysis / ZoneAnalysis / BuildingAnalysis interfaces that used to
// sit here described the return shapes of the deleted demo-data calculators.
// The live equivalents are computed in `lib/water-monthly-data.ts`.

export const ZONE_CONFIG: ZoneConfig[] = [
  { code: 'Zone_01_(FM)', name: 'Zone FM', bulkMeterAccount: '4300346', hasBuildings: true },
  { code: 'Zone_03_(A)', name: 'Zone 3A', bulkMeterAccount: '4300343', hasBuildings: true },
  { code: 'Zone_03_(B)', name: 'Zone 3B', bulkMeterAccount: '4300344', hasBuildings: true },
  { code: 'Zone_03C', name: 'ZEN Project', bulkMeterAccount: '4300348', hasBuildings: false },
  { code: 'Zone_05', name: 'Zone 5', bulkMeterAccount: '4300345', hasBuildings: false },
  { code: 'Zone_08', name: 'Zone 8', bulkMeterAccount: '4300342', hasBuildings: false },
  { code: 'Zone_VS', name: 'Village Square', bulkMeterAccount: '4300335', hasBuildings: false },
];

/** Dynamically generates months from Jan 2024 up to the current month. No manual updates needed. */
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
export function getDynamicMonths(): string[] {
  const START_YEAR = 2024;
  const now = new Date();
  const endYear = now.getFullYear();
  const endMonth = now.getMonth(); // 0-indexed
  const months: string[] = [];
  for (let y = START_YEAR; y <= endYear; y++) {
    const lastM = y === endYear ? endMonth : 11;
    for (let m = 0; m <= lastM; m++) {
      months.push(`${MONTH_NAMES[m]}-${String(y).slice(2)}`);
    }
  }
  return months;
}

/** Dynamically generated from Jan 2024 to the current calendar month — no manual updates needed. */
export const AVAILABLE_MONTHS = getDynamicMonths();

/**
 * Walk `months` newest-first and return the most recent one that actually has
 * data, according to the injected `hasData` probe. Returns `null` if none of
 * the probed months (capped at `maxProbes`, newest-first) have data.
 *
 * Why this exists: `getDynamicMonths()` extends to the *current* calendar
 * month, so on the first days of a new month the daily report would otherwise
 * default to a month with no rows yet and surface a scary "Failed to Load"
 * error. This lets callers default to the latest *populated* month instead.
 *
 * Pure with respect to the injected probe (no network/DB dependency here), so
 * it is unit-testable in isolation. `months` is expected oldest → newest, the
 * shape `getDynamicMonths()` returns.
 */
export async function findLatestMonthWithData(
  months: string[],
  hasData: (month: string) => Promise<boolean>,
  maxProbes = 18,
): Promise<string | null> {
  const latestFirst = [...months].reverse().slice(0, maxProbes);
  for (const month of latestFirst) {
    if (await hasData(month)) return month;
  }
  return null;
}

export const TYPE_CATEGORIES: Record<string, string[]> = {
  Commercial: ['Retail', 'Building'],
  Residential: ['Residential (Villa)', 'Residential (Apart)', 'D_Building_Bulk', 'D_Building_Common', 'Un-Sold'],
  Irrigation: ['IRR_Servies'],
  Common: ['MB_Common', 'Zone Bulk', 'Main BULK']
};


// =============================================================================
// NOTE — the hardcoded demo dataset that used to live here has been REMOVED.
//
// This file previously carried a 366-entry `WATER_METERS` array of real-looking
// supply and consumption figures, plus ~20 calculation helpers
// (`getWaterMeters`, `calculateMonthlyAnalysis`, `calculateZoneAnalysis`, …)
// that all read it through a module-level `dynamicWaterMeters` variable.
//
// `setWaterMetersData()` was never called anywhere in the application, so that
// variable was permanently null and every one of those helpers returned demo
// figures. Nothing outside this file imported them, so no screen was affected —
// but any future code that reached for `getWaterMeters()` would have rendered
// fabricated readings that look entirely plausible.
//
// The water module reads live data through `fetchWaterMeters()`
// (`functions/api/water.ts`), which returns `{ meters, error, negatives }` and
// renders an explicit error state on failure. Use that. Nothing in this app may
// substitute invented figures for missing data.
//
// The seed scripts under `scripts/seeds/` are unaffected — each declares its own
// local dataset.
// =============================================================================
