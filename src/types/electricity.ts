
export interface ElectricityRecord {
  id?: number;
  meter_label: string;
  account_number: string;
  zone: string;
  type: string;
  consumption: number;
  reading_date: string;
  created_at?: string;
  // Additional properties for the structured data from electricityData.ts
  name?: string;
  meterAccountNo?: string;
  consumption?: {
    [key: string]: number;
  };
}

// Define the additional types needed for the electricity components
export interface FacilityConsumption {
  name: string;
  type: string;
  consumption: number;
  cost: number;
  previousConsumption: number;
  previousCost: number;
  change: number | null;
}

export interface MonthlyTypeConsumption {
  month: string;
  [type: string]: string | number;
}

export interface TopConsumer {
  name: string;
  type: string;
  consumption: number;
  cost: number;
}
