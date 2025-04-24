
/**
 * Type definitions for electricity system data
 */

export interface ElectricityConsumptionData {
  metadata: {
    version: string;
    timestamp: string;
    description: string;
    units: string;
  };
  facilities: ElectricityFacility[];
  summary: {
    totalConsumption: number;
    totalCost: number;
    highestConsumer: string;
    averageConsumption: number;
  };
}

export interface ElectricityFacility {
  id: string;
  name: string;
  type: string;
  zone: string;
  accountNumber: string;
  consumption: {
    [month: string]: number;
  };
}

export interface ElectricityFilters {
  year: number;
  month: string | 'all';
  zone: string;
  type: string;
  view: 'overview' | 'facilities' | 'trends' | 'comparison';
}
