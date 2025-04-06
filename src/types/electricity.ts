
export interface ElectricityRecord {
  id?: number;
  meter_label: string;
  account_number: string;
  zone: string;
  type: string;
  consumption: number;
  reading_date: string;
  created_at?: string;
}
