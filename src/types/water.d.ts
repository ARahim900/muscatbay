
/**
 * Type definitions for water system data
 */

export interface WaterZone {
  name: string;
  consumption: number;
  loss: number;
}

export interface WaterConsumptionData {
  metadata: {
    version: string;
    timestamp: string;
    description: string;
    units: string;
  };
  total: {
    consumption: number;
    loss: number;
  };
  zones: WaterZone[];
}

export interface WaterFilter {
  month: string;
  zone: string;
  type: string;
}

export interface WaterSystemData {
  levels: {
    L1: number;
    L2: number;
    L3: number;
  };
  zones: Record<string, {
    consumption: number;
    loss: number;
  }>;
  types: Record<string, number>;
  losses: {
    systemLoss: number;
    financialImpact: number;
    zoneLosses: Record<string, number>;
  };
  monthlyTrends: Record<string, {
    consumption: number;
    loss: number;
  }>;
}
