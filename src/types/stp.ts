
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
}

export interface ProcessingMetrics {
  processingEfficiency: number;
  irrigationUtilization: number;
  directSewagePercentage: number;
  tankerPercentage: number;
}
