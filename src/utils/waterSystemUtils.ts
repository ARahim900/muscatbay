import { WaterConsumptionData, ZoneMetrics, LevelMetrics, TypeConsumption, MonthlyConsumption } from '@/types/waterSystem';

// Constants for excluded meters
const EXCLUDED_METERS = ['4300322']; // Z3-74(3) meter to be excluded

/**
 * Transform raw Airtable data into a more structured format
 */
export const transformWaterData = (data: WaterConsumptionData[]): WaterConsumptionData[] => {
  // Make sure data is valid before filtering
  if (!data || !Array.isArray(data)) {
    console.warn("Invalid data passed to transformWaterData:", data);
    return [];
  }
  
  // Filter out excluded meters and ensure each item has required properties
  return data.filter(item => {
    // Skip items without proper account numbers
    if (!item['Acct #']) return false;
    
    // Skip excluded meters
    if (EXCLUDED_METERS.includes(String(item['Acct #']))) return false;
    
    return true;
  });
};

/**
 * Calculate reading for a specific month, handling different data types
 */
export const getReadingValue = (item: WaterConsumptionData, month: string): number => {
  if (!item) return 0;
  if (month === 'all') return 0; // Return 0 for 'all' selection to fix zero display issue
  
  const value = item[month];
  
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && !isNaN(parseFloat(value))) return parseFloat(value);
  return 0;
};

/**
 * Get all available months from the data
 */
