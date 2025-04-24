
/**
 * Electricity data service for Muscat Bay operations web application
 */
import { fetchData } from './dataService';

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
 * Gets mock electricity data
 * @returns Mock electricity data
 */
export function getElectricityData() {
  return [
    {
      id: 'elec-001',
      name: 'Residential Zone A',
      type: 'Residential',
      zone: 'Zone A',
      accountNumber: 'ACC-001',
      consumption: {
        'Jan': 45000,
        'Feb': 42000,
        'Mar': 41000,
        'Apr': 43500,
        'May': 47000,
        'Jun': 52000
      }
    },
    {
      id: 'elec-002',
      name: 'Commercial Plaza',
      type: 'Commercial',
      zone: 'Zone B',
      accountNumber: 'ACC-002',
      consumption: {
        'Jan': 68000,
        'Feb': 65000,
        'Mar': 69000,
        'Apr': 71000,
        'May': 73000,
        'Jun': 75000
      }
    }
  ];
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
