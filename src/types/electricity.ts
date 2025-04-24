
// Electricity related type definitions

export interface ElectricityRecord {
  id: string;
  zone: string;
  name: string;
  type: string;
  consumption: {
    [month: string]: number;
  };
  cost: number;
}

export interface ElectricityConsumptionData {
  records: ElectricityRecord[];
  total: {
    consumption: number;
    cost: number;
  };
  trends: {
    [month: string]: number;
  };
}

export interface TypeConsumption {
  type: string;
  consumption: number;
  cost: number;
}

export interface TopConsumer {
  name: string;
  type: string;
  consumption: number;
  cost: number;
}

export interface MonthlyTypeConsumption {
  month: string;
  [type: string]: string | number;
}

export interface FacilityConsumption {
  name: string;
  type: string;
  consumption: number;
  cost: number;
  previousConsumption: number | null;
  previousCost: number | null;
  change: number | null;
}
