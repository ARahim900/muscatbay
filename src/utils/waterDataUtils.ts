
import { fetchData } from '@/services/dataService';
import { WaterData } from '@/types/water';

/**
 * Loads water consumption data
 */
export async function loadWaterConsumptionData(): Promise<any> {
  try {
    const data = await fetchData<any>('water/consumption.json');
    return data;
  } catch (error) {
    console.error('Error loading water consumption data:', error);
    return null;
  }
}

/**
 * Parses CSV data for water consumption
 * @param csvData CSV data string
 */
export function parseWaterCSV(csvData: string): WaterData[] {
  try {
    // Simple CSV parsing
    const lines = csvData.trim().split('\n');
    const headers = lines[0].split(',').map(header => header.trim());
    
    return lines.slice(1).map((line, index) => {
      const values = line.split(',').map(val => val.trim());
      const entry: any = { id: `water-${index}` };
      
      headers.forEach((header, i) => {
        // Convert known numeric fields
        const monthFields = ['jan_24', 'feb_24', 'mar_24', 'apr_24', 'may_24', 'jun_24', 
                            'jul_24', 'aug_24', 'sep_24', 'oct_24', 'nov_24', 'dec_24',
                            'jan_25', 'feb_25', 'total'];
        
        const headerKey = header.toLowerCase().replace(/ /g, '_').replace(/-/g, '_');
        
        if (monthFields.includes(headerKey) && !isNaN(parseFloat(values[i]))) {
          entry[headerKey] = parseFloat(values[i]);
        } else {
          entry[headerKey] = values[i];
        }
      });
      
      return entry as WaterData;
    });
  } catch (error) {
    console.error('Error parsing water CSV data:', error);
    return [];
  }
}

/**
 * Processes water data for visualization
 * @param data Water consumption data array
 */
export function processWaterData(data: WaterData[]): any {
  try {
    if (!data || data.length === 0) return null;
    
    // Group by type
    const typeGroups: Record<string, any> = {};
    data.forEach(item => {
      const type = item.type || 'Unspecified';
      if (!typeGroups[type]) {
        typeGroups[type] = {
          type,
          jan_24: 0, feb_24: 0, mar_24: 0, apr_24: 0, may_24: 0, jun_24: 0,
          jul_24: 0, aug_24: 0, sep_24: 0, oct_24: 0, nov_24: 0, dec_24: 0,
          jan_25: 0, feb_25: 0, total: 0
        };
      }
      
      // Sum consumption for each month
      ['jan_24', 'feb_24', 'mar_24', 'apr_24', 'may_24', 'jun_24', 
       'jul_24', 'aug_24', 'sep_24', 'oct_24', 'nov_24', 'dec_24',
       'jan_25', 'feb_25', 'total'].forEach(month => {
        if (typeof item[month] === 'number' && !isNaN(item[month])) {
          typeGroups[type][month] += item[month];
        }
      });
    });
    
    // Group by zone
    const zoneGroups: Record<string, any> = {};
    data.forEach(item => {
      const zone = item.zone || 'Unspecified';
      if (!zoneGroups[zone]) {
        zoneGroups[zone] = {
          zone,
          jan_24: 0, feb_24: 0, mar_24: 0, apr_24: 0, may_24: 0, jun_24: 0,
          jul_24: 0, aug_24: 0, sep_24: 0, oct_24: 0, nov_24: 0, dec_24: 0,
          jan_25: 0, feb_25: 0, total: 0
        };
      }
      
      // Sum consumption for each month
      ['jan_24', 'feb_24', 'mar_24', 'apr_24', 'may_24', 'jun_24', 
       'jul_24', 'aug_24', 'sep_24', 'oct_24', 'nov_24', 'dec_24',
       'jan_25', 'feb_25', 'total'].forEach(month => {
        if (typeof item[month] === 'number' && !isNaN(item[month])) {
          zoneGroups[zone][month] += item[month];
        }
      });
    });
    
    return {
      byType: Object.values(typeGroups),
      byZone: Object.values(zoneGroups),
      raw: data
    };
  } catch (error) {
    console.error('Error processing water data:', error);
    return null;
  }
}
