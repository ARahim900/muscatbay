
export interface WaterMeter {
  id: string;
  meterLabel?: string;
  accountNumber?: string | number;
  zone?: string;
  type?: string;
  parentMeter?: string;
  label?: string; // 'L1', 'L2', 'L3', 'DC'
  readings: {
    [key: string]: number | null;
  };
}

export interface WaterConsumptionData {
  id: string;
  'Meter Label'?: string;
  'Acct #'?: number | string;
  'Zone'?: string;
  'Type'?: string;
  'Parent Meter'?: string;
  'Label'?: string; // Field to identify hierarchy level
  [key: string]: any; // To allow for month readings like 'Jan-25', 'Feb-25', etc.
}

export interface ZoneMetrics {
  zone: string;
  bulkSupply: number; // L2 reading
  individualMeters: number; // Sum of L3 readings
  loss: number; // Calculated loss
  lossPercentage: number; // Loss as percentage
}

export interface LevelMetrics {
  l1Supply: number;
  l2Volume: number;
  l3Volume: number;
  stage1Loss: number;
  stage2Loss: number;
  totalLoss: number;
  stage1LossPercentage: number;
  stage2LossPercentage: number;
  totalLossPercentage: number;
}

export interface TypeConsumption {
  type: string;
  consumption: number;
  percentage: number;
}

export interface MonthlyConsumption {
  month: string;
  l1Supply?: number;
  l2Volume?: number;
  l3Volume?: number;
  loss?: number;
  lossPercentage?: number;
}

export interface WaterDashboardFilters {
  selectedMonth: string;
  selectedZone: string;
  selectedType: string;
  selectedView: string;
}
