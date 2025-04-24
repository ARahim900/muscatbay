
/**
 * Type definitions for electricity system data
 */

export interface ElectricityRecord {
  name: string;
  type: string;
  meterAccountNo: string;
  consumption: Record<string, number>;
}

export interface ElectricityConsumptionData {
  metadata: {
    version: string;
    timestamp: string;
    description: string;
    units: string;
  };
  data: ElectricityRecord[];
}

export interface ElectricityConsumptionByType {
  type: string;
  consumption: number;
  percentage: number;
}

export interface ElectricityMonthlyTotal {
  month: string;
  consumption: number;
  previousMonthChange: number;
}

export interface ElectricityFilters {
  month: string;
  type: string;
  sortBy: 'name' | 'consumption' | 'type';
  sortOrder: 'asc' | 'desc';
}
