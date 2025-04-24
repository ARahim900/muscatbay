
/**
 * Electricity data types and helper functions
 * 
 * Note: This file now serves as a bridge to the new data service architecture.
 * For new code, import directly from src/services/electricityService.ts
 */

import { ElectricityRecord } from '@/types/electricity';
import { fetchElectricityData } from '@/services/electricityService';

export const getElectricityData = async (): Promise<ElectricityRecord[]> => {
  try {
    return await fetchElectricityData();
  } catch (error) {
    console.error('Error fetching electricity data:', error);
    return [];
  }
};

// Export the type for backward compatibility
export type { ElectricityRecord };
