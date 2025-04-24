
/**
 * Electricity data service for Muscat Bay operations web application
 */
import { fetchData } from './dataService';
import { ElectricityConsumptionData } from '@/types/electricity';

/**
 * Fetches electricity consumption data
 * @param signal Optional AbortSignal for request cancellation
 * @returns Promise with electricity consumption data
 */
export async function fetchElectricityData(signal?: AbortSignal): Promise<any[]> {
  try {
    const response = await fetchData<any>(
      'electricity/consumption.json',
      {
        signal,
        errorMessage: 'Failed to load electricity consumption data'
      }
    );
    
    return Array.isArray(response) ? response : [];
  } catch (error) {
    console.error('Error in fetchElectricityData:', error);
    throw error;
  }
}

/**
 * Calculates electricity cost
 * @param consumption Electricity consumption in kWh
 * @param rate Electricity rate per kWh
 * @returns Total cost
 */
export function calculateElectricityCost(consumption: number, rate: number): number {
  return consumption * rate;
}
