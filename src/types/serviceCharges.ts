// Service Charge Zone type
export interface ServiceChargeZone {
  id: number;
  name: string;
  code: string;
  totalBUA: number;
  unitCount: number;
  serviceChargeRate: number;
  reserveFundRate: number;
}

// Reserve Fund Rate type
export interface ReserveFundRate {
  id: number;
  zoneCode: string;
  rate: number;
  effectiveDate: string;
  notes?: string;
}

// Operating Expense type for calculations
export interface OperatingExpense {
  id: string;
  category: string;
  description: string;
  serviceProvider: string;
  serviceType: string;
  monthlyCost: number;
  annualCost: number;
  allocation: string;
  status: 'Active' | 'Pending' | 'Expired';
  year: number;
  quarter?: number;
  month?: number;
  notes?: string;
}

// Property Unit type
export interface PropertyUnit {
  id: string;
  unitNo: string;
  sector: string;
  propertyType: string;
  status: string;
  unitType: string;
  bua: number;
  plotSize?: number;
  unitValue?: number;
  zoneCode?: string;
  hasLift: boolean;
  handoverDate?: string;
  anticipatedHandoverDate?: string;
}

// Service Charge Calculation type
export interface ServiceChargeCalculation {
  id?: string;
  propertyId?: string;
  calculationDate: string;
  zoneCode: string;
  propertySize: number;
  hasLiftAccess: boolean;
  baseRate: number;
  liftRate: number;
  reserveRate: number;
  operatingShare: number;
  liftShare: number;
  reserveContribution: number;
  totalAnnual: number;
  quarterly: number;
  monthly: number;
}

// Expense Breakdown Item for calculation display
export interface ExpenseBreakdownItem {
  category: string;
  serviceProvider: string;
  annual: number;
  allocation: string;
  isApplicable: boolean;
  amount: number;
}

// Property Service Charge for display
export interface PropertyServiceCharge {
  id: string;
  unitNumber: string;
  zone: string;
  unitType: string;
  bua: number;
  hasLift: boolean;
  owner: string;
  baseOperatingShare: number;
  liftShare: number;
  reserveFundContribution: number;
  totalCharge: number;
  quarterlyCharge: number;
  monthlyCharge: number;
}

// Expense Category Summary for charts
export interface ExpenseCategorySummary {
  category: string;
  amount: number;
  percentage: number;
}

// Zone Expense Summary for comparison charts
export interface ZoneExpenseSummary {
  zoneName: string;
  zoneCode: string;
  baseRate: number;
  totalArea: number;
  totalAnnualCharge: number;
  averageCharge: number;
}
