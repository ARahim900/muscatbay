
/**
 * Type definitions for STP (Sewage Treatment Plant) data
 */

export interface STPDailyRecord {
  date: string;
  bod?: number;
  cod?: number;
  tss?: number;
  nh4_n?: number;
  tn?: number;
  tp?: number;
  ph?: number;
  tankerTrips?: number;
  expectedVolumeTankers?: number;
  directSewageMb?: number;
  totalInfluent?: number;
  totalWaterProcessed?: number;
  tseToIrrigation?: number;
}

export interface STPDailyData {
  metadata: {
    version: string;
    timestamp: string;
    description: string;
  };
  data: STPDailyRecord[];
}

export interface STPMonthlyAggregate {
  month: string;
  tankerTrips: number;
  totalInfluent: number;
  totalWaterProcessed: number;
  tseToIrrigation: number;
  directSewageMb: number;
  expectedVolumeTankers: number;
  bodAvg: number;
  codAvg: number;
  tssAvg: number;
  days: number;
}

export interface STPFilters {
  year: number;
  month: number | 'all';
  view: 'daily' | 'monthly' | 'performance';
  sortBy: 'date' | 'bod' | 'cod' | 'tss';
  sortOrder: 'asc' | 'desc';
}
