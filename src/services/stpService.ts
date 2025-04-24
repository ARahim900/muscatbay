
import { fetchData } from './dataService';
import { getStpDailyData } from '@/utils/stpDailyData';

/**
 * Fetches STP daily data
 * @param signal Optional AbortSignal for request cancellation
 * @returns Promise with STP daily data
 */
export async function fetchSTPDailyData(signal?: AbortSignal): Promise<any> {
  try {
    // This would fetch from an API in production
    // For now, return the mock data
    return getStpDailyData();
  } catch (error) {
    console.error('Error in fetchSTPDailyData:', error);
    throw error;
  }
}

/**
 * Fetches STP monthly aggregate data
 * @param signal Optional AbortSignal for request cancellation
 * @returns Promise with STP monthly data
 */
export async function fetchSTPMonthlyData(signal?: AbortSignal): Promise<any> {
  try {
    // This would be implemented in production
    return { records: [] };
  } catch (error) {
    console.error('Error in fetchSTPMonthlyData:', error);
    throw error;
  }
}

/**
 * Processes STP data
 * @param data Raw STP data
 * @param dateRange Date range for filtering
 * @param plant Plant ID for filtering
 * @returns Processed STP data
 */
export function processData(data: any, dateRange?: any, plant?: string): any[] {
  if (!data || !data.records) {
    return [];
  }
  
  let records = data.records;
  
  // Filter by plant if specified
  if (plant && plant !== 'all') {
    records = records.filter((record: any) => record.plantId === plant);
  }
  
  // Filter by date range if specified
  if (dateRange && dateRange.start && dateRange.end) {
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    
    records = records.filter((record: any) => {
      const recordDate = new Date(record.date);
      return recordDate >= startDate && recordDate <= endDate;
    });
  }
  
  return records;
}

/**
 * Calculates STP efficiency
 * @param influentFlow Influent flow rate
 * @param effluentFlow Effluent flow rate
 * @returns Efficiency percentage
 */
export function calculateSTPEfficiency(influentFlow: number, effluentFlow: number): number {
  if (influentFlow <= 0) return 0;
  return (effluentFlow / influentFlow) * 100;
}
