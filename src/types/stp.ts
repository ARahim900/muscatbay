
// STP related type definitions

export interface STPDailyRecord {
  id: string;
  date: string;
  plantId: string;
  plantName: string;
  influentFlow: number;
  effluentFlow: number;
  totalSuspendedSolids: number;
  biochemicalOxygenDemand: number;
  chemicalOxygenDemand: number;
  pH: number;
  dissolvedOxygen: number;
  temperature: number;
  remarks?: string;
}

export interface STPMonthlyData {
  month: string;
  tankerTrips: number;
  expectedVolumeTankers: number;
  directSewageMB: number;
  totalInfluent: number;
  totalWaterProcessed: number;
  tseToIrrigation: number;
  utilizationPercentage?: string;
  processingEfficiency?: string;
  capacity?: number;
}

export interface ProcessingMetrics {
  processingEfficiency: number;
  irrigationUtilization: number;
  directSewagePercentage: number;
  tankerPercentage: number;
}

export interface OperatingParameter {
  name: string;
  value: number;
  min: number;
  max: number;
  status: string;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  fill?: string;
}
