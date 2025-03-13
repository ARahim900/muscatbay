
export interface WaterData {
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
  jan_25: number;
  feb_25: number;
  total: number;
}

export interface CSVRowData {
  'Meter Label': string;
  'Acct #': string;
  'Zone': string;
  'Type': string;
  'Parent Meter': string;
  'Jan-24': string;
  'Feb-24': string;
  'Mar-24': string;
  'Apr-24': string;
  'May-24': string;
  'Jun-24': string;
  'Jul-24': string;
  'Aug-24': string;
  'Sep-24': string;
  'Oct-24': string;
  'Nov-24': string;
  'Dec-24': string;
  'Jan-25': string;
  'Feb-25': string;
  'Total': string;
  [key: string]: string; // Allow for additional properties
}
