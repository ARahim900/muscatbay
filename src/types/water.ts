
// Water related type definitions

export interface WaterConsumptionData {
  metadata: {
    version: string;
    timestamp: string;
    description: string;
  };
  total: {
    consumption: number;
    loss: number;
    cost: number;
  };
  zones: WaterZone[];
  trend: {
    [month: string]: number;
  };
}

export interface WaterSystemData {
  levels: {
    L1: number;
    L2: number;
    L3: number;
  };
  zones: {
    [key: string]: {
      consumption: number;
      loss: number;
    };
  };
  types: {
    [key: string]: number;
  };
  losses: {
    systemLoss: number;
    zoneLosses: {
      [key: string]: number;
    };
    financialImpact: number;
  };
  monthlyTrends: {
    [key: string]: {
      consumption: number;
      loss: number;
    };
  };
}

export interface WaterZone {
  id: string;
  name: string;
  consumption: number;
  loss: number;
  trend: {
    [month: string]: number;
  };
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

export interface WaterFilter {
  month: string;
  zone: string;
  type: string;
}

export interface WaterData {
  meter_label: string;
  account_number: string;
  zone: string;
  type: string;
  parent_meter: string;
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
}

export interface CSVRowData {
  Zone: string;
  Type: string;
  'Parent Meter': string | null;
  [key: string]: any;  // For monthly consumption data columns
}
