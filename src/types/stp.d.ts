
/**
 * Type definitions for STP (Sewage Treatment Plant) data
 */

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
  year: number;
  plantId: string;
  plantName: string;
  averageInfluentFlow: number;
  averageEffluentFlow: number;
  averageTSS: number;
  averageBOD: number;
  averageCOD: number;
  averagePH: number;
  averageDO: number;
  averageTemperature: number;
  compliancePct: number;
}

export interface STPFilters {
  plant: string;
  dateRange: {
    start: string;
    end: string;
  };
  year: number | 'all';
  month: string;
  view: 'daily' | 'monthly' | 'compliance' | 'efficiency';
}

export interface STPDailyData {
  records: STPDailyRecord[];
}
