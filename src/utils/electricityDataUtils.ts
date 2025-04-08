
import { ElectricityRecord, FacilityConsumption, TypeConsumption, TopConsumer } from '@/types/electricity';

/**
 * Processes raw Airtable data into standardized format for electricity components
 * @param rawData - Raw data from Airtable
 * @param selectedMonth - Currently selected month
 * @param selectedYear - Currently selected year
 * @param electricityRate - The rate per kWh in OMR
 * @returns Processed electricity data 
 */
export const processAirtableData = (
  rawData: any[], 
  selectedMonth: string, 
  selectedYear: string,
  electricityRate: number = 0.025
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
    console.log("Processing electricity data with", rawData.length, "records");
    
    // Format the column name based on Airtable's field format
    // Airtable field names may use different formats - using both formats for robustness
    const monthYearKey = `${selectedMonth}-${selectedYear.substring(2)}`; // e.g., "Mar-25"
    const fullMonthYearKey = `${getFullMonth(selectedMonth)}-${selectedYear}`; // e.g., "March-2025"
    const altMonthYearKey = `${getFullMonth(selectedMonth)} ${selectedYear.substring(2)}`; // e.g., "March 25"
    
    console.log("Looking for consumption data using keys:", monthYearKey, fullMonthYearKey, altMonthYearKey);
    
    let totalConsumption = 0;
    let maxConsumption = 0;
    let maxConsumer = '';
    let validRecordsCount = 0;
    
    // Map for consumption by type
    const typeMap = new Map<string, number>();
    
    // Process each record - safely handle each record
    rawData.forEach((record) => {
      if (!record) return;
      
      // Try multiple possible field names to find consumption data
      let consumption = 0;
      let fieldFound = false;
      
      // Log record keys for debugging
      console.log("Record keys:", Object.keys(record));
      
      // First try the abbreviated format (e.g., "Mar-25")
      if (record[monthYearKey] !== undefined && record[monthYearKey] !== null) {
        consumption = parseFloatSafe(record[monthYearKey]);
        fieldFound = true;
        console.log(`Found consumption using ${monthYearKey}: ${consumption}`);
      } 
      // Then try the full month name format (e.g., "March-2025")
      else if (record[fullMonthYearKey] !== undefined && record[fullMonthYearKey] !== null) {
        consumption = parseFloatSafe(record[fullMonthYearKey]);
        fieldFound = true;
        console.log(`Found consumption using ${fullMonthYearKey}: ${consumption}`);
      }
      // Try alternate format (e.g., "March 25")
      else if (record[altMonthYearKey] !== undefined && record[altMonthYearKey] !== null) {
        consumption = parseFloatSafe(record[altMonthYearKey]);
        fieldFound = true;
        console.log(`Found consumption using ${altMonthYearKey}: ${consumption}`);
      }
      // Try another common date format convention based on the structure observed in the raw data
      else if (record[`${selectedMonth.charAt(0).toUpperCase() + selectedMonth.slice(1).toLowerCase()}-${selectedYear}`] !== undefined) {
        consumption = parseFloatSafe(record[`${selectedMonth.charAt(0).toUpperCase() + selectedMonth.slice(1).toLowerCase()}-${selectedYear}`]);
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
          console.log(`Found consumption using alternative field: ${possibleFields[0]} = ${consumption}`);
        }
      }
      
      if (!fieldFound) {
        console.log(`No consumption data found for record:`, record["Name"] || record["Meter Label"] || "Unknown meter");
        return;
      }
      
      if (!isNaN(consumption) && consumption !== null) {
        totalConsumption += consumption;
        validRecordsCount++;
        
        // Track max consumer
        if (consumption > maxConsumption) {
          maxConsumption = consumption;
          // Try different possible field names for the meter label
          maxConsumer = record['Name'] || record['Meter Label'] || 'Unknown';
        }
        
        // Aggregate by type - try different possible field names for the type
        const type = record['Type'] || 'Unknown';
        const currentTypeConsumption = typeMap.get(type) || 0;
        typeMap.set(type, currentTypeConsumption + consumption);
      }
    });
    
    console.log(`Processed ${validRecordsCount} valid records with consumption data`);
    console.log(`Total consumption: ${totalConsumption} kWh`);
    console.log(`Types found:`, Array.from(typeMap.keys()));
    
    // Calculate average
    const averageConsumption = validRecordsCount > 0 ? totalConsumption / validRecordsCount : 0;
    
    // Convert type map to array for charts
    const typeBreakdown = Array.from(typeMap.entries())
      .filter(([_, consumption]) => consumption > 0)
      .map(([type, consumption]) => ({
        name: type,
        value: consumption,
        color: getTypeColor(type)
      }))
      .sort((a, b) => b.value - a.value);
    
    console.log(`Type breakdown:`, typeBreakdown);
    
    // Get top consumers
    const topConsumers = [...rawData]
      .filter(record => {
        // Check for consumption data in possible field formats
        let consumption = 0;
        let hasConsumption = false;
        
        if (record[monthYearKey] !== undefined) {
          consumption = parseFloatSafe(record[monthYearKey]);
          hasConsumption = true;
        }
        else if (record[fullMonthYearKey] !== undefined) {
          consumption = parseFloatSafe(record[fullMonthYearKey]);
          hasConsumption = true;
        }
        else if (record[altMonthYearKey] !== undefined) {
          consumption = parseFloatSafe(record[altMonthYearKey]);
          hasConsumption = true;
        }
        else {
          const possibleFields = Object.keys(record).filter(key => 
            key.includes(selectedMonth) || 
            key.toLowerCase().includes(getFullMonth(selectedMonth).toLowerCase())
          );
          if (possibleFields.length > 0) {
            consumption = parseFloatSafe(record[possibleFields[0]]);
            hasConsumption = true;
          }
        }
        
        return hasConsumption && consumption > 0;
      })
      .sort((a, b) => {
        // Get consumption values using possible field formats
        const getConsumption = (rec: any): number => {
          if (rec[monthYearKey] !== undefined) return parseFloatSafe(rec[monthYearKey]);
          else if (rec[fullMonthYearKey] !== undefined) return parseFloatSafe(rec[fullMonthYearKey]);
          else if (rec[altMonthYearKey] !== undefined) return parseFloatSafe(rec[altMonthYearKey]);
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
      .slice(0, 10)
      .map(record => {
        // Get consumption value using possible field formats
        let consumption = 0;
        if (record[monthYearKey] !== undefined) consumption = parseFloatSafe(record[monthYearKey]);
        else if (record[fullMonthYearKey] !== undefined) consumption = parseFloatSafe(record[fullMonthYearKey]);
        else if (record[altMonthYearKey] !== undefined) consumption = parseFloatSafe(record[altMonthYearKey]);
        else {
          const possibleFields = Object.keys(record).filter(key => 
            key.includes(selectedMonth) || 
            key.toLowerCase().includes(getFullMonth(selectedMonth).toLowerCase())
          );
          if (possibleFields.length > 0) consumption = parseFloatSafe(record[possibleFields[0]]);
        }
        
        return {
          name: record['Name'] || record['Meter Label'] || 'Unknown',
          type: record['Type'] || 'Unknown',
          consumption: consumption,
          cost: calculateCost(consumption, electricityRate)
        };
      });
    
    console.log(`Top consumers:`, topConsumers.map(c => ({ name: c.name, consumption: c.consumption })));
    
    // Calculate total cost
    const totalCost = calculateCost(totalConsumption, electricityRate);
    
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

// Calculate cost based on the provided electricity rate
export const calculateCost = (consumption: number, rate: number = 0.025): number => {
  return consumption * rate;
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
    'Apartment': '#10b981', // green
    'D_Building': '#f59e0b', // amber
    'SBJ Common Meter': '#f59e0b', // amber
    'IRR': '#ef4444', // red
    'IRR_Services': '#ef4444', // red
    'MC': '#8b5cf6', // purple
    'MB_Common': '#8b5cf6', // purple
    'Building': '#0ea5e9', // light blue
    'PS': '#6366f1', // indigo
    'LS': '#8b5cf6', // purple
    'DB': '#ec4899', // pink
    'Street Light': '#eab308', // yellow
    'Zone-3 landscape light': '#84cc16', // lime
    'FP-Landscape Lights Z3': '#84cc16', // lime
    'Common': '#8b5cf6', // purple
    'Common Area': '#8b5cf6' // purple
  };
  
  return typeColors[type] || '#64748b'; // default color
};
