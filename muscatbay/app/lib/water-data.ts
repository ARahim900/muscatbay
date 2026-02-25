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
 * Zones include: Zone FM, Zone 3A, Zone 3B, Zone 5, Zone 8, Village Square,
 * and Sales Center. Each zone has a bulk meter account for loss calculation.
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
  id?: number;
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

export interface WaterAnalysis {
  A1: number;
  A2: number;
  A3Bulk: number;
  A3Individual: number;
  stage1Loss: number;
  stage2Loss: number;
  stage3Loss: number;
  totalLoss: number;
  efficiency: number;
  lossPercentage: number;
}

export interface ZoneAnalysis {
  zone: string;
  zoneName: string;
  bulkMeterReading: number;
  individualTotal: number;
  loss: number;
  lossPercentage: number;
  efficiency: number;
  meterCount: number;
}

export interface BuildingAnalysis {
  building: string;
  zone: string;
  bulkMeterReading: number;
  apartmentTotal: number;
  loss: number;
  lossPercentage: number;
  apartmentCount: number;
}

export const ZONE_CONFIG: ZoneConfig[] = [
  { code: 'Zone_01_(FM)', name: 'Zone FM', bulkMeterAccount: '4300346', hasBuildings: true },
  { code: 'Zone_03_(A)', name: 'Zone 3A', bulkMeterAccount: '4300343', hasBuildings: true },
  { code: 'Zone_03_(B)', name: 'Zone 3B', bulkMeterAccount: '4300344', hasBuildings: true },
  { code: 'Zone_05', name: 'Zone 5', bulkMeterAccount: '4300345', hasBuildings: false },
  { code: 'Zone_08', name: 'Zone 8', bulkMeterAccount: '4300342', hasBuildings: false },
  { code: 'Zone_VS', name: 'Village Square', bulkMeterAccount: '4300335', hasBuildings: false },
  { code: 'Zone_SC', name: 'Sales Center', bulkMeterAccount: '4300295', hasBuildings: false },
];

export const AVAILABLE_MONTHS = [
  'Jan-24', 'Feb-24', 'Mar-24', 'Apr-24', 'May-24', 'Jun-24', 'Jul-24', 'Aug-24', 'Sep-24', 'Oct-24', 'Nov-24', 'Dec-24',
  'Jan-25', 'Feb-25', 'Mar-25', 'Apr-25', 'May-25', 'Jun-25', 'Jul-25', 'Aug-25', 'Sep-25', 'Oct-25', 'Nov-25', 'Dec-25',
  'Jan-26', 'Feb-26'
];

export const TYPE_CATEGORIES: Record<string, string[]> = {
  Commercial: ['Retail', 'Building'],
  Residential: ['Residential (Villa)', 'Residential (Apart)', 'D_Building_Bulk', 'D_Building_Common'],
  Irrigation: ['IRR_Servies'],
  Common: ['MB_Common', 'Zone Bulk', 'Main BULK']
};

const c = (vals: (number | null)[]): Record<string, number | null> => {
  const result: Record<string, number | null> = {};
  AVAILABLE_MONTHS.forEach((m, i) => { result[m] = vals[i] ?? null; });
  return result;
};

