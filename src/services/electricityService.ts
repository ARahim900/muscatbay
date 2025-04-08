
import { fetchTableData } from './airtableService';
import { ElectricityRecord } from '@/types/electricity';
import { addIdsToElectricityData } from '@/utils/dataUtils';
import { toast } from 'sonner';
import { electricityData as fallbackData } from '@/data/electricityData';

// Airtable table ID for Electricity data
const ELECTRICITY_TABLE_ID = 'shrpAtmnZhxfZ87Ue'; 

export const fetchElectricityData = async (options = {}) => {
  try {
    const rawData = await fetchTableData(ELECTRICITY_TABLE_ID, {
      view: 'Grid view',
      ...options
    });

    // Transform Airtable data to match ElectricityRecord type
    const transformedData: ElectricityRecord[] = rawData.map(record => ({
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

    // Add unique IDs to the records
    return addIdsToElectricityData(transformedData);
  } catch (error) {
    console.error('Error fetching electricity data:', error);
    toast.error('Could not connect to Airtable. Using local data instead.');
    
    // Return the fallback data
    return fallbackData;
  }
};

export const fetchTopConsumers = async (month: string) => {
  const electricityData = await fetchElectricityData();
  
  return electricityData
    .filter(record => record.consumption[month] > 0)
    .sort((a, b) => (b.consumption[month] || 0) - (a.consumption[month] || 0))
    .slice(0, 5);
};
