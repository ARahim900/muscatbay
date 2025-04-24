
/**
 * Water data service for Muscat Bay operations web application
 */
import { fetchData } from './dataService';
import { WaterConsumptionData, WaterZone } from '@/types/water';

/**
 * Fetches water consumption data
 * @param signal Optional AbortSignal for request cancellation
 * @returns Promise with water consumption data
 */
export async function fetchWaterData(signal?: AbortSignal): Promise<WaterConsumptionData> {
  try {
    const response = await fetchData<WaterConsumptionData>(
      'water/consumption.json',
      {
        signal,
        errorMessage: 'Failed to load water consumption data'
      }
    );
    
    return response;
  } catch (error) {
    console.error('Error in fetchWaterData:', error);
    throw error;
  }
}

/**
 * Calculates water system efficiency
 * @param totalConsumption Total water consumption
 * @param totalLoss Total water loss
 * @returns Efficiency percentage
 */
export function calculateEfficiency(totalConsumption: number, totalLoss: number): number {
  if (totalConsumption === 0) return 0;
  const totalWater = totalConsumption + totalLoss;
  return (totalConsumption / totalWater) * 100;
}

/**
 * Calculates water cost
 * @param consumption Water consumption in cubic meters
 * @param rate Water rate per cubic meter
 * @returns Total cost
 */
export function calculateWaterCost(consumption: number, rate: number): number {
  return consumption * rate;
}

/**
 * Sorts zones by consumption or loss
 * @param zones Array of water zones
 * @param sortBy Property to sort by ('consumption' or 'loss')
 * @param sortOrder Sort direction ('asc' or 'desc')
 * @returns Sorted array of zones
 */
export function sortZonesByProperty(
  zones: WaterZone[],
  sortBy: 'consumption' | 'loss' = 'consumption',
  sortOrder: 'asc' | 'desc' = 'desc'
): WaterZone[] {
  if (!zones || zones.length === 0) return [];
  
  return [...zones].sort((a, b) => {
    const valueA = a[sortBy];
    const valueB = b[sortBy];
    
    return sortOrder === 'asc' ? valueA - valueB : valueB - valueA;
  });
}
