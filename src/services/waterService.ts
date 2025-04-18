
import { supabase } from '@/integrations/supabase/client';
import { WaterData } from '@/types/water';

export interface WaterMeter {
  id: number;
  meter_label: string;
  account_number: string;
  zone: string;
  type: string;
  parent_meter: string | null;
  jan_24: number;
  feb_24: number;
  mar_24: number;
  apr_24: number;
  may_24: number;
  jun_24: number;
  jul_24: number;
  aug_24: number;
  sep_24: number;
  oct_24: number;
  nov_24: number;
  dec_24: number;
  jan_25: number;
  feb_25: number;
  total: number;
  // These fields are derived, not from database
  level?: string;  // Add as optional
  status?: string; // Add as optional
  lastReading?: number; // Add as optional
}

export interface ZoneData {
  id: string;
  name: string;
  displayName: string;
  type: string;
  status: string;
}

export interface WaterConsumptionData {
  month: string;
  year: string;
  mainSupply: number;
  zone3a: number;
  zone3b: number;
  zone5: number;
  irrigation: number;
}

export interface WaterLossData {
  period: string;
  totalSupply: number;
  totalDistribution: number;
  totalConsumption: number;
  stage1Loss: number;
  stage1LossPercent: number;
  stage2Loss: number;
  stage2LossPercent: number;
  totalLossPercent: number;
}

export interface MeterReadingHistory {
  date: string;
  reading: number;
  status: string;
}

export interface MeterDetails extends WaterMeter {
  accountNumber: string;
  installDate: string;
  lastMaintenance: string;
  manufacturer: string;
  model: string;
  accuracy: string;
  readingHistory: MeterReadingHistory[];
}

// Get all water meters
export const getWaterMeters = async (): Promise<WaterMeter[]> => {
  const { data, error } = await supabase
    .from('water_distribution_master')
    .select('*');
    
  if (error) {
    console.error('Error fetching water meters:', error);
    return [];
  }
  
  // Derive the level based on type and other characteristics
  return data.map(meter => ({
    ...meter,
    // Add derived properties that don't exist in the database
    level: determineMeterLevel(meter.type, meter.parent_meter),
    status: 'Active', // Default status
    lastReading: determineMostRecentReading(meter)
  }));
};

// Helper function to determine meter level based on type and parent meter
const determineMeterLevel = (type: string, parentMeter: string | null): string => {
  if (type === 'Main BULK' || type === 'Main Bulk') {
    return 'L1';
  } else if (type === 'Zone Bulk') {
    return 'L2';
  } else if (parentMeter && (type === 'Residential' || type === 'Commercial')) {
    return 'L3';
  } else if (type === 'Irrigation') {
    return 'DC';
  } else {
    return 'Unknown';
  }
};

// Helper function to determine the most recent reading
const determineMostRecentReading = (meter: WaterMeter): number => {
  // Check each month starting from the most recent
  if (meter.feb_25 > 0) return meter.feb_25;
  if (meter.jan_25 > 0) return meter.jan_25;
  if (meter.dec_24 > 0) return meter.dec_24;
  if (meter.nov_24 > 0) return meter.nov_24;
  if (meter.oct_24 > 0) return meter.oct_24;
  if (meter.sep_24 > 0) return meter.sep_24;
  if (meter.aug_24 > 0) return meter.aug_24;
  if (meter.jul_24 > 0) return meter.jul_24;
  if (meter.jun_24 > 0) return meter.jun_24;
  if (meter.may_24 > 0) return meter.may_24;
  if (meter.apr_24 > 0) return meter.apr_24;
  if (meter.mar_24 > 0) return meter.mar_24;
  if (meter.feb_24 > 0) return meter.feb_24;
  if (meter.jan_24 > 0) return meter.jan_24;
  return 0;
};

// Get zones
export const getWaterZones = async (): Promise<ZoneData[]> => {
  // In a real implementation, this would fetch from a zones table
  // For now, we'll return mock data
  return [
    { id: 'zone-01', name: 'Zone 01', displayName: 'Zone 01 (Facility Mgmt)', type: 'Commercial', status: 'Active' },
    { id: 'zone-03a', name: 'Zone 03A', displayName: 'Zone 03A (Residential)', type: 'Residential', status: 'Active' },
    { id: 'zone-03b', name: 'Zone 03B', displayName: 'Zone 03B (Residential)', type: 'Residential', status: 'Active' },
    { id: 'zone-05', name: 'Zone 05', displayName: 'Zone 05 (Mixed)', type: 'Mixed', status: 'Active' },
    { id: 'zone-08', name: 'Zone 08', displayName: 'Zone 08 (Utility)', type: 'Utility', status: 'Active' },
  ];
};

// Get consumption data
export const getWaterConsumptionData = async (): Promise<WaterConsumptionData[]> => {
  // In a real implementation, this would aggregate from water_distribution_master
  // For now, we'll return mock data
  
  // TODO: Remove mock data and implement actual aggregation from database
  return [
    { month: 'Jan', year: '2024', mainSupply: 32803, zone3a: 1234, zone3b: 2653, zone5: 3900, irrigation: 3780 },
    { month: 'Feb', year: '2024', mainSupply: 27996, zone3a: 1099, zone3b: 2169, zone5: 3350, irrigation: 3100 },
    { month: 'Mar', year: '2024', mainSupply: 23860, zone3a: 1297, zone3b: 2315, zone5: 3250, irrigation: 2720 },
    { month: 'Apr', year: '2024', mainSupply: 31869, zone3a: 1892, zone3b: 2381, zone5: 3720, irrigation: 4250 },
  ];
};

