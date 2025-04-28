
export interface WaterMeterRow {
  meterLabel: string;
  acctNum: string;
  zone: string;
  type: string;
  parentMeterLabel: string | null;
  label: string;
  [key: string]: any; // For month columns like "Jan-24", "Feb-24", etc.
}

export interface ZoneMetrics {
  l2Bulk: number;
  l3Sum: number;
  loss: number;
  lossPercentage: number;
}

export interface CalculatedMetrics {
  totalL1Supply: number;
  totalL2Volume: number;
  totalL3Volume: number;
  stage1Loss: number;
  stage1LossPercentage: number;
  stage2Loss: number;
  stage2LossPercentage: number;
  totalLoss: number;
  totalLossPercentage: number;
  consumptionByType: Record<string, number>;
  zoneMetrics: Record<string, ZoneMetrics>;
  topLosingZones: Array<{name: string; lossPercentage: number}>;
  debugInfo: {
    l1Count: number;
    l2Count: number;
    dcFromL1Count: number;
    l3ForTotalCount: number;
    dcForTotalCount: number;
    excludedL3Value: number;
  };
}
