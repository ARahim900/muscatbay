
import { ElectricityRecord, ElectricityDataSummary, TypeConsumption, ZoneConsumption, TopConsumer } from '@/types/electricity';
import { ELECTRICITY_RATE } from '@/data/electricityMockData';

// Process raw electricity data
export const processElectricityData = (
  electricityData: ElectricityRecord[],
  selectedMonth: string,
  selectedYear: string
): ElectricityDataSummary => {
  // Default values for empty or invalid data
  const defaultData: ElectricityDataSummary = {
    totalConsumption: 0,
    totalCost: 0,
    averageConsumption: 0,
    maxConsumption: 0,
    maxConsumer: 'N/A',
    typeBreakdown: [],
    zoneBreakdown: [],
    topConsumers: []
  };

  if (!electricityData || !Array.isArray(electricityData) || electricityData.length === 0) {
    console.log("No electricity data available");
    return defaultData;
  }

  try {
    // Format month column, e.g., "Feb-25"
    const monthColumn = `${selectedMonth}-${selectedYear.substring(2)}`;
    console.log(`Processing data for month: ${monthColumn}`);
    
    let totalConsumption = 0;
    let maxConsumption = 0;
    let maxConsumer = '';
    
    // Maps for aggregation
    const typeMap = new Map<string, number>();
    const zoneMap = new Map<string, number>();
    
    // Process each record
    electricityData.forEach((record: ElectricityRecord) => {
      if (!record) return;
      
      // Get consumption for selected month
      const consumption = record.consumption[monthColumn] || 0;
      
      if (!isNaN(consumption)) {
        totalConsumption += consumption;
        
        // Track max consumer
        if (consumption > maxConsumption) {
          maxConsumption = consumption;
          maxConsumer = record.name || 'Unknown';
        }
        
        // Aggregate by type
        const type = record.type || 'Unknown';
        const currentTypeConsumption = typeMap.get(type) || 0;
        typeMap.set(type, currentTypeConsumption + consumption);
        
        // Aggregate by zone
        const zone = record.zone || 'Unknown';
        const currentZoneConsumption = zoneMap.get(zone) || 0;
        zoneMap.set(zone, currentZoneConsumption + consumption);
      }
    });
    
    // Calculate average
    const averageConsumption = electricityData.length > 0 ? totalConsumption / electricityData.length : 0;
    
    // Type colors
    const typeColors: Record<string, string> = {
      'MC': '#3b82f6',             // blue
      'Building': '#10b981',       // green
      'Apartment': '#f59e0b',      // amber
      'Commercial': '#ef4444',     // red
      'Street Light': '#8b5cf6',   // purple
      'Irrigation': '#0ea5e9',     // light blue
      'Actuator': '#6366f1',       // indigo
      'Unknown': '#64748b'         // slate
    };
    
    // Convert type map to array for charts
    const typeBreakdown: TypeConsumption[] = Array.from(typeMap.entries())
      .filter(([_, consumption]) => consumption > 0) // Only include types with consumption
      .map(([type, consumption]) => {
        return {
          type,
          consumption,
          cost: calculateCost(consumption),
          color: typeColors[type] || typeColors['Unknown']
        };
      })
      .sort((a, b) => b.consumption - a.consumption);
    
    // Calculate percentages for type breakdown
    if (totalConsumption > 0) {
      typeBreakdown.forEach(item => {
        item.percentage = (item.consumption / totalConsumption) * 100;
      });
    }
    
    // Convert zone map to array for charts
    const zoneBreakdown: ZoneConsumption[] = Array.from(zoneMap.entries())
      .filter(([_, consumption]) => consumption > 0) // Only include zones with consumption
      .map(([zone, consumption]) => {
        return {
          zone,
          consumption,
          cost: calculateCost(consumption)
        };
      })
      .sort((a, b) => b.consumption - a.consumption);
    
    // Calculate percentages for zone breakdown
    if (totalConsumption > 0) {
      zoneBreakdown.forEach(item => {
        item.percentage = (item.consumption / totalConsumption) * 100;
      });
    }
    
    // Get top consumers
    const topConsumers: TopConsumer[] = electricityData
      .filter(record => record && record.consumption[monthColumn] > 0)
      .sort((a, b) => {
        const aConsumption = a.consumption[monthColumn] || 0;
        const bConsumption = b.consumption[monthColumn] || 0;
        return bConsumption - aConsumption;
      })
      .slice(0, 5)
      .map(record => ({
        id: record.id,
        name: record.name,
        type: record.type,
        zone: record.zone,
        consumption: record.consumption[monthColumn] || 0,
        cost: calculateCost(record.consumption[monthColumn] || 0)
      }));
    
    // Calculate total cost
    const totalCost = calculateCost(totalConsumption);
    
    return {
      totalConsumption,
      totalCost,
      averageConsumption,
      maxConsumption,
      maxConsumer,
      typeBreakdown,
      zoneBreakdown,
      topConsumers
    };
  } catch (error) {
    console.error("Error processing electricity data:", error);
    return defaultData;
  }
};

// Calculate cost based on consumption and rate
export const calculateCost = (consumption: number): number => {
  return consumption * ELECTRICITY_RATE;
};

// Format numbers for better readability
export const formatNumber = (num: number): string => {
  return num.toLocaleString(undefined, { 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 0 
  });
};

// Format currency for better readability
export const formatCurrency = (num: number): string => {
  return num.toLocaleString(undefined, { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
};

// Get color for a facility type
export const getTypeColor = (type: string): string => {
  const typeColors: Record<string, string> = {
    'MC': '#3b82f6',             // blue
    'Building': '#10b981',       // green
    'Apartment': '#f59e0b',      // amber
    'Commercial': '#ef4444',     // red
    'Street Light': '#8b5cf6',   // purple
    'Irrigation': '#0ea5e9',     // light blue
    'Actuator': '#6366f1',       // indigo
    'Unknown': '#64748b'         // slate
  };
  
  return typeColors[type] || typeColors['Unknown'];
};

// Get months for selection dropdown
export const getAvailableMonths = () => {
  return [
    { value: 'Apr', label: 'April' },
    { value: 'May', label: 'May' },
    { value: 'Jun', label: 'June' },
    { value: 'Jul', label: 'July' },
    { value: 'Aug', label: 'August' },
    { value: 'Sep', label: 'September' },
    { value: 'Oct', label: 'October' },
    { value: 'Nov', label: 'November' },
    { value: 'Dec', label: 'December' },
    { value: 'Jan', label: 'January' },
    { value: 'Feb', label: 'February' },
    { value: 'Mar', label: 'March' }
  ];
};

// Get years for selection dropdown
export const getAvailableYears = () => {
  return [
    { value: '2024', label: '2024' },
    { value: '2025', label: '2025' }
  ];
};
