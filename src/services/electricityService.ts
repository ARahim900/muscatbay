
import { fetchTableData } from './airtableService';
import { ElectricityRecord } from '@/types/electricity';
import { addIdsToElectricityData } from '@/utils/dataUtils';

// You'll need to replace this with the actual Airtable table ID for Electricity
const ELECTRICITY_TABLE_ID = 'tblElectricityData'; 

export const fetchElectricityData = async (options = {}) => {
  try {
    const rawData = await fetchTableData(ELECTRICITY_TABLE_ID, {
      view: 'Grid view',
      ...options
    });

    // Transform Airtable data to match ElectricityRecord type
    const transformedData: ElectricityRecord[] = rawData.map(record => ({
      name: record.name || '',
      type: record.type || '',
      zone: record.zone || '',
      meterAccountNo: record.meterAccountNo || '',
      consumption: {
        'Apr-24': record['Apr-24'] || 0,
        'May-24': record['May-24'] || 0,
        // Add other months as needed
      }
    }));

    // Add unique IDs to the records
    return addIdsToElectricityData(transformedData);
  } catch (error) {
    console.error('Error fetching electricity data:', error);
    throw error;
  }
};

export const fetchTopConsumers = async (month: string) => {
  const electricityData = await fetchElectricityData();
  
  return electricityData
    .filter(record => record.consumption[month] > 0)
    .sort((a, b) => (b.consumption[month] || 0) - (a.consumption[month] || 0))
    .slice(0, 5);
};
