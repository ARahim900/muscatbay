
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
 * Gets water consumption by zone
 * @param data Water consumption data
 * @returns Array of zone consumption and loss data
 */
export function getZoneConsumption(data: WaterConsumptionData): WaterZone[] {
  if (!data || !data.zones) {
    return [];
  }
  
  return data.zones;
}

/**
 * Calculates water system efficiency
 * @param data Water consumption data
 * @returns Efficiency percentage
 */
export function calculateSystemEfficiency(data: WaterConsumptionData): number {
  if (!data || !data.total || data.total.consumption === 0) {
    return 0;
  }
  
  const totalConsumption = data.total.consumption;
  const totalLoss = data.total.loss;
  
  // Calculate efficiency as (total consumption - loss) / total consumption
  return ((totalConsumption - totalLoss) / totalConsumption) * 100;
}

/**
 * Calculates financial impact of water loss
 * @param data Water consumption data
 * @param waterCostPerCubicMeter Cost of water per cubic meter
 * @returns Financial impact value
 */
export function calculateFinancialImpact(
  data: WaterConsumptionData,
  waterCostPerCubicMeter: number = 3.5
): number {
  if (!data || !data.total) {
    return 0;
  }
  
  return data.total.loss * waterCostPerCubicMeter;
}
