
/**
 * Electricity data service for Muscat Bay operations web application
 */
import { fetchData } from './dataService';
import { ElectricityConsumptionData, ElectricityRecord } from '@/types/electricity';

/**
 * Fetches electricity consumption data
 * @param signal Optional AbortSignal for request cancellation
 * @returns Promise with electricity consumption data
 */
export async function fetchElectricityData(signal?: AbortSignal): Promise<ElectricityRecord[]> {
  try {
    const response = await fetchData<ElectricityConsumptionData>(
      'electricity/consumption.json',
      {
        signal,
        errorMessage: 'Failed to load electricity consumption data'
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error in fetchElectricityData:', error);
    throw error;
  }
}

/**
 * Gets available months in the electricity data
 * @param data Electricity consumption data
 * @returns Array of available months
 */
export function getAvailableMonths(data: ElectricityRecord[]): string[] {
  if (!data || data.length === 0) return [];
  
  const firstRecord = data[0];
  if (!firstRecord || !firstRecord.consumption) return [];
  
  return Object.keys(firstRecord.consumption);
}

/**
 * Gets all unique facility types from the electricity data
 * @param data Electricity consumption data
 * @returns Array of unique facility types
 */
export function getFacilityTypes(data: ElectricityRecord[]): string[] {
  if (!data || data.length === 0) return [];
  
  const types = new Set<string>();
  data.forEach(record => {
    if (record.type) {
      types.add(record.type);
    }
  });
  
  return Array.from(types).sort();
}

/**
 * Calculates monthly totals by facility type
 * @param data Electricity consumption data
 * @param month Selected month
 * @returns Object with consumption totals by facility type
 */
export function calculateMonthlyTotalsByType(
  data: ElectricityRecord[],
  month: string
): Record<string, number> {
  if (!data || data.length === 0 || !month) {
    return {};
  }
  
  const result: Record<string, number> = {};
  
  data.forEach(record => {
    const type = record.type || 'Unknown';
    const consumption = record.consumption?.[month] || 0;
    
    if (!result[type]) {
      result[type] = 0;
    }
    
    result[type] += consumption;
  });
  
  return result;
}

/**
 * Calculates total consumption for each month
 * @param data Electricity consumption data
 * @returns Object with total consumption by month
 */
export function calculateMonthlyTotals(data: ElectricityRecord[]): Record<string, number> {
  if (!data || data.length === 0) return {};
  
  const months = getAvailableMonths(data);
  const result: Record<string, number> = {};
  
  months.forEach(month => {
    result[month] = data.reduce((total, record) => {
      return total + (record.consumption?.[month] || 0);
    }, 0);
  });
  
  return result;
}
