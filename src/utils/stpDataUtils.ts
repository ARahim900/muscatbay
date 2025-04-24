
import { fetchData } from '@/services/dataService';
import { STPDailyData } from '@/types/stp';

/**
 * Loads STP daily data from JSON file
 */
export async function stpDailyData(): Promise<STPDailyData[]> {
  try {
    const data = await fetchData<{ records: STPDailyData[] }>('stp/daily.json');
    return data?.records || [];
  } catch (error) {
    console.error('Error loading STP daily data:', error);
    return [];
  }
}

/**
 * Loads STP monthly data from JSON file
 */
export async function stpMonthlyData(): Promise<any[]> {
  try {
    const data = await fetchData<{ records: any[] }>('stp/monthly.json');
    return data?.records || [];
  } catch (error) {
    console.error('Error loading STP monthly data:', error);
    return [];
  }
}

/**
 * Formats a date string to a readable format
 * @param dateStr Date string in YYYY-MM-DD format
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Formats a month string to a readable format
 * @param monthStr Month string in YYYY-MM format
 */
export function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long'
  });
}

/**
 * Calculates efficiency statistics from monthly data
 * @param monthlyData Array of monthly STP data
 */
export function calculateEfficiencyStats(monthlyData: any[]): any {
  if (!monthlyData || monthlyData.length === 0) {
    return {
      avgUtilization: 0,
      avgProcessing: 0,
      trend: []
    };
  }

  const trend = monthlyData.map(month => ({
    month: formatMonth(month.month),
    utilization: month.utilizationPercentage || 0,
    processing: month.processingEfficiency || 0
  }));

  const avgUtilization = monthlyData.reduce((sum, month) => sum + (month.utilizationPercentage || 0), 0) / monthlyData.length;
  const avgProcessing = monthlyData.reduce((sum, month) => sum + (month.processingEfficiency || 0), 0) / monthlyData.length;

  return {
    avgUtilization: parseFloat(avgUtilization.toFixed(1)),
    avgProcessing: parseFloat(avgProcessing.toFixed(1)),
    trend
  };
}

/**
 * Calculates daily metrics for a specific month
 * @param dailyData Array of daily STP data
 * @param month Month in YYYY-MM format
 */
export function calculateMonthlyMetrics(dailyData: STPDailyData[], month: string): any {
  if (!dailyData || dailyData.length === 0) {
    return {
      totalTankerTrips: 0,
      totalInfluent: 0,
      avgProcessingEfficiency: 0
    };
  }

  const monthData = dailyData.filter(day => day.date.startsWith(month));
  
  if (monthData.length === 0) {
    return {
      totalTankerTrips: 0,
      totalInfluent: 0,
      avgProcessingEfficiency: 0
    };
  }

  const totalTankerTrips = monthData.reduce((sum, day) => sum + day.tankerTrips, 0);
  const totalInfluent = monthData.reduce((sum, day) => sum + day.totalInfluent, 0);
  const totalWaterProcessed = monthData.reduce((sum, day) => sum + day.totalWaterProcessed, 0);
  const avgProcessingEfficiency = totalInfluent > 0 ? (totalWaterProcessed / totalInfluent) * 100 : 0;

  return {
    totalTankerTrips,
    totalInfluent,
    totalWaterProcessed,
    avgProcessingEfficiency: parseFloat(avgProcessingEfficiency.toFixed(1))
  };
}