export const WATER_METERS: WaterMeter[] = [
  { label: 'Z5-17', accountNumber: '4300001', level: 'L3', zone: 'Zone_05', parentMeter: 'ZONE 5 (Bulk Zone 5)', type: 'Residential (Villa)', consumption: c([99, 51, 53, 62, 135, 140, 34, 132, 63, 103, 54, 148, 110, 77.3, 86.3, 89.4, 57.9, 72, 87, 74, 109, 84, 83, 77, 97, null]) },
  { label: 'Z3-42 (Villa)', accountNumber: '4300002', level: 'L3', zone: 'Zone_03_(A)', parentMeter: 'ZONE 3A (BULK ZONE 3A)', type: 'Residential (Villa)', consumption: c([61, 33, 36, 47, 39, 42, 25, 20, 44, 57, 51, 75, 31.3, 45.6, 20.6, 62.4, 86.8, 58.7, 53, 65, 47, 25, 24, 23, 29, null]) },
  { label: 'Z3-46(5) (Building)', accountNumber: '4300003', level: 'L4', zone: 'Zone_03_(A)', parentMeter: 'D-46 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4.95, 0.01, 0, 0.04, 4.2, 4.3, 4, 9, 53, 41, 32, 30, 26, null]) },
  { label: 'Z3-49(3) (Building)', accountNumber: '4300004', level: 'L4', zone: 'Zone_03_(A)', parentMeter: 'D-49 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([1, 1, 22, 30, 18, 6, 7, 11, 7, 10, 9, 5, 9.77, 14, 12.7, 12.1, 11.7, 2.62, 4, 9, 3, 2, 4, 17, 11, null]) },
  { label: 'Z3-38 (Villa)', accountNumber: '4300005', level: 'L3', zone: 'Zone_03_(A)', parentMeter: 'ZONE 3A (BULK ZONE 3A)', type: 'Residential (Villa)', consumption: c([0, 0, 0, 0, 0, 3, 0, 4, 30, 2, 12, 11, 9.26, 6.74, 7.7, 7.39, 8.09, 6.15, 109, 24, 6, 4, 8, 4, 1, null]) },
  { label: 'Z3-75(4) (Building)', accountNumber: '4300006', level: 'L4', zone: 'Zone_03_(A)', parentMeter: 'D-75 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([0, 14, 3, 0, 0, 0, 0, 0, 0, 0, 7, 6, 0, 0.05, 0, 0, 0.59, 0.01, 0, 0, 0, 0, 0, 6, 5, null]) },
  { label: 'Z3-46(3A) (Building)', accountNumber: '4300007', level: 'L4', zone: 'Zone_03_(A)', parentMeter: 'D-46 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([13, 7, 6, 25, 27, 30, 35, 41, 29, 44, 32, 43, 37.4, 33.2, 18, 34.2, 42.5, 34, 39, 40, 7, 2, 5, 16, 8, null]) },
  { label: 'Z3-52(6) (Building)', accountNumber: '4300008', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-52 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([27, 22, 19, 28, 27, 27, 298, 58, 14, 18, 17, 8, 9.93, 8.95, 9, 14, 12, 17, 15, 13, 8, 16, 17, 10, 12, null]) },
  { label: 'Z3-21 (Villa)', accountNumber: '4300009', level: 'L3', zone: 'Zone_03_(B)', parentMeter: 'ZONE 3B (BULK ZONE 3B)', type: 'Residential (Villa)', consumption: c([37, 38, 24, 20, 31, 41, 9, 54, 263, 68, 45, 43, 39.4, 50.1, 46.2, 47.3, 50.9, 39.1, 69, 56, 50, 47, 43, 50, 41, null]) },
  { label: 'Z3-049(4) (Building)', accountNumber: '4300010', level: 'L4', zone: 'Zone_03_(A)', parentMeter: 'D-49 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([11, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 7.62, 0.5, 8.67, 0.01, 0, 0.01, 0, 2, 1, 7, 4, 2, 9, null]) },
  { label: 'Z3-46(1A) (Building)', accountNumber: '4300011', level: 'L4', zone: 'Zone_03_(A)', parentMeter: 'D-46 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([9, 10, 10, 11, 10, 10, 11, 11, 12, 17, 11, 13, 11.1, 9.43, 10.5, 10.9, 11.3, 12.2, 15, 16, 15, 13, 13, 13, 13, null]) },
  { label: 'Z3-47(2) (Building)', accountNumber: '4300012', level: 'L4', zone: 'Zone_03_(A)', parentMeter: 'D-47 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([0, 0, 0, 0, 0, 0, 2, 2, 3, 1, 3, 1, 0.86, 0.54, 1.63, 0.42, 0.59, 3.05, 1, 1, 2, 2, 2, 2, 3, null]) },
  { label: 'Z3-45(3A) (Building)', accountNumber: '4300013', level: 'L4', zone: 'Zone_03_(A)', parentMeter: 'D-45 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([5, 8, 0, 2, 0, 2, 0, 0, 0, 1, 0, 2, 7.51, 4.28, 0.05, 1.09, 1.2, 0.54, 0, 0, 1, 0, 1, 6, 0, null]) },
  { label: 'Z3-46(2A) (Building)', accountNumber: '4300014', level: 'L4', zone: 'Zone_03_(A)', parentMeter: 'D-46 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, null]) },
  { label: 'Z3-46(6) (Building)', accountNumber: '4300015', level: 'L4', zone: 'Zone_03_(A)', parentMeter: 'D-46 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([3, 2, 1, 1, 3, 3, 2, 2, 2, 2, 1, 2, 2.48, 1.21, 1.35, 4.21, 5.21, 4.43, 3, 10, 1, 19, 17, 2, 3, null]) },
  { label: 'Z3-47(4) (Building)', accountNumber: '4300016', level: 'L4', zone: 'Zone_03_(A)', parentMeter: 'D-47 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([15, 15, 26, 15, 22, 14, 23, 6, 16, 16, 8, 13, 10.6, 12.1, 0.07, 0.7, 0, 7.34, 2, 3, 9, 5, 5, 3, 6, null]) },
  { label: 'Z3-45(5) (Building)', accountNumber: '4300017', level: 'L4', zone: 'Zone_03_(A)', parentMeter: 'D-45 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([4, 3, 2, 10, 6, 8, 9, 3, 7, 22, 15, 10, 4.47, 3.22, 2.29, 2.04, 2.04, 1.79, 0, 0, 19, 15, 21, 14, 13, null]) },
  { label: 'Z3-47(5) (Building)', accountNumber: '4300018', level: 'L4', zone: 'Zone_03_(A)', parentMeter: 'D-47 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([8, 56, 13, 7, 2, 0, 1, 15, 0, 13, 5, 9, 35.4, 11.5, 11.9, 17.9, 15.5, 12.3, 13, 10, 13, 40, 30, 19, 11, null]) },
  { label: 'Z3-45(6) (Building)', accountNumber: '4300019', level: 'L4', zone: 'Zone_03_(A)', parentMeter: 'D-45 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([3, 3, 4, 20, 3, 8, 6, 4, 5, 6, 7, 4, 4.76, 15.1, 35.6, 41.9, 47.3, 4.33, 5, 5, 4, 5, 6, 5, 3, null]) },
  { label: 'Z3-20 (Villa)', accountNumber: '4300020', level: 'L3', zone: 'Zone_03_(B)', parentMeter: 'ZONE 3B (BULK ZONE 3B)', type: 'Residential (Villa)', consumption: c([2, 1, 1, 2, 2, 2, 6, 4, 10, 14, 10, 11, 11.7, 13.1, 8.28, 2.84, 5.38, 13.7, 12, 10, 3, 9, 5, 10, 9, null]) },
  { label: 'Z3-50(4) (Building)', accountNumber: '4300021', level: 'L4', zone: 'Zone_03_(A)', parentMeter: 'D-50 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([15, 4, 7, 6, 11, 5, 6, 9, 6, 9, 8, 9, 5.97, 3.96, 5.81, 16.3, 6.65, 7.01, 19, 9, 5, 7, 7, 7, 14, null]) },
  { label: 'Z3-74(3) (Building)', accountNumber: '4300022', level: 'L4', zone: 'Zone_03_(A)', parentMeter: 'D-74 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([21, 54, 16, 6, 22, 5, 6, 12, 13, 24, 19, 12, 11.5, 18.6, 20.3, 26.6, 26.3, 19.9, 30, 25, 30, 25, 33, 21, 26, null]) },
  { label: 'Z8-11', accountNumber: '4300023', level: 'L3', zone: 'Zone_08', parentMeter: 'BULK ZONE 8', type: 'Residential (Villa)', consumption: c([0, 1, 0, 0, 1, 23, 2, 2, 1, 1, 2, 0, 0.16, 0.34, 0.03, 0.01, 0.01, 0.13, 0, 0, 15, 4, 0, 0, 0, null]) },
  { label: 'Z8-13', accountNumber: '4300024', level: 'L3', zone: 'Zone_08', parentMeter: 'BULK ZONE 8', type: 'Residential (Villa)', consumption: c([6, 2, 1, 1, 0, 15, 0, 0, 0, 3, 2, 1, 0, 0.02, 0.02, 0.06, 0.13, 0.94, 229, 245, 254, 258, 263, 173, 157, null]) },
  { label: 'Z3-13 (Villa)', accountNumber: '4300025', level: 'L3', zone: 'Zone_03_(B)', parentMeter: 'ZONE 3B (BULK ZONE 3B)', type: 'Residential (Villa)', consumption: c([24, 27, 23, 17, 20, 24, 10, 11, 5, 20, 16, 19, 19.7, 19.4, 21.3, 23.6, 19.9, 14.9, 6, 18, 18, 17, 18, 12, 18, null]) },
  { label: 'Z3-45(4A) (Building)', accountNumber: '4300026', level: 'L4', zone: 'Zone_03_(A)', parentMeter: 'D-45 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.01, 0.47, 0.01, 0.05, 0, 0, 4, 2, 1, 4, 4, 5, 6, null]) },
  { label: 'Z3-50(5) (Building)', accountNumber: '4300027', level: 'L4', zone: 'Zone_03_(A)', parentMeter: 'D-50 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([2, 0, 0, 1, 0, 1, 23, 10, 9, 8, 12, 8, 8.43, 9.67, 23.2, 10.7, 10.7, 13.4, 12, 10, 7, 11, 9, 11, 24, null]) },
  { label: 'Z3-50(6) (Building)', accountNumber: '4300028', level: 'L4', zone: 'Zone_03_(A)', parentMeter: 'D-50 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([6, 14, 16, 15, 16, 20, 1, 12, 17, 25, 21, 23, 20.7, 16.7, 21.1, 13.4, 15.6, 15.1, 18, 15, 16, 13, 18, 19, 17, null]) },
  { label: 'Z3-52(4A) (Building)', accountNumber: '4300029', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-52 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.03, 0, 0, 0.04, 5.84, 6.42, 7, 9, 5, 10, 8, 11, 7, null]) },
  { label: 'Z3-44(1A) (Building)', accountNumber: '4300030', level: 'L4', zone: 'Zone_03_(A)', parentMeter: 'D-44 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([0, 0, 20, 25, 23, 7, 0, 0, 2, 9, 8, 5, 10.7, 9.8, 10.6, 6.82, 11, 8.05, 2, 7, 9, 9, 11, 9, 12, null]) },
  { label: 'Z3-44(1B) (Building)', accountNumber: '4300031', level: 'L4', zone: 'Zone_03_(A)', parentMeter: 'D-44 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, null]) },
  { label: 'Z3-44(2A) (Building)', accountNumber: '4300032', level: 'L4', zone: 'Zone_03_(A)', parentMeter: 'D-44 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([4, 2, 15, 20, 21, 1, 5, 2, 3, 7, 7, 2, 7.93, 3.41, 5.37, 9.4, 6.51, 1.81, 3, 5, 6, 7, 3, 9, 9, null]) },
  { label: 'Z3-44(2B) (Building)', accountNumber: '4300033', level: 'L4', zone: 'Zone_03_(A)', parentMeter: 'D-44 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([7, 3, 8, 3, 4, 2, 2, 4, 5, 9, 5, 8, 7.2, 5.96, 7.78, 7.69, 2.79, 0, 0, 0, 0, 7, 5, 6, 6, null]) },
  { label: 'Z3-44(5) (Building)', accountNumber: '4300034', level: 'L4', zone: 'Zone_03_(A)', parentMeter: 'D-44 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([148, 135, 126, 99, 15, 25, 61, 132, 115, 249, 208, 135, 116, 134, 44.9, 24.7, 5.63, 6.04, 9, 8, 7, 4, 1, 0, 0, null]) },
  { label: 'Z3-44(6) (Building)', accountNumber: '4300035', level: 'L4', zone: 'Zone_03_(A)', parentMeter: 'D-44 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([36, 20, 19, 16, 13, 9, 7, 9, 17, 39, 33, 33, 33.3, 32.4, 36.8, 36.1, 34.7, 32.4, 36, 38, 39, 40, 44, 41, 85, null]) },
  { label: 'Z3-75(1) (Building)', accountNumber: '4300036', level: 'L4', zone: 'Zone_03_(A)', parentMeter: 'D-75 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 0.57, 0.02, 0.16, 1.07, 0.71, 0.7, 1, 1, 0, 0, 0, 0, 0, null]) },
  { label: 'Z3-75(3) (Building)', accountNumber: '4300037', level: 'L4', zone: 'Zone_03_(A)', parentMeter: 'D-75 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([4, 0, 0, 0, 0, 2, 0, 0, 0, 3, 1, 4, 2.24, 5.93, 1.09, 5.62, 0.01, 0.01, 0, 0, 0, 5, 0, 5, 11, null]) },
  { label: 'Z3-23 (Villa)', accountNumber: '4300038', level: 'L3', zone: 'Zone_03_(A)', parentMeter: 'ZONE 3A (BULK ZONE 3A)', type: 'Residential (Villa)', consumption: c([29, 16, 18, 18, 15, 32, 24, 28, 25, 37, 2, 2, 0.74, 0.01, 0, 0, 0.87, 0.66, 1, 0, 0, 0, 34, 68, 20, null]) },
  { label: 'Z3-47(3) (Building)', accountNumber: '4300039', level: 'L4', zone: 'Zone_03_(A)', parentMeter: 'D-47 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([14, 15, 14, 14, 19, 14, 16, 19, 13, 21, 17, 18, 17.7, 17, 19.1, 17.4, 18.4, 20.7, 46, 21, 20, 20, 18, 18, 19, null]) },
  { label: 'Z3-48(3) (Building)', accountNumber: '4300040', level: 'L4', zone: 'Zone_03_(A)', parentMeter: 'D-48 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([8, 8, 7, 8, 7, 3, 4, 8, 7, 10, 10, 3, 3.64, 3.95, 4.4, 4.36, 7.25, 7.39, 2, 7, 10, 23, 19, 6, 8, null]) },
  { label: 'Z3-48(6) (Building)', accountNumber: '4300041', level: 'L4', zone: 'Zone_03_(A)', parentMeter: 'D-48 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([1, 0, 0, 0, 0, 3, 5, 10, 0, 10, 1, 0, 0, 0.01, 0.37, 0.37, 0.38, 0.43, 0, 0, 0, 0, 0, 0, 2, null]) },
  { label: 'Z3-52(3A) (Building)', accountNumber: '4300042', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-52 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([1, 1, 1, 0, 1, 0, 1, 2, 8, 9, 8, 6, 5.95, 7.93, 6.09, 5.06, 11.3, 7.49, 9, 7, 6, 9, 8, 5, 7, null]) },
  { label: 'Z3-46(4A) (Building)', accountNumber: '4300043', level: 'L4', zone: 'Zone_03_(A)', parentMeter: 'D-46 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([1, 1, 1, 1, 1, 1, 0, 0, 1, 3, 1, 0, 3.66, 1.25, 0.26, 18.9, 5.16, 0.2, 2, 1, 2, 1, 0, 0, 0, null]) },
  { label: 'Z3-41 (Villa)', accountNumber: '4300044', level: 'L3', zone: 'Zone_03_(A)', parentMeter: 'ZONE 3A (BULK ZONE 3A)', type: 'Residential (Villa)', consumption: c([50, 38, 26, 20, 90, 66, 128, 192, 58, 53, 44, 22, 12.8, 15.9, 36.5, 25.5, 24.9, 42.5, 30, 5, 75, 28, 30, 26, 27, null]) },
  { label: 'Z3-74(5) (Building)', accountNumber: '4300045', level: 'L4', zone: 'Zone_03_(A)', parentMeter: 'D-74 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([10, 2, 5, 5, 7, 6, 5, 7, 5, 4, 5, 7, 12.4, 5.81, 13.9, 16, 9.27, 11.7, 15, 6, 17, 17, 17, 18, 17, null]) },
  { label: 'Z3-74(6) (Building)', accountNumber: '4300046', level: 'L4', zone: 'Zone_03_(A)', parentMeter: 'D-74 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([32, 12, 6, 13, 9, 2, 3, 0, 2, 12, 6, 6, 10.8, 3.98, 4.25, 4.99, 5.03, 4.58, 16, 7, 7, 11, 7, 8, 7, null]) },
  { label: 'Z3-50(3) (Building)', accountNumber: '4300047', level: 'L4', zone: 'Zone_03_(A)', parentMeter: 'D-50 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([2, 8, 7, 6, 3, 4, 4, 5, 5, 9, 9, 7, 7.6, 11.5, 7.53, 0.1, 0.04, 0, 0, 0, 0, 0, 0, 0, 0, null]) },
  { label: 'Z3-48(5) (Building)', accountNumber: '4300048', level: 'L4', zone: 'Zone_03_(A)', parentMeter: 'D-48 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([0, 0, 0, 0, 0, 0, 2, 4, 2, 4, 33, 16, 1.33, 1, 1.11, 0.62, 0.2, 0, 0, 3, 0, 0, 0, 0, 0, null]) },
  { label: 'Z3-37 (Villa)', accountNumber: '4300049', level: 'L3', zone: 'Zone_03_(A)', parentMeter: 'ZONE 3A (BULK ZONE 3A)', type: 'Residential (Villa)', consumption: c([1, 2, 0, 1, 0, 0, 5, 13, 0, 1, 1, 3, 26, 14, 19.6, 27.3, 48.7, 15.4, 37, 24, 20, 28, 41, 32, 30, null]) },
  { label: 'Z3-43 (Villa)', accountNumber: '4300050', level: 'L3', zone: 'Zone_03_(A)', parentMeter: 'ZONE 3A (BULK ZONE 3A)', type: 'Residential (Villa)', consumption: c([79, 67, 50, 62, 72, 75, 49, 83, 76, 91, 77, 70, 68.4, 61.9, 52.5, 51.9, 47.8, 78.2, 55, 48, 50, 43, 40, 50, 145, null]) },
  { label: 'Z3-47(6) (Building)', accountNumber: '4300051', level: 'L4', zone: 'Zone_03_(A)', parentMeter: 'D-47 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([18, 19, 27, 15, 10, 12, 6, 6, 16, 13, 23, 27, 28.2, 12.6, 17.7, 17.2, 8.51, 5.81, 5, 8, 13, 9, 14, 9, 18, null]) },
  { label: 'Z3-31 (Villa)', accountNumber: '4300052', level: 'L3', zone: 'Zone_03_(A)', parentMeter: 'ZONE 3A (BULK ZONE 3A)', type: 'Residential (Villa)', consumption: c([115, 105, 86, 81, 140, 135, 151, 258, 222, 37, 164, 176, 165, 133, 121, 215, 221, 240, 109, 235, 219, 242, 233, 128, 97, null]) },
  { label: 'Z3-49(5) (Building)', accountNumber: '4300053', level: 'L4', zone: 'Zone_03_(A)', parentMeter: 'D-49 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([3, 6, 1, 1, 2, 0, 0, 2, 1, 10, 0, 0, 0, 3.86, 0.41, 0.06, 0, 0, 3, 2, 1, 0, 0, 1, 1, null]) },
  { label: 'Z3-62(6) (Building)', accountNumber: '4300054', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-62 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([12, 14, 15, 14, 3, 0, 0, 0, 0, 0, 0, 1, 38.9, 18.4, 17.8, 10.7, 2.9, 1.71, 2, 2, 2, 3, 4, 1, 7, null]) },
  { label: 'Z3-75(5) (Building)', accountNumber: '4300055', level: 'L4', zone: 'Zone_03_(A)', parentMeter: 'D-75 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([0, 0, 11, 8, 9, 11, 8, 10, 12, 27, 22, 14, 15.7, 11.1, 13.8, 15.2, 16, 16.3, 14, 17, 17, 15, 14, 16, 20, null]) },
  { label: 'Z3-52(5) (Building)', accountNumber: '4300056', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-52 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([13, 5, 6, 4, 7, 9, 6, 5, 6, 4, 3, 4, 4.84, 2.93, 4.46, 6.3, 9.32, 7.55, 6, 7, 4, 65, 2, 5, 5, null]) },
  { label: 'Z3-15 (Villa)', accountNumber: '4300057', level: 'L3', zone: 'Zone_03_(B)', parentMeter: 'ZONE 3B (BULK ZONE 3B)', type: 'Residential (Villa)', consumption: c([53, 39, 32, 31, 34, 45, 43, 31, 37, 45, 36, 36, 40.2, 36.3, 40.3, 46.3, 43.9, 43.6, 38, 45, 41, 39, 38, 38, 38, null]) },
  { label: 'Z5-13', accountNumber: '4300058', level: 'L3', zone: 'Zone_05', parentMeter: 'ZONE 5 (Bulk Zone 5)', type: 'Residential (Villa)', consumption: c([78, 73, 9, 46, 17, 83, 40, 80, 61, 56, 68, 85, 71.3, 97.1, 101, 118, 109, 116, 154, 146, 130, 168, 67, 48, 117, null]) },
  { label: 'Z5-14', accountNumber: '4300059', level: 'L3', zone: 'Zone_05', parentMeter: 'ZONE 5 (Bulk Zone 5)', type: 'Residential (Villa)', consumption: c([68, 56, 52, 250, 128, 100, 12, 20, 22, 22, 62, 72, 70.7, 85.6, 86.6, 91.2, 82.4, 95.9, 67, 81, 58, 98, 80, 34, 35, null]) },
  { label: 'Z3-14 (Villa)', accountNumber: '4300060', level: 'L3', zone: 'Zone_03_(B)', parentMeter: 'ZONE 3B (BULK ZONE 3B)', type: 'Residential (Villa)', consumption: c([55, 45, 42, 57, 66, 27, 31, 11, 16, 27, 30, 173, 160, 102, 33, 42.3, 32.3, 82.6, 74, 15, 15, 14, 14, 7, 6, null]) },
  { label: 'Z3-49(6) (Building)', accountNumber: '4300061', level: 'L4', zone: 'Zone_03_(A)', parentMeter: 'D-49 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([34, 26, 16, 15, 16, 34, 16, 4, 10, 36, 25, 26, 24.4, 21.8, 22.3, 27.1, 22.3, 20, 29, 38, 29, 27, 25, 33, 30, null]) },
  { label: 'Z3-62(1) (Building)', accountNumber: '4300062', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-62 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([0, 3, 0, 0, 4, 19, 0, 0, 1, 9, 2, 1, 3.49, 0.97, 15.5, 9.38, 5.36, 5.96, 15, 8, 7, 18, 42, 26, 3, null]) },
  { label: 'Z3-75(6) (Building)', accountNumber: '4300063', level: 'L4', zone: 'Zone_03_(A)', parentMeter: 'D-75 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([52, 39, 21, 17, 24, 24, 20, 24, 19, 24, 40, 34, 34.3, 28.9, 39, 35.5, 25.8, 31.2, 31, 41, 35, 26, 39, 28, 26, null]) },
  { label: 'Z3-53(4B) (Building)', accountNumber: '4300064', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-53 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, null]) },
  { label: 'Z3-60(1B) (Building)', accountNumber: '4300065', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-60 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([12, 9, 10, 8, 9, 7, 11, 10, 10, 15, 12, 14, 14.2, 12.7, 10.5, 13.8, 12.7, 11, 12, 13, 12, 10, 7, 7, 7, null]) },
  { label: 'Z3-59(4B) (Building)', accountNumber: '4300066', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-59 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([10, 8, 9, 10, 8, 8, 8, 8, 1, 1, 0, 1, 2.94, 3.16, 0.06, 0.8, 0.13, 0.01, 0, 0, 0, 0, 0, 5, 7, null]) },
  { label: 'Z3-60(3B) (Building)', accountNumber: '4300067', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-60 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.21, 1.37, 0, 0.34, 0.01, 0, 0, 0, 0, 0, 0, 0, 1, null]) },
  { label: 'Z3-60(4B) (Building)', accountNumber: '4300068', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-60 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([7, 4, 4, 3, 6, 5, 5, 4, 4, 4, 0, 0, 1.24, 2.1, 5, 6, 4, 1, 5, 6, 5, 5, 4, 4, 3, null]) },
  { label: 'Z3-52(2A) (Building)', accountNumber: '4300069', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-52 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([1, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 2, 0, 0, 0, 0.01, 0, 0.06, 0, 0, 1, 0, 0, 0, 1, null]) },
  { label: 'Z3-58(1B) (Building)', accountNumber: '4300070', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-58 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([8, 9, 1, 1, 0, 2, 2, 1, 2, 2, 1, 1, 1.64, 1.46, 2.11, 1.64, 2.6, 1.96, 2, 2, 1, 2, 1, 1, 1, null]) },
  { label: 'Z3-55(1B) (Building)', accountNumber: '4300071', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-55 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([2, 2, 3, 0, 0, 0, 0, 1, 0, 0, 3, 4, 3.16, 3.52, 3.35, 2.91, 3.58, 2.27, 3, 3, 3, 3, 3, 5, 3, null]) },
  { label: 'Z3-60(2B) (Building)', accountNumber: '4300072', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-60 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([1, 2, 0, 1, 0, 1, 0, 0, 0, 1, 2, 4, 2.36, 0.01, 0.86, 10.7, 1.65, 1.46, 0, 0, 3, 1, 11, 11, 11, null]) },
  { label: 'Z3-59(3A) (Building)', accountNumber: '4300073', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-59 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.57, 0, 0, 0, 0, 0, 0, 0, 0, 0, null]) },
  { label: 'Z3-53(6) (Building)', accountNumber: '4300074', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-53 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([0, 0, 3, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 2, 4, 27, 60, 79, 64, 51, null]) },
  { label: 'Z3-35 (Villa)', accountNumber: '4300075', level: 'L3', zone: 'Zone_03_(A)', parentMeter: 'ZONE 3A (BULK ZONE 3A)', type: 'Residential (Villa)', consumption: c([82, 78, 77, 67, 91, 54, 58, 70, 78, 92, 83, 69, 63.7, 53.9, 61.6, 72.9, 67.7, 86.3, 70, 65, 71, 79, 74, 82, 66, null]) },
  { label: 'Z3-12 (Villa)', accountNumber: '4300076', level: 'L3', zone: 'Zone_03_(B)', parentMeter: 'ZONE 3B (BULK ZONE 3B)', type: 'Residential (Villa)', consumption: c([52, 95, 258, 55, 67, 111, 93, 120, 118, 178, 55, 67, 71.7, 54.9, 60, 181, 178, 249, 188, 179, 165, 77, 114, 90, 110, null]) },
  { label: 'Z3-11 (Villa)', accountNumber: '4300077', level: 'L3', zone: 'Zone_03_(B)', parentMeter: 'ZONE 3B (BULK ZONE 3B)', type: 'Residential (Villa)', consumption: c([0, 2, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.27, 0, 0, 0, 0, 0, 0, 0, 0, null]) },
  { label: 'Z3-4 (Villa)', accountNumber: '4300078', level: 'L3', zone: 'Zone_03_(B)', parentMeter: 'ZONE 3B (BULK ZONE 3B)', type: 'Residential (Villa)', consumption: c([105, 90, 96, 106, 126, 122, 156, 150, 97, 171, 56, 111, 89.4, 48.9, 28.5, 23.7, 113, 129, 221, 129, 77, 95, 91, 62, 48, null]) },
  { label: 'Z3-40 (Villa)', accountNumber: '4300079', level: 'L3', zone: 'Zone_03_(A)', parentMeter: 'ZONE 3A (BULK ZONE 3A)', type: 'Residential (Villa)', consumption: c([26, 18, 25, 19, 26, 19, 12, 10, 12, 36, 20, 20, 18.7, 22.5, 38.6, 35.1, 139, 39.2, 13, 23, 7, 42, 32, 34, 40, null]) },
  { label: 'Z3-17 (Villa)', accountNumber: '4300080', level: 'L3', zone: 'Zone_03_(B)', parentMeter: 'ZONE 3B (BULK ZONE 3B)', type: 'Residential (Villa)', consumption: c([11, 5, 8, 5, 14, 19, 18, 22, 14, 24, 17, 20, 16.2, 9.62, 5.73, 13.1, 14.9, 12.8, 14, 12, 14, 20, 22, 22, 28, null]) },
  { label: 'Z3-30 (Villa)', accountNumber: '4300081', level: 'L3', zone: 'Zone_03_(A)', parentMeter: 'ZONE 3A (BULK ZONE 3A)', type: 'Residential (Villa)', consumption: c([16, 14, 19, 26, 9, 8, 8, 0, 0, 1, 1, 0, 0.21, 0, 4, 0, 0, 0, 1, 0, 0, 0, 0, 0, 3, null]) },
  { label: 'Z3-33 (Villa)', accountNumber: '4300082', level: 'L3', zone: 'Zone_03_(A)', parentMeter: 'ZONE 3A (BULK ZONE 3A)', type: 'Residential (Villa)', consumption: c([78, 32, 43, 36, 52, 68, 60, 60, 47, 76, 52, 45, 44.2, 40, 46.6, 48.2, 49.3, 34.1, 0, 48, 48, 54, 52, 54, 49, null]) },
  { label: 'Z3-18 (Villa)', accountNumber: '4300083', level: 'L3', zone: 'Zone_03_(B)', parentMeter: 'ZONE 3B (BULK ZONE 3B)', type: 'Residential (Villa)', consumption: c([62, 43, 36, 56, 47, 63, 59, 67, 46, 58, 42, 31, 35.1, 32, 37.7, 39.5, 75.7, 99.3, 92, 83, 63, 61, 21, 6, 2, null]) },
  { label: 'Z3-36 (Villa)', accountNumber: '4300084', level: 'L3', zone: 'Zone_03_(A)', parentMeter: 'ZONE 3A (BULK ZONE 3A)', type: 'Residential (Villa)', consumption: c([13, 11, 22, 44, 85, 68, 61, 58, 72, 102, 115, 93, 77.8, 74.2, 80.8, 82, 170, 168, 155, 115, 110, 89, 87, 76, 86, null]) },
  { label: 'Z3-32 (Villa)', accountNumber: '4300085', level: 'L3', zone: 'Zone_03_(A)', parentMeter: 'ZONE 3A (BULK ZONE 3A)', type: 'Residential (Villa)', consumption: c([19, 25, 32, 29, 13, 0, 30, 31, 38, 57, 44, 30, 37.2, 36, 37.4, 37.6, 39.9, 39.5, 35, 30, 41, 38, 40, 35, 34, null]) },
  { label: 'Z3-39 (Villa)', accountNumber: '4300086', level: 'L3', zone: 'Zone_03_(A)', parentMeter: 'ZONE 3A (BULK ZONE 3A)', type: 'Residential (Villa)', consumption: c([67, 33, 35, 40, 27, 51, 24, 38, 35, 47, 34, 37, 37, 31.7, 34.7, 33.4, 41.1, 33.4, 38, 34, 35, 32, 41, 29, 37, null]) },
  { label: 'Z3-34 (Villa)', accountNumber: '4300087', level: 'L3', zone: 'Zone_03_(A)', parentMeter: 'ZONE 3A (BULK ZONE 3A)', type: 'Residential (Villa)', consumption: c([1, 12, 9, 30, 14, 0, 0, 0, 0, 0, 0, 31, 0.21, 0, 0, 19.7, 17.5, 8.91, 10, 41, 24, 52, 27, 29, 42, null]) },
  { label: 'Z3-3 (Villa)', accountNumber: '4300088', level: 'L3', zone: 'Zone_03_(B)', parentMeter: 'ZONE 3B (BULK ZONE 3B)', type: 'Residential (Villa)', consumption: c([78, 66, 80, 91, 84, 84, 83, 61, 67, 78, 69, 86, 64.2, 52.8, 71.2, 72.6, 176, 193, 136, 118, 112, 119, 96, 93, 76, null]) },
  { label: 'Z3-27 (Villa)', accountNumber: '4300089', level: 'L3', zone: 'Zone_03_(A)', parentMeter: 'ZONE 3A (BULK ZONE 3A)', type: 'Residential (Villa)', consumption: c([0, 0, 0, 0, 8, 0, 5, 0, 4, 0, 8, 59, 14.1, 24.8, 63.2, 72.8, 25.1, 64.5, 121, 38, 53, 34, 81, 18, 44, null]) },
  { label: 'Z3-7 (Villa)', accountNumber: '4300090', level: 'L3', zone: 'Zone_03_(B)', parentMeter: 'ZONE 3B (BULK ZONE 3B)', type: 'Residential (Villa)', consumption: c([27, 23, 14, 21, 30, 46, 23, 43, 24, 50, 34, 31, 36.5, 41.6, 51, 55.7, 58.3, 44.9, 47, 15, 28, 32, 44, 35, 43, null]) },
  { label: 'Z3-24 (Villa)', accountNumber: '4300091', level: 'L3', zone: 'Zone_03_(A)', parentMeter: 'ZONE 3A (BULK ZONE 3A)', type: 'Residential (Villa)', consumption: c([10, 8, 10, 7, 15, 7, 6, 7, 4, 5, 4, 15, 17.6, 32.4, 86.4, 99.7, 75.2, 60.4, 70, 63, 57, 65, 52, 65, 57, null]) },
  { label: 'Z3-10 (Villa)', accountNumber: '4300092', level: 'L3', zone: 'Zone_03_(B)', parentMeter: 'ZONE 3B (BULK ZONE 3B)', type: 'Residential (Villa)', consumption: c([37, 32, 31, 35, 47, 34, 40, 56, 41, 60, 33, 37, 75.4, 75.7, 70.2, 99.7, 88.5, 95.4, 84, 79, 68, 68, 52, 39, 32, null]) },
  { label: 'Z3-25 (Villa)', accountNumber: '4300093', level: 'L3', zone: 'Zone_03_(A)', parentMeter: 'ZONE 3A (BULK ZONE 3A)', type: 'Residential (Villa)', consumption: c([15, 12, 9, 9, 25, 11, 15, 6, 0, 0, 0, 0, 2.97, 0, 0, 0, 0, 0, 0, 0, 37, 0, 0, 0, 0, null]) },
  { label: 'Z3-1 (Villa)', accountNumber: '4300094', level: 'L3', zone: 'Zone_03_(B)', parentMeter: 'ZONE 3B (BULK ZONE 3B)', type: 'Residential (Villa)', consumption: c([6, 6, 3, 4, 5, 5, 5, 6, 5, 3, 4, 3, 2.86, 4.04, 5.56, 6.87, 7.45, 13.7, 37, 44, 37, 37, 13, 7, 10, null]) },
  { label: 'Z3-26 (Villa)', accountNumber: '4300095', level: 'L3', zone: 'Zone_03_(A)', parentMeter: 'ZONE 3A (BULK ZONE 3A)', type: 'Residential (Villa)', consumption: c([10, 69, 13, 21, 17, 18, 13, 4, 4, 3, 0, 0, 0, 0.19, 0, 0, 0, 0.01, 0, 0, 0, 0, 0, 0, 0, null]) },
  { label: 'Z3-9 (Villa)', accountNumber: '4300096', level: 'L3', zone: 'Zone_03_(B)', parentMeter: 'ZONE 3B (BULK ZONE 3B)', type: 'Residential (Villa)', consumption: c([68, 57, 76, 32, 17, 40, 38, 100, 60, 57, 70, 71, 65.4, 43, 61.9, 60.1, 69.2, 75, 81, 72, 44, 49, 47, 52, 60, null]) },
  { label: 'Z3-29 (Villa)', accountNumber: '4300097', level: 'L3', zone: 'Zone_03_(A)', parentMeter: 'ZONE 3A (BULK ZONE 3A)', type: 'Residential (Villa)', consumption: c([12, 5, 9, 12, 9, 9, 7, 1, 0, 2, 0, 1, 0.31, 6.75, 4.22, 0.47, 0, 5.53, 3, 34, 20, 20, 20, 24, 23, null]) },
  { label: 'Z3-2 (Villa)', accountNumber: '4300098', level: 'L3', zone: 'Zone_03_(B)', parentMeter: 'ZONE 3B (BULK ZONE 3B)', type: 'Residential (Villa)', consumption: c([111, 114, 97, 110, 57, 129, 113, 88, 74, 89, 52, 17, 6.2, 5.63, 8.86, 6.51, 37.6, 17.1, 26, 20, 56, 28, 24, 19, 22, null]) },
  { label: 'Z3-19 (Villa)', accountNumber: '4300099', level: 'L3', zone: 'Zone_03_(B)', parentMeter: 'ZONE 3B (BULK ZONE 3B)', type: 'Residential (Villa)', consumption: c([38, 11, 9, 16, 15, 6, 6, 9, 6, 5, 11, 13, 138, 4.37, 27.3, 108, 76.9, 7.59, 0, 45, 85, 11, 7, 9, 7, null]) },
  { label: 'Z3-6 (Villa)', accountNumber: '4300100', level: 'L3', zone: 'Zone_03_(B)', parentMeter: 'ZONE 3B (BULK ZONE 3B)', type: 'Residential (Villa)', consumption: c([34, 21, 29, 32, 34, 45, 49, 57, 39, 49, 40, 34, 30, 30, 42, 35.7, 29.6, 31.7, 58, 34, 31, 30, 39, 27, 25, null]) },
  { label: 'Z3-28 (Villa)', accountNumber: '4300101', level: 'L3', zone: 'Zone_03_(A)', parentMeter: 'ZONE 3A (BULK ZONE 3A)', type: 'Residential (Villa)', consumption: c([32, 2, 3, 21, 45, 44, 45, 46, 46, 59, 36, 41, 43.6, 32.8, 35.8, 40, 53.2, 43, 57, 37, 39, 22, 6, 58, 95, null]) },
  { label: 'Z3-22 (Villa)', accountNumber: '4300102', level: 'L3', zone: 'Zone_03_(B)', parentMeter: 'ZONE 3B (BULK ZONE 3B)', type: 'Residential (Villa)', consumption: c([24, 20, 17, 19, 22, 20, 36, 22, 15, 20, 15, 23, 21.2, 21.4, 56.1, 31.1, 31.5, 34.4, 34, 32, 74, 54, 25, 27, 22, null]) },
  { label: 'Z3-16 (Villa)', accountNumber: '4300103', level: 'L3', zone: 'Zone_03_(B)', parentMeter: 'ZONE 3B (BULK ZONE 3B)', type: 'Residential (Villa)', consumption: c([43, 14, 16, 10, 38, 6, 1, 21, 6, 2, 3, 5, 0.6, 27.9, 2.63, 5.1, 21.4, 64.3, 51, 22, 54, 12, 11, 19, 16, null]) },
  { label: 'Z3-5 (Villa)', accountNumber: '4300104', level: 'L3', zone: 'Zone_03_(B)', parentMeter: 'ZONE 3B (BULK ZONE 3B)', type: 'Residential (Villa)', consumption: c([52, 63, 47, 58, 42, 24, 68, 44, 40, 34, 26, 34, 39.5, 49.5, 45.8, 53.2, 50.5, 33.5, 74, 95, 102, 127, 174, 314, 163, null]) },
  { label: 'Z3-8 (Villa)', accountNumber: '4300105', level: 'L3', zone: 'Zone_03_(B)', parentMeter: 'ZONE 3B (BULK ZONE 3B)', type: 'Residential (Villa)', consumption: c([56, 32, 19, 15, 49, 40, 38, 25, 49, 68, 181, 290, 80.9, 91.8, 224, 350, 414, 347, 132, 54, 51, 53, 54, 62, 61, null]) },
  { label: 'Z3-74(1) (Building)', accountNumber: '4300106', level: 'L4', zone: 'Zone_03_(A)', parentMeter: 'D-74 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([7, 7, 0, 0, 0, 0, 0, 0, 0, 9, 6, 1, 1, 0, 0, 1.7, 0.61, 4.82, 3, 0, 0, 1, 3, 3, 3, null]) },
  { label: 'Z3-49(1) (Building)', accountNumber: '4300107', level: 'L4', zone: 'Zone_03_(A)', parentMeter: 'D-49 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.35, 3.31, 3.76, 8.5, 3.16, 4.69, 8, 4, 2, 4, 4, 7, 10, null]) },
  { label: 'Z3-49(2) (Building)', accountNumber: '4300108', level: 'L4', zone: 'Zone_03_(A)', parentMeter: 'D-49 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([11, 15, 7, 6, 9, 11, 11, 14, 12, 11, 11, 12, 14.1, 14.3, 13.6, 14.2, 13.2, 12.5, 4, 11, 13, 12, 12, 19, 17, null]) },
  { label: 'Z3-50(1) (Building)', accountNumber: '4300109', level: 'L4', zone: 'Zone_03_(A)', parentMeter: 'D-50 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([32, 32, 36, 26, 35, 45, 1, 43, 24, 53, 32, 34, 21.6, 22.3, 32.8, 5.55, 0.81, 0.84, 12, 5, 21, 38, 4, 0, 0, null]) },
  { label: 'Z3-45(1A) (Building)', accountNumber: '4300110', level: 'L4', zone: 'Zone_03_(A)', parentMeter: 'D-45 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([8, 0, 1, 0, 0, 0, 0, 1, 0, 1, 1, 1, 0.65, 0.26, 0, 0.79, 0.56, 2.4, 0, 3, 0, 2, 0, 2, 0, null]) },
  { label: 'Z3-51(1) (Building)', accountNumber: '4300111', level: 'L4', zone: 'Zone_03_(A)', parentMeter: 'D-51 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([12, 13, 13, 11, 18, 29, 1, 0, 0, 1, 0, 0, 0.11, 0, 0.09, 0, 0.51, 0.13, 0, 19, 21, 20, 19, 14, 19, null]) },
  { label: 'Z3-51(2) (Building)', accountNumber: '4300112', level: 'L4', zone: 'Zone_03_(A)', parentMeter: 'D-51 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([17, 21, 20, 17, 17, 19, 19, 24, 24, 39, 29, 29, 31.5, 26.8, 32.5, 29.2, 32, 29.4, 33, 36, 31, 40, 35, 34, 36, null]) },
  { label: 'Z3-45(2A) (Building)', accountNumber: '4300113', level: 'L4', zone: 'Zone_03_(A)', parentMeter: 'D-45 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([0, 8, 2, 6, 5, 0, 1, 0, 0, 5, 9, 2, 2.03, 6.25, 9.5, 11.1, 3.89, 0.24, 0, 0, 0, 4, 5, 4, 3, null]) },
  { label: 'Z3-050(2) (Building)', accountNumber: '4300114', level: 'L4', zone: 'Zone_03_(A)', parentMeter: 'D-50 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([2, 3, 4, 5, 2, 1, 0, 3, 0, 0, 2, 1, 0, 8.02, 0.3, 2.47, 0, 2.67, 0, 4, 0, 5, 4, 1, 0, null]) },
  { label: 'Z3-47(1) (Building)', accountNumber: '4300115', level: 'L4', zone: 'Zone_03_(A)', parentMeter: 'D-47 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([0, 0, 5, 0, 0, 0, 0, 1, 15, 13, 17, 9, 8.81, 9.46, 10.9, 15.1, 10, 5.47, 0, 5, 19, 20, 14, 13, 13, null]) },
  { label: 'Z3-52(1A) (Building)', accountNumber: '4300116', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-52 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([5, 6, 4, 4, 4, 5, 5, 6, 8, 14, 16, 17, 18.4, 13.9, 4.88, 7.8, 7.66, 7.02, 15, 11, 2, 4, 6, 6, 6, null]) },
  { label: 'Z3-48(1) (Building)', accountNumber: '4300117', level: 'L4', zone: 'Zone_03_(A)', parentMeter: 'D-48 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([0, 2, 0, 0, 0, 0, 1, 0, 0, 1, 28, 8, 2.89, 5.74, 3.74, 5.14, 14.2, 30.3, 19, 20, 8, 9, 5, 20, 19, null]) },
  { label: 'Z3-74(2) (Building)', accountNumber: '4300118', level: 'L4', zone: 'Zone_03_(A)', parentMeter: 'D-74 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([0, 0, 0, 0, 6, 18, 11, 0, 0, 1, 0, 0, 0.07, 0.14, 0, 0.13, 0, 0.31, 0, 0, 0, 0, 0, 0, 0, null]) },
  { label: 'Z3-62(2) (Building)', accountNumber: '4300119', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-62 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([0, 1, 0, 16, 10, 9, 7, 17, 10, 14, 5, 17, 7.02, 9.42, 8.83, 11.5, 13.7, 18.2, 28, 22, 27, 14, 14, 22, 18, null]) },
  { label: 'Z3-58(5) (Building)', accountNumber: '4300120', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-58 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([79, 43, 12, 31, 32, 32, 22, 29, 25, 36, 29, 29, 28.9, 21.2, 34.7, 29.5, 29.8, 23.4, 26, 26, 24, 23, 23, 20, 24, null]) },
  { label: 'Z3-51(3) (Building)', accountNumber: '4300121', level: 'L4', zone: 'Zone_03_(A)', parentMeter: 'D-51 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([7, 5, 6, 20, 24, 4, 6, 8, 9, 11, 14, 12, 12.7, 9.55, 10.5, 10.5, 13.8, 12.5, 14, 2, 5, 12, 10, 12, 19, null]) },
  { label: 'Z3-75(2) (Building)', accountNumber: '4300122', level: 'L4', zone: 'Zone_03_(A)', parentMeter: 'D-75 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([3, 2, 2, 1, 2, 5, 19, 7, 0, 0, 12, 5, 6.31, 6.63, 10.2, 7.63, 6.8, 8.33, 14, 37, 12, 14, 8, 3, 8, null]) },
  { label: 'Z3-48(2) (Building)', accountNumber: '4300123', level: 'L4', zone: 'Zone_03_(A)', parentMeter: 'D-48 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([0, 2, 2, 3, 5, 2, 8, 3, 4, 11, 2, 5, 2.63, 0.11, 3.59, 2.01, 0.4, 4.32, 0, 1, 0, 3, 0, 3, 1, null]) },
  { label: 'Z3-62(3) (Building)', accountNumber: '4300124', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-62 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0.56, 0, 0, 0.01, 0.02, 0.02, 0, 0, 0, 1, 0, 0, 0, null]) },
  { label: 'Z3-74(4) (Building)', accountNumber: '4300125', level: 'L4', zone: 'Zone_03_(A)', parentMeter: 'D-74 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([7, 17, 23, 27, 33, 29, 28, 24, 3, 0, 0, 0, 0, 2, 0, 0.01, 0, 0, 1, 11, 12, 12, 6, 8, 4, null]) },
  { label: 'D 52-Building Common Meter', accountNumber: '4300126', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-52 Building Bulk Meter', type: 'D_Building_Common', consumption: c([4, 3, 2, 2, 0, 1, 1, 1, 1, 2, 1, 1, 1.01, 1.03, 2.29, 3.84, 1.21, 1.8, 1, 1, 1, 2, 1, 1, 1, null]) },
  { label: 'Z3-51(4) (Building)', accountNumber: '4300127', level: 'L4', zone: 'Zone_03_(A)', parentMeter: 'D-51 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([20, 15, 13, 12, 9, 12, 11, 11, 9, 15, 9, 9, 11.3, 8.05, 12.3, 9.27, 10.7, 10.1, 24, 16, 14, 13, 11, 12, 12, null]) },
  { label: 'Z3-051(5) (Building)', accountNumber: '4300128', level: 'L4', zone: 'Zone_03_(A)', parentMeter: 'D-51 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([3, 0, 61, 0, 2, 4, 5, 8, 0, 0, 1, 1, 1.76, 4.9, 19.2, 6.21, 7.24, 9.11, 22, 13, 14, 18, 19, 20, 22, null]) },
  { label: 'Z3-62(4) (Building)', accountNumber: '4300129', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-62 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([12, 8, 28, 39, 28, 21, 39, 49, 33, 2, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, null]) },
  { label: 'Z3-58(3B) (Building)', accountNumber: '4300130', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-58 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([0, 0, 0, 0, 0, 3, 2, 6, 1, 9, 6, 6, 5.39, 6.57, 3.03, 28.5, 7.4, 10.3, 8, 13, 4, 6, 6, 10, 8, null]) },
  { label: 'Z3-48(4) (Building)', accountNumber: '4300131', level: 'L4', zone: 'Zone_03_(A)', parentMeter: 'D-48 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([13, 17, 14, 16, 2, 2, 7, 0, 0, 3, 4, 3, 5.11, 4.49, 5.68, 4.27, 1.98, 4.22, 6, 5, 4, 4, 5, 3, 5, null]) },
  { label: 'Z3-058(4B) (Building)', accountNumber: '4300132', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-58 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([20, 7, 6, 4, 4, 5, 3, 5, 7, 5, 7, 4, 8.36, 6.98, 5.66, 5.31, 5.06, 0.01, 0, 0, 0, 0, 0, 0, 0, null]) },
  { label: 'Z3-62(5) (Building)', accountNumber: '4300133', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-62 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.05, 0.01, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, null]) },
  { label: 'Z3-51(6) (Building)', accountNumber: '4300134', level: 'L4', zone: 'Zone_03_(A)', parentMeter: 'D-51 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([6, 0, 0, 9, 3, 4, 10, 4, 3, 9, 9, 18, 7.45, 1.73, 5.61, 5.92, 9.48, 8.98, 10, 5, 12, 8, 9, 9, 4, null]) },
  { label: 'D 45-Building Common Meter', accountNumber: '4300135', level: 'L4', zone: 'Zone_03_(A)', parentMeter: 'D-45 Building Bulk Meter', type: 'D_Building_Common', consumption: c([3, 3, 2, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0.24, 0.75, 0.76, 0.65, 0.86, 0.41, 1, 1, 12, 1, 1, 1, 1, null]) },
  { label: 'D 50-Building Common Meter', accountNumber: '4300136', level: 'L4', zone: 'Zone_03_(A)', parentMeter: 'D-50 Building Bulk Meter', type: 'D_Building_Common', consumption: c([3, 5, 1, 2, 0, 1, 1, 1, 0, 2, 1, 0, 0.95, 0.8, 0.56, 1, 0.52, 0.54, 1, 2, 2, 1, 2, 3, 1, null]) },
  { label: 'D 51-Building Common Meter', accountNumber: '4300137', level: 'L4', zone: 'Zone_03_(A)', parentMeter: 'D-51 Building Bulk Meter', type: 'D_Building_Common', consumption: c([4, 3, 2, 2, 1, 3, 1, 1, 1, 1, 2, 1, 0.63, 0.73, 0.58, 1.38, 1.74, 1.52, 1, 1, 1, 2, 2, 2, 2, null]) },
  { label: 'D 46-Building Common Meter', accountNumber: '4300138', level: 'L4', zone: 'Zone_03_(A)', parentMeter: 'D-46 Building Bulk Meter', type: 'D_Building_Common', consumption: c([3, 5, 2, 1, 51, 0, 1, 1, 0, 1, 0, 1, 0.43, 0.47, 0.58, 0.77, 1.47, 0.48, 1, 1, 2, 1, 1, 1, 1, null]) },
  { label: 'D 74-Building Common Meter', accountNumber: '4300139', level: 'L4', zone: 'Zone_03_(A)', parentMeter: 'D-74 Building Bulk Meter', type: 'D_Building_Common', consumption: c([3, 3, 2, 1, 2, 0, 1, 1, 0, 2, 1, 1, 0.55, 0.88, 0.94, 1.93, 1.08, 0.63, 1, 2, 2, 1, 1, 2, 1, null]) },
  { label: 'D 49-Building Common Meter', accountNumber: '4300140', level: 'L4', zone: 'Zone_03_(A)', parentMeter: 'D-49 Building Bulk Meter', type: 'D_Building_Common', consumption: c([3, 4, 1, 2, 1, 1, 1, 1, 0, 1, 1, 1, 0.54, 0.59, 1.72, 1.21, 0.6, 0.62, 1, 1, 2, 1, 1, 1, 1, null]) },
  { label: 'D 48-Building Common Meter', accountNumber: '4300141', level: 'L4', zone: 'Zone_03_(A)', parentMeter: 'D-48 Building Bulk Meter', type: 'D_Building_Common', consumption: c([3, 4, 1, 2, 1, 1, 1, 0, 0, 1, 0, 1, 0.3, 0.4, 0.59, 0.67, 0.44, 0.32, 1, 1, 1, 1, 1, 1, 0, null]) },
  { label: 'D 62-Building Common Meter', accountNumber: '4300142', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-62 Building Bulk Meter', type: 'D_Building_Common', consumption: c([4, 4, 2, 3, 1, 1, 2, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, null]) },
  { label: 'D 47-Building Common Meter', accountNumber: '4300143', level: 'L4', zone: 'Zone_03_(A)', parentMeter: 'D-47 Building Bulk Meter', type: 'D_Building_Common', consumption: c([4, 5, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0.31, 0.55, 0.34, 1.22, 0.79, 0.49, 1, 2, 1, 2, 1, 1, 1, null]) },
  { label: 'D 44-Building Common Meter', accountNumber: '4300144', level: 'L4', zone: 'Zone_03_(A)', parentMeter: 'D-44 Building Bulk Meter', type: 'D_Building_Common', consumption: c([3, 4, 2, 1, 1, 1, 1, 1, 0, 2, 1, 1, 0.8, 0.57, 0.65, 0.82, 0.89, 0.77, 1, 1, 1, 1, 1, 1, 1, null]) },
  { label: 'D 75-Building Common Meter', accountNumber: '4300145', level: 'L4', zone: 'Zone_03_(A)', parentMeter: 'D-75 Building Bulk Meter', type: 'D_Building_Common', consumption: c([4, 5, 2, 2, 2, 1, 2, 2, 2, 7, 6, 2, 2.5, 4.2, 3.29, 6.53, 9.08, 5.63, 7, 4, 4, 3, 3, 2, 4, null]) },
  { label: 'Z5-5', accountNumber: '4300146', level: 'L3', zone: 'Zone_05', parentMeter: 'ZONE 5 (Bulk Zone 5)', type: 'Residential (Villa)', consumption: c([1, 2, 0, 3, 1, 8, 3, 0, 2, 13, 4, 3, 2.62, 4.44, 3.5, 5.45, 38.7, 1.32, 60, 240, 54, 67, 55, 49, 44, null]) },
  { label: 'Z5-30', accountNumber: '4300147', level: 'L3', zone: 'Zone_05', parentMeter: 'ZONE 5 (Bulk Zone 5)', type: 'Residential (Villa)', consumption: c([0, 1, 3, 53, 10, 1, 0, 17, 17, 4, 6, 60, 65, 82.3, 75.3, 113, 203, 238, 212, 155, 83, 73, 110, 144, 120, null]) },
  { label: 'Z5-2', accountNumber: '4300148', level: 'L3', zone: 'Zone_05', parentMeter: 'ZONE 5 (Bulk Zone 5)', type: 'Residential (Villa)', consumption: c([2, 2, 0, 0, 3, 3, 1, 1, 0, 0, 0, 0, 0.05, 0, 0.04, 0.03, 0.42, 0.38, 0, 0, 0, 0, 0, 0, 0, null]) },
  { label: 'Z5-10', accountNumber: '4300149', level: 'L3', zone: 'Zone_05', parentMeter: 'ZONE 5 (Bulk Zone 5)', type: 'Residential (Villa)', consumption: c([0, 0, 0, 0, 0, 0, 0, 0, 6, 3, 0, 4, 36.5, 0, 0.02, 0, 0.06, 0.02, 0, 0, 34, 30, 29, 18, 21, null]) },
  { label: 'Z5-4', accountNumber: '4300150', level: 'L3', zone: 'Zone_05', parentMeter: 'ZONE 5 (Bulk Zone 5)', type: 'Residential (Villa)', consumption: c([54, 40, 98, 36, 30, 52, 110, 85, 32, 38, 86, 100, 78.3, 95.7, 46.6, 40.8, 29.4, 13.8, 49, 31, 34, 20, 10, 88, 45, null]) },
  { label: 'Z5-6', accountNumber: '4300151', level: 'L3', zone: 'Zone_05', parentMeter: 'ZONE 5 (Bulk Zone 5)', type: 'Residential (Villa)', consumption: c([1, 0, 1, 0, 0, 0, 0, 0, 5, 12, 5, 2, 6.42, 2.96, 9.91, 5.28, 36.9, 0.21, 0, 0, 0, 0, 0, 0, 0, null]) },
  { label: 'Z5 020', accountNumber: '4300152', level: 'L3', zone: 'Zone_05', parentMeter: 'ZONE 5 (Bulk Zone 5)', type: 'Residential (Villa)', consumption: c([26, 13, 13, 20, 18, 34, 51, 3, 1, 0, 28, 24, 24.3, 28.1, 151, 165, 202, 214, 196, 161, 131, 102, 97, 80, 76, null]) },
  { label: 'Z5-23', accountNumber: '4300153', level: 'L3', zone: 'Zone_05', parentMeter: 'ZONE 5 (Bulk Zone 5)', type: 'Residential (Villa)', consumption: c([0, 0, 0, 5, 6, 56, 1, 0, 4, 11, 3, 0, 0, 9.15, 32.2, 0.12, 0.28, 0.54, 0, 104, 3, 0, 2, 14, 8, null]) },
  { label: 'Z5-15', accountNumber: '4300154', level: 'L3', zone: 'Zone_05', parentMeter: 'ZONE 5 (Bulk Zone 5)', type: 'Residential (Villa)', consumption: c([39, 33, 33, 27, 41, 60, 47, 40, 36, 51, 40, 37, 34, 19, 17.8, 22.4, 29.7, 17.8, 20, 21, 18, 18, 15, 13, 16, null]) },
  { label: 'Z5-9', accountNumber: '4300155', level: 'L3', zone: 'Zone_05', parentMeter: 'ZONE 5 (Bulk Zone 5)', type: 'Residential (Villa)', consumption: c([72, 97, 84, 96, 158, 82, 70, 74, 95, 134, 94, 56, 37.1, 44.7, 45.8, 55.7, 76.6, 66.5, 56, 54, 45, 60, 63, 48, 66, null]) },
  { label: 'Z5-26', accountNumber: '4300156', level: 'L3', zone: 'Zone_05', parentMeter: 'ZONE 5 (Bulk Zone 5)', type: 'Residential (Villa)', consumption: c([0, 0, 0, 0, 0, 0, 0, 2, 0, 12, 18, 25, 60.3, 39.4, 18, 68.6, 107, 81.9, 57, 28, 29, 11, 19, 22, 11, null]) },
  { label: 'Z5-25', accountNumber: '4300157', level: 'L3', zone: 'Zone_05', parentMeter: 'ZONE 5 (Bulk Zone 5)', type: 'Residential (Villa)', consumption: c([0, 0, 0, 0, 0, 0, 0, 0, 24, 20, 37, 18, 37.4, 22, 11.6, 71.7, 104, 82.9, 57, 31, 13, 45, 33, 36, 34, null]) },
  { label: 'Z5-31', accountNumber: '4300158', level: 'L3', zone: 'Zone_05', parentMeter: 'ZONE 5 (Bulk Zone 5)', type: 'Residential (Villa)', consumption: c([7, 20, 0, 0, 0, 0, 189, 68, 61, 0, 0, 14, 31.5, 22.8, 16.3, 15.7, 3.84, 1.49, 0, 0, 41, 13, 9, 12, 28, null]) },
  { label: 'Z5-33', accountNumber: '4300159', level: 'L3', zone: 'Zone_05', parentMeter: 'ZONE 5 (Bulk Zone 5)', type: 'Residential (Villa)', consumption: c([0, 7, 3, 3, 0, 0, 0, 1, 18, 3, 0, 0, 1.89, 0.09, 23.7, 0.01, 18.5, 11.9, 0, 152, 375, 3, 3, 9, 1, null]) },
  { label: 'Z5-29', accountNumber: '4300160', level: 'L3', zone: 'Zone_05', parentMeter: 'ZONE 5 (Bulk Zone 5)', type: 'Residential (Villa)', consumption: c([0, 0, 0, 0, 0, 0, 0, 1, 0, 68, 15, 21, 47.6, 64, 23.1, 19.4, 28, 23.9, 19, 18, 7, 4, 5, 25, 2, null]) },
  { label: 'Z5-28', accountNumber: '4300161', level: 'L3', zone: 'Zone_05', parentMeter: 'ZONE 5 (Bulk Zone 5)', type: 'Residential (Villa)', consumption: c([0, 0, 0, 0, 0, 0, 0, 40, 0, 90, 16, 11, 49.6, 21.2, 8.79, 8.18, 14, 18.7, 16, 6, 8, 69, 54, 47, 55, null]) },
  { label: 'Z5-32', accountNumber: '4300162', level: 'L3', zone: 'Zone_05', parentMeter: 'ZONE 5 (Bulk Zone 5)', type: 'Residential (Villa)', consumption: c([0, 2, 2, 3, 0, 0, 0, 1, 47, 1, 3, 1, 59.7, 111, 80.4, 70.5, 67.6, 50.9, 25, 43, 36, 49, 42, 50, 18, null]) },
  { label: 'Z5-22', accountNumber: '4300163', level: 'L3', zone: 'Zone_05', parentMeter: 'ZONE 5 (Bulk Zone 5)', type: 'Residential (Villa)', consumption: c([89, 32, 38, 10, 36, 17, 21, 39, 0, 18, 25, 28, 14.3, 34.2, 192, 244, 201, 186, 192, 175, 80, 108, 78, 15, 35, null]) },
  { label: 'Z5-7', accountNumber: '4300164', level: 'L3', zone: 'Zone_05', parentMeter: 'ZONE 5 (Bulk Zone 5)', type: 'Residential (Villa)', consumption: c([2, 2, 1, 2, 2, 6, 2, 0, 2, 0, 0, 0, 0.22, 9.89, 29.4, 7.46, 5.25, 1.64, 0, 0, 0, 4, 27, 8, 0, null]) },
  { label: 'Z5-27', accountNumber: '4300165', level: 'L3', zone: 'Zone_05', parentMeter: 'ZONE 5 (Bulk Zone 5)', type: 'Residential (Villa)', consumption: c([0, 0, 0, 0, 0, 0, 0, 0, 12, 9, 9, 11, 35.2, 12.9, 19.2, 11.8, 15.2, 9.17, 9, 10, 3, 11, 9, 11, 31, null]) },
  { label: 'Z5-12', accountNumber: '4300166', level: 'L3', zone: 'Zone_05', parentMeter: 'ZONE 5 (Bulk Zone 5)', type: 'Residential (Villa)', consumption: c([59, 78, 49, 39, 89, 105, 90, 90, 84, 112, 89, 71, 43.3, 42.2, 45.3, 66.9, 80.6, 97, 84, 58, 64, 93, 53, 49, 56, null]) },
  { label: 'Z5 024', accountNumber: '4300167', level: 'L3', zone: 'Zone_05', parentMeter: 'ZONE 5 (Bulk Zone 5)', type: 'Residential (Villa)', consumption: c([19, 2, 0, 30, 1, 1, 1, 0, 0, 3, 4, 39, 65.6, 0.62, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, null]) },
  { label: 'Z5 016', accountNumber: '4300168', level: 'L3', zone: 'Zone_05', parentMeter: 'ZONE 5 (Bulk Zone 5)', type: 'Residential (Villa)', consumption: c([306, 64, 6, 10, 34, 118, 363, 347, 16, 85, 67, 57, 26.9, 25.2, 42.2, 50.9, 53.1, 47.6, 71, 50, 53, 49, 52, 56, 64, null]) },
  { label: 'Z5-21', accountNumber: '4300169', level: 'L3', zone: 'Zone_05', parentMeter: 'ZONE 5 (Bulk Zone 5)', type: 'Residential (Villa)', consumption: c([2, 0, 0, 1, 1, 0, 3, 1, 0, 5, 13, 23, 24.6, 20.1, 35.9, 58.2, 56.6, 42.7, 38, 22, 97, 25, 89, 31, 11, null]) },
  { label: 'Z5-3', accountNumber: '4300170', level: 'L3', zone: 'Zone_05', parentMeter: 'ZONE 5 (Bulk Zone 5)', type: 'Residential (Villa)', consumption: c([1, 1, 0, 0, 1, 5, 24, 28, 68, 116, 205, 141, 147, 79.6, 74.9, 99.9, 70.3, 81.9, 95, 100, 142, 120, 114, 105, 109, null]) },
  { label: 'Z5 019', accountNumber: '4300171', level: 'L3', zone: 'Zone_05', parentMeter: 'ZONE 5 (Bulk Zone 5)', type: 'Residential (Villa)', consumption: c([4, 9, 6, 8, 9, 14, 8, 9, 8, 12, 6, 7, 5.01, 5.55, 7.19, 1.52, 57.2, 0.01, 31, 6, 4, 11, 7, 5, 5, null]) },
  { label: 'Z5-1', accountNumber: '4300172', level: 'L3', zone: 'Zone_05', parentMeter: 'ZONE 5 (Bulk Zone 5)', type: 'Residential (Villa)', consumption: c([0, 3, 8, 7, 43, 0, 1, 6, 88, 8, 5, 5, 5.14, 4.5, 3.75, 5.22, 47.3, 5.32, 33, 12, 7, 8, 9, 10, 4, null]) },
  { label: 'Z5-11', accountNumber: '4300173', level: 'L3', zone: 'Zone_05', parentMeter: 'ZONE 5 (Bulk Zone 5)', type: 'Residential (Villa)', consumption: c([15, 6, 10, 24, 13, 15, 16, 34, 50, 65, 71, 68, 30.1, 42.8, 5.04, 2.75, 9.05, 8.95, 17, 19, 66, 27, 22, 0, 2, null]) },
  { label: 'Z5-18', accountNumber: '4300174', level: 'L3', zone: 'Zone_05', parentMeter: 'ZONE 5 (Bulk Zone 5)', type: 'Residential (Villa)', consumption: c([5, 13, 11, 10, 12, 26, 10, 15, 35, 23, 23, 18, 7.89, 11.8, 11.3, 37.5, 30.1, 30, 28, 17, 1, 38, 16, 9, 9, null]) },
  { label: 'Z5-8', accountNumber: '4300175', level: 'L3', zone: 'Zone_05', parentMeter: 'ZONE 5 (Bulk Zone 5)', type: 'Residential (Villa)', consumption: c([0, 0, 0, 0, 0, 1, 1, 3, 1, 3, 0, 5, 5.96, 9.09, 14.4, 67.1, 11.9, 1.07, 0, 0, 0, 11, 53, 43, 0, null]) },
  { label: 'D-75 Building Bulk Meter', accountNumber: '4300176', level: 'L3', zone: 'Zone_03_(A)', parentMeter: 'ZONE 3A (BULK ZONE 3A)', type: 'D_Building_Bulk', consumption: c([64, 56, 47, 36, 48, 55, 59, 43, 60, 60, 84, 75, 62.5, 57.8, 68.4, 71.9, 59.2, 62.2, 67, 101, 68, 65, 64, 57, 74, null]) },
  { label: 'D-74 Building Bulk Meter', accountNumber: '4300177', level: 'L3', zone: 'Zone_03_(A)', parentMeter: 'ZONE 3A (BULK ZONE 3A)', type: 'D_Building_Bulk', consumption: c([114, 130, 59, 53, 86, 68, 227, 58, 37, 47, 36, 33, 40.3, 31.6, 40.1, 54.4, 51.2, 62.6, 101, 106, 136, 116, 66, 59, 56, null]) },
  { label: 'D-44 Building Bulk Meter', accountNumber: '4300178', level: 'L3', zone: 'Zone_03_(A)', parentMeter: 'ZONE 3A (BULK ZONE 3A)', type: 'D_Building_Bulk', consumption: c([232, 193, 201, 175, 83, 190, 232, 185, 264, 316, 257, 193, 178, 211, 82.9, 85.5, 61.6, 49.1, 52, 59, 64, 68, 66, 66, 114, null]) },
  { label: 'D-45 Building Bulk Meter', accountNumber: '4300179', level: 'L3', zone: 'Zone_03_(A)', parentMeter: 'ZONE 3A (BULK ZONE 3A)', type: 'D_Building_Bulk', consumption: c([20, 28, 10, 46, 23, 26, 25, 19, 21, 37, 31, 21, 19.5, 29.8, 47.2, 56.3, 54.8, 9.55, 12, 11, 36, 29, 39, 36, 27, null]) },
  { label: 'D-46 Building Bulk Meter', accountNumber: '4300180', level: 'L3', zone: 'Zone_03_(A)', parentMeter: 'ZONE 3A (BULK ZONE 3A)', type: 'D_Building_Bulk', consumption: c([47, 56, 35, 44, 54, 53, 53, 55, 46, 64, 38, 60, 59.9, 45.4, 30.6, 68.2, 69.4, 54.9, 65, 85, 121, 134, 68, 60, 50, null]) },
  { label: 'D-47 Building Bulk Meter', accountNumber: '4300181', level: 'L3', zone: 'Zone_03_(A)', parentMeter: 'ZONE 3A (BULK ZONE 3A)', type: 'D_Building_Bulk', consumption: c([68, 121, 93, 60, 56, 46, 56, 46, 86, 79, 71, 79, 102, 63.7, 61.9, 69.7, 56.8, 83.2, 121, 62, 76, 96, 83, 65, 71, null]) },
  { label: 'D-48 Building Bulk Meter', accountNumber: '4300182', level: 'L3', zone: 'Zone_03_(A)', parentMeter: 'ZONE 3A (BULK ZONE 3A)', type: 'D_Building_Bulk', consumption: c([11, 33, 21, 12, 15, 13, 28, 21, 15, 76, 70, 43, 16.4, 16.2, 19.8, 17.8, 25.4, 47, 28, 37, 24, 39, 30, 33, 35, null]) },
  { label: 'D-49 Building Bulk Meter', accountNumber: '4300183', level: 'L3', zone: 'Zone_03_(A)', parentMeter: 'ZONE 3A (BULK ZONE 3A)', type: 'D_Building_Bulk', consumption: c([81, 66, 48, 64, 93, 173, 23, 42, 42, 0, 42, 49, 58, 63, 59, 0, 108, 42, 59, 63, 77, 141, 0, 128, 78, null]) },
  { label: 'D-50 Building Bulk Meter', accountNumber: '4300184', level: 'L3', zone: 'Zone_03_(A)', parentMeter: 'ZONE 3A (BULK ZONE 3A)', type: 'D_Building_Bulk', consumption: c([69, 76, 82, 68, 82, 92, 53, 104, 64, 117, 78, 84, 64.6, 72.8, 90.8, 49.3, 34.1, 39.5, 60, 44, 6, 75, 41, 41, 57, null]) },
  { label: 'D-51 Building Bulk Meter', accountNumber: '4300185', level: 'L3', zone: 'Zone_03_(A)', parentMeter: 'ZONE 3A (BULK ZONE 3A)', type: 'D_Building_Bulk', consumption: c([76, 68, 131, 87, 87, 98, 63, 65, 52, 76, 59, 79, 90.9, 96.4, 165, 166, 111, 101, 149, 154, 175, 202, 107, 96, 129, null]) },
  { label: 'D-52 Building Bulk Meter', accountNumber: '4300186', level: 'L3', zone: 'Zone_03_(B)', parentMeter: 'ZONE 3B (BULK ZONE 3B)', type: 'D_Building_Bulk', consumption: c([52, 47, 41, 45, 45, 61, 316, 83, 47, 47, 43, 39, 39.6, 33.8, 27.2, 36.6, 47.8, 46.4, 52, 47, 26, 104, 41, 36, 37, null]) },
  { label: 'D-62 Building Bulk Meter', accountNumber: '4300187', level: 'L3', zone: 'Zone_03_(B)', parentMeter: 'ZONE 3B (BULK ZONE 3B)', type: 'D_Building_Bulk', consumption: c([29, 30, 45, 26, 42, 26, 42, 64, 41, 24, 9, 21, 49.5, 28.9, 42.3, 34.4, 22.4, 26.7, 46, 33, 37, 38, 96, 87, 82, null]) },
  { label: 'Z8-1', accountNumber: '4300188', level: 'L3', zone: 'Zone_08', parentMeter: 'BULK ZONE 8', type: 'Residential (Villa)', consumption: c([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.79, 1.68, 3, 16.2, 6.52, 0.2, 2, 0, 0, 1, 1, 0, 0, null]) },
  { label: 'Z8-2', accountNumber: '4300189', level: 'L3', zone: 'Zone_08', parentMeter: 'BULK ZONE 8', type: 'Residential (Villa)', consumption: c([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.01, 0, 0, 0.04, 0.03, 0, 0, 0, 0, 0, 0, 0, null]) },
  { label: 'Z8-3', accountNumber: '4300190', level: 'L3', zone: 'Zone_08', parentMeter: 'BULK ZONE 8', type: 'Residential (Villa)', consumption: c([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.01, 0, 0.03, 0.03, 0, 0, 27, 3, 1, 1, 1, null]) },
  { label: 'Z8-4', accountNumber: '4300191', level: 'L3', zone: 'Zone_08', parentMeter: 'BULK ZONE 8', type: 'Residential (Villa)', consumption: c([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, null]) },
  { label: 'Z8-6', accountNumber: '4300192', level: 'L3', zone: 'Zone_08', parentMeter: 'BULK ZONE 8', type: 'Residential (Villa)', consumption: c([0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0.34, 0.22, 0.01, 0.09, 0.39, 0.37, 0, 0, 0, 0, 0, 0, 0, null]) },
  { label: 'Z8-7', accountNumber: '4300193', level: 'L3', zone: 'Zone_08', parentMeter: 'BULK ZONE 8', type: 'Residential (Villa)', consumption: c([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, null]) },
  { label: 'Z8-8', accountNumber: '4300194', level: 'L3', zone: 'Zone_08', parentMeter: 'BULK ZONE 8', type: 'Residential (Villa)', consumption: c([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, null]) },
  { label: 'Z8-10', accountNumber: '4300195', level: 'L3', zone: 'Zone_08', parentMeter: 'BULK ZONE 8', type: 'Residential (Villa)', consumption: c([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, null]) },
  { label: 'Z8-12', accountNumber: '4300196', level: 'L3', zone: 'Zone_08', parentMeter: 'BULK ZONE 8', type: 'Residential (Villa)', consumption: c([109, 148, 169, 235, 180, 235, 237, 442, 661, 417, 223, 287, 235, 185, 258, 266, 295, 388, 464, 550, 320, 233, 199, 134, 110, null]) },
  { label: 'Z8-14', accountNumber: '4300197', level: 'L3', zone: 'Zone_08', parentMeter: 'BULK ZONE 8', type: 'Residential (Villa)', consumption: c([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, null]) },
  { label: 'Z8-15', accountNumber: '4300198', level: 'L3', zone: 'Zone_08', parentMeter: 'BULK ZONE 8', type: 'Residential (Villa)', consumption: c([227, 74, 90, 145, 179, 100, 136, 152, 144, 87, 100, 90, 97.9, 57.9, 73.3, 125, 112, 121, 123, 126, 109, 107, 129, 126, 92, null]) },
  { label: 'Z8-16', accountNumber: '4300199', level: 'L3', zone: 'Zone_08', parentMeter: 'BULK ZONE 8', type: 'Residential (Villa)', consumption: c([180, 165, 52, 147, 0, 62, 113, 86, 91, 112, 103, 98, 65.7, 67.6, 59, 97.9, 95.3, 82, 129, 252, 99, 98, 78, 94, 72, null]) },
  { label: 'Z8-17', accountNumber: '4300200', level: 'L3', zone: 'Zone_08', parentMeter: 'BULK ZONE 8', type: 'Residential (Villa)', consumption: c([198, 135, 213, 190, 196, 138, 94, 220, 0, 191, 154, 155, 161, 152, 187, 205, 238, 211, 191, 200, 189, 206, 200, 170, 156, null]) },
  { label: 'D 53-Building Common Meter', accountNumber: '4300201', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-53 Building Bulk Meter', type: 'D_Building_Common', consumption: c([5, 2, 2, 1, 0, 0, 1, 1, 1, 2, 0, 1, 0.24, 0.46, 6.86, 2.8, 1.96, 0.91, 1, 1, 1, 1, 1, 0, 0, null]) },
  { label: 'D 54-Building Common Meter', accountNumber: '4300202', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-54 Building Bulk Meter', type: 'D_Building_Common', consumption: c([5, 2, 4, 2, 0, 1, 2, 1, 0, 2, 1, 1, 0.39, 0.28, 1.22, 3.55, 1.08, 1.02, 1, 0, 1, 0, 1, 0, 0, null]) },
  { label: 'D 55-Building Common Meter', accountNumber: '4300203', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-55 Building Bulk Meter', type: 'D_Building_Common', consumption: c([7, 3, 1, 2, 1, 0, 2, 1, 1, 3, 2, 2, 1.4, 1.1, 2.04, 2.69, 1.67, 0.3, 1, 1, 4, 13, 0, 0, 0, null]) },
  { label: 'D 56-Building Common Meter', accountNumber: '4300204', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-56 Building Bulk Meter', type: 'D_Building_Common', consumption: c([4, 3, 1, 2, 0, 1, 2, 2, 2, 2, 1, 2, 1.27, 2.26, 7.76, 3.03, 3.72, 2.02, 2, 2, 2, 2, 2, 2, 2, null]) },
  { label: 'D 57-Building Common Meter', accountNumber: '4300205', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-57 Building Bulk Meter', type: 'D_Building_Common', consumption: c([4, 2, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1.51, 1.35, 3.98, 7.22, 2.57, 1.93, 3, 2, 2, 1, 1, 1, 1, null]) },
  { label: 'D 58-Building Common Meter', accountNumber: '4300206', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-58 Building Bulk Meter', type: 'D_Building_Common', consumption: c([4, 3, 1, 1, 1, 0, 1, 1, 0, 2, 1, 0, 0.32, 0.69, 0.3, 2.31, 0.32, 0.55, 1, 1, 1, 0, 1, 0, 0, null]) },
  { label: 'D 59-Building Common Meter', accountNumber: '4300207', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-59 Building Bulk Meter', type: 'D_Building_Common', consumption: c([4, 2, 1, 2, 0, 0, 1, 1, 0, 1, 0, 1, 0.45, 0.61, 0.45, 1.07, 0.96, 0.39, 1, 1, 1, 0, 0, 0, 0, null]) },
  { label: 'D 60-Building Common Meter', accountNumber: '4300208', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-60 Building Bulk Meter', type: 'D_Building_Common', consumption: c([4, 3, 2, 1, 0, 1, 0, 1, 0, 1, 1, 0, 0.72, 0.51, 0.29, 1.07, 1.99, 0.38, 1, 1, 1, 1, 0, 0, 0, null]) },
  { label: 'D 61-Building Common Meter', accountNumber: '4300209', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-61 Building Bulk Meter', type: 'D_Building_Common', consumption: c([0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0.43, 0.49, 0.44, 2.56, 0.35, 0.57, 1, 2, 1, 1, 1, 1, 1, null]) },
  { label: 'Z3-53(1A) (Building)', accountNumber: '4300210', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-53 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([3, 10, 5, 9, 9, 7, 5, 8, 9, 13, 6, 7, 7.85, 7.74, 12.1, 11.3, 3.93, 17.3, 12, 12, 12, 9, 8, 19, 16, null]) },
  { label: 'Z3-53(1B) (Building)', accountNumber: '4300211', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-53 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([11, 10, 4, 4, 1, 9, 5, 5, 3, 9, 12, 12, 5.94, 7.48, 6.56, 8, 9.37, 7.76, 7, 8, 4, 7, 6, 8, 8, null]) },
  { label: 'Z3-53(2A) (Building)', accountNumber: '4300212', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-53 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([1, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, null]) },
  { label: 'Z3-53(2B) (Building)', accountNumber: '4300213', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-53 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, null]) },
  { label: 'Z3-53(3A) (Building)', accountNumber: '4300214', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-53 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([8, 8, 4, 6, 2, 8, 4, 0, 0, 0, 0, 0, 0, 0.67, 0.21, 6.04, 0.07, 0.02, 0, 7, 0, 2, 3, 3, 4, null]) },
  { label: 'Z3-53(3B) (Building)', accountNumber: '4300215', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-53 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 4, 1.11, 2.81, 1.04, 6.08, 5.51, 0.83, 0, 0, 1, 0, 3, 0, 3, null]) },
  { label: 'Z3-53(4A) (Building)', accountNumber: '4300216', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-53 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([6, 6, 3, 1, 0, 7, 0, 2, 5, 7, 5, 3, 0.64, 4.63, 0.25, 4.7, 0.01, 0, 4, 1, 3, 3, 4, 2, 11, null]) },
  { label: 'Z3-53(5) (Building)', accountNumber: '4300217', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-53 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([0, 0, 2, 0, 0, 0, 0, 0, 0, 3, 2, 2, 1.73, 1.45, 1.18, 0.27, 0.41, 0.25, 0, 0, 0, 15, 4, 4, 3, null]) },
  { label: 'Z3-54(1A) (Building)', accountNumber: '4300218', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-54 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([12, 6, 10, 11, 16, 12, 7, 5, 7, 10, 9, 14, 10.9, 11.8, 8.65, 13.1, 5.01, 14.7, 30, 13, 16, 13, 12, 13, 14, null]) },
  { label: 'Z3-54(1B) (Building)', accountNumber: '4300219', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-54 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([0, 0, 1, 0, 2, 1, 1, 0, 1, 0, 2, 1, 0.92, 0.41, 5.5, 5.5, 3.11, 0.01, 5, 6, 3, 3, 2, 2, 2, null]) },
  { label: 'Z3-54(2A) (Building)', accountNumber: '4300220', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-54 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([2, 4, 3, 0, 0, 3, 16, 2, 1, 2, 4, 3, 2.49, 2.95, 3.43, 0.91, 0, 0.16, 1, 0, 0, 0, 0, 0, 1, null]) },
  { label: 'Z3-54(2B) (Building)', accountNumber: '4300221', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-54 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([8, 8, 8, 5, 10, 9, 7, 2, 4, 15, 18, 19, 19.2, 8.24, 19.9, 14.8, 10.4, 5.21, 12, 8, 9, 2, 7, 5, 7, null]) },
  { label: 'Z3-54(3A) (Building)', accountNumber: '4300222', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-54 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([8, 9, 7, 7, 9, 6, 8, 8, 7, 10, 10, 6, 7.43, 6.86, 5.35, 7.23, 4.95, 0.22, 0, 0, 0, 0, 0, 0, 0, null]) },
  { label: 'Z3-54(3B) (Building)', accountNumber: '4300223', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-54 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([0, 5, 6, 9, 1, 0, 0, 0, 0, 3, 11, 1, 1.55, 0.53, 0.05, 0.9, 0.02, 0.06, 0, 0, 0, 0, 6, 0, 0, null]) },
  { label: 'Z3-54(4A) (Building)', accountNumber: '4300224', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-54 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([0, 3, 0, 0, 0, 0, 4, 3, 0, 0, 4, 2, 0.42, 0, 4.66, 8.85, 0, 11.6, 0, 0, 0, 0, 21, 6, 8, null]) },
  { label: 'Z3-54(4B) (Building)', accountNumber: '4300225', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-54 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([0, 0, 1, 2, 1, 3, 0, 0, 0, 0, 1, 0, 0, 0, 1.65, 1.79, 0, 0, 0, 0, 0, 0, 0, 0, 0, null]) },
  { label: 'Z3-54(5) (Building)', accountNumber: '4300226', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-54 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([18, 20, 18, 21, 21, 21, 18, 17, 19, 21, 16, 16, 15.6, 15.5, 14.9, 17.3, 19.1, 15.7, 17, 15, 15, 17, 13, 12, 14, null]) },
  { label: 'Z3-54(6) (Building)', accountNumber: '4300227', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-54 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([1, 1, 2, 7, 2, 1, 2, 0, 0, 0, 20, 3, 4.35, 3.88, 4.15, 22.9, 8.63, 8.7, 12, 14, 10, 11, 8, 15, 5, null]) },
  { label: 'Z3-55(1A) (Building)', accountNumber: '4300228', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-55 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([0, 0, 4, 1, 1, 0, 1, 4, 0, 0, 0, 0, 0, 0, 0.01, 0, 0.47, 0, 0, 0, 0, 0, 0, 0, 0, null]) },
  { label: 'Z3-55(2A) (Building)', accountNumber: '4300229', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-55 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([26, 23, 19, 23, 25, 25, 27, 24, 16, 24, 21, 24, 23.2, 23.4, 5.54, 15.4, 25.2, 25.2, 25, 27, 25, 27, 29, 31, 19, null]) },
  { label: 'Z3-55(2B) (Building)', accountNumber: '4300230', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-55 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([2, 4, 4, 7, 5, 2, 6, 6, 2, 3, 5, 4, 3.37, 3.32, 5.04, 5.18, 4.26, 0.14, 4, 1, 0, 2, 3, 4, 3, null]) },
  { label: 'Z3-55(3A) (Building)', accountNumber: '4300231', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-55 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([1, 2, 1, 0, 2, 2, 9, 18, 11, 10, 12, 11, 16.3, 8.02, 4.95, 9.55, 12.3, 9.17, 24, 26, 6, 9, 9, 13, 29, null]) },
  { label: 'Z3-55(3B) (Building)', accountNumber: '4300232', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-55 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([1, 5, 6, 6, 3, 8, 2, 6, 8, 8, 6, 3, 7.07, 2.35, 5.33, 7.13, 4.91, 7.23, 6, 8, 5, 7, 7, 7, 8, null]) },
  { label: 'Z3-55(4A) (Building)', accountNumber: '4300233', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-55 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([8, 7, 8, 10, 6, 1, 4, 11, 7, 10, 8, 5, 3.18, 6.32, 8.4, 8.83, 5.91, 11.9, 11, 11, 6, 6, 1, 0, 0, null]) },
  { label: 'Z3-55(4B) (Building)', accountNumber: '4300234', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-55 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([9, 8, 10, 8, 7, 1, 1, 4, 2, 5, 4, 5, 5.12, 4.17, 5.68, 5.65, 2.88, 4.05, 4, 6, 1, 4, 6, 6, 6, null]) },
  { label: 'Z3-55(5) (Building)', accountNumber: '4300235', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-55 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0.02, 0.22, 1, 0.45, 0.93, 0.24, 0, 0, 1, 12, 14, 0, 0, null]) },
  { label: 'Z3-55(6) (Building)', accountNumber: '4300236', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-55 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([46, 41, 33, 50, 66, 72, 16, 2, 14, 41, 20, 4, 6.98, 5.76, 72, 125, 31.4, 0.37, 0, 0, 2, 9, 3, 13, 5, null]) },
  { label: 'Z3-56(1A) (Building)', accountNumber: '4300237', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-56 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([5, 8, 3, 4, 4, 3, 2, 1, 1, 4, 3, 174, 46.6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, null]) },
  { label: 'Z3-56(1B) (Building)', accountNumber: '4300238', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-56 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0.64, 0.3, 0, 0.27, 0.68, 0, 1, 0, 1, 1, 1, 1, 1, null]) },
  { label: 'Z3-56(2A) (Building)', accountNumber: '4300239', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-56 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([1, 0, 1, 64, 31, 0, 0, 0, 0, 0, 2, 2, 2.78, 6.39, 0.47, 3.26, 5.97, 0.83, 0, 0, 5, 5, 4, 3, 2, null]) },
  { label: 'Z3-56(2B) (Building)', accountNumber: '4300240', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-56 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([5, 3, 3, 9, 2, 1, 0, 0, 0, 2, 5, 9, 4.48, 1.31, 7.4, 11.9, 2.74, 0.04, 0, 0, 0, 0, 8, 8, 5, null]) },
  { label: 'Z3-56(3A) (Building)', accountNumber: '4300241', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-56 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.01, 0, 0.01, 9.01, 13, 15, 11, 10, 8, 8, 7, null]) },
  { label: 'Z3-56(3B) (Building)', accountNumber: '4300242', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-56 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([1, 10, 10, 12, 0, 3, 0, 0, 0, 0, 0, 0, 0, 1.01, 0, 0, 0, 0.11, 0, 0, 0, 0, 5, 4, 2, null]) },
  { label: 'Z3-56(4A) (Building)', accountNumber: '4300243', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-56 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([0, 1, 5, 0, 0, 13, 18, 16, 0, 0, 0, 0, 0, 0, 3.96, 3.54, 1.85, 0.95, 0, 0, 1, 0, 0, 9, 3, null]) },
  { label: 'Z3-56(4B) (Building)', accountNumber: '4300244', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-56 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([0, 0, 0, 0, 0, 2, 4, 8, 1, 2, 3, 2, 7, 0, 0.8, 3.4, 3.6, 3.83, 9, 10, 7, 7, 10, 8, 9, null]) },
  { label: 'Z3-56(5) (Building)', accountNumber: '4300245', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-56 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([0, 7, 4, 7, 0, 2, 1, 1, 0, 5, 0, 1, 1.69, 1.87, 0, 1.25, 0, 0.07, 4, 1, 2, 0, 0, 0, 13, null]) },
  { label: 'Z3-56(6) (Building)', accountNumber: '4300246', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-56 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([0, 0, 3, 5, 1, 7, 4, 24, 17, 13, 6, 10, 13.9, 3.42, 17.7, 1.96, 0.13, 0, 0, 0, 0, 0, 0, 0, 0, null]) },
  { label: 'Z3-57(1A) (Building)', accountNumber: '4300247', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-57 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([6, 3, 3, 2, 6, 0, 2, 4, 4, 5, 2, 7, 2.15, 7.78, 0.08, 0.06, 1.78, 5.47, 2, 0, 0, 0, 0, 1, 1, null]) },
  { label: 'Z3-57(1B) (Building)', accountNumber: '4300248', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-57 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([1, 1, 0, 4, 0, 1, 10, 0, 0, 0, 0, 3, 3.49, 0.23, 0, 1.08, 0.05, 1.2, 0, 1, 0, 0, 3, 2, 4, null]) },
  { label: 'Z3-57(2A) (Building)', accountNumber: '4300249', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-57 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([5, 4, 4, 4, 5, 4, 3, 6, 5, 7, 5, 4, 3.8, 5.54, 4.77, 3.77, 5.06, 2.77, 3, 5, 5, 5, 7, 5, 12, null]) },
  { label: 'Z3-57(2B) (Building)', accountNumber: '4300250', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-57 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([5, 2, 0, 3, 0, 0, 0, 0, 0, 1, 2, 3, 0.92, 1.7, 4.85, 8.09, 11.2, 7.28, 7, 6, 9, 10, 8, 9, 9, null]) },
  { label: 'Z3-57(3A) (Building)', accountNumber: '4300251', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-57 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([7, 6, 7, 7, 24, 14, 5, 6, 5, 5, 5, 5, 5, 4.1, 5.83, 4.97, 6.75, 6.56, 11, 7, 6, 5, 5, 6, 6, null]) },
  { label: 'Z3-57(3B) (Building)', accountNumber: '4300252', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-57 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([1, 1, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0.25, 0.18, 0.38, 0.19, 0.06, 0.29, 0, 0, 0, 1, 1, 0, 5, null]) },
  { label: 'Z3-57(4A) (Building)', accountNumber: '4300253', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-57 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.31, 0, 0.07, 1, 0, 2, 0, 0, 0, 0, null]) },
  { label: 'Z3-57(4B) (Building)', accountNumber: '4300254', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-57 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([0, 2, 0, 0, 5, 1, 2, 0, 0, 3, 0, 3, 0, 2.8, 0, 3.25, 0, 3.64, 0, 0, 7, 0, 0, 5, 5, null]) },
  { label: 'Z3-57(5) (Building)', accountNumber: '4300255', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-57 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([9, 4, 1, 17, 5, 9, 20, 27, 0, 12, 33, 29, 16.6, 13.6, 7.09, 21.1, 29.8, 24.6, 22, 21, 20, 15, 18, 20, 30, null]) },
  { label: 'Z3-57(6) (Building)', accountNumber: '4300256', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-57 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([0, 13, 0, 0, 2, 0, 18, 24, 0, 15, 1, 0, 9.33, 26.3, 22.4, 13.6, 13.4, 6, 9, 12, 15, 9, 23, 9, 8, null]) },
  { label: 'Z3-58(1A) (Building)', accountNumber: '4300257', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-58 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([10, 12, 4, 4, 3, 4, 3, 3, 2, 3, 2, 3, 3.26, 1.74, 4.54, 3.56, 3.52, 1.19, 2, 2, 4, 9, 4, 5, 3, null]) },
  { label: 'Z3-58(2A) (Building)', accountNumber: '4300258', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-58 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([10, 8, 0, 11, 0, 4, 3, 0, 2, 2, 0, 1, 0, 0.85, 4.24, 4, 0.06, 0, 0, 0, 0, 0, 0, 0, 0, null]) },
  { label: 'Z3-58(2B) (Building)', accountNumber: '4300259', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-58 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([2, 2, 0, 0, 2, 5, 4, 4, 1, 1, 3, 6, 4.7, 4.62, 2.08, 8.73, 5.96, 2.87, 8, 9, 5, 3, 4, 2, 4, null]) },
  { label: 'Z3-58(3A) (Building)', accountNumber: '4300260', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-58 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([13, 7, 1, 0, 0, 0, 0, 9, 10, 16, 10, 2, 0, 0.01, 0.06, 0, 11.8, 8, 4, 3, 4, 3, 4, 1, 3, null]) },
  { label: 'Z3-58(4A) (Building)', accountNumber: '4300261', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-58 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([2, 3, 0, 1, 0, 2, 2, 1, 1, 1, 2, 0, 0.2, 0.32, 0.6, 0.37, 0.14, 0.01, 0, 6, 13, 1, 1, 3, 1, null]) },
  { label: 'Z3-58(6) (Building)', accountNumber: '4300262', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-58 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([0, 0, 1, 0, 0, 0, 0, 3, 15, 16, 1, 1, 1.61, 2.31, 4.26, 8.42, 14, 12.9, 12, 18, 18, 18, 10, 15, 18, null]) },
  { label: 'Z3-59(1A) (Building)', accountNumber: '4300263', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-59 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 3, 4, 6.93, 6.52, 4.54, 4.77, 5.82, 4.51, 4, 4, 4, 3, 3, 3, 7, null]) },
  { label: 'Z3-59(1B) (Building)', accountNumber: '4300264', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-59 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([1, 4, 1, 1, 2, 1, 3, 2, 0, 1, 2, 2, 2.31, 3.43, 1, 0.05, 0.46, 0.02, 0, 1, 0, 0, 0, 1, 1, null]) },
  { label: 'Z3-59(2A) (Building)', accountNumber: '4300265', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-59 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([0, 0, 1, 17, 14, 8, 4, 7, 12, 11, 11, 8, 9.24, 12.4, 14.6, 14.1, 14.3, 12.8, 13, 12, 9, 8, 7, 13, 9, null]) },
  { label: 'Z3-59(2B) (Building)', accountNumber: '4300266', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-59 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([11, 13, 9, 12, 8, 13, 11, 19, 9, 12, 10, 17, 12.2, 13.5, 12.2, 15.7, 9.91, 12.3, 11, 12, 16, 16, 8, 11, 10, null]) },
  { label: 'Z3-59(3B) (Building)', accountNumber: '4300267', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-59 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([0, 0, 0, 0, 0, 0, 0, 1, 2, 2, 1, 2, 1.21, 3.21, 4.45, 2.61, 0.31, 0.01, 0, 0, 0, 0, 0, 0, 0, null]) },
  { label: 'Z3-59(4A) (Building)', accountNumber: '4300268', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-59 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([12, 3, 26, 17, 61, 0, 0, 0, 9, 15, 10, 13, 9.38, 7.49, 7.14, 7.31, 4.37, 7.16, 12, 12, 15, 8, 11, 8, 9, null]) },
  { label: 'Z3-59(5) (Building)', accountNumber: '4300269', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-59 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([0, 8, 14, 8, 10, 6, 1, 8, 0, 16, 5, 3, 12, 2.6, 8.14, 9.51, 6.38, 3.89, 10, 3, 2, 7, 3, 4, 1, null]) },
  { label: 'Z3-59(6) (Building)', accountNumber: '4300270', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-59 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([10, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 14, 3, 1, 12, 12, 10, 12, 18, 17, null]) },
  { label: 'Z3-60(1A) (Building)', accountNumber: '4300271', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-60 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([2, 2, 2, 1, 1, 4, 1, 1, 0, 3, 2, 1, 2.89, 6.3, 6.41, 6.05, 6.01, 3.26, 5, 7, 6, 5, 4, 10, 8, null]) },
  { label: 'Z3-60(2A) (Building)', accountNumber: '4300272', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-60 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([5, 4, 5, 4, 0, 1, 0, 0, 0, 5, 4, 4, 3.82, 4.28, 3.29, 2.27, 3.98, 9.82, 5, 3, 3, 3, 4, 4, 3, null]) },
  { label: 'Z3-60(3A) (Building)', accountNumber: '4300273', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-60 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([11, 12, 12, 9, 0, 7, 7, 6, 7, 6, 11, 9, 4.72, 8.44, 17.5, 9.33, 6.68, 5.89, 4, 4, 1, 7, 7, 7, 7, null]) },
  { label: 'Z3-60(4A) (Building)', accountNumber: '4300274', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-60 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([5, 5, 4, 6, 4, 15, 7, 12, 6, 5, 6, 6, 5.57, 4.56, 6.02, 4.28, 7.65, 2.75, 3, 0, 0, 6, 4, 3, 0, null]) },
  { label: 'Z3-60(5) (Building)', accountNumber: '4300275', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-60 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([5, 1, 1, 0, 0, 0, 0, 0, 23, 25, 6, 0, 0.01, 0.01, 0.02, 0.04, 0.02, 0.01, 0, 0, 33, 8, 4, 2, 0, null]) },
  { label: 'Z3-60(6) (Building)', accountNumber: '4300276', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-60 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([27, 12, 42, 48, 95, 166, 72, 33, 27, 37, 28, 14, 20.1, 34, 44.5, 47.5, 45.3, 48.5, 48, 46, 22, 25, 6, 18, 59, null]) },
  { label: 'Z3-61(1A) (Building)', accountNumber: '4300277', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-61 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([0, 4, 0, 17, 15, 6, 2, 0, 0, 6, 8, 10, 1.46, 0.43, 2.76, 3.16, 1.25, 0.13, 0, 11, 6, 7, 7, 3, 0, null]) },
  { label: 'Z3-61(1B) (Building)', accountNumber: '4300278', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-61 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([4, 3, 1, 2, 3, 4, 3, 5, 3, 5, 14, 6, 8.91, 8.56, 3.06, 7.95, 2.06, 7.69, 9, 6, 5, 6, 11, 8, 9, null]) },
  { label: 'Z3-61(2A) (Building)', accountNumber: '4300279', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-61 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([21, 18, 17, 17, 18, 9, 18, 11, 0, 0, 0, 0, 0, 0, 11.2, 10.8, 12.7, 2.67, 1, 2, 3, 2, 1, 1, 1, null]) },
  { label: 'Z3-61(2B) (Building)', accountNumber: '4300280', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-61 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([1, 2, 1, 1, 1, 0, 0, 0, 2, 0, 0, 1, 0.79, 0.62, 0.08, 0.85, 1.22, 1.04, 1, 2, 3, 2, 0, 1, 1, null]) },
  { label: 'Z3-61(3A) (Building)', accountNumber: '4300281', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-61 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([0, 4, 0, 1, 0, 2, 1, 2, 1, 4, 0, 0, 0, 5.69, 21.1, 22.3, 1.55, 0.11, 0, 0, 0, 0, 0, 0, 7, null]) },
  { label: 'Z3-61(3B) (Building)', accountNumber: '4300282', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-61 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([1, 1, 0, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0.24, 0.2, 0.1, 4.45, 11.3, 11.1, 8, 7, 8, 0, 0, 1, 1, null]) },
  { label: 'Z3-61(4A) (Building)', accountNumber: '4300283', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-61 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 6, 7, 6.39, 9.57, 7.16, 7.79, 5.28, 6.85, 6, 23, 4, 6, 10, 6, 9, null]) },
  { label: 'Z3-61(4B) (Building)', accountNumber: '4300284', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-61 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([0, 0, 1, 7, 5, 2, 4, 7, 9, 9, 5, 8, 2.36, 3.24, 9.55, 4.18, 2.47, 3.39, 4, 3, 4, 3, 3, 3, 3, null]) },
  { label: 'Z3-61(5) (Building)', accountNumber: '4300285', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-61 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([0, 9, 11, 8, 2, 4, 0, 0, 0, 0, 8, 0, 5.81, 0, 1.36, 1.81, 0, 0, 0, 0, 2, 9, 0, 2, 0, null]) },
  { label: 'Z3-61(6) (Building)', accountNumber: '4300286', level: 'L4', zone: 'Zone_03_(B)', parentMeter: 'D-61 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([20, 8, 5, 23, 6, 17, 10, 6, 3, 1, 4, 9, 14.7, 14.4, 19.4, 16.5, 12, 9.16, 16, 12, 16, 15, 7, 14, 16, null]) },
  { label: 'Z8-5', accountNumber: '4300287', level: 'L3', zone: 'Zone_08', parentMeter: 'BULK ZONE 8', type: 'Residential (Villa)', consumption: c([131, 117, 131, 142, 208, 247, 272, 344, 236, 280, 309, 314, 142, 278, 313, 336, 325, 236, 224, 98, 343, 203, 155, 183, 156, null]) },
  { label: 'Z8-9', accountNumber: '4300288', level: 'L3', zone: 'Zone_08', parentMeter: 'BULK ZONE 8', type: 'Residential (Villa)', consumption: c([8, 8, 0, 4, 2, 5, 47, 51, 4, 14, 12, 25, 4.98, 11.5, 5.96, 3.77, 5.61, 2.97, 1, 1, 1, 1, 1, 1, 0, null]) },
  { label: 'Z8-18', accountNumber: '4300289', level: 'L3', zone: 'Zone_08', parentMeter: 'BULK ZONE 8', type: 'Residential (Villa)', consumption: c([290, 212, 253, 418, 384, 478, 459, 410, 312, 196, 239, 149, 122, 102, 331, 342, 359, 361, 242, 127, 157, 137, 141, 111, 113, null]) },
  { label: 'Z8-19', accountNumber: '4300290', level: 'L3', zone: 'Zone_08', parentMeter: 'BULK ZONE 8', type: 'Residential (Villa)', consumption: c([161, 147, 205, 271, 282, 340, 157, 306, 239, 197, 248, 125, 104, 70.9, 226, 275, 274, 244, 197, 187, 168, 223, 164, 79, 91, null]) },
  { label: 'Z8-20', accountNumber: '4300291', level: 'L3', zone: 'Zone_08', parentMeter: 'BULK ZONE 8', type: 'Residential (Villa)', consumption: c([226, 210, 289, 358, 298, 313, 290, 297, 275, 219, 298, 158, 146, 101, 307, 298, 300, 89.9, 122, 106, 160, 125, 96, 94, 108, null]) },
  { label: 'Z8-21', accountNumber: '4300292', level: 'L3', zone: 'Zone_08', parentMeter: 'BULK ZONE 8', type: 'Residential (Villa)', consumption: c([188, 173, 172, 320, 254, 344, 233, 243, 200, 119, 167, 101, 99, 53.3, 284, 254, 154, 115, 60, 60, 63, 62, 84, 30, 47, null]) },
  { label: 'Z8-22', accountNumber: '4300293', level: 'L3', zone: 'Zone_08', parentMeter: 'BULK ZONE 8', type: 'Residential (Villa)', consumption: c([262, 168, 174, 366, 388, 418, 271, 343, 330, 138, 213, 177, 225, 147, 327, 451, 387, 254, 105, 55, 48, 31, 35, 38, 16, null]) },
  { label: 'Irrigation Tank 04 - (Z08)', accountNumber: '4300294', level: 'DC', zone: 'Direct Connection', parentMeter: 'Main Bulk (NAMA)', type: 'IRR_Servies', consumption: c([764, 509, 440, 970, 1165, 1475, 782, 559, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, -1, null]) },
  { label: 'Sales Center Common Building', accountNumber: '4300295', level: 'L2', zone: 'Zone_SC', parentMeter: 'Main Bulk (NAMA)', type: 'Zone Bulk', consumption: c([45, 46, 37, 35, 61, 32, 36, 28, 25, 41, 54, 62, 74.5, 62.9, 44.1, 65.5, 63.1, 54.9, 59, 61, 87, 78, 78, 21, 152, null]) },
  { label: 'Building FM', accountNumber: '4300296', level: 'L3', zone: 'Zone_01_(FM)', parentMeter: 'ZONE FM ( BULK ZONE FM )', type: 'MB_Common', consumption: c([34, 43, 22, 18, 27, 22, 32, 37, 34, 45, 30, 38, 35.6, 36.8, 51.6, 40, 40.8, 31.7, 44, 40, 38, 39, 44, 41, 30, null]) },
  { label: 'Building (Security)', accountNumber: '4300297', level: 'DC', zone: 'Direct Connection', parentMeter: 'Main Bulk (NAMA)', type: 'MB_Common', consumption: c([33, 31, 30, 32, 9, 4, 4, 4, 5, 6, 10, 17, 17.1, 15.8, 15.1, 15.9, 15.9, 13.4, 18, 16, 17, 20, 25, 27, 27, null]) },
  { label: 'Building Taxi', accountNumber: '4300298', level: 'L3', zone: 'Zone_01_(FM)', parentMeter: 'ZONE FM ( BULK ZONE FM )', type: 'Retail', consumption: c([11, 9, 10, 10, 13, 10, 8, 13, 12, 17, 11, 13, 11.1, 15.1, 13, 14.5, 13.3, 13.6, 13, 17, 17, 17, 15, 20, 15, null]) },
  { label: 'Building (ROP)', accountNumber: '4300299', level: 'DC', zone: 'Direct Connection', parentMeter: 'Main Bulk (NAMA)', type: 'MB_Common', consumption: c([38, 31, 31, 33, 10, 2, 3, 25, 42, 45, 25, 22, 22.4, 20.7, 19.6, 19.6, 19.7, 16.9, 22, 20, 21, 23, 31, 31, 33, null]) },
  { label: 'Building B1', accountNumber: '4300300', level: 'L3', zone: 'Zone_01_(FM)', parentMeter: 'ZONE FM ( BULK ZONE FM )', type: 'Retail', consumption: c([258, 183, 178, 184, 198, 181, 164, 202, 184, 167, 214, 245, 225, 200, 266, 248, 233, 146, 227, 298, 273, 265, 250, 253, 256, null]) },
  { label: 'Building B2', accountNumber: '4300301', level: 'L3', zone: 'Zone_01_(FM)', parentMeter: 'ZONE FM ( BULK ZONE FM )', type: 'Retail', consumption: c([239, 194, 214, 205, 167, 187, 177, 191, 206, 163, 194, 226, 231, 189, 232, 183, 199, 172, 190, 240, 224, 248, 256, 255, 280, null]) },
  { label: 'Building B3', accountNumber: '4300302', level: 'L3', zone: 'Zone_01_(FM)', parentMeter: 'ZONE FM ( BULK ZONE FM )', type: 'Retail', consumption: c([166, 147, 153, 190, 170, 124, 119, 123, 131, 112, 172, 161, 166, 148, 152, 132, 160, 153, 168, 148, 165, 210, 257, 214, 177, null]) },
  { label: 'Building B4', accountNumber: '4300303', level: 'L3', zone: 'Zone_01_(FM)', parentMeter: 'ZONE FM ( BULK ZONE FM )', type: 'Retail', consumption: c([8, 17, 21, 29, 30, 5, 93, 130, 119, 92, 134, 138, 106, 95.6, 165, 145, 121, 150, 158, 179, 211, 175, 169, 161, 153, null]) },
  { label: 'Building B5', accountNumber: '4300304', level: 'L3', zone: 'Zone_01_(FM)', parentMeter: 'ZONE FM ( BULK ZONE FM )', type: 'Retail', consumption: c([28, 0, 0, 17, 49, 175, 8, 8, 3, 0, 0, 0, 1.6, 1.49, 1.06, 0.73, 0.12, 179, 62, 54, 41, 42, 37, 32, 6, null]) },
  { label: 'Building B6', accountNumber: '4300305', level: 'L3', zone: 'Zone_01_(FM)', parentMeter: 'ZONE FM ( BULK ZONE FM )', type: 'Retail', consumption: c([7, 9, 9, 11, 16, 57, 131, 234, 226, 196, 195, 224, 250, 220, 282, 278, 214, 195, 194, 210, 221, 229, 231, 260, 287, null]) },
  { label: 'Building B7', accountNumber: '4300306', level: 'L3', zone: 'Zone_01_(FM)', parentMeter: 'ZONE FM ( BULK ZONE FM )', type: 'Retail', consumption: c([304, 243, 251, 275, 244, 226, 140, 161, 36, 116, 148, 151, 175, 170, 197, 200, 200, 155, 191, 155, 168, 200, 201, 211, 214, null]) },
  { label: 'Building B8', accountNumber: '4300307', level: 'L3', zone: 'Zone_01_(FM)', parentMeter: 'ZONE FM ( BULK ZONE FM )', type: 'Retail', consumption: c([557, 260, 253, 290, 320, 275, 261, 196, 176, 178, 261, 276, 268, 250, 233, 0, 413, 213, 62, 84, 196, 383, 281, 280, 262, null]) },
  { label: 'Irrigation Tank (Z01_FM)', accountNumber: '4300308', level: 'L3', zone: 'Zone_01_(FM)', parentMeter: 'ZONE FM ( BULK ZONE FM )', type: 'IRR_Servies', consumption: c([0, 0, 0, 0, 0, 519, 877, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, null]) },
  { label: 'Room PUMP (FIRE)', accountNumber: '4300309', level: 'L3', zone: 'Zone_01_(FM)', parentMeter: 'ZONE FM ( BULK ZONE FM )', type: 'MB_Common', consumption: c([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 25, 107, 75.9, 0.32, 0, 0, 0, 0, 0, 0, 0, 0, 2, 1, 1, null]) },
  { label: 'Building (MEP)', accountNumber: '4300310', level: 'L3', zone: 'Zone_01_(FM)', parentMeter: 'ZONE FM ( BULK ZONE FM )', type: 'MB_Common', consumption: c([1, 1, 1, 2, 4, 4, 6, 8, 3, 2, 3, 2, 2, 2, 1, 0, 6, 2, 1, 2, 3, 4, 4, 4, 4, null]) },
  { label: 'D-53 Building Bulk Meter', accountNumber: '4300311', level: 'L3', zone: 'Zone_03_(B)', parentMeter: 'ZONE 3B (BULK ZONE 3B)', type: 'D_Building_Bulk', consumption: c([34, 43, 31, 32, 19, 38, 20, 21, 23, 32, 26, 27, 17.4, 25.1, 27.9, 38.9, 21, 26.7, 26, 30, 46, 94, 106, 100, 96, null]) },
  { label: 'D-54 Building Bulk Meter', accountNumber: '4300312', level: 'L3', zone: 'Zone_03_(B)', parentMeter: 'ZONE 3B (BULK ZONE 3B)', type: 'D_Building_Bulk', consumption: c([58, 63, 65, 68, 65, 61, 89, 22, 43, 63, 95, 66, 62.2, 49.9, 68.1, 95.8, 50.8, 55.8, 75, 55, 53, 45, 67, 46, 50, null]) },
  { label: 'D-55 Building Bulk Meter', accountNumber: '4300313', level: 'L3', zone: 'Zone_03_(B)', parentMeter: 'ZONE 3B (BULK ZONE 3B)', type: 'D_Building_Bulk', consumption: c([90, 93, 150, 106, 113, 107, 67, 77, 66, 97, 80, 65, 69.9, 58.2, 112, 181, 94.4, 60.7, 78, 82, 54, 90, 76, 77, 74, null]) },
  { label: 'D-56 Building Bulk Meter', accountNumber: '4300314', level: 'L3', zone: 'Zone_03_(B)', parentMeter: 'ZONE 3B (BULK ZONE 3B)', type: 'D_Building_Bulk', consumption: c([323, 106, 140, 236, 216, 275, 348, 462, 68, 32, 26, 214, 91.7, 16.8, 39, 0, 0, 59, 32, 28, 29, 27, 40, 42, 43, null]) },
  { label: 'D-57 Building Bulk Meter', accountNumber: '4300315', level: 'L3', zone: 'Zone_03_(B)', parentMeter: 'ZONE 3B (BULK ZONE 3B)', type: 'D_Building_Bulk', consumption: c([46, 48, 28, 42, 67, 69, 105, 113, 44, 52, 52, 56, 46.5, 63.5, 49.4, 63.5, 72.3, 46, 64, 54, 66, 31, 0, 0, 87, null]) },
  { label: 'D-58 Building Bulk Meter', accountNumber: '4300316', level: 'L3', zone: 'Zone_03_(B)', parentMeter: 'ZONE 3B (BULK ZONE 3B)', type: 'D_Building_Bulk', consumption: c([132, 95, 36, 53, 46, 63, 47, 65, 75, 89, 63, 55, 55.2, 46.9, 62.6, 93.7, 83, 62.1, 63, 81, 75, 66, 54, 58, 64, null]) },
  { label: 'D-59 Building Bulk Meter', accountNumber: '4300317', level: 'L3', zone: 'Zone_03_(B)', parentMeter: 'ZONE 3B (BULK ZONE 3B)', type: 'D_Building_Bulk', consumption: c([71, 52, 78, 72, 106, 43, 45, 56, 49, 62, 45, 51, 56.5, 53.7, 53.1, 65.9, 46.9, 43.7, 53, 56, 57, 51, 45, 63, 62, null]) },
  { label: 'D-60 Building Bulk Meter', accountNumber: '4300318', level: 'L3', zone: 'Zone_03_(B)', parentMeter: 'ZONE 3B (BULK ZONE 3B)', type: 'D_Building_Bulk', consumption: c([92, 96, 96, 95, 122, 207, 111, 78, 91, 98, 67, 53, 55.4, 75.1, 94.3, 102, 90.7, 84.1, 83, 73, 88, 32, 49, 66, 99, null]) },
  { label: 'D-61 Building Bulk Meter', accountNumber: '4300319', level: 'L3', zone: 'Zone_03_(B)', parentMeter: 'ZONE 3B (BULK ZONE 3B)', type: 'D_Building_Bulk', consumption: c([57, 60, 39, 79, 52, 46, 40, 34, 20, 27, 46, 44, 41, 43, 76, 82, 49.2, 43.1, 62, 66, 50, 49, 40, 40, 46, null]) },
  { label: 'Irrigation Tank 02 (Z03)', accountNumber: '4300320', level: 'L3', zone: 'Zone_03_(B)', parentMeter: 'ZONE 3B (BULK ZONE 3B)', type: 'IRR_Servies', consumption: c([42, 36, 74, 39, 31, 36, 45, 45, 30, 30, 29, 57, 49, 47, 43, 15, 304.7, 106, 91, 92, 225, 548, 873, 321, 0, null]) },
  { label: 'Irrigation Tank 03 (Z05)', accountNumber: '4300321', level: 'L3', zone: 'Zone_05', parentMeter: 'ZONE 5 (Bulk Zone 5)', type: 'IRR_Servies', consumption: c([1223, 1016, 552, 808, 0, 347, 763, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, null]) },
  { label: 'Irrigation Tank 01 (Outlet)', accountNumber: '4300322', level: 'N/A', zone: 'N/A', parentMeter: 'N/A', type: 'IRR_Servies', consumption: c([21543, 15803, 24147, 23435, 25002, 24544, 25526, 31284, 28396, 32509, 23743, 23518, 27954, 29422, 26787, 13780, 30126.9, 18885, 20290, 23295, 19002, 15136, 13998, 23239, 28077, null]) },
  { label: 'Irrigation Tank 01 (Inlet)', accountNumber: '4300323', level: 'DC', zone: 'Direct Connection', parentMeter: 'Main Bulk (NAMA)', type: 'IRR_Servies', consumption: c([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 1, 0, 0, 0, 0, 0, 0, null]) },
  { label: 'Building CIF/CB', accountNumber: '4300324', level: 'L3', zone: 'Zone_01_(FM)', parentMeter: 'ZONE FM ( BULK ZONE FM )', type: 'Retail', consumption: c([8, 5, 6, 27, 29, 25, 258, 300, 285, 388, 349, 347, 415, 294, 352, 304, 284, 242, 442, 731, 516, 274, 270, 254, 319, null]) },
  { label: 'Building Nursery Building', accountNumber: '4300325', level: 'L3', zone: 'Zone_01_(FM)', parentMeter: 'ZONE FM ( BULK ZONE FM )', type: 'Retail', consumption: c([7, 6, 5, 5, 6, 4, 5, 6, 6, 8, 5, 5, 4, 4, 4, 0, 6, 4, 2, 2, 7, 5, 5, 3, 4, null]) },
  { label: 'Irrigation Tank - VS PO Water', accountNumber: '4300326', level: 'L3', zone: 'Zone_VS', parentMeter: 'Village Square (Zone Bulk)', type: 'IRR_Servies', consumption: c([0, 0, 0, 2, 0, 157, 116, 71, 100, 0, 1, 0, 0.02, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, null]) },
  { label: 'Coffee 1 (GF Shop No.591)', accountNumber: '4300327', level: 'L3', zone: 'Zone_VS', parentMeter: 'Village Square (Zone Bulk)', type: 'Retail', consumption: c([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.53, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, null]) },
  { label: 'Sale Centre Caffe & Bar (GF Shop No.592 A)', accountNumber: '4300328', level: 'L3', zone: 'Zone_SC', parentMeter: 'Sale Centre (Zone Bulk)', type: 'Retail', consumption: c([0, 0, 0, 0, 0, 0, 0, 6, 0, 0, 0, 0, 0.4, 1.39, 3.03, 5.04, 12, 5.09, 20, 33, 28, 43, 40, 60, 53, null]) },
  { label: 'Coffee 2 (GF Shop No.594 A)', accountNumber: '4300329', level: 'L3', zone: 'Zone_VS', parentMeter: 'Village Square (Zone Bulk)', type: 'Retail', consumption: c([0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 1, 3, 2.65, 2.81, 4.28, 4.94, 5.19, 3.76, 9, 5, 16, 10, 11, 14, 7, null]) },
  { label: 'Supermarket (FF Shop No.591)', accountNumber: '4300330', level: 'L3', zone: 'Zone_VS', parentMeter: 'Village Square (Zone Bulk)', type: 'Retail', consumption: c([0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, null]) },
  { label: 'Pharmacy (FF Shop No.591 A)', accountNumber: '4300331', level: 'L3', zone: 'Zone_VS', parentMeter: 'Village Square (Zone Bulk)', type: 'Retail', consumption: c([0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0.23, 0.01, 0, 0.02, 0, 0.01, 0, 0, 0, 0, 0, 0, 0, null]) },
  { label: 'Laundry Services (FF Shop No.593)', accountNumber: '4300332', level: 'L3', zone: 'Zone_VS', parentMeter: 'Village Square (Zone Bulk)', type: 'Retail', consumption: c([0, 1, 16, 49, 32, 34, 32, 47, 34, 45, 52, 31, 33, 25, 22, 0, 43.5, 27.9, 44, 42, 45, 49, 61, 75, 86, null]) },
  { label: 'Shop No.593 A', accountNumber: '4300333', level: 'L3', zone: 'Zone_VS', parentMeter: 'Village Square (Zone Bulk)', type: 'Retail', consumption: c([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, null]) },
  { label: 'Hotel Main Building', accountNumber: '4300334', level: 'DC', zone: 'Direct Connection', parentMeter: 'Main Bulk (NAMA)', type: 'Retail', consumption: c([14012, 12880, 11222, 13217, 13980, 15385, 12810, 13747, 13031, 17688, 15156, 14668, 18048, 19482, 22151, 11667, 26963, 17379, 14713, 16249, 13548, 18876, 18656, 18102, -63838, null]) },
  { label: 'Village Square (Zone Bulk)', accountNumber: '4300335', level: 'L2', zone: 'Zone_VS', parentMeter: 'Main Bulk (NAMA)', type: 'Zone Bulk', consumption: c([26, 19, 72, 60, 125, 277, 143, 137, 145, 63, 34, 17, 14, 12, 21, 13, 18.8, 18.6, 60, 77, 81, 122, 126, 189, 249, null]) },
  { label: 'Community Mgmt - Technical Zone, STP', accountNumber: '4300336', level: 'DC', zone: 'Direct Connection', parentMeter: 'Main Bulk (NAMA)', type: 'MB_Common', consumption: c([28, 47, 34, 27, 24, 51, 18, 23, 22, 17, 14, 25, 29.1, 37.1, 25.7, 35.1, 28.5, 53.1, 50, 56, 55, 62, 42, 38, 40, null]) },
  { label: 'Cabinet FM (CONTRACTORS OFFICE)', accountNumber: '4300337', level: 'L3', zone: 'Zone_01_(FM)', parentMeter: 'ZONE FM ( BULK ZONE FM )', type: 'Building', consumption: c([99, 98, 70, 53, 22, 95, 90, 10, 4, 1, 15, 42, 67.1, 53.2, 59.4, 56.9, 51.3, 49.7, 56, 49, 39, 0, 64, 43, 36, null]) },
  { label: 'PHASE 02, MAIN ENTRANCE (Infrastructure)', accountNumber: '4300338', level: 'DC', zone: 'Direct Connection', parentMeter: 'Main Bulk (NAMA)', type: 'MB_Common', consumption: c([34, 33, 35, 40, 40, 49, 24, 11, 12, 12, 12, 10, 10.4, 8.23, 6.03, 6.44, 6.09, 6.33, 7, 7, 8, 12, 10, 18, 16, null]) },
  { label: 'Building CIF/CB (COFFEE SH)', accountNumber: '4300339', level: 'L3', zone: 'Zone_01_(FM)', parentMeter: 'ZONE FM ( BULK ZONE FM )', type: 'Retail', consumption: c([19, 10, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, null]) },
  { label: 'Irrigation- Controller UP', accountNumber: '4300340', level: 'DC', zone: 'Direct Connection', parentMeter: 'Main Bulk (NAMA)', type: 'IRR_Servies', consumption: c([647, 297, 318, 351, 414, 1038, 1636, 1213, 1410, 1204, 124, 53, 0, 0, 0, 0, 33, 491, 554, 272, 266, 181, 328, 253, 124, null]) },
  { label: 'Irrigation- Controller DOWN', accountNumber: '4300341', level: 'DC', zone: 'Direct Connection', parentMeter: 'Main Bulk (NAMA)', type: 'IRR_Servies', consumption: c([1124, 907, 773, 628, 601, 891, 1006, 742, 860, 1559, 171, 185, 159, 239, 283, 0, 910, 511, 611, 343, 0, 0, 0, 0, 0, null]) },
  { label: 'ZONE 8 (Bulk Zone 8)', accountNumber: '4300342', level: 'L2', zone: 'Zone_08', parentMeter: 'Main Bulk (NAMA)', type: 'Zone Bulk', consumption: c([2170, 1825, 2021, 2753, 2722, 3193, 3639, 3957, 3947, 4296, 3569, 3018, 1547, 1498, 2605, 3138, 2937, 3142, 3492, 3347, 3783, 3929, 3306, 3506, 10017, null]) },
  { label: 'ZONE 3A (Bulk Zone 3A)', accountNumber: '4300343', level: 'L2', zone: 'Zone_03_(A)', parentMeter: 'Main Bulk (NAMA)', type: 'Zone Bulk', consumption: c([1234, 1099, 1297, 1892, 2254, 2227, 3313, 3172, 2698, 3715, 3501, 3796, 4235, 4273, 3591, 3996, 4898, 6566, 5949, 6207, 6440, 7219, 5208, 1483, 2616, null]) },
  { label: 'ZONE 3B (Bulk Zone 3B)', accountNumber: '4300344', level: 'L2', zone: 'Zone_03_(B)', parentMeter: 'Main Bulk (NAMA)', type: 'Zone Bulk', consumption: c([2653, 2169, 2315, 2381, 2634, 2932, 3369, 3458, 3742, 2906, 2695, 3583, 3256, 2962, 3331, 935, 3093, 3231, 3243, 2886, 16402, 5467, 11824, 2050, 6529, null]) },
  { label: 'ZONE 5 (Bulk Zone 5)', accountNumber: '4300345', level: 'L2', zone: 'Zone_05', parentMeter: 'Main Bulk (NAMA)', type: 'Zone Bulk', consumption: c([4286, 3897, 4127, 4911, 2639, 4992, 5305, 4039, 2736, 3383, 1438, 3788, 4267, 4231, 3862, 3663, 3849, 4137, 3476, 3968, 4030, 4218, 4433, 4874, 4598, null]) },
  { label: 'ZONE FM ( BULK ZONE FM )', accountNumber: '4300346', level: 'L2', zone: 'Zone_01_(FM)', parentMeter: 'Main Bulk (NAMA)', type: 'Zone Bulk', consumption: c([1595, 1283, 1255, 1383, 1411, 2078, 2601, 1638, 1550, 2098, 1808, 1946, 2008, 1740, 1880, 1756, 1693, 1673, 1960, 2305, 2089, 2002, 2059, 2130, 2271, null]) },
  { label: 'Irrigation Tank - VS (TSE Water)', accountNumber: '4300347', level: 'N/A', zone: 'N/A', parentMeter: 'N/A', type: 'IRR_Servies', consumption: c([0, 0, 0, 0, 0, 0, 0, 666, 841, 946, 744, 603, 934, 934, 855, 0, 2698, 1164, 825, 1917, 1444, 1489, 1053, 749, 917, null]) },
  { label: 'Al Adrak Camp', accountNumber: '4300348', level: 'DC', zone: 'Direct Connection', parentMeter: 'Main Bulk (NAMA)', type: 'Retail', consumption: c([0, 0, 0, 0, 0, 0, 0, 0, 474, 1179, 494, 494, 1038, 702, 1161, 1000, 1228, 1015, 972, 924, 860, 879, 875, 686, 833, null]) },
  { label: 'Al Adrak Company (accommodation)Camp Area', accountNumber: '4300349', level: 'DC', zone: 'Direct Connection', parentMeter: 'Main Bulk (NAMA)', type: 'Retail', consumption: c([0, 0, 0, 0, 0, 0, 0, 0, 193, 1073, 808, 808, 0, 0, 0, 0, 1805, 1758, 1859, 1572, 1774, 1687, 1448, 1066, 1352, null]) },
  { label: 'Main Bulk (NAMA)', accountNumber: 'C43659', level: 'L1', zone: 'Main Bulk', parentMeter: 'NAMA', type: 'Main BULK', consumption: c([32803, 27996, 23860, 31869, 30737, 41953, 35166, 35420, 41341, 31519, 35290, 36733, 32580, 44043, 49697, 31828, 58425, 41840, 41475, 38813, 42088, 46049, 47347, 45922, 41320, null]) }
];

// =============================================================================
// DYNAMIC DATA SUPPORT (for Supabase integration)
// =============================================================================

/**
 * Storage for dynamically loaded water meters from Supabase
 * When set, these override the static WATER_METERS
 */
let dynamicWaterMeters: WaterMeter[] | null = null;

/**
 * Check if using live Supabase data
 */
export function isUsingLiveData(): boolean {
  return dynamicWaterMeters !== null && dynamicWaterMeters.length > 0;
}

/**
 * Set water meters data from external source (Supabase)
 * This will override the static WATER_METERS for all calculations
 */
export function setWaterMetersData(meters: WaterMeter[]): void {
  dynamicWaterMeters = meters;
  console.log(`[Water] Set ${meters.length} meters from Supabase`);
}

/**
 * Clear dynamic data and revert to static WATER_METERS
 */
export function clearWaterMetersData(): void {
  dynamicWaterMeters = null;
}

/**
 * Get current water meters (Supabase data or static fallback)
 */
export function getWaterMeters(): WaterMeter[] {
  return dynamicWaterMeters || WATER_METERS;
}

// =============================================================================
// Calculation Functions
export function getConsumption(meter: WaterMeter, month: string): number {
  const val = meter.consumption[month];
  return val !== null && val !== undefined ? val : 0;
}

export function getMetersByLevel(level: string): WaterMeter[] {
  return getWaterMeters().filter(m => m.level === level);
}

export function getMetersByZone(zone: string): WaterMeter[] {
  return getWaterMeters().filter(m => m.zone === zone);
}

export function getMetersByParent(parentMeter: string): WaterMeter[] {
  return getWaterMeters().filter(m => m.parentMeter === parentMeter);
}

export function getMetersByType(type: string): WaterMeter[] {
  return getWaterMeters().filter(m => m.type === type);
}

export function getMeterByAccount(accountNumber: string): WaterMeter | undefined {
  return getWaterMeters().find(m => m.accountNumber === accountNumber);
}

export function calculateMonthlyAnalysis(month: string): WaterAnalysis {
  const l1Meters = getMetersByLevel('L1');
  const l2Meters = getMetersByLevel('L2');
  const l3Meters = getMetersByLevel('L3');
  const l4Meters = getMetersByLevel('L4');
  const dcMeters = getMetersByLevel('DC');

  // Helper to check if a meter has data for the month
  const hasData = (m: WaterMeter) => m.consumption[month] !== null && m.consumption[month] !== undefined;

  // Helper to get consumption only if it exists
  const getVal = (m: WaterMeter) => getConsumption(m, month);

  const A1 = l1Meters.reduce((sum, m) => sum + getVal(m), 0);
  const A2 = l2Meters.reduce((sum, m) => sum + getVal(m), 0) +
    dcMeters.reduce((sum, m) => sum + getVal(m), 0);

  // For A3, we need to be careful. If we have a lot of missing data, the sum will be low, 
  // leading to high calculated loss.
  // Current approach: Sum what we have. 
  // IMPACT: If individual meters are missing (null), A3 is lower -> Loss (A1-A3) is higher.
  // IMPROVEMENT: We could try to estimate, but for now, let's strictly sum. 
  // However, identifying if data is "complete" is hard without a schedule.
  // A better approach for the "Analysis" object might be to flag potential inaccuracy?
  // For now, let's keep the sum but maybe we can ensure we don't return negative loss if A3 > A1 (unlikely but possible with bad data).

  const A3Bulk = l3Meters.reduce((sum, m) => sum + getVal(m), 0) +
    dcMeters.reduce((sum, m) => sum + getVal(m), 0);
  const l3NonBuildings = l3Meters.filter(m => !m.type.includes('Building_Bulk'));
  const A3Individual = l3NonBuildings.reduce((sum, m) => sum + getVal(m), 0) +
    l4Meters.reduce((sum, m) => sum + getVal(m), 0) +
    dcMeters.reduce((sum, m) => sum + getVal(m), 0);

  const stage1Loss = A1 - A2;
  const stage2Loss = A2 - A3Individual;
  const stage3Loss = A3Bulk - A3Individual;
  const totalLoss = A1 - A3Individual;

  // Clamp efficiency to 100 max to avoid confusing users if data is weird
  const efficiency = A1 > 0 ? Math.min(100, (A3Individual / A1) * 100) : 0;
  // Allow negative loss? It implies metering errors (generating water). 
  // Let's keep it real for diagnosis.
  const lossPercentage = A1 > 0 ? (totalLoss / A1) * 100 : 0;

  return {
    A1, A2, A3Bulk, A3Individual, stage1Loss, stage2Loss, stage3Loss, totalLoss,
    efficiency: Math.round(efficiency * 10) / 10,
    lossPercentage: Math.round(lossPercentage * 10) / 10
  };
}

export function calculateRangeAnalysis(startMonth: string, endMonth: string): WaterAnalysis {
  const startIdx = AVAILABLE_MONTHS.indexOf(startMonth);
  const endIdx = AVAILABLE_MONTHS.indexOf(endMonth);
  if (startIdx === -1 || endIdx === -1 || startIdx > endIdx) return calculateMonthlyAnalysis(startMonth);

  const months = AVAILABLE_MONTHS.slice(startIdx, endIdx + 1);
  const analyses = months.map(m => calculateMonthlyAnalysis(m));

  const totals: WaterAnalysis = {
    A1: analyses.reduce((sum, a) => sum + a.A1, 0),
    A2: analyses.reduce((sum, a) => sum + a.A2, 0),
    A3Bulk: analyses.reduce((sum, a) => sum + a.A3Bulk, 0),
    A3Individual: analyses.reduce((sum, a) => sum + a.A3Individual, 0),
    stage1Loss: analyses.reduce((sum, a) => sum + a.stage1Loss, 0),
    stage2Loss: analyses.reduce((sum, a) => sum + a.stage2Loss, 0),
    stage3Loss: analyses.reduce((sum, a) => sum + a.stage3Loss, 0),
    totalLoss: 0, efficiency: 0, lossPercentage: 0
  };

  totals.totalLoss = totals.A1 - totals.A3Individual;
  totals.efficiency = totals.A1 > 0 ? Math.round((totals.A3Individual / totals.A1) * 1000) / 10 : 0;
  totals.lossPercentage = totals.A1 > 0 ? Math.round((totals.totalLoss / totals.A1) * 1000) / 10 : 0;

  return totals;
}

export function calculateZoneAnalysis(zone: string, month: string): ZoneAnalysis {
  const config = ZONE_CONFIG.find(z => z.code === zone);
  if (!config) return { zone, zoneName: zone, bulkMeterReading: 0, individualTotal: 0, loss: 0, lossPercentage: 0, efficiency: 0, meterCount: 0 };

  const bulkMeter = getMeterByAccount(config.bulkMeterAccount);
  const bulkMeterReading = bulkMeter ? getConsumption(bulkMeter, month) : 0;
  const zoneMeters = getMetersByZone(zone).filter(m => m.level === 'L3' || m.level === 'L4');
  const l3Meters = zoneMeters.filter(m => m.level === 'L3' && !m.type.includes('Building_Bulk'));
  const l4Meters = zoneMeters.filter(m => m.level === 'L4');
  const individualTotal = l3Meters.reduce((sum, m) => sum + getConsumption(m, month), 0) +
    l4Meters.reduce((sum, m) => sum + getConsumption(m, month), 0);

  const loss = bulkMeterReading - individualTotal;
  const lossPercentage = bulkMeterReading > 0 ? (loss / bulkMeterReading) * 100 : 0;
  // Clamp efficiency to 100 max
  const efficiency = bulkMeterReading > 0 ? Math.min(100, (individualTotal / bulkMeterReading) * 100) : 0;

  return {
    zone, zoneName: config.name, bulkMeterReading, individualTotal, loss,
    lossPercentage: Math.round(lossPercentage * 10) / 10,
    efficiency: Math.round(efficiency * 10) / 10,
    meterCount: zoneMeters.length
  };
}

export function calculateBuildingAnalysis(buildingBulkAccount: string, month: string): BuildingAnalysis {
  const bulkMeter = getMeterByAccount(buildingBulkAccount);
  if (!bulkMeter) return { building: '', zone: '', bulkMeterReading: 0, apartmentTotal: 0, loss: 0, lossPercentage: 0, apartmentCount: 0 };

  const bulkMeterReading = getConsumption(bulkMeter, month);
  const apartments = getMetersByParent(bulkMeter.label);
  const apartmentTotal = apartments.reduce((sum, m) => sum + getConsumption(m, month), 0);
  const loss = bulkMeterReading - apartmentTotal;
  const lossPercentage = bulkMeterReading > 0 ? (loss / bulkMeterReading) * 100 : 0;

  return {
    building: bulkMeter.label, zone: bulkMeter.zone, bulkMeterReading, apartmentTotal, loss,
    lossPercentage: Math.round(lossPercentage * 10) / 10,
    apartmentCount: apartments.length
  };
}

export function getConsumptionByType(month: string): { type: string; total: number; percentage: number; color: string }[] {
  const typeColors: Record<string, string> = {
    Commercial: '#3B82F6', Residential: '#10B981', Irrigation: '#F59E0B', Common: '#8B5CF6'
  };

  const results: { type: string; total: number; percentage: number; color: string }[] = [];
  let grandTotal = 0;

  for (const [category, types] of Object.entries(TYPE_CATEGORIES)) {
    const meters = getWaterMeters().filter(m => types.includes(m.type));
    const total = meters.reduce((sum, m) => sum + getConsumption(m, month), 0);
    grandTotal += total;
    results.push({ type: category, total, percentage: 0, color: typeColors[category] || '#6B7280' });
  }

  results.forEach(r => { r.percentage = grandTotal > 0 ? Math.round((r.total / grandTotal) * 1000) / 10 : 0; });
  return results;
}

export function getMonthlyTrends(startMonth: string, endMonth: string) {
  const startIdx = AVAILABLE_MONTHS.indexOf(startMonth);
  const endIdx = AVAILABLE_MONTHS.indexOf(endMonth);
  if (startIdx === -1 || endIdx === -1) return [];

  const months = AVAILABLE_MONTHS.slice(startIdx, endIdx + 1);
  return months.map(month => {
    const analysis = calculateMonthlyAnalysis(month);
    return { month, ...analysis };
  });
}

export function getAllZonesAnalysis(month: string): ZoneAnalysis[] {
  return ZONE_CONFIG.map(config => calculateZoneAnalysis(config.code, month));
}

export function getAllBuildingsAnalysis(month: string): BuildingAnalysis[] {
  const buildingBulks = getWaterMeters().filter(m => m.type === 'D_Building_Bulk');
  return buildingBulks.map(b => calculateBuildingAnalysis(b.accountNumber, month));
}

export function getPerformanceRating(lossPercentage: number): { status: string; color: string; emoji: string } {
  if (lossPercentage < 10) return { status: 'Excellent', color: '#10B981', emoji: '🟢' };
  if (lossPercentage < 20) return { status: 'Good', color: '#3B82F6', emoji: '🟡' };
  if (lossPercentage < 30) return { status: 'Average', color: '#F59E0B', emoji: '🟠' };
  return { status: 'Poor', color: '#EF4444', emoji: '🔴' };
}

export function formatNumber(num: number): string {
  return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

export function getMeterCountsByLevel(): { level: string; count: number }[] {
  return ['L1', 'L2', 'L3', 'L4', 'DC'].map(level => ({ level, count: getMetersByLevel(level).length }));
}
