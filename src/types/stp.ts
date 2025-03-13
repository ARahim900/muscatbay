
export interface STPDailyData {
  date: string;
  tankerTrips: number;
  expectedVolumeTankers: number;
  directSewageMB: number;
  totalInfluent: number;
  totalWaterProcessed: number;
  tseToIrrigation: number;
  "NH4-N"?: number;
  pH?: number;
  BOD?: number;
  COD?: number;
  TSS?: number;
  TN?: number;
  TP?: number;
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

