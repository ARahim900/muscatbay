
export interface ElectricityRecord {
  id: string;
  name: string;
  type: string;
  zone?: string;
  meterAccountNo: string;
  consumption: {
    [key: string]: number;
  };
}

export interface ElectricityMonthlyData {
  month: string;
  consumption: number;
  cost: number;
}

export interface FacilityConsumption {
  id: string;
  name: string;
  type: string;
  zone?: string;
  consumption: number;
  cost: number;
  previousConsumption?: number;
  previousCost?: number;
  change?: number | null;
  totalConsumption?: number;
  totalCost?: number;
}

export interface TypeConsumption {
  type: string;
  consumption: number;
  cost: number;
  percentage?: number;
  color?: string;
}

export interface ZoneConsumption {
  zone: string;
  consumption: number;
  cost: number;
  percentage?: number;
  color?: string;
}

export interface MonthlyTypeConsumption {
  month: string;
  [key: string]: number | string;
}

export interface TopConsumer {
  id: string;
  name: string;
  type: string;
  zone?: string;
  consumption: number;
  cost: number;
}

export interface ElectricityDataSummary {
  totalConsumption: number;
  totalCost: number;
  averageConsumption: number;
  maxConsumption: number;
  maxConsumer: string;
  typeBreakdown: TypeConsumption[];
  zoneBreakdown?: ZoneConsumption[];
  topConsumers: TopConsumer[];
}
