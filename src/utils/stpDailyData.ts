
/**
 * STP daily data types and helper functions
 * 
 * Note: This file now serves as a bridge to the new data service architecture.
 * For new code, import directly from src/services/stpService.ts
 */

import { STPDailyRecord } from '@/types/stp';
import { 
  fetchSTPDailyData,
  filterDataByDateRange,
  filterDataByTimeRange,
  calculateMonthlyAggregates
} from '@/services/stpService';

export const getSTPDailyData = async (): Promise<STPDailyRecord[]> => {
  try {
    return await fetchSTPDailyData();
  } catch (error) {
    console.error('Error fetching STP daily data:', error);
    return [];
  }
};

// Re-export functions for backward compatibility
export {
  filterDataByDateRange,
  filterDataByTimeRange,
  calculateMonthlyAggregates
};

// Export the type for backward compatibility
export type { STPDailyRecord };
