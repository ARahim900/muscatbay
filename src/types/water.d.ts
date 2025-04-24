
/**
 * Type definitions for water system data
 */

export interface WaterZone {
  name: string;
  consumption: number;
  loss: number;
}

export interface WaterConsumptionData {
  metadata: {
    version: string;
    timestamp: string;
    description: string;
    units: string;
  };
  total: {
    consumption: number;
    loss: number;
  };
  zones: WaterZone[];
}

export interface WaterSystemMetrics {
  totalConsumption: number;
  totalLoss: number;
  efficiency: number;
  averageDailyUsage: number;
  waterRate: number;
  monthlyCost: number;
}

export interface ZoneData {
  name: string;
  consumption: number;
  loss: number;
  percentage: number;
}

export interface TypeData {
  name: string;
  value: number;
  percentage: number;
}

export interface WaterFilters {
  zone: string;
  period: string;
  view: 'overview' | 'zones' | 'types' | 'trends';
}
