
export interface ElectricityMeter {
  id: string;
  'Electrical Meter Account No'?: string;
  'Unit Number (Muncipality)'?: string;
  'Muscat Bay Number'?: string;
  'SL:no.'?: number;
  'Zone'?: string;
  'Type'?: string;
  readings: {
    [key: string]: number | null;
  };
}

export interface ElectricityConsumptionData {
  id: string;
  'Electrical Meter Account No'?: string;
  'Unit Number (Muncipality)'?: string;
  'Muscat Bay Number'?: string;
  'SL:no.'?: number;
  'Zone'?: string;
  'Type'?: string;
  [key: string]: any; // To allow for month readings like 'January-25', 'February-25', etc.
}

export interface ElectricityZoneMetrics {
  zone: string;
  totalConsumption: number;
  meterCount: number;
  avgConsumption: number;
  percentage: number;
}

export interface ElectricityTypeMetrics {
  type: string;
  consumption: number;
  percentage: number;
  meterCount: number;
}

export interface MonthlyElectricityConsumption {
  month: string;
  consumption: number;
  year?: number | string;
}

export interface ElectricityDashboardFilters {
  selectedMonth: string;
  selectedZone: string;
  selectedType: string;
  selectedView: string;
}
