
export interface WaterMeterRow {
  meterLabel: string;
  acctNum: string;
  zone: string;
  type: string;
  parentMeterLabel: string | null;
  label: string;
  [key: string]: any; // For month columns like "Jan-24", "Feb-24", etc.
}

export interface ZoneMetrics {
  l2Bulk: number;
  l3Sum: number;
  loss: number;
  lossPercentage: number;
}

export interface CalculatedMetrics {
  totalL1Supply: number;
  totalL2Volume: number;
  totalL3Volume: number;
  stage1Loss: number;
  stage1LossPercentage: number;
  stage2Loss: number;
  stage2LossPercentage: number;
  totalLoss: number;
  totalLossPercentage: number;
  consumptionByType: Record<string, number>;
  zoneMetrics: Record<string, ZoneMetrics>;
  topLosingZones: Array<{name: string; lossPercentage: number}>;
  debugInfo: {
    l1Count: number;
    l2Count: number;
    dcFromL1Count: number;
    l3ForTotalCount: number;
    dcForTotalCount: number;
    excludedL3Value: number;
  };
}

export interface ProcessedWaterData {
  meterLabel: string;
  acctNum: string;
  zone: string;
  type: string;
  parentMeterLabel: string | null;
  label: string;
  [key: string]: string | number | null;
}

export interface WaterSystemSectionProps {
  fullView?: boolean;
}

export interface WaterSystemState {
  rawData: any[];
  processedData: WaterMeterRow[];
  selectedYear: string;
  selectedMonth: string;
  selectedPeriod: string;
  activeTab: string;
  selectedZone: string;
  selectedType: string;
  isLoading: boolean;
  isScriptLoading: boolean;
  settingsSaved: boolean;
  searchTerm: string;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  light: string;
  white: string;
  darkText: string;
  lightText: string;
  success: string;
  warning: string;
  error: string;
  chartColors: string[];
}

export interface PapaParse {
  parse(csv: string, config: PapaParseConfig): PapaParseResult;
}

export interface PapaParseConfig {
  header?: boolean;
  dynamicTyping?: boolean;
  skipEmptyLines?: boolean;
  transformHeader?: (header: string) => string;
}

export interface PapaParseResult {
  data: any[];
  errors: any[];
}

export interface Window {
  Papa: PapaParse;
}
