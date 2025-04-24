
/**
 * Sewage Treatment Plant (STP) data service for Muscat Bay operations web application
 */
import { fetchData } from './dataService';
import { STPDailyData, STPDailyRecord } from '@/types/stp';

/**
 * Fetches STP daily operational data
 * @param signal Optional AbortSignal for request cancellation
 * @returns Promise with STP daily data
 */
export async function fetchSTPDailyData(signal?: AbortSignal): Promise<STPDailyRecord[]> {
  try {
    const response = await fetchData<STPDailyData>(
      'stp/daily.json',
      {
        signal,
        errorMessage: 'Failed to load STP daily operational data'
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error in fetchSTPDailyData:', error);
    throw error;
  }
}

/**
 * Filters STP data by date range
 * @param data STP daily data
 * @param startDate Start date of filter range
 * @param endDate End date of filter range
 * @returns Filtered STP data
 */
export function filterDataByDateRange(
  data: STPDailyRecord[],
  startDate: Date,
  endDate: Date
): STPDailyRecord[] {
  if (!data || data.length === 0) {
    return [];
  }
  
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  return data.filter(record => {
    const recordDate = new Date(record.date);
    return recordDate >= start && recordDate <= end;
  });
}

/**
 * Filters STP data by time range
 * @param data STP daily data
 * @param timeRange Time range code ('1D', '7D', '1M', '3M', 'ALL')
 * @returns Filtered STP data
 */
export function filterDataByTimeRange(
  data: STPDailyRecord[],
  timeRange: '1D' | '7D' | '1M' | '3M' | 'ALL'
): STPDailyRecord[] {
  if (!data || data.length === 0) {
    return [];
  }

  switch (timeRange) {
    case '1D':
      // Last day data
      return data.slice(-1);
    case '7D':
      // Last 7 days data
      return data.slice(-7);
    case '1M':
      // Last month (approximating as last 30 days)
      return data.slice(-30);
    case '3M':
      // Last 3 months (approximating as last 90 days)
      return data.slice(-90);
    case 'ALL':
    default:
      return data;
  }
}

/**
 * Calculates monthly aggregates from daily STP data
 * @param data STP daily data
 * @returns Monthly aggregated STP data
 */
export function calculateMonthlyAggregates(data: STPDailyRecord[]) {
  if (!data || data.length === 0) {
    return [];
  }

  const monthlyData: Record<string, {
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
  }> = {};

  data.forEach(record => {
    const date = new Date(record.date);
    const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    const monthName = date.toLocaleString('default', { month: 'short' });
    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const capacity = 750 * daysInMonth; // 750 m³/day capacity

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        month: monthName,
        tankerTrips: 0,
        tankerVolume: 0,
        directSewage: 0,
        totalInfluent: 0,
        waterProcessed: 0,
        tseIrrigation: 0,
        capacity,
        utilizationPercentage: '0',
        processingEfficiency: '0'
      };
    }

    monthlyData[monthKey].tankerTrips += record.tankerTrips;
    monthlyData[monthKey].tankerVolume += record.expectedVolumeTankers;
    monthlyData[monthKey].directSewage += record.directSewageMB;
    monthlyData[monthKey].totalInfluent += record.totalInfluent;
    monthlyData[monthKey].waterProcessed += record.totalWaterProcessed;
    monthlyData[monthKey].tseIrrigation += record.tseToIrrigation;
  });

  // Calculate percentages after all data is aggregated
  Object.keys(monthlyData).forEach(key => {
    const month = monthlyData[key];
    month.utilizationPercentage = ((month.totalInfluent / month.capacity) * 100).toFixed(1);
    month.processingEfficiency = ((month.tseIrrigation / month.totalInfluent) * 100).toFixed(1);
  });

  return Object.values(monthlyData);
}
