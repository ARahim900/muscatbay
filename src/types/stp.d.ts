
/**
 * Type definitions for STP (Sewage Treatment Plant) system data
 */

export interface STPDailyRecord {
  date: string;
  tankerTrips: number;
  expectedVolumeTankers: number;
  directSewageMB: number;
  totalInfluent: number;
  totalWaterProcessed: number;
  tseToIrrigation: number;
}

export interface STPDailyData {
  metadata: {
    version: string;
    timestamp: string;
    description: string;
    units: {
      volume: string;
      tankerTrips: string;
    };
  };
  data: STPDailyRecord[];
}

export interface STPMonthlyAggregate {
  month: string;
  tankerTrips: number;
  tankerVolume: number;
  directSewage: number;
  totalInfluent: number;
  waterProcessed: number;
  tseIrrigation: number;
  capacity: number;
  utilizationPercentage: string;
  processingEfficiency: string;
}

export interface STPFilters {
  timeRange: '1D' | '7D' | '1M' | '3M' | 'ALL';
  year: string;
  month: string;
  aggregation: 'daily' | 'weekly' | 'monthly';
}
