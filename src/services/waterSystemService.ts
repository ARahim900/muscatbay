
import Papa from 'papaparse';
import { WaterSystemData, WaterFilter, CSVRowData } from '@/types/water';

const WATER_RATE_OMR = 3.5; // OMR per cubic meter - adjust as needed

export const parseWaterData = async (filters: WaterFilter): Promise<WaterSystemData> => {
  // Load CSV file
  const response = await fetch('/src/data/Master WA DB  - Master_WA_DB .csv');
  const csvText = await response.text();
  
  // Parse CSV
  const { data } = Papa.parse<CSVRowData>(csvText, {
    header: true,
    skipEmptyLines: true
  });
  
  console.log('Parsed CSV data:', data);
  
  // Filter data based on selected filters
  const filteredData = data.filter(row => {
    if (filters.zone !== 'all' && row.Zone !== filters.zone) return false;
    if (filters.type !== 'all' && row.Type !== filters.type) return false;
    return true;
  });
  
  // Calculate L1, L2, L3 totals
  const levels = {
    L1: calculateLevelTotal(filteredData, 'L1'),
    L2: calculateLevelTotal(filteredData, 'L2'),
    L3: calculateLevelTotal(filteredData, 'L3')
  };
  
  // Calculate zone analysis
  const zones = calculateZoneAnalysis(filteredData);
  
  // Calculate type breakdown
  const types = calculateTypeBreakdown(filteredData);
  
  // Calculate losses
  const losses = calculateLossAnalysis(filteredData);
  
  // Calculate monthly trends
  const monthlyTrends = calculateMonthlyTrends(filteredData);
  
  return {
    levels,
    zones,
    types,
    losses,
    monthlyTrends
  };
};

// Helper functions
const calculateLevelTotal = (data: CSVRowData[], level: string): number => {
  return data
    .filter(row => determineMeterLevel(row.Type, row['Parent Meter']) === level)
    .reduce((sum, row) => sum + parseFloat(row[getCurrentMonthColumn()] || '0'), 0);
};

const calculateZoneAnalysis = (data: CSVRowData[]) => {
  const zones: { [key: string]: { consumption: number; loss: number } } = {};
  
  data.forEach(row => {
    if (!zones[row.Zone]) {
      zones[row.Zone] = { consumption: 0, loss: 0 };
    }
    
    const consumption = parseFloat(row[getCurrentMonthColumn()] || '0');
    zones[row.Zone].consumption += consumption;
    
    // Calculate zone loss (difference between zone bulk meter and sum of sub-meters)
    if (row.Type === 'Zone Bulk') {
      const subMetersSum = data
        .filter(subRow => 
          subRow.Zone === row.Zone && 
          subRow.Type !== 'Zone Bulk'
        )
        .reduce((sum, subRow) => 
          sum + parseFloat(subRow[getCurrentMonthColumn()] || '0'), 
          0
        );
      
      zones[row.Zone].loss = consumption - subMetersSum;
    }
  });
  
  return zones;
};

const calculateTypeBreakdown = (data: CSVRowData[]) => {
  const types: { [key: string]: number } = {};
  
  data.forEach(row => {
    if (!types[row.Type]) {
      types[row.Type] = 0;
    }
    types[row.Type] += parseFloat(row[getCurrentMonthColumn()] || '0');
  });
  
  return types;
};

const calculateLossAnalysis = (data: CSVRowData[]) => {
  // Calculate total system input
  const mainBulkFlow = data
    .filter(row => row.Type === 'Main BULK')
    .reduce((sum, row) => sum + parseFloat(row[getCurrentMonthColumn()] || '0'), 0);
  
  // Calculate total consumption
  const totalConsumption = data
    .filter(row => row.Type !== 'Main BULK' && row.Type !== 'Zone Bulk')
    .reduce((sum, row) => sum + parseFloat(row[getCurrentMonthColumn()] || '0'), 0);
  
  // Calculate system loss
  const systemLoss = mainBulkFlow - totalConsumption;
  
  // Calculate zone-specific losses
  const zoneLosses: { [key: string]: number } = {};
  Object.keys(calculateZoneAnalysis(data)).forEach(zone => {
    zoneLosses[zone] = calculateZoneAnalysis(data)[zone].loss;
  });
  
  return {
    systemLoss,
    zoneLosses,
    financialImpact: systemLoss * WATER_RATE_OMR
  };
};

const calculateMonthlyTrends = (data: CSVRowData[]) => {
  const months = [
    'jan_24', 'feb_24', 'mar_24', 'apr_24', 'may_24', 'jun_24',
    'jul_24', 'aug_24', 'sep_24', 'oct_24', 'nov_24', 'dec_24',
    'jan_25', 'feb_25'
  ];
  
  const trends: { [key: string]: { consumption: number; loss: number } } = {};
  
  months.forEach(month => {
    const mainBulkFlow = data
      .filter(row => row.Type === 'Main BULK')
      .reduce((sum, row) => sum + parseFloat(row[month] || '0'), 0);
      
    const consumption = data
      .filter(row => row.Type !== 'Main BULK' && row.Type !== 'Zone Bulk')
      .reduce((sum, row) => sum + parseFloat(row[month] || '0'), 0);
      
    trends[month] = {
      consumption,
      loss: mainBulkFlow - consumption
    };
  });
  
  return trends;
};

// Utility functions
const determineMeterLevel = (type: string, parentMeter: string | null): string => {
  if (type === 'Main BULK') return 'L1';
  if (type === 'Zone Bulk') return 'L2';
  return 'L3';
};

const getCurrentMonthColumn = (): string => {
  // Default to most recent month (feb_25)
  return 'feb_25';
};

export const getAvailableZones = async (): Promise<string[]> => {
  const response = await fetch('/src/data/Master WA DB  - Master_WA_DB .csv');
  const csvText = await response.text();
  
  const { data } = Papa.parse<CSVRowData>(csvText, {
    header: true,
    skipEmptyLines: true
  });
  
  // Fix: Convert unknown[] to string[] by explicitly filtering out non-string values and asserting the type
  const zones = Array.from(new Set(data.map(row => row.Zone)))
    .filter((zone): zone is string => typeof zone === 'string' && zone !== '');
  
  return zones;
};

export const getAvailableTypes = async (): Promise<string[]> => {
  const response = await fetch('/src/data/Master WA DB  - Master_WA_DB .csv');
  const csvText = await response.text();
  
  const { data } = Papa.parse<CSVRowData>(csvText, {
    header: true,
    skipEmptyLines: true
  });
  
  // Fix: Convert unknown[] to string[] by explicitly filtering out non-string values and asserting the type
  const types = Array.from(new Set(data.map(row => row.Type)))
    .filter((type): type is string => typeof type === 'string' && type !== '');
  
  return types;
};
