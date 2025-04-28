
export interface ParsedCsvRow {
  [key: string]: string | number;
  "Meter Label"?: string;
  "Acct #"?: string;
  Zone?: string;
  Type?: string;
  "Parent Meter"?: string;
  Label?: string;
  "Level "?: string;
}

export interface WaterMeterData {
  meterLabel: string;
  acctNum: string;
  zone: string;
  type: string;
  parentMeterLabel: string | null;
  label: string;
  [key: string]: string | number | null;
}

export interface ZoneMetrics {
  zoneName: string;
  consumption: number;
  percentage: number;
  status: string;
}

export interface TypeMetrics {
  typeName: string;
  consumption: number;
  percentage: number;
}

export interface WaterSystemTabProps {
  selectedYear: string;
  selectedMonth: string;
}

export interface WaterChartData {
  name: string;
  value: number;
}
