
export interface ElectricityRecord {
  name: string;
  type: string;
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
  name: string;
  type: string;
  consumption: number;
  cost: number;
  previousConsumption?: number;
  previousCost?: number;
  change?: number | null;
  januaryConsumption?: number;
  januaryCost?: number;
  februaryConsumption?: number;
  februaryCost?: number;
  totalConsumption?: number;
  totalCost?: number;
}

export interface TypeConsumption {
  type: string;
  consumption: number;
  cost: number;
}

export interface MonthlyTypeConsumption {
  month: string;
  [key: string]: number | string;
}

export interface TopConsumer {
  name: string;
  type: string;
  consumption: number;
  cost: number;
}