// Get water loss data
export const getWaterLossData = async (): Promise<WaterLossData[]> => {
  // In a real implementation, this would calculate from water_distribution_master
  // For now, we'll return mock data
  
  // TODO: Remove mock data and implement actual calculation from database
  return [
    { period: 'Jan-24', totalSupply: 32803, totalDistribution: 10190, totalConsumption: 9500, stage1Loss: 22613, stage1LossPercent: 68.9, stage2Loss: 690, stage2LossPercent: 6.8, totalLossPercent: 71.0 },
    { period: 'Feb-24', totalSupply: 27996, totalDistribution: 8950, totalConsumption: 8300, stage1Loss: 19046, stage1LossPercent: 68.0, stage2Loss: 650, stage2LossPercent: 7.3, totalLossPercent: 70.3 },
    { period: 'Mar-24', totalSupply: 23860, totalDistribution: 9100, totalConsumption: 8500, stage1Loss: 14760, stage1LossPercent: 61.9, stage2Loss: 600, stage2LossPercent: 6.6, totalLossPercent: 64.4 },
    { period: 'Apr-24', totalSupply: 31869, totalDistribution: 11500, totalConsumption: 10800, stage1Loss: 20369, stage1LossPercent: 63.9, stage2Loss: 700, stage2LossPercent: 6.1, totalLossPercent: 66.1 },
  ];
};

// Get meter details
export const getWaterMeterDetails = async (meterId: string): Promise<MeterDetails | null> => {
  // In a real implementation, this would fetch from water_distribution_master and related tables
  // For now, we'll simulate by filtering the meters we already have
  
  const meters = await getWaterMeters();
  const meter = meters.find(m => m.id.toString() === meterId);
  
  if (!meter) return null;
  
  // Extend the meter with additional details
  return {
    ...meter,
    accountNumber: `430${Math.floor(1000 + Math.random() * 9000)}`,
    installDate: '2021-05-20',
    lastMaintenance: '2023-11-10',
    manufacturer: 'Flow Systems Inc.',
    model: 'SmartFlow X500',
    accuracy: '±1.5%',
    readingHistory: [
      { date: '2024-01-31', reading: determineMockReading(meterId, 0), status: 'verified' },
      { date: '2024-02-29', reading: determineMockReading(meterId, 1), status: 'verified' },
      { date: '2024-03-31', reading: determineMockReading(meterId, 2), status: 'verified' },
      { date: '2024-04-30', reading: determineMockReading(meterId, 3), status: 'verified' },
    ]
  };
};

// Helper function to generate consistent mock readings
const determineMockReading = (meterId: string, index: number): number => {
  const baseValues = [
    { m5: 61, m6: 99, other: 32 },
    { m5: 33, m6: 51, other: 2 },
    { m5: 36, m6: 53, other: 76 },
    { m5: 47, m6: 62, other: 32 },
  ];
  
  if (meterId === '5') return baseValues[index].m5;
  if (meterId === '6') return baseValues[index].m6;
  return baseValues[index].other;
};

// Get water alerts
export const getWaterAlerts = async () => {
  // In a real implementation, this would fetch from an alerts table
  // For now, we'll return mock data
  
  return [
    { id: 'alert1', type: 'consumption', severity: 'high', title: 'High Consumption', message: 'Zone 3A consumption increased by 45% from March to April', timestamp: new Date('2024-04-15T09:30:00'), status: 'new' },
    { id: 'alert2', type: 'loss', severity: 'critical', title: 'Critical Water Loss', message: 'System-wide water loss remains above 65% threshold', timestamp: new Date('2024-04-10T14:15:00'), status: 'acknowledged' },
    { id: 'alert3', type: 'meter', severity: 'medium', title: 'Meter Reading Anomaly', message: 'Z3-28 Villa shows unusual consumption pattern', timestamp: new Date('2024-04-05T11:20:00'), status: 'new' },
    { id: 'alert4', type: 'maintenance', severity: 'low', title: 'Maintenance Required', message: 'Main Bulk Meter scheduled for calibration', timestamp: new Date('2024-04-01T16:45:00'), status: 'new' },
  ];
};

// Get water summary stats
export const getWaterSummaryStats = async () => {
  // In a real implementation, this would calculate from water_distribution_master
  // For now, we'll return mock data
  
  return {
    totalConsumption: 31869,
    previousPeriodConsumption: 23860,
    changePercent: 33.6,
    activeMeters: 26,
    inactiveMeters: 2,
    alertCount: 4,
    averageLoss: 66.1,
    topConsumer: {
      label: 'Irrigation Main',
      consumption: 4250,
      percent: 13.3
    }
  };
};

// Filter meters by zone
export const filterMetersByZone = (meters: WaterMeter[], zoneId: string): WaterMeter[] => {
  if (zoneId === 'all') return meters;
  
  // Map our zone IDs to actual zone values from the database
  const zoneMapping: Record<string, string> = {
    'zone-01': 'Zone 01',
    'zone-03a': 'Zone 03(A)',
    'zone-03b': 'Zone 03(B)',
    'zone-05': 'Zone 05',
    'zone-08': 'Zone 08',
  };
  
  const targetZone = zoneMapping[zoneId];
  return meters.filter(meter => meter.zone === targetZone);
};
