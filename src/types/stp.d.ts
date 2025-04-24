
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

export interface STPMonthlyAggregate {
  month: string;
  year: string;
  averageInfluent: number;
  averageEffluent: number;
  averageTSS: number;
  averageBOD: number;
  averageCOD: number;
  efficiency: number;
}

export interface STPFilters {
  plantId?: string;
  startDate?: string;
  endDate?: string;
  month?: string;
  year?: string;
}

export interface STPDailyData {
  records: STPDailyRecord[];
}
