
export interface WaterMetrics {
  bulkReading: number;
  l3Sum: number;
  loss: number;
  lossPercent: number;
}

export interface ZoneData {
  zone: string;
  consumption: number;
  loss: number;
  lossPercent: number;
}

export interface TypeData {
  type: string;
  value: number;
  percentage: number;
}

export interface WaterSystemMetrics {
  total: {
    consumption: number;
    loss: number;
    lossPercent: number;
  };
  zones: ZoneData[];
  types: TypeData[];
  monthly: {
    [key: string]: {
      consumption: number;
      loss: number;
    };
  }
}
