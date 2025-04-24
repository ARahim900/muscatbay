
export interface ElectricityRecord {
  id: string;
  zone: string;
  consumption: number;
  cost: number;
}

export interface ElectricityConsumptionData {
  records: ElectricityRecord[];
  total: {
    consumption: number;
    cost: number;
  };
  trends: {
    [month: string]: number;
  };
}

export interface ElectricityFilters {
  zone?: string;
  startDate?: string;
  endDate?: string;
  month?: string;
  year?: string;
}
