
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
