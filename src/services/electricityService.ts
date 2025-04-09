
import { fetchTableData } from './api/airtableService';
import { ElectricityRecord } from '@/types/electricity';
import { ElectricityConsumptionData } from '@/types/electricitySystem';
import { addIdsToElectricityData } from '@/utils/dataUtils';
import { toast } from 'sonner';
import { electricityData as fallbackData } from '@/data/electricityData';

// Airtable table ID for Electricity data
const ELECTRICITY_TABLE_ID = 'shrpAtmnZhxfZ87Ue'; 

interface FetchElectricityOptions {
  view?: string;
  filterByFormula?: string;
  maxRecords?: number;
  sort?: Array<{field: string, direction: 'asc' | 'desc'}>;
  useFallback?: boolean;
}

export const fetchElectricityData = async <T = ElectricityConsumptionData | ElectricityRecord>(options: FetchElectricityOptions = {}) => {
  const { useFallback = true, ...queryOptions } = options;
  
  try {
    const rawData = await fetchTableData(ELECTRICITY_TABLE_ID, queryOptions);

    if (typeof rawData[0]?.id === 'string') {
      // Data already has IDs, just return it with the correct type
      return rawData as T[];
    }

    // Transform Airtable data to match ElectricityRecord type
    const transformedData: ElectricityRecord[] = rawData.map(record => ({
      id: record.id || '',  // Ensure ID is set
      name: record['Unit Number (Muncipality)'] || record['Muscat Bay Number'] || 'Unknown',
      type: record['Type'] || 'Unknown',
      zone: record['Zone'] || 'Unknown',
      meterAccountNo: record['Electrical Meter Account No'] || '',
      consumption: {
        'Apr-24': parseFloat(record['April-24']) || 0,
        'May-24': parseFloat(record['May-24']) || 0,
        'Jun-24': parseFloat(record['June-24']) || 0,
        'Jul-24': parseFloat(record['July-24']) || 0,
        'Aug-24': parseFloat(record['August-24']) || 0,
        'Sep-24': parseFloat(record['September-24']) || 0,
        'Oct-24': parseFloat(record['October-24']) || 0,
        'Nov-24': parseFloat(record['November-24']) || 0,
        'Dec-24': parseFloat(record['December-24']) || 0,
        'Jan-25': parseFloat(record['January-25']) || 0,
        'Feb-25': parseFloat(record['February-25']) || 0,
        'Mar-25': parseFloat(record['March-25']) || 0
      }
    }));

    // Add unique IDs to the records if needed
    const result = addIdsToElectricityData(transformedData);
    return result as unknown as T[];
  } catch (error) {
    console.error('Error fetching electricity data:', error);
    
    if (useFallback) {
      toast.error('Could not connect to Airtable. Using local data instead.');
      return fallbackData as unknown as T[];
    }
    
    throw error;
  }
};

export const fetchTopConsumers = async (month: string) => {
  const electricityData = await fetchElectricityData();
  
  return electricityData
    .filter(record => (record as any).consumption[month] > 0)
    .sort((a, b) => ((b as any).consumption[month] || 0) - ((a as any).consumption[month] || 0))
    .slice(0, 5);
};
