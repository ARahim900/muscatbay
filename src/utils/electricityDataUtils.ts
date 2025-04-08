
import { ElectricityRecord, FacilityConsumption, TypeConsumption, TopConsumer } from '@/types/electricity';

/**
 * Processes raw Airtable data into standardized format for electricity components
 * @param rawData - Raw data from Airtable
 * @param selectedMonth - Currently selected month
 * @param selectedYear - Currently selected year
 * @returns Processed electricity data 
 */
export const processAirtableData = (
  rawData: any[], 
  selectedMonth: string, 
  selectedYear: string
): {
  totalConsumption: number;
  totalCost: number;
  averageConsumption: number;
  maxConsumption: number;
  maxConsumer: string;
  typeBreakdown: { name: string; value: number; color: string }[];
  topConsumers: TopConsumer[];
} => {
  // Default values for empty or invalid data
  const defaultData = {
    totalConsumption: 0,
    totalCost: 0,
    averageConsumption: 0,
    maxConsumption: 0,
    maxConsumer: 'N/A',
    typeBreakdown: [],
    topConsumers: []
  };

  // Ensure rawData is a valid array
  if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
    console.log("No electricity data available");
    return defaultData;
  }

  try {
    // Format the column name based on Airtable's field format
    // Airtable field names may use different formats - using both formats for robustness
    const monthYearKey = `${selectedMonth}-${selectedYear.substring(2)}`; // e.g., "Aug-24"
    const fullMonthYearKey = `${getFullMonth(selectedMonth)}-${selectedYear}`; // e.g., "August-24"
    
    console.log("Looking for consumption data using keys:", monthYearKey, "or", fullMonthYearKey);
    
    let totalConsumption = 0;
    let maxConsumption = 0;
    let maxConsumer = '';
    
    // Map for consumption by type
    const typeMap = new Map<string, number>();
    
    // Calculate totals - safely handle each record
    rawData.forEach((record) => {
      if (!record) return;
      
      // Try multiple possible field names to find consumption data
      let consumption = 0;
      let fieldFound = false;
      
      // First try the abbreviated format
      if (record[monthYearKey] !== undefined) {
        consumption = parseFloatSafe(record[monthYearKey]);
        fieldFound = true;
      } 
      // Then try the full month name format
      else if (record[fullMonthYearKey] !== undefined) {
        consumption = parseFloatSafe(record[fullMonthYearKey]);
        fieldFound = true;
      }
      // Try looking for fields that match part of the name
      else {
        const possibleFields = Object.keys(record).filter(key => 
          key.includes(selectedMonth) || 
          key.toLowerCase().includes(getFullMonth(selectedMonth).toLowerCase())
        );
        
        if (possibleFields.length > 0) {
          consumption = parseFloatSafe(record[possibleFields[0]]);
          fieldFound = true;
          console.log(`Found consumption using alternative field: ${possibleFields[0]}`);
        }
      }
      
      if (!fieldFound) {
        console.log(`No consumption data found for record:`, record["Meter Label"] || "Unknown meter");
        return;
      }
      
      if (!isNaN(consumption)) {
        totalConsumption += consumption;
        
        // Track max consumer
        if (consumption > maxConsumption) {
          maxConsumption = consumption;
          // Try different possible field names for the meter label
          maxConsumer = record['Meter Label'] || record['Name'] || 'Unknown';
        }
        
        // Aggregate by type - try different possible field names for the type
        const type = record['Type'] || 'Unknown';
        const currentTypeConsumption = typeMap.get(type) || 0;
        typeMap.set(type, currentTypeConsumption + consumption);
      }
    });
    
    // Calculate average
    const averageConsumption = rawData.length > 0 ? totalConsumption / rawData.length : 0;
    
    // Convert type map to array for charts
    const typeBreakdown = Array.from(typeMap.entries()).map(([type, consumption]) => ({
      name: type,
      value: consumption,
      color: getTypeColor(type)
    }));
    
    // Get top consumers
    const topConsumers = [...rawData]
      .filter(record => {
        // Check for consumption data in possible field formats
        let hasConsumption = false;
        if (record[monthYearKey] !== undefined) hasConsumption = true;
        else if (record[fullMonthYearKey] !== undefined) hasConsumption = true;
        else {
          const possibleFields = Object.keys(record).filter(key => 
            key.includes(selectedMonth) || 
            key.toLowerCase().includes(getFullMonth(selectedMonth).toLowerCase())
          );
          if (possibleFields.length > 0) hasConsumption = true;
        }
        return hasConsumption;
      })
      .sort((a, b) => {
        // Get consumption values using possible field formats
        const getConsumption = (rec: any): number => {
          if (rec[monthYearKey] !== undefined) return parseFloatSafe(rec[monthYearKey]);
          else if (rec[fullMonthYearKey] !== undefined) return parseFloatSafe(rec[fullMonthYearKey]);
          else {
            const possibleFields = Object.keys(rec).filter(key => 
              key.includes(selectedMonth) || 
              key.toLowerCase().includes(getFullMonth(selectedMonth).toLowerCase())
            );
            if (possibleFields.length > 0) return parseFloatSafe(rec[possibleFields[0]]);
            return 0;
          }
        };
        
        return getConsumption(b) - getConsumption(a);
      })
      .slice(0, 5)
      .map(record => {
        // Get consumption value using possible field formats
        let consumption = 0;
        if (record[monthYearKey] !== undefined) consumption = parseFloatSafe(record[monthYearKey]);
        else if (record[fullMonthYearKey] !== undefined) consumption = parseFloatSafe(record[fullMonthYearKey]);
        else {
          const possibleFields = Object.keys(record).filter(key => 
            key.includes(selectedMonth) || 
            key.toLowerCase().includes(getFullMonth(selectedMonth).toLowerCase())
          );
          if (possibleFields.length > 0) consumption = parseFloatSafe(record[possibleFields[0]]);
        }
        
        return {
          name: record['Meter Label'] || record['Name'] || 'Unknown',
          type: record['Type'] || 'Unknown',
          consumption: consumption,
          cost: calculateCost(consumption)
        };
      });
    
    // Estimate cost (fictional calculation)
    const totalCost = calculateCost(totalConsumption);
    
    return {
      totalConsumption,
      totalCost,
      averageConsumption,
      maxConsumption,
      maxConsumer,
      typeBreakdown,
      topConsumers
    };
  } catch (error) {
    console.error("Error processing electricity data:", error);
    return defaultData; // Return default data structure in case of errors
  }
};

