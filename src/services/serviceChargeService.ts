
import { supabase } from '@/integrations/supabase/client';
import { 
  ServiceChargeZone, 
  ReserveFundRate, 
  OperatingExpense,
  PropertyUnit,
  ServiceChargeCalculation,
  ExpenseCategorySummary,
  ZoneExpenseSummary
} from '@/types/serviceCharges';

// Fetch all service charge zones
export const fetchServiceChargeZones = async (): Promise<ServiceChargeZone[]> => {
  const { data, error } = await supabase
    .from('service_charge_zones')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching service charge zones:', error);
    throw error;
  }

  // Map database columns to camelCase for frontend
  return data.map(zone => ({
    id: zone.id,
    name: zone.name,
    code: zone.code,
    totalBUA: zone.total_bua,
    unitCount: zone.unit_count,
    serviceChargeRate: zone.service_charge_rate,
    reserveFundRate: zone.reserve_fund_rate
  }));
};

// Fetch all reserve fund rates
export const fetchReserveFundRates = async (): Promise<ReserveFundRate[]> => {
  const { data, error } = await supabase
    .from('reserve_fund_rates')
    .select('*')
    .order('effective_date', { ascending: false });

  if (error) {
    console.error('Error fetching reserve fund rates:', error);
    throw error;
  }

  return data.map(rate => ({
    id: rate.id,
    zoneCode: rate.zone_code,
    rate: rate.rate,
    effectiveDate: rate.effective_date,
    notes: rate.notes
  }));
};

// Fetch all operating expenses
export const fetchOperatingExpenses = async (): Promise<OperatingExpense[]> => {
  const { data, error } = await supabase
    .from('operating_expenses')
    .select('*')
    .eq('status', 'Active')
    .order('category');

  if (error) {
    console.error('Error fetching operating expenses:', error);
    throw error;
  }

  return data.map(expense => ({
    id: expense.id,
    category: expense.category,
    description: expense.description,
    serviceProvider: expense.service_provider,
    serviceType: expense.service_type,
    monthlyCost: expense.monthly_cost,
    annualCost: expense.annual_cost,
    allocation: expense.allocation,
    status: expense.status,
    year: expense.year,
    quarter: expense.quarter,
    month: expense.month,
    notes: expense.notes
  }));
};

// Fetch all property units
export const fetchPropertyUnits = async (): Promise<PropertyUnit[]> => {
  const { data, error } = await supabase
    .from('property_units')
    .select('*')
    .order('unit_no');

  if (error) {
    console.error('Error fetching property units:', error);
    throw error;
  }

  return data.map(unit => ({
    id: unit.id,
    unitNo: unit.unit_no,
    sector: unit.sector,
    propertyType: unit.property_type,
    status: unit.status,
    unitType: unit.unit_type,
    bua: unit.bua,
    plotSize: unit.plot_size,
    unitValue: unit.unit_value,
    zoneCode: unit.zone_code,
    hasLift: unit.has_lift,
    handoverDate: unit.handover_date,
    anticipatedHandoverDate: unit.anticipated_handover_date
  }));
};

// Save a service charge calculation
export const saveServiceChargeCalculation = async (calculation: ServiceChargeCalculation): Promise<ServiceChargeCalculation> => {
  const { data, error } = await supabase
    .from('service_charge_calculations')
    .insert({
      property_id: calculation.propertyId,
      zone_code: calculation.zoneCode,
      property_size: calculation.propertySize,
      has_lift_access: calculation.hasLiftAccess,
      base_rate: calculation.baseRate,
      lift_rate: calculation.liftRate,
      reserve_rate: calculation.reserveRate,
      operating_share: calculation.operatingShare,
      lift_share: calculation.liftShare,
      reserve_contribution: calculation.reserveContribution,
      total_annual: calculation.totalAnnual,
      quarterly: calculation.quarterly,
      monthly: calculation.monthly
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving service charge calculation:', error);
    throw error;
  }

  return {
    id: data.id,
    propertyId: data.property_id,
    calculationDate: data.calculation_date,
    zoneCode: data.zone_code,
    propertySize: data.property_size,
    hasLiftAccess: data.has_lift_access,
    baseRate: data.base_rate,
    liftRate: data.lift_rate,
    reserveRate: data.reserve_rate,
    operatingShare: data.operating_share,
    liftShare: data.lift_share,
    reserveContribution: data.reserve_contribution,
    totalAnnual: data.total_annual,
    quarterly: data.quarterly,
    monthly: data.monthly
  };
};

// Get expense category summary for charts
export const getExpenseCategorySummary = async (): Promise<ExpenseCategorySummary[]> => {
  const expenses = await fetchOperatingExpenses();
  
  // Group expenses by category
  const categoryMap = new Map<string, number>();
  let totalExpenses = 0;
  
  expenses.forEach(expense => {
    const currentTotal = categoryMap.get(expense.category) || 0;
    categoryMap.set(expense.category, currentTotal + expense.annualCost);
    totalExpenses += expense.annualCost;
  });
  
  // Create summary with percentages
  return Array.from(categoryMap.entries()).map(([category, amount]) => ({
    category,
    amount,
    percentage: (amount / totalExpenses) * 100
  }));
};

// Get zone expense summary for comparison
export const getZoneExpenseSummary = async (): Promise<ZoneExpenseSummary[]> => {
  const zones = await fetchServiceChargeZones();
  
  return zones.map(zone => {
    // Calculate total and average charges
    const totalAnnualCharge = zone.totalBUA * zone.serviceChargeRate * 12;
    const averageCharge = zone.unitCount > 0 ? totalAnnualCharge / zone.unitCount : 0;
    
    return {
      zoneName: zone.name,
      zoneCode: zone.code,
      baseRate: zone.serviceChargeRate,
      totalArea: zone.totalBUA,
      totalAnnualCharge,
      averageCharge
    };
  });
};

// Get expense breakdown for a specific property calculation
export const calculateExpenseBreakdown = (
  expenses: OperatingExpense[],
  propertySize: number,
  hasLift: boolean,
  totalOperatingShare: number
): ExpenseBreakdownItem[] => {
  // Filter out lift maintenance if not applicable
  const applicableExpenses = expenses.filter(exp => 
    exp.category !== 'Lift Maintenance' || hasLift
  );
  
  // Calculate non-lift expenses total
  const nonLiftExpensesTotal = expenses
    .filter(exp => exp.category !== 'Lift Maintenance')
    .reduce((sum, exp) => sum + exp.annualCost, 0);
  
  // Calculate each expense's contribution
  return expenses.map(expense => {
    const isApplicable = expense.category !== 'Lift Maintenance' || hasLift;
    let amount = 0;
    
    if (isApplicable) {
      if (expense.category === 'Lift Maintenance') {
        // Lift expenses are calculated separately based on properties with lifts
        const liftExpense = expenses.find(e => e.category === 'Lift Maintenance');
        amount = liftExpense ? (liftExpense.annualCost / propertySize) * propertySize : 0;
      } else {
        // Operating expenses are proportional to the total operating share
        amount = (expense.annualCost / nonLiftExpensesTotal) * totalOperatingShare;
      }
    }
    
    return {
      category: expense.category,
      serviceProvider: expense.serviceProvider,
      annual: expense.annualCost,
      allocation: expense.allocation,
      isApplicable,
      amount
    };
  });
};
