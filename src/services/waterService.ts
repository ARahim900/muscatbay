
import { fetchData } from './dataService';

/**
 * Fetches water data
 * @param signal Optional AbortSignal for request cancellation
 * @returns Promise with water data
 */
export async function fetchWaterData(signal?: AbortSignal): Promise<any> {
  try {
    const response = await fetchData<any>('water/consumption.json');
    
    return response || {};
  } catch (error) {
    console.error('Error in fetchWaterData:', error);
    throw error;
  }
}

/**
 * Calculates water system efficiency
 * @param totalFlow Total water flow
 * @param losses Water losses
 * @returns Efficiency percentage
 */
export function calculateEfficiency(totalFlow: number, losses: number): number {
  if (totalFlow <= 0) return 0;
  
  const efficiency = ((totalFlow - losses) / totalFlow) * 100;
  return Math.max(0, Math.min(100, efficiency)); // Clamp between 0 and 100
}