export const getAvailableMonths = (data: WaterConsumptionData[]): string[] => {
  const months = ['all'];
  
  if (!data || data.length === 0) {
    console.warn("No data available for extracting months");
    return months;
  }
  
  const firstItem = data[0];
  if (!firstItem) return months;
  
  const monthFields = Object.keys(firstItem).filter(key => 
    /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-\d{2}$/.test(key)
  );
  
  monthFields.sort((a, b) => {
    const monthOrder = {'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6, 
                        'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12};
    const monthA = a.substring(0, 3);
    const monthB = b.substring(0, 3);
    const yearA = parseInt(a.substring(4));
    const yearB = parseInt(b.substring(4));
    
    if (yearA !== yearB) return yearA - yearB;
    return monthOrder[monthA as keyof typeof monthOrder] - monthOrder[monthB as keyof typeof monthOrder];
  });
  
  monthFields.forEach(month => {
    // Check if any record has data for this month
    const hasData = data.some(item => getReadingValue(item, month) > 0);
    if (hasData && !months.includes(month)) {
      months.push(month);
    }
  });
  
  // Ensure we have at least one month for demo data
  if (months.length <= 1) {
    console.log("Adding default months since no month data was found");
    months.push('Jan-25', 'Feb-25');
  }
  
  return months;
};

/**
 * Get all zones from the data
 */
export const getZones = (data: WaterConsumptionData[]): string[] => {
  const zones = ['all'];
  
  if (!data || data.length === 0) return zones;
  
  data.forEach(item => {
    if (item.Zone && !zones.includes(item.Zone)) {
      zones.push(item.Zone);
    }
  });
  
  return zones;
};

/**
 * Get all types from the data
 */
export const getTypes = (data: WaterConsumptionData[]): string[] => {
  const types = ['all'];
  
  if (!data || data.length === 0) return types;
  
  data.forEach(item => {
    if (item.Type && !types.includes(item.Type)) {
      types.push(item.Type);
    }
  });
  
  return types;
};

/**
 * Filter data based on selected filters
 */
export const filterWaterData = (
  data: WaterConsumptionData[], 
  selectedMonth: string, 
  selectedZone: string,
  selectedType: string
): WaterConsumptionData[] => {
  if (!data || data.length === 0) return [];
  
  return data.filter(record => {
    // Fix for 'all' month selection - if 'all' is selected, include all records regardless of month data
    const monthMatch = selectedMonth === 'all' || 
                      (record[selectedMonth] !== undefined && 
                       record[selectedMonth] !== null);
    const zoneMatch = selectedZone === 'all' || record.Zone === selectedZone;
    const typeMatch = selectedType === 'all' || record.Type === selectedType;
    
    return monthMatch && zoneMatch && typeMatch;
  });
};

/**
 * Calculate water metrics for different levels based on hierarchy
 */
export const calculateLevelMetrics = (
  data: WaterConsumptionData[], 
  selectedMonth: string
): LevelMetrics => {
  // Calculate consumption for each level
  
  // L1: Main Bulk meter
  const l1Meters = data.filter(meter => meter.Label === 'L1');
  const l1Supply = selectedMonth === 'all' 
    ? getAverageMonthlyValue(l1Meters)  // For 'all', use the average of all months
    : l1Meters.reduce((sum, meter) => sum + getReadingValue(meter, selectedMonth), 0);
  
  // L2: Zone Bulk meters + Direct Connections from L1
  const l2Meters = data.filter(meter => meter.Label === 'L2');
  const dcMetersFromL1 = data.filter(meter => 
    meter.Label === 'DC' && 
    l1Meters.some(l1 => l1['Meter Label'] === meter['Parent Meter'])
  );
  
  const l2Volume = selectedMonth === 'all'
    ? getAverageMonthlyValue([...l2Meters, ...dcMetersFromL1])
    : [...l2Meters, ...dcMetersFromL1].reduce((sum, meter) => sum + getReadingValue(meter, selectedMonth), 0);
  
  // L3: Individual meters (L3) + All Direct Connections
  const l3Meters = data.filter(meter => meter.Label === 'L3');
  const dcMeters = data.filter(meter => meter.Label === 'DC');
  
  const l3Volume = selectedMonth === 'all'
    ? getAverageMonthlyValue([...l3Meters, ...dcMeters])
    : [...l3Meters, ...dcMeters].reduce((sum, meter) => sum + getReadingValue(meter, selectedMonth), 0);
  
  // Calculate losses
  const stage1Loss = l1Supply - l2Volume;
  const stage2Loss = l2Volume - l3Volume;
  const totalLoss = l1Supply - l3Volume;
  
  // Calculate percentages (avoid division by zero)
  const stage1LossPercentage = l1Supply > 0 ? (stage1Loss / l1Supply) * 100 : 0;
  const stage2LossPercentage = l2Volume > 0 ? (stage2Loss / l2Volume) * 100 : 0;
  const totalLossPercentage = l1Supply > 0 ? (totalLoss / l1Supply) * 100 : 0;
  
  return {
    l1Supply,
    l2Volume,
    l3Volume,
    stage1Loss,
    stage2Loss,
    totalLoss,
    stage1LossPercentage,
    stage2LossPercentage,
    totalLossPercentage
  };
};

/**
 * Helper function to calculate average monthly value across all months for a set of meters
 */
function getAverageMonthlyValue(meters: WaterConsumptionData[]): number {
  if (meters.length === 0) return 0;
  
  // Get all month fields from the first meter
  const firstMeter = meters[0];
  if (!firstMeter) return 0;
  
  const monthFields = Object.keys(firstMeter).filter(key => 
    /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-\d{2}$/.test(key)
  );
  
  if (monthFields.length === 0) return 0;
  
  // Calculate total for all months
  let totalValue = 0;
  let monthCount = 0;
  
  monthFields.forEach(month => {
    let monthTotal = 0;
    meters.forEach(meter => {
      monthTotal += getReadingValue(meter, month);
    });
    
    if (monthTotal > 0) {
      totalValue += monthTotal;
      monthCount++;
    }
  });
  
  // Return average
  return monthCount > 0 ? totalValue / monthCount : 0;
}

/**
 * Calculate zone-specific metrics
 */
export const calculateZoneMetrics = (
  data: WaterConsumptionData[], 
  selectedMonth: string
): ZoneMetrics[] => {
  const zoneList = getZones(data).filter(zone => zone !== 'all');
  
  return zoneList.map(zone => {
    // Get L2 bulk meter for this zone
    const zoneBulkMeter = data.find(meter => 
      meter.Label === 'L2' && meter.Zone === zone
    );
    
    const bulkSupply = zoneBulkMeter ? 
      getReadingValue(zoneBulkMeter, selectedMonth) : 0;
    
    // Sum all L3 meters in this zone
    const individualMeters = data
      .filter(meter => 
        (meter.Label === 'L3' || meter.Label === 'DC') && 
        meter.Zone === zone
      )
      .reduce((sum, meter) => {
        return sum + getReadingValue(meter, selectedMonth);
      }, 0);
    
    // Calculate loss
    const loss = bulkSupply - individualMeters;
    const lossPercentage = bulkSupply > 0 ? (loss / bulkSupply) * 100 : 0;
    
    return {
      zone,
      bulkSupply,
      individualMeters,
      loss,
      lossPercentage
    };
  }).sort((a, b) => b.lossPercentage - a.lossPercentage);
};

/**
 * Calculate consumption by type
 */
export const calculateTypeConsumption = (
  data: WaterConsumptionData[],
  selectedMonth: string
): TypeConsumption[] => {
  const typeMap: Record<string, number> = {};
  
  // Calculate consumption for each type
  data.forEach(meter => {
    if (meter.Type && (meter.Label === 'L3' || meter.Label === 'DC')) {
      const consumption = getReadingValue(meter, selectedMonth);
      
      if (!typeMap[meter.Type]) {
        typeMap[meter.Type] = 0;
      }
      
      typeMap[meter.Type] += consumption;
    }
  });
  
  // Calculate total consumption
  const totalConsumption = Object.values(typeMap).reduce((sum, val) => sum + val, 0);
  
  // Format the result
  const result = Object.entries(typeMap)
    .map(([type, consumption]) => ({
      type,
      consumption,
      percentage: totalConsumption > 0 ? (consumption / totalConsumption) * 100 : 0
    }))
    .sort((a, b) => b.consumption - a.consumption);
  
  return result;
};

/**
 * Calculate monthly consumption and loss trends
 */
export const calculateMonthlyTrends = (
  data: WaterConsumptionData[],
  months: string[]
): MonthlyConsumption[] => {
  const filteredMonths = months.filter(month => month !== 'all');
  
  return filteredMonths.map(month => {
    const metrics = calculateLevelMetrics(data, month);
    
    return {
      month,
      l1Supply: metrics.l1Supply,
      l2Volume: metrics.l2Volume,
      l3Volume: metrics.l3Volume,
      loss: metrics.totalLoss,
      lossPercentage: metrics.totalLossPercentage
    };
  });
};
