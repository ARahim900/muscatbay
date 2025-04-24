
/**
 * STP (Sewage Treatment Plant) data service for Muscat Bay operations web application
 */
import { fetchData } from './dataService';
import { STPDailyData, STPDailyRecord } from '@/types/stp';

/**
 * Fetches STP daily data
 * @param signal Optional AbortSignal for request cancellation
 * @returns Promise with STP daily records
 */
export async function fetchSTPDailyData(signal?: AbortSignal): Promise<STPDailyRecord[]> {
  try {
    const response = await fetchData<STPDailyData>(
      'stp/daily-data.json',
      {
        signal,
        errorMessage: 'Failed to load STP daily data'
      }
    );
    
    return response.data || [];
  } catch (error) {
    console.error('Error in fetchSTPDailyData:', error);
    throw error;
  }
}

/**
 * Fetches STP monthly data
 * @param signal Optional AbortSignal for request cancellation
 * @returns Promise with STP monthly data
 */
export async function fetchSTPMonthlyData(signal?: AbortSignal): Promise<any[]> {
  try {
    const response = await fetchData(
      'stp/monthly-data.json',
      {
        signal,
        errorMessage: 'Failed to load STP monthly data'
      }
    );
    
    if (response && response.data) {
      return response.data;
    }
    return [];
  } catch (error) {
    console.error('Error in fetchSTPMonthlyData:', error);
    throw error;
  }
}

/**
 * Filters STP data by date range
 * @param data Array of STP daily records
 * @param startDate Start date for filtering
 * @param endDate End date for filtering
 * @returns Filtered array of STP daily records
 */
export function filterDataByDateRange(data: STPDailyRecord[], startDate: Date, endDate: Date): STPDailyRecord[] {
  if (!data || !Array.isArray(data)) return [];
  
  return data.filter(record => {
    const recordDate = new Date(record.date);
    return recordDate >= startDate && recordDate <= endDate;
  });
}

/**
 * Filters STP data by time range within a day
 * @param data Array of STP daily records
 * @param startHour Start hour (0-23)
 * @param endHour End hour (0-23)
 * @returns Filtered array of STP daily records
 */
export function filterDataByTimeRange(data: STPDailyRecord[], startHour: number, endHour: number): STPDailyRecord[] {
  if (!data || !Array.isArray(data)) return [];
  
  // This is a placeholder. In a real application, this would filter by hour if hourly data is available
  return data;
}

/**
 * Calculates monthly aggregates from daily data
 * @param dailyData Array of STP daily records
 * @returns Object with monthly aggregated data
 */
export function calculateMonthlyAggregates(dailyData: STPDailyRecord[]): any[] {
  if (!dailyData || !Array.isArray(dailyData)) return [];
  
  const monthlyData: Record<string, any> = {};
  
  dailyData.forEach(record => {
    const date = new Date(record.date);
    const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyData[yearMonth]) {
      monthlyData[yearMonth] = {
        month: yearMonth,
        tankerTrips: 0,
        totalInfluent: 0,
        totalWaterProcessed: 0,
        tseToIrrigation: 0,
        directSewageMb: 0,
        expectedVolumeTankers: 0,
        bodAvg: 0,
        codAvg: 0,
        tssAvg: 0,
        days: 0
      };
    }
    
    const monthly = monthlyData[yearMonth];
    monthly.tankerTrips += record.tankerTrips || 0;
    monthly.totalInfluent += record.totalInfluent || 0;
    monthly.totalWaterProcessed += record.totalWaterProcessed || 0;
    monthly.tseToIrrigation += record.tseToIrrigation || 0;
    monthly.directSewageMb += record.directSewageMb || 0;
    monthly.expectedVolumeTankers += record.expectedVolumeTankers || 0;
    
    if (record.bod) {
      monthly.bodAvg = (monthly.bodAvg * monthly.days + record.bod) / (monthly.days + 1);
    }
    if (record.cod) {
      monthly.codAvg = (monthly.codAvg * monthly.days + record.cod) / (monthly.days + 1);
    }
    if (record.tss) {
      monthly.tssAvg = (monthly.tssAvg * monthly.days + record.tss) / (monthly.days + 1);
    }
    
    monthly.days++;
  });
  
  return Object.values(monthlyData);
}
