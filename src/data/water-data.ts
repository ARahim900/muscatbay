
/**
 * Water data and utilities 
 * 
 * Note: This file now serves as a bridge to the new data service architecture.
 * For new code, import directly from src/services/waterService.ts
 */
import { fetchWaterData } from '@/services/waterService';
import { WaterConsumptionData, WaterZone } from '@/types/water';

export async function getWaterData(): Promise<WaterConsumptionData> {
  try {
    return await fetchWaterData();
  } catch (error) {
    console.error('Error fetching water data:', error);
    return {
      metadata: {
        version: '1.0',
        timestamp: new Date().toISOString(),
        description: 'Error loading data',
        units: 'm³'
      },
      total: {
        consumption: 0,
        loss: 0
      },
      zones: []
    };
  }
}

// Export the types for backward compatibility
export type { WaterConsumptionData, WaterZone };