// Helper function to safely parse float values
const parseFloatSafe = (value: any): number => {
  if (value === undefined || value === null) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

// Calculate cost (fictional calculation - 0.025 OMR per kWh)
export const calculateCost = (consumption: number): number => {
  return consumption * 0.025;
};

// Function to get full month name
const getFullMonth = (shortMonth: string): string => {
  const months: { [key: string]: string } = {
    'Jan': 'January',
    'Feb': 'February',
    'Mar': 'March',
    'Apr': 'April',
    'May': 'May',
    'Jun': 'June',
    'Jul': 'July',
    'Aug': 'August',
    'Sep': 'September',
    'Oct': 'October',
    'Nov': 'November',
    'Dec': 'December'
  };
  return months[shortMonth] || shortMonth;
};

// Function to get type color
export const getTypeColor = (type: string): string => {
  const typeColors: { [key: string]: string } = {
    'Retail': '#3b82f6',  // blue
    'Residential (Villa)': '#10b981', // green
    'Residential (Apart)': '#f59e0b', // amber
    'IRR': '#ef4444', // red
    'IRR_Services': '#ef4444', // red
    'MB_Common': '#8b5cf6', // purple
    'Building': '#0ea5e9', // light blue
    'D_Building_Common': '#6366f1', // indigo
    'Common': '#8b5cf6', // purple
    'Common Area': '#8b5cf6' // purple
  };
  
  return typeColors[type] || '#64748b'; // default color
};

