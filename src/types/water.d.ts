
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
  efficiency: number;
  totalLoss: number;
  costPerUnit: number;
}

export interface ZoneData {
  name: string;
  consumption: number;
  loss: number;
  efficiency: number;
}

export interface TypeData {
  name: string;
  consumption: number;
  percentage: number;
}

export interface WaterSystemData {
  zones: WaterZone[];
  metrics: WaterSystemMetrics;
}
