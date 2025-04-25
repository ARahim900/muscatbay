import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Utility function to format numbers with commas
export const formatNumber = (number: number | undefined) => {
  if (number === undefined) return "N/A";
  return number.toLocaleString();
};

// Function to calculate total water consumption
export const calculateTotalConsumption = (data: WaterData[]): number => {
  return data.reduce((sum, record) => sum + record.total, 0);
};

// Function to calculate water loss percentage
export const calculateWaterLossPercentage = (consumption: number, loss: number): number => {
  if (consumption === 0) return 0;
  return (loss / consumption) * 100;
};

// Function to analyze water consumption by type
export const analyzeConsumptionByType = (data: WaterData[]) => {
  const consumptionByType: { [key: string]: number } = {};
  data.forEach(record => {
    if (record.type) {
      consumptionByType[record.type] = (consumptionByType[record.type] || 0) + record.total;
    }
  });
  return consumptionByType;
};

// Function to analyze water consumption by zone
export const analyzeConsumptionByZone = (data: WaterData[]) => {
  const consumptionByZone: { [key: string]: number } = {};
  data.forEach(record => {
    if (record.zone) {
      consumptionByZone[record.zone] = (consumptionByZone[record.zone] || 0) + record.total;
    }
  });
  return consumptionByZone;
};

// Function to simulate monthly water consumption trend
export const simulateMonthlyConsumptionTrend = (): { month: string; consumption: number; loss: number }[] => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return months.map(month => ({
    month,
    consumption: Math.floor(Math.random() * 1000), // Random consumption value
    loss: Math.floor(Math.random() * 100) // Random loss value
  }));
};

// Function to generate system statistics
export const generateSystemStats = (data: WaterData[]) => {
  const totalMeters = data.length;
  const activeZones = new Set(data.map(record => record.zone)).size;
  const totalConsumption = calculateTotalConsumption(data);
  const averageConsumption = totalMeters > 0 ? totalConsumption / totalMeters : 0;

  return {
    totalMeters,
    activeZones,
    averageConsumption
  };
};

// Function to extract unique water zones
export const extractWaterZones = (data: WaterData[]): string[] => {
  return [...new Set(data.map(record => record.zone))];
};

// Function to process water data and return analysis
export const processWaterDataForAnalysis = (data: WaterData[]): WaterConsumptionData => {
  const totalConsumption = calculateTotalConsumption(data);
  const totalLoss = Math.floor(Math.random() * totalConsumption * 0.1); // Simulate 10% loss
  const lossPercentage = calculateWaterLossPercentage(totalConsumption, totalLoss);
  const consumptionByType = analyzeConsumptionByType(data);
  const consumptionByZone = analyzeConsumptionByZone(data);
  const consumptionTrend = simulateMonthlyConsumptionTrend();
  const systemStats = generateSystemStats(data);
  const waterZones = extractWaterZones(data);

  return {
    total: {
      consumption: totalConsumption,
      loss: totalLoss,
      percentage: lossPercentage
    },
    byType: consumptionByType,
    byZone: consumptionByZone,
    trend: consumptionTrend,
    systemStats: systemStats,
    waterZones: waterZones
  };
};

// Update the function that was causing the TypeScript error
export function processWaterData(data: any[]): WaterData[] {
  if (!data || data.length === 0) {
    return [];
  }

  return data.map(row => {
    // Create an object that matches the WaterData type including all the required properties
    return {
      total: Number(row.total || 0),
      meter_label: row.meter_label,
      account_number: row.account_number,
      zone: row.zone || '',
      type: row.type || '',
      parent_meter: row.parent_meter || '',
      // Add all the required month fields with default values to match WaterData type
      jan_24: Number(row.jan_24 || 0),
      feb_24: Number(row.feb_24 || 0),
      mar_24: Number(row.mar_24 || 0),
      apr_24: Number(row.apr_24 || 0),
      may_24: Number(row.may_24 || 0),
      jun_24: Number(row.jun_24 || 0),
      jul_24: Number(row.jul_24 || 0),
      aug_24: Number(row.aug_24 || 0),
      sep_24: Number(row.sep_24 || 0),
      oct_24: Number(row.oct_24 || 0),
      nov_24: Number(row.nov_24 || 0),
      dec_24: Number(row.dec_24 || 0),
      status: row.status || 'active'
    };
  });
}

// Add the missing functions that were referenced
export function parseCSVFromClipboard(csvText: string): any[] {
  if (!csvText) return [];
  
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',').map(header => header.trim());
  
  return lines.slice(1).map(line => {
    const values = line.split(',').map(value => value.trim());
    const row: {[key: string]: string} = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    return row;
  });
}

export function saveWaterData(data: WaterData[]): Promise<void> {
  // Simulate saving data to a backend or local storage
  return new Promise((resolve) => {
    console.log('Saving water data:', data);
    // Here you would typically make an API call to save the data
    localStorage.setItem('waterData', JSON.stringify(data));
    setTimeout(resolve, 500); // Simulate network delay
  });
}
