
interface WaterData {
  total: number;
  meter_label: string;
  account_number: string;
  zone: string;
  type: string;
  parent_meter: string;
  jan_24: number;
  feb_24: number;
  mar_24: number;
  apr_24: number;
  may_24: number;
  jun_24: number;
  jul_24: number;
  aug_24: number;
  sep_24: number;
  oct_24: number;
  nov_24: number;
  dec_24: number;
  status: string;
}

interface WaterConsumptionData {
  total: {
    consumption: number;
    loss: number;
    percentage: number;
  };
  byType: {
    [key: string]: number;
  };
  byZone: {
    [key: string]: number;
  };
  trend: {
    month: string;
    consumption: number;
    loss: number;
  }[];
  systemStats: {
    totalMeters: number;
    activeZones: number;
    averageConsumption: number;
  };
  waterZones: string[];
}
