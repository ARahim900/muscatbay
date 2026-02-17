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
  // L1 - Main Source
  { label: 'Main Bulk (NAMA)', accountNumber: 'C43659', level: 'L1', zone: 'Main Bulk', parentMeter: 'NAMA', type: 'Main BULK', consumption: c([32580, 44043, 34915, 46039, 58425, 41840, 41475, 41743, 42088, 46049, 47347, 45922, 41320]) },

  // L2 - Zone Bulks
  { label: 'ZONE 8 (Bulk Zone 8)', accountNumber: '4300342', level: 'L2', zone: 'Zone_08', parentMeter: 'Main Bulk (NAMA)', type: 'Zone Bulk', consumption: c([1547, 1498, 3072, 3138, 2937, 3142, 3072, 3840, 3385, 3468, 3881, 3868, 10017]) },
  { label: 'ZONE 3A (Bulk Zone 3A)', accountNumber: '4300343', level: 'L2', zone: 'Zone_03_(A)', parentMeter: 'Main Bulk (NAMA)', type: 'Zone Bulk', consumption: c([4235, 4273, 3591, 3996, 4898, 6566, 5949, 6207, 6440, 7219, 5208, 1483, 2616]) },
  { label: 'ZONE 3B (Bulk Zone 3B)', accountNumber: '4300344', level: 'L2', zone: 'Zone_03_(B)', parentMeter: 'Main Bulk (NAMA)', type: 'Zone Bulk', consumption: c([3256, 2962, 3331, 935, 2083, 3231, 3243, 2886, 16402, 5467, 11824, 2050, 6529]) },
  { label: 'ZONE 5 (Bulk Zone 5)', accountNumber: '4300345', level: 'L2', zone: 'Zone_05', parentMeter: 'Main Bulk (NAMA)', type: 'Zone Bulk', consumption: c([4267, 4231, 3862, 3663, 3849, 4137, 3476, 3968, 4030, 4218, 4433, 4874, 4598]) },
  { label: 'ZONE FM ( BULK ZONE FM )', accountNumber: '4300346', level: 'L2', zone: 'Zone_01_(FM)', parentMeter: 'Main Bulk (NAMA)', type: 'Zone Bulk', consumption: c([2008, 1740, 1880, 1756, 1693, 1673, 1960, 2305, 2089, 2002, 2059, 2130, 2271]) },
  { label: 'Village Square (Zone Bulk)', accountNumber: '4300335', level: 'L2', zone: 'Zone_VS', parentMeter: 'Main Bulk (NAMA)', type: 'Zone Bulk', consumption: c([14, 12, 21, 13, 96, 19, 60, 77, 81, 122, 126, 189, 249]) },
  { label: 'Sales Center Common Building', accountNumber: '4300295', level: 'L2', zone: 'Zone_SC', parentMeter: 'Main Bulk (NAMA)', type: 'Zone Bulk', consumption: c([75, 63, 44, 66, 63, 55, 59, 61, 87, 78, 78, 21, 152]) },

  // DC - Direct Connections (11 meters)
  { label: 'Hotel Main Building', accountNumber: '4300334', level: 'DC', zone: 'Direct Connection', parentMeter: 'Main Bulk (NAMA)', type: 'Retail', consumption: c([18048, 19482, 22151, 11667, 26963, 17379, 14713, 16192, 14546, 17927, 18624, 18471, 16000]) },
  { label: 'Al Adrak Camp', accountNumber: '4300348', level: 'DC', zone: 'Direct Connection', parentMeter: 'Main Bulk (NAMA)', type: 'Retail', consumption: c([1038, 702, 1161, 1000, 1228, 1015, 972, 924, 769, 879, 875, 686, 833]) },
  { label: 'Al Adrak Company (accommodation)Camp Area', accountNumber: '4300349', level: 'DC', zone: 'Direct Connection', parentMeter: 'Main Bulk (NAMA)', type: 'Retail', consumption: c([0, 0, 0, 0, 0, 1758, 1802, 1511, 1776, 1687, 1448, 1066, 1352]) },
  { label: 'Community Mgmt - Technical Zone, STP', accountNumber: '4300336', level: 'DC', zone: 'Direct Connection', parentMeter: 'Main Bulk (NAMA)', type: 'MB_Common', consumption: c([29, 37, 26, 35, 29, 53, 50, 56, 55, 62, 42, 38, 40]) },
  { label: 'Building (Security)', accountNumber: '4300297', level: 'DC', zone: 'Direct Connection', parentMeter: 'Main Bulk (NAMA)', type: 'MB_Common', consumption: c([17, 16, 15, 16, 16, 13, 18, 16, 17, 20, 25, 27, 27]) },
  { label: 'Building (ROP)', accountNumber: '4300299', level: 'DC', zone: 'Direct Connection', parentMeter: 'Main Bulk (NAMA)', type: 'MB_Common', consumption: c([22, 21, 20, 20, 20, 17, 22, 20, 21, 23, 31, 31, 33]) },
  { label: 'PHASE 02, MAIN ENTRANCE (Infrastructure)', accountNumber: '4300338', level: 'DC', zone: 'Direct Connection', parentMeter: 'Main Bulk (NAMA)', type: 'MB_Common', consumption: c([10, 8, 6, 6, 6, 6, 7, 7, 8, 12, 10, 18, 16]) },
  { label: 'Irrigation Tank 01 (Inlet)', accountNumber: '4300323', level: 'DC', zone: 'Direct Connection', parentMeter: 'Main Bulk (NAMA)', type: 'IRR_Servies', consumption: c([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]) },
  { label: 'Irrigation Tank 04 - (Z08)', accountNumber: '4300294', level: 'DC', zone: 'Direct Connection', parentMeter: 'Main Bulk (NAMA)', type: 'IRR_Servies', consumption: c([0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0]) },
  { label: 'Irrigation- Controller UP', accountNumber: '4300340', level: 'DC', zone: 'Direct Connection', parentMeter: 'Main Bulk (NAMA)', type: 'IRR_Servies', consumption: c([0, 0, 0, 0, 33, 491, 554, 272, 266, 181, 328, 253, 124]) },
  { label: 'Irrigation- Controller DOWN', accountNumber: '4300341', level: 'DC', zone: 'Direct Connection', parentMeter: 'Main Bulk (NAMA)', type: 'IRR_Servies', consumption: c([159, 239, 283, 0, 910, 511, 611, 343, 0, 0, 0, 0, 0]) },

  // L3 - Zone FM (17 meters)
  { label: 'Building FM', accountNumber: '4300296', level: 'L3', zone: 'Zone_01_(FM)', parentMeter: 'ZONE FM ( BULK ZONE FM )', type: 'MB_Common', consumption: c([36, 37, 52, 40, 41, 32, 44, 40, 38, 39, 44, 41, 30]) },
  { label: 'Building Taxi', accountNumber: '4300298', level: 'L3', zone: 'Zone_01_(FM)', parentMeter: 'ZONE FM ( BULK ZONE FM )', type: 'Retail', consumption: c([11, 15, 13, 15, 13, 14, 13, 17, 17, 17, 15, 20, 15]) },
  { label: 'Building B1', accountNumber: '4300300', level: 'L3', zone: 'Zone_01_(FM)', parentMeter: 'ZONE FM ( BULK ZONE FM )', type: 'Retail', consumption: c([225, 200, 266, 248, 233, 146, 227, 298, 273, 265, 250, 253, 256]) },
  { label: 'Building B2', accountNumber: '4300301', level: 'L3', zone: 'Zone_01_(FM)', parentMeter: 'ZONE FM ( BULK ZONE FM )', type: 'Retail', consumption: c([231, 189, 232, 183, 199, 172, 190, 240, 224, 248, 256, 255, 280]) },
  { label: 'Building B3', accountNumber: '4300302', level: 'L3', zone: 'Zone_01_(FM)', parentMeter: 'ZONE FM ( BULK ZONE FM )', type: 'Retail', consumption: c([166, 148, 152, 132, 160, 153, 168, 148, 165, 210, 257, 214, 177]) },
  { label: 'Building B4', accountNumber: '4300303', level: 'L3', zone: 'Zone_01_(FM)', parentMeter: 'ZONE FM ( BULK ZONE FM )', type: 'Retail', consumption: c([106, 96, 165, 145, 121, 150, 158, 179, 211, 175, 169, 161, 153]) },
  { label: 'Building B5', accountNumber: '4300304', level: 'L3', zone: 'Zone_01_(FM)', parentMeter: 'ZONE FM ( BULK ZONE FM )', type: 'Retail', consumption: c([2, 1, 1, 1, 0, 179, 62, 54, 41, 42, 37, 32, 6]) },
  { label: 'Building B6', accountNumber: '4300305', level: 'L3', zone: 'Zone_01_(FM)', parentMeter: 'ZONE FM ( BULK ZONE FM )', type: 'Retail', consumption: c([250, 220, 282, 278, 214, 195, 194, 210, 221, 229, 231, 260, 287]) },
  { label: 'Building B7', accountNumber: '4300306', level: 'L3', zone: 'Zone_01_(FM)', parentMeter: 'ZONE FM ( BULK ZONE FM )', type: 'Retail', consumption: c([175, 170, 197, 200, 200, 155, 191, 155, 168, 200, 201, 211, 214]) },
  { label: 'Building B8', accountNumber: '4300307', level: 'L3', zone: 'Zone_01_(FM)', parentMeter: 'ZONE FM ( BULK ZONE FM )', type: 'Retail', consumption: c([268, 250, 233, 0, 413, 213, 62, 84, 380, 579, 281, 280, 262]) },
  { label: 'Irrigation Tank (Z01_FM)', accountNumber: '4300308', level: 'L3', zone: 'Zone_01_(FM)', parentMeter: 'ZONE FM ( BULK ZONE FM )', type: 'IRR_Servies', consumption: c([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]) },
  { label: 'Room PUMP (FIRE)', accountNumber: '4300309', level: 'L3', zone: 'Zone_01_(FM)', parentMeter: 'ZONE FM ( BULK ZONE FM )', type: 'MB_Common', consumption: c([76, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 1, 1]) },
  { label: 'Building (MEP)', accountNumber: '4300310', level: 'L3', zone: 'Zone_01_(FM)', parentMeter: 'ZONE FM ( BULK ZONE FM )', type: 'MB_Common', consumption: c([2, 2, 1, 0, 6, 2, 1, 2, 3, 4, 4, 4, 4]) },
  { label: 'Building CIF/CB', accountNumber: '4300324', level: 'L3', zone: 'Zone_01_(FM)', parentMeter: 'ZONE FM ( BULK ZONE FM )', type: 'Retail', consumption: c([415, 294, 352, 304, 284, 242, 442, 731, 516, 274, 270, 254, 319]) },
  { label: 'Building CIF/CB (COFFEE SH)', accountNumber: '4300339', level: 'L3', zone: 'Zone_01_(FM)', parentMeter: 'ZONE FM ( BULK ZONE FM )', type: 'Retail', consumption: c([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]) },
  { label: 'Building Nursery Building', accountNumber: '4300325', level: 'L3', zone: 'Zone_01_(FM)', parentMeter: 'ZONE FM ( BULK ZONE FM )', type: 'Retail', consumption: c([4, 4, 4, 0, 6, 4, 2, 2, 7, 5, 5, 3, 4]) },
  { label: 'Cabinet FM (CONTRACTORS OFFICE)', accountNumber: '4300337', level: 'L3', zone: 'Zone_01_(FM)', parentMeter: 'ZONE FM ( BULK ZONE FM )', type: 'Building', consumption: c([67, 53, 59, 57, 51, 50, 56, 49, 39, 0, 64, 43, 36]) },

  // L3 - Zone 3A Villas
  { label: 'Z3-23 (Villa)', accountNumber: '4300038', level: 'L3', zone: 'Zone_03_(A)', parentMeter: 'ZONE 3A (BULK ZONE 3A)', type: 'Residential (Villa)', consumption: c([1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 34, 68, 20]) },
  { label: 'Z3-24 (Villa)', accountNumber: '4300091', level: 'L3', zone: 'Zone_03_(A)', parentMeter: 'ZONE 3A (BULK ZONE 3A)', type: 'Residential (Villa)', consumption: c([18, 32, 86, 100, 75, 60, 70, 63, 57, 65, 52, 65, 57]) },
  { label: 'Z3-27 (Villa)', accountNumber: '4300089', level: 'L3', zone: 'Zone_03_(A)', parentMeter: 'ZONE 3A (BULK ZONE 3A)', type: 'Residential (Villa)', consumption: c([14, 25, 63, 73, 25, 65, 121, 38, 53, 34, 81, 18, 44]) },
  { label: 'Z3-28 (Villa)', accountNumber: '4300101', level: 'L3', zone: 'Zone_03_(A)', parentMeter: 'ZONE 3A (BULK ZONE 3A)', type: 'Residential (Villa)', consumption: c([44, 33, 36, 40, 53, 43, 57, 37, 39, 22, 6, 58, 95]) },
  { label: 'Z3-29 (Villa)', accountNumber: '4300097', level: 'L3', zone: 'Zone_03_(A)', parentMeter: 'ZONE 3A (BULK ZONE 3A)', type: 'Residential (Villa)', consumption: c([0, 7, 4, 0, 0, 6, 3, 34, 20, 20, 20, 24, 23]) },
  { label: 'Z3-30 (Villa)', accountNumber: '4300081', level: 'L3', zone: 'Zone_03_(A)', parentMeter: 'ZONE 3A (BULK ZONE 3A)', type: 'Residential (Villa)', consumption: c([0, 2, 4, 0, 0, 0, 1, 0, 0, 0, 0, 0, 3]) },
  { label: 'Z3-31 (Villa)', accountNumber: '4300052', level: 'L3', zone: 'Zone_03_(A)', parentMeter: 'ZONE 3A (BULK ZONE 3A)', type: 'Residential (Villa)', consumption: c([165, 133, 30, 241, 527, 240, 109, 235, 219, 242, 233, 128, 97]) },
  { label: 'Z3-32 (Villa)', accountNumber: '4300085', level: 'L3', zone: 'Zone_03_(A)', parentMeter: 'ZONE 3A (BULK ZONE 3A)', type: 'Residential (Villa)', consumption: c([37, 36, 37, 38, 40, 40, 35, 30, 41, 38, 40, 35, 34]) },
  { label: 'Z3-33 (Villa)', accountNumber: '4300082', level: 'L3', zone: 'Zone_03_(A)', parentMeter: 'ZONE 3A (BULK ZONE 3A)', type: 'Residential (Villa)', consumption: c([44, 40, 47, 48, 49, 34, 0, 48, 48, 54, 52, 54, 49]) },
  { label: 'Z3-34 (Villa)', accountNumber: '4300087', level: 'L3', zone: 'Zone_03_(A)', parentMeter: 'ZONE 3A (BULK ZONE 3A)', type: 'Residential (Villa)', consumption: c([0, 0, 0, 20, 18, 9, 10, 41, 24, 52, 27, 29, 42]) },
  { label: 'Z3-35 (Villa)', accountNumber: '4300075', level: 'L3', zone: 'Zone_03_(A)', parentMeter: 'ZONE 3A (BULK ZONE 3A)', type: 'Residential (Villa)', consumption: c([64, 54, 62, 73, 68, 86, 70, 65, 71, 79, 74, 82, 66]) },
  { label: 'Z3-36 (Villa)', accountNumber: '4300084', level: 'L3', zone: 'Zone_03_(A)', parentMeter: 'ZONE 3A (BULK ZONE 3A)', type: 'Residential (Villa)', consumption: c([78, 74, 81, 82, 170, 168, 155, 115, 110, 89, 87, 76, 86]) },
  { label: 'Z3-37 (Villa)', accountNumber: '4300049', level: 'L3', zone: 'Zone_03_(A)', parentMeter: 'ZONE 3A (BULK ZONE 3A)', type: 'Residential (Villa)', consumption: c([26, 14, 20, 27, 49, 15, 37, 24, 20, 28, 41, 32, 30]) },
  { label: 'Z3-38 (Villa)', accountNumber: '4300005', level: 'L3', zone: 'Zone_03_(A)', parentMeter: 'ZONE 3A (BULK ZONE 3A)', type: 'Residential (Villa)', consumption: c([9, 7, 8, 7, 8, 6, 109, 24, 6, 4, 8, 4, 1]) },
  { label: 'Z3-39 (Villa)', accountNumber: '4300086', level: 'L3', zone: 'Zone_03_(A)', parentMeter: 'ZONE 3A (BULK ZONE 3A)', type: 'Residential (Villa)', consumption: c([37, 32, 35, 33, 41, 33, 38, 34, 35, 32, 41, 29, 37]) },
  { label: 'Z3-40 (Villa)', accountNumber: '4300079', level: 'L3', zone: 'Zone_03_(A)', parentMeter: 'ZONE 3A (BULK ZONE 3A)', type: 'Residential (Villa)', consumption: c([19, 23, 39, 35, 139, 39, 13, 23, 7, 42, 32, 34, 40]) },
  { label: 'Z3-41 (Villa)', accountNumber: '4300044', level: 'L3', zone: 'Zone_03_(A)', parentMeter: 'ZONE 3A (BULK ZONE 3A)', type: 'Residential (Villa)', consumption: c([13, 16, 37, 26, 25, 43, 30, 5, 75, 28, 30, 26, 27]) },
  { label: 'Z3-42 (Villa)', accountNumber: '4300002', level: 'L3', zone: 'Zone_03_(A)', parentMeter: 'ZONE 3A (BULK ZONE 3A)', type: 'Residential (Villa)', consumption: c([31, 46, 21, 62, 87, 59, 53, 65, 47, 25, 24, 23, 29]) },
  { label: 'Z3-43 (Villa)', accountNumber: '4300050', level: 'L3', zone: 'Zone_03_(A)', parentMeter: 'ZONE 3A (BULK ZONE 3A)', type: 'Residential (Villa)', consumption: c([68, 62, 53, 52, 48, 78, 55, 48, 50, 43, 40, 50, 145]) },

  // L3 - Zone 3A Building Bulks
  { label: 'D-44 Building Bulk Meter', accountNumber: '4300178', level: 'L3', zone: 'Zone_03_(A)', parentMeter: 'ZONE 3A (BULK ZONE 3A)', type: 'D_Building_Bulk', consumption: c([178, 211, 83, 86, 62, 49, 52, 59, 64, 68, 66, 66, 114]) },
  { label: 'D-45 Building Bulk Meter', accountNumber: '4300179', level: 'L3', zone: 'Zone_03_(A)', parentMeter: 'ZONE 3A (BULK ZONE 3A)', type: 'D_Building_Bulk', consumption: c([20, 30, 47, 56, 55, 10, 12, 11, 36, 29, 39, 36, 27]) },
  { label: 'D-46 Building Bulk Meter', accountNumber: '4300180', level: 'L3', zone: 'Zone_03_(A)', parentMeter: 'ZONE 3A (BULK ZONE 3A)', type: 'D_Building_Bulk', consumption: c([60, 45, 31, 68, 69, 55, 65, 85, 121, 134, 68, 60, 50]) },
  { label: 'D-47 Building Bulk Meter', accountNumber: '4300181', level: 'L3', zone: 'Zone_03_(A)', parentMeter: 'ZONE 3A (BULK ZONE 3A)', type: 'D_Building_Bulk', consumption: c([102, 64, 62, 70, 57, 83, 121, 62, 76, 96, 83, 65, 71]) },
  { label: 'D-51 Building Bulk Meter', accountNumber: '4300185', level: 'L3', zone: 'Zone_03_(A)', parentMeter: 'ZONE 3A (BULK ZONE 3A)', type: 'D_Building_Bulk', consumption: c([91, 96, 165, 166, 111, 101, 149, 154, 175, 202, 107, 96, 129]) },
  { label: 'D-74 Building Bulk Meter', accountNumber: '4300177', level: 'L3', zone: 'Zone_03_(A)', parentMeter: 'ZONE 3A (BULK ZONE 3A)', type: 'D_Building_Bulk', consumption: c([40, 32, 40, 54, 51, 63, 101, 106, 136, 116, 66, 59, 56]) },
  { label: 'D-75 Building Bulk Meter', accountNumber: '4300176', level: 'L3', zone: 'Zone_03_(A)', parentMeter: 'ZONE 3A (BULK ZONE 3A)', type: 'D_Building_Bulk', consumption: c([63, 58, 68, 72, 59, 62, 67, 101, 68, 65, 64, 57, 74]) },

  // L4 - D-44 Apartments
  { label: 'Z3-44(1A) (Building)', accountNumber: '4300030', level: 'L4', zone: 'Zone_03_(A)', parentMeter: 'D-44 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([11, 10, 11, 7, 11, 8, 2, 7, 9, 9, 11, 9, 12]) },
  { label: 'Z3-44(1B) (Building)', accountNumber: '4300031', level: 'L4', zone: 'Zone_03_(A)', parentMeter: 'D-44 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]) },
  { label: 'Z3-44(2A) (Building)', accountNumber: '4300032', level: 'L4', zone: 'Zone_03_(A)', parentMeter: 'D-44 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([8, 3, 5, 9, 7, 2, 3, 5, 6, 7, 3, 9, 9]) },
  { label: 'Z3-44(2B) (Building)', accountNumber: '4300033', level: 'L4', zone: 'Zone_03_(A)', parentMeter: 'D-44 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([7, 6, 8, 8, 3, 0, 0, 0, 0, 7, 5, 6, 6]) },
  { label: 'Z3-44(5) (Building)', accountNumber: '4300034', level: 'L4', zone: 'Zone_03_(A)', parentMeter: 'D-44 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([116, 134, 45, 25, 6, 6, 9, 8, 7, 4, 1, 0, 0]) },
  { label: 'Z3-44(6) (Building)', accountNumber: '4300035', level: 'L4', zone: 'Zone_03_(A)', parentMeter: 'D-44 Building Bulk Meter', type: 'Residential (Apart)', consumption: c([33, 32, 37, 36, 35, 32, 36, 38, 39, 40, 44, 41, 85]) },
  { label: 'D 44-Building Common Meter', accountNumber: '4300144', level: 'L4', zone: 'Zone_03_(A)', parentMeter: 'D-44 Building Bulk Meter', type: 'D_Building_Common', consumption: c([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]) },

  // L3 - Zone 3B Villas
  { label: 'Z3-1 (Villa)', accountNumber: '4300094', level: 'L3', zone: 'Zone_03_(B)', parentMeter: 'ZONE 3B (BULK ZONE 3B)', type: 'Residential (Villa)', consumption: c([3, 4, 6, 7, 7, 14, 37, 44, 37, 37, 13, 7, 10]) },
  { label: 'Z3-2 (Villa)', accountNumber: '4300098', level: 'L3', zone: 'Zone_03_(B)', parentMeter: 'ZONE 3B (BULK ZONE 3B)', type: 'Residential (Villa)', consumption: c([6, 6, 9, 7, 38, 17, 26, 20, 56, 28, 24, 19, 22]) },
  { label: 'Z3-3 (Villa)', accountNumber: '4300088', level: 'L3', zone: 'Zone_03_(B)', parentMeter: 'ZONE 3B (BULK ZONE 3B)', type: 'Residential (Villa)', consumption: c([64, 53, 71, 73, 176, 193, 136, 118, 112, 119, 96, 93, 76]) },
  { label: 'Z3-4 (Villa)', accountNumber: '4300078', level: 'L3', zone: 'Zone_03_(B)', parentMeter: 'ZONE 3B (BULK ZONE 3B)', type: 'Residential (Villa)', consumption: c([89, 49, 29, 24, 113, 129, 221, 129, 77, 95, 91, 62, 48]) },
  { label: 'Z3-5 (Villa)', accountNumber: '4300104', level: 'L3', zone: 'Zone_03_(B)', parentMeter: 'ZONE 3B (BULK ZONE 3B)', type: 'Residential (Villa)', consumption: c([40, 50, 46, 53, 51, 34, 74, 95, 102, 127, 174, 314, 163]) },
  { label: 'Z3-6 (Villa)', accountNumber: '4300100', level: 'L3', zone: 'Zone_03_(B)', parentMeter: 'ZONE 3B (BULK ZONE 3B)', type: 'Residential (Villa)', consumption: c([30, 30, 42, 36, 30, 32, 58, 34, 31, 30, 39, 27, 25]) },
  { label: 'Z3-7 (Villa)', accountNumber: '4300090', level: 'L3', zone: 'Zone_03_(B)', parentMeter: 'ZONE 3B (BULK ZONE 3B)', type: 'Residential (Villa)', consumption: c([37, 42, 51, 56, 58, 45, 47, 15, 28, 32, 44, 35, 43]) },
  { label: 'Z3-8 (Villa)', accountNumber: '4300105', level: 'L3', zone: 'Zone_03_(B)', parentMeter: 'ZONE 3B (BULK ZONE 3B)', type: 'Residential (Villa)', consumption: c([81, 92, 224, 350, 414, 347, 132, 54, 51, 53, 54, 62, 61]) },
  { label: 'Z3-9 (Villa)', accountNumber: '4300096', level: 'L3', zone: 'Zone_03_(B)', parentMeter: 'ZONE 3B (BULK ZONE 3B)', type: 'Residential (Villa)', consumption: c([65, 43, 62, 60, 69, 75, 81, 72, 44, 49, 47, 52, 60]) },
  { label: 'Z3-10 (Villa)', accountNumber: '4300092', level: 'L3', zone: 'Zone_03_(B)', parentMeter: 'ZONE 3B (BULK ZONE 3B)', type: 'Residential (Villa)', consumption: c([75, 76, 70, 100, 89, 95, 84, 79, 68, 68, 52, 39, 32]) },
  { label: 'Z3-12 (Villa)', accountNumber: '4300076', level: 'L3', zone: 'Zone_03_(B)', parentMeter: 'ZONE 3B (BULK ZONE 3B)', type: 'Residential (Villa)', consumption: c([72, 55, 60, 181, 178, 249, 188, 179, 165, 77, 114, 90, 110]) },
  { label: 'Z3-13 (Villa)', accountNumber: '4300025', level: 'L3', zone: 'Zone_03_(B)', parentMeter: 'ZONE 3B (BULK ZONE 3B)', type: 'Residential (Villa)', consumption: c([20, 19, 21, 24, 20, 15, 6, 18, 18, 17, 18, 12, 18]) },
  { label: 'Z3-14 (Villa)', accountNumber: '4300060', level: 'L3', zone: 'Zone_03_(B)', parentMeter: 'ZONE 3B (BULK ZONE 3B)', type: 'Residential (Villa)', consumption: c([160, 102, 33, 42, 32, 83, 74, 15, 15, 14, 14, 7, 6]) },
  { label: 'Z3-15 (Villa)', accountNumber: '4300057', level: 'L3', zone: 'Zone_03_(B)', parentMeter: 'ZONE 3B (BULK ZONE 3B)', type: 'Residential (Villa)', consumption: c([40, 36, 40, 46, 44, 44, 38, 45, 41, 39, 38, 38, 38]) },
  { label: 'Z3-16 (Villa)', accountNumber: '4300103', level: 'L3', zone: 'Zone_03_(B)', parentMeter: 'ZONE 3B (BULK ZONE 3B)', type: 'Residential (Villa)', consumption: c([1, 28, 3, 5, 21, 64, 51, 22, 54, 12, 11, 19, 16]) },
  { label: 'Z3-17 (Villa)', accountNumber: '4300080', level: 'L3', zone: 'Zone_03_(B)', parentMeter: 'ZONE 3B (BULK ZONE 3B)', type: 'Residential (Villa)', consumption: c([16, 10, 6, 13, 15, 13, 14, 12, 14, 20, 22, 22, 28]) },
  { label: 'Z3-18 (Villa)', accountNumber: '4300083', level: 'L3', zone: 'Zone_03_(B)', parentMeter: 'ZONE 3B (BULK ZONE 3B)', type: 'Residential (Villa)', consumption: c([35, 32, 38, 40, 76, 99, 92, 83, 63, 61, 21, 6, 2]) },
  { label: 'Z3-19 (Villa)', accountNumber: '4300099', level: 'L3', zone: 'Zone_03_(B)', parentMeter: 'ZONE 3B (BULK ZONE 3B)', type: 'Residential (Villa)', consumption: c([138, 4, 27, 108, 77, 8, 0, 45, 85, 11, 7, 9, 7]) },
  { label: 'Z3-20 (Villa)', accountNumber: '4300020', level: 'L3', zone: 'Zone_03_(B)', parentMeter: 'ZONE 3B (BULK ZONE 3B)', type: 'Residential (Villa)', consumption: c([12, 13, 8, 3, 5, 14, 12, 10, 3, 9, 5, 10, 9]) },
  { label: 'Z3-21 (Villa)', accountNumber: '4300009', level: 'L3', zone: 'Zone_03_(B)', parentMeter: 'ZONE 3B (BULK ZONE 3B)', type: 'Residential (Villa)', consumption: c([39, 50, 46, 47, 51, 39, 69, 56, 50, 47, 43, 50, 41]) },
  { label: 'Z3-22 (Villa)', accountNumber: '4300102', level: 'L3', zone: 'Zone_03_(B)', parentMeter: 'ZONE 3B (BULK ZONE 3B)', type: 'Residential (Villa)', consumption: c([21, 21, 56, 31, 32, 34, 34, 32, 74, 54, 25, 27, 22]) },

  // L3 - Zone 3B Building Bulks
  { label: 'D-52 Building Bulk Meter', accountNumber: '4300186', level: 'L3', zone: 'Zone_03_(B)', parentMeter: 'ZONE 3B (BULK ZONE 3B)', type: 'D_Building_Bulk', consumption: c([40, 34, 27, 37, 48, 46, 52, 47, 26, 104, 41, 36, 37]) },
  { label: 'D-53 Building Bulk Meter', accountNumber: '4300311', level: 'L3', zone: 'Zone_03_(B)', parentMeter: 'ZONE 3B (BULK ZONE 3B)', type: 'D_Building_Bulk', consumption: c([17, 25, 28, 39, 21, 27, 26, 30, 46, 94, 106, 100, 96]) },
  { label: 'D-54 Building Bulk Meter', accountNumber: '4300312', level: 'L3', zone: 'Zone_03_(B)', parentMeter: 'ZONE 3B (BULK ZONE 3B)', type: 'D_Building_Bulk', consumption: c([62, 50, 68, 96, 51, 56, 75, 55, 53, 45, 67, 46, 50]) },
  { label: 'D-55 Building Bulk Meter', accountNumber: '4300313', level: 'L3', zone: 'Zone_03_(B)', parentMeter: 'ZONE 3B (BULK ZONE 3B)', type: 'D_Building_Bulk', consumption: c([70, 58, 112, 181, 94, 61, 78, 82, 54, 90, 76, 77, 74]) },
  { label: 'D-56 Building Bulk Meter', accountNumber: '4300314', level: 'L3', zone: 'Zone_03_(B)', parentMeter: 'ZONE 3B (BULK ZONE 3B)', type: 'D_Building_Bulk', consumption: c([92, 17, 39, 0, 40, 40, 91, 28, 29, 27, 40, 42, 43]) },
  { label: 'D-57 Building Bulk Meter', accountNumber: '4300315', level: 'L3', zone: 'Zone_03_(B)', parentMeter: 'ZONE 3B (BULK ZONE 3B)', type: 'D_Building_Bulk', consumption: c([47, 64, 49, 64, 72, 46, 50, 54, 66, 31, 0, 0, 87]) },
  { label: 'D-58 Building Bulk Meter', accountNumber: '4300316', level: 'L3', zone: 'Zone_03_(B)', parentMeter: 'ZONE 3B (BULK ZONE 3B)', type: 'D_Building_Bulk', consumption: c([55, 47, 63, 94, 83, 62, 63, 81, 75, 66, 54, 58, 64]) },
  { label: 'D-59 Building Bulk Meter', accountNumber: '4300317', level: 'L3', zone: 'Zone_03_(B)', parentMeter: 'ZONE 3B (BULK ZONE 3B)', type: 'D_Building_Bulk', consumption: c([57, 54, 53, 66, 47, 44, 53, 56, 57, 51, 45, 63, 62]) },
  { label: 'D-60 Building Bulk Meter', accountNumber: '4300318', level: 'L3', zone: 'Zone_03_(B)', parentMeter: 'ZONE 3B (BULK ZONE 3B)', type: 'D_Building_Bulk', consumption: c([55, 75, 94, 102, 91, 84, 83, 73, 88, 32, 49, 66, 99]) },
  { label: 'D-61 Building Bulk Meter', accountNumber: '4300319', level: 'L3', zone: 'Zone_03_(B)', parentMeter: 'ZONE 3B (BULK ZONE 3B)', type: 'D_Building_Bulk', consumption: c([41, 43, 76, 82, 49, 43, 62, 66, 50, 49, 40, 40, 46]) },
  { label: 'D-62 Building Bulk Meter', accountNumber: '4300187', level: 'L3', zone: 'Zone_03_(B)', parentMeter: 'ZONE 3B (BULK ZONE 3B)', type: 'D_Building_Bulk', consumption: c([50, 29, 42, 34, 22, 27, 46, 33, 37, 38, 96, 87, 82]) },
  { label: 'Irrigation Tank 02 (Z03)', accountNumber: '4300320', level: 'L3', zone: 'Zone_03_(B)', parentMeter: 'ZONE 3B (BULK ZONE 3B)', type: 'IRR_Servies', consumption: c([49, 47, 43, 15, 322, 106, 91, 92, 225, 548, 873, 321, 0]) },

  // L3 - Zone 3A - D-48, D-49, D-50 Building Bulks
  { label: 'D-48 Building Bulk Meter', accountNumber: '4300182', level: 'L3', zone: 'Zone_03_(A)', parentMeter: 'ZONE 3A (BULK ZONE 3A)', type: 'D_Building_Bulk', consumption: c([16, 16, 20, 18, 25, 47, 28, 37, 24, 39, 30, 33, 35]) },
  { label: 'D-49 Building Bulk Meter', accountNumber: '4300183', level: 'L3', zone: 'Zone_03_(A)', parentMeter: 'ZONE 3A (BULK ZONE 3A)', type: 'D_Building_Bulk', consumption: c([58, 63, 59, 0, 108, 42, 96, 96, 96, 340, 96, 96, 78]) },
  { label: 'D-50 Building Bulk Meter', accountNumber: '4300184', level: 'L3', zone: 'Zone_03_(A)', parentMeter: 'ZONE 3A (BULK ZONE 3A)', type: 'D_Building_Bulk', consumption: c([65, 73, 91, 49, 34, 40, 60, 44, 6, 75, 41, 41, 57]) },

  // L3 - Zone 5 Villas
  { label: 'Z5-1', accountNumber: '4300172', level: 'L3', zone: 'Zone_05', parentMeter: 'ZONE 5 (Bulk Zone 5)', type: 'Residential (Villa)', consumption: c([5, 5, 4, 5, 47, 5, 33, 12, 7, 8, 9, 10, 4]) },
  { label: 'Z5-3', accountNumber: '4300170', level: 'L3', zone: 'Zone_05', parentMeter: 'ZONE 5 (Bulk Zone 5)', type: 'Residential (Villa)', consumption: c([147, 80, 75, 100, 70, 82, 95, 100, 142, 120, 114, 105, 109]) },
  { label: 'Z5-4', accountNumber: '4300150', level: 'L3', zone: 'Zone_05', parentMeter: 'ZONE 5 (Bulk Zone 5)', type: 'Residential (Villa)', consumption: c([78, 96, 47, 41, 29, 14, 49, 31, 34, 20, 10, 88, 45]) },
  { label: 'Z5-5', accountNumber: '4300146', level: 'L3', zone: 'Zone_05', parentMeter: 'ZONE 5 (Bulk Zone 5)', type: 'Residential (Villa)', consumption: c([3, 4, 4, 5, 39, 1, 60, 240, 54, 67, 55, 49, 44]) },
  { label: 'Z5-9', accountNumber: '4300155', level: 'L3', zone: 'Zone_05', parentMeter: 'ZONE 5 (Bulk Zone 5)', type: 'Residential (Villa)', consumption: c([37, 45, 46, 56, 77, 67, 56, 54, 45, 60, 63, 48, 66]) },
  { label: 'Z5-12', accountNumber: '4300166', level: 'L3', zone: 'Zone_05', parentMeter: 'ZONE 5 (Bulk Zone 5)', type: 'Residential (Villa)', consumption: c([43, 42, 45, 67, 81, 97, 84, 58, 64, 93, 53, 49, 56]) },
  { label: 'Z5-13', accountNumber: '4300058', level: 'L3', zone: 'Zone_05', parentMeter: 'ZONE 5 (Bulk Zone 5)', type: 'Residential (Villa)', consumption: c([71, 97, 101, 118, 109, 116, 154, 146, 130, 168, 67, 48, 117]) },
  { label: 'Z5-14', accountNumber: '4300059', level: 'L3', zone: 'Zone_05', parentMeter: 'ZONE 5 (Bulk Zone 5)', type: 'Residential (Villa)', consumption: c([71, 86, 87, 91, 82, 96, 67, 81, 58, 98, 80, 34, 35]) },
  { label: 'Z5-15', accountNumber: '4300154', level: 'L3', zone: 'Zone_05', parentMeter: 'ZONE 5 (Bulk Zone 5)', type: 'Residential (Villa)', consumption: c([34, 19, 18, 22, 30, 18, 20, 21, 18, 18, 15, 13, 16]) },
  { label: 'Z5-16', accountNumber: '4300168', level: 'L3', zone: 'Zone_05', parentMeter: 'ZONE 5 (Bulk Zone 5)', type: 'Residential (Villa)', consumption: c([27, 25, 42, 51, 53, 48, 71, 50, 53, 49, 52, 56, 64]) },
  { label: 'Z5-17', accountNumber: '4300001', level: 'L3', zone: 'Zone_05', parentMeter: 'ZONE 5 (Bulk Zone 5)', type: 'Residential (Villa)', consumption: c([110, 77, 86, 89, 58, 72, 87, 74, 109, 84, 83, 77, 97]) },
  { label: 'Z5-20', accountNumber: '4300152', level: 'L3', zone: 'Zone_05', parentMeter: 'ZONE 5 (Bulk Zone 5)', type: 'Residential (Villa)', consumption: c([24, 28, 151, 165, 202, 214, 196, 161, 131, 102, 97, 80, 76]) },
  { label: 'Z5-21', accountNumber: '4300169', level: 'L3', zone: 'Zone_05', parentMeter: 'ZONE 5 (Bulk Zone 5)', type: 'Residential (Villa)', consumption: c([25, 20, 36, 58, 57, 43, 38, 22, 97, 25, 89, 31, 11]) },
  { label: 'Z5-22', accountNumber: '4300163', level: 'L3', zone: 'Zone_05', parentMeter: 'ZONE 5 (Bulk Zone 5)', type: 'Residential (Villa)', consumption: c([14, 34, 192, 244, 201, 186, 192, 175, 80, 108, 78, 15, 35]) },
  { label: 'Z5-25', accountNumber: '4300157', level: 'L3', zone: 'Zone_05', parentMeter: 'ZONE 5 (Bulk Zone 5)', type: 'Residential (Villa)', consumption: c([37, 22, 12, 72, 104, 83, 57, 31, 13, 45, 33, 36, 34]) },
  { label: 'Z5-26', accountNumber: '4300156', level: 'L3', zone: 'Zone_05', parentMeter: 'ZONE 5 (Bulk Zone 5)', type: 'Residential (Villa)', consumption: c([60, 39, 18, 69, 107, 82, 57, 28, 29, 11, 19, 22, 11]) },
  { label: 'Z5-27', accountNumber: '4300165', level: 'L3', zone: 'Zone_05', parentMeter: 'ZONE 5 (Bulk Zone 5)', type: 'Residential (Villa)', consumption: c([35, 13, 19, 12, 15, 9, 9, 10, 3, 11, 9, 11, 31]) },
  { label: 'Z5-28', accountNumber: '4300161', level: 'L3', zone: 'Zone_05', parentMeter: 'ZONE 5 (Bulk Zone 5)', type: 'Residential (Villa)', consumption: c([50, 21, 9, 8, 14, 19, 16, 6, 8, 69, 54, 47, 55]) },
  { label: 'Z5-29', accountNumber: '4300160', level: 'L3', zone: 'Zone_05', parentMeter: 'ZONE 5 (Bulk Zone 5)', type: 'Residential (Villa)', consumption: c([48, 64, 23, 19, 28, 24, 19, 18, 7, 4, 5, 25, 2]) },
  { label: 'Z5-30', accountNumber: '4300147', level: 'L3', zone: 'Zone_05', parentMeter: 'ZONE 5 (Bulk Zone 5)', type: 'Residential (Villa)', consumption: c([65, 82, 75, 113, 203, 238, 212, 155, 83, 73, 110, 144, 120]) },
  { label: 'Z5-31', accountNumber: '4300158', level: 'L3', zone: 'Zone_05', parentMeter: 'ZONE 5 (Bulk Zone 5)', type: 'Residential (Villa)', consumption: c([32, 23, 16, 16, 4, 1, 0, 0, 41, 13, 9, 12, 28]) },
  { label: 'Z5-32', accountNumber: '4300162', level: 'L3', zone: 'Zone_05', parentMeter: 'ZONE 5 (Bulk Zone 5)', type: 'Residential (Villa)', consumption: c([60, 111, 80, 71, 68, 51, 25, 43, 36, 49, 42, 50, 18]) },
  { label: 'Irrigation Tank 03 (Z05)', accountNumber: '4300321', level: 'L3', zone: 'Zone_05', parentMeter: 'ZONE 5 (Bulk Zone 5)', type: 'IRR_Servies', consumption: c([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]) },

  // L3 - Zone 8 Villas
  { label: 'Z8-1', accountNumber: '4300188', level: 'L3', zone: 'Zone_08', parentMeter: 'BULK ZONE 8', type: 'Residential (Villa)', consumption: c([1, 2, 3, 16, 7, 0, 2, 0, 0, 1, 1, 0, 0]) },
  { label: 'Z8-5', accountNumber: '4300287', level: 'L3', zone: 'Zone_08', parentMeter: 'BULK ZONE 8', type: 'Residential (Villa)', consumption: c([142, 278, 313, 336, 325, 236, 224, 98, 343, 203, 155, 183, 156]) },
  { label: 'Z8-9', accountNumber: '4300288', level: 'L3', zone: 'Zone_08', parentMeter: 'BULK ZONE 8', type: 'Residential (Villa)', consumption: c([5, 12, 6, 4, 6, 3, 1, 1, 1, 1, 1, 1, 0]) },
  { label: 'Z8-11', accountNumber: '4300023', level: 'L3', zone: 'Zone_08', parentMeter: 'BULK ZONE 8', type: 'Residential (Villa)', consumption: c([0, 0, 0, 0, 0, 0, 0, 0, 15, 4, 0, 0, 0]) },
  { label: 'Z8-12', accountNumber: '4300196', level: 'L3', zone: 'Zone_08', parentMeter: 'BULK ZONE 8', type: 'Residential (Villa)', consumption: c([235, 185, 258, 266, 295, 388, 464, 550, 320, 233, 199, 134, 110]) },
  { label: 'Z8-13', accountNumber: '4300024', level: 'L3', zone: 'Zone_08', parentMeter: 'BULK ZONE 8', type: 'Residential (Villa)', consumption: c([0, 0, 0, 0, 0, 1, 229, 245, 254, 258, 263, 173, 157]) },
  { label: 'Z8-15', accountNumber: '4300198', level: 'L3', zone: 'Zone_08', parentMeter: 'BULK ZONE 8', type: 'Residential (Villa)', consumption: c([98, 58, 73, 125, 112, 121, 123, 126, 109, 107, 129, 126, 92]) },
  { label: 'Z8-16', accountNumber: '4300199', level: 'L3', zone: 'Zone_08', parentMeter: 'BULK ZONE 8', type: 'Residential (Villa)', consumption: c([66, 68, 59, 98, 95, 82, 129, 252, 99, 98, 78, 94, 72]) },
  { label: 'Z8-17', accountNumber: '4300200', level: 'L3', zone: 'Zone_08', parentMeter: 'BULK ZONE 8', type: 'Residential (Villa)', consumption: c([161, 152, 187, 205, 238, 211, 191, 200, 189, 206, 200, 170, 156]) },
  { label: 'Z8-18', accountNumber: '4300289', level: 'L3', zone: 'Zone_08', parentMeter: 'BULK ZONE 8', type: 'Residential (Villa)', consumption: c([122, 102, 331, 342, 359, 361, 242, 127, 157, 137, 141, 111, 113]) },
  { label: 'Z8-19', accountNumber: '4300290', level: 'L3', zone: 'Zone_08', parentMeter: 'BULK ZONE 8', type: 'Residential (Villa)', consumption: c([104, 71, 226, 275, 274, 244, 197, 187, 168, 223, 164, 79, 91]) },
  { label: 'Z8-20', accountNumber: '4300291', level: 'L3', zone: 'Zone_08', parentMeter: 'BULK ZONE 8', type: 'Residential (Villa)', consumption: c([146, 101, 307, 298, 300, 90, 122, 106, 160, 125, 96, 94, 108]) },
  { label: 'Z8-21', accountNumber: '4300292', level: 'L3', zone: 'Zone_08', parentMeter: 'BULK ZONE 8', type: 'Residential (Villa)', consumption: c([99, 53, 284, 254, 154, 115, 60, 60, 63, 62, 84, 30, 47]) },
  { label: 'Z8-22', accountNumber: '4300293', level: 'L3', zone: 'Zone_08', parentMeter: 'BULK ZONE 8', type: 'Residential (Villa)', consumption: c([225, 147, 327, 451, 387, 254, 105, 55, 48, 31, 35, 38, 16]) },

  // L3 - Village Square
  { label: 'Irrigation Tank - VS PO Water', accountNumber: '4300326', level: 'L3', zone: 'Zone_VS', parentMeter: 'Village Square (Zone Bulk)', type: 'IRR_Servies', consumption: c([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]) },
  { label: 'Coffee 1 (GF Shop No.591)', accountNumber: '4300327', level: 'L3', zone: 'Zone_VS', parentMeter: 'Village Square (Zone Bulk)', type: 'Retail', consumption: c([1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]) },
  { label: 'Coffee 2 (GF Shop No.594 A)', accountNumber: '4300329', level: 'L3', zone: 'Zone_VS', parentMeter: 'Village Square (Zone Bulk)', type: 'Retail', consumption: c([3, 3, 4, 5, 5, 4, 9, 5, 16, 10, 11, 14, 7]) },
  { label: 'Supermarket (FF Shop No.591)', accountNumber: '4300330', level: 'L3', zone: 'Zone_VS', parentMeter: 'Village Square (Zone Bulk)', type: 'Retail', consumption: c([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0]) },
  { label: 'Pharmacy (FF Shop No.591 A)', accountNumber: '4300331', level: 'L3', zone: 'Zone_VS', parentMeter: 'Village Square (Zone Bulk)', type: 'Retail', consumption: c([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]) },
  { label: 'Laundry Services (FF Shop No.593)', accountNumber: '4300332', level: 'L3', zone: 'Zone_VS', parentMeter: 'Village Square (Zone Bulk)', type: 'Retail', consumption: c([33, 25, 22, 0, 44, 28, 44, 42, 45, 49, 61, 75, 86]) },
  { label: 'Shop No.593 A', accountNumber: '4300333', level: 'L3', zone: 'Zone_VS', parentMeter: 'Village Square (Zone Bulk)', type: 'Retail', consumption: c([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]) },

  // L3 - Sales Center
  { label: 'Sale Centre Caffe & Bar (GF Shop No.592 A)', accountNumber: '4300328', level: 'L3', zone: 'Zone_SC', parentMeter: 'Sale Centre (Zone Bulk)', type: 'Retail', consumption: c([0, 1, 3, 5, 12, 5, 20, 33, 28, 43, 40, 60, 53]) },
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
