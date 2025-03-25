import { supabase } from '@/integrations/supabase/client';
import { 
  ServiceChargeZone, 
  ReserveFundRate, 
  OperatingExpense,
  PropertyUnit,
  ServiceChargeCalculation,
  ExpenseBreakdownItem,
  ExpenseCategorySummary,
  ZoneExpenseSummary,
  PropertyServiceCharge
} from '@/types/serviceCharges';

// Fetch all service charge zones
export const fetchServiceChargeZones = async (): Promise<ServiceChargeZone[]> => {
  try {
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
  } catch (err) {
    console.error('Error in fetchServiceChargeZones:', err);
    return [];
  }
};

// Fetch all reserve fund rates
export const fetchReserveFundRates = async (): Promise<ReserveFundRate[]> => {
  try {
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
  } catch (err) {
    console.error('Error in fetchReserveFundRates:', err);
    return [];
  }
};

// Fetch all operating expenses
export const fetchOperatingExpenses = async (): Promise<OperatingExpense[]> => {
  try {
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
      description: expense.description || '',
      serviceProvider: expense.service_provider,
      serviceType: expense.service_type,
      monthlyCost: expense.monthly_cost,
      annualCost: expense.annual_cost,
      allocation: expense.allocation,
      status: expense.status as 'Active' | 'Pending' | 'Expired',
      year: expense.year,
      quarter: expense.quarter,
      month: expense.month,
      notes: expense.notes || ''
    }));
  } catch (err) {
    console.error('Error in fetchOperatingExpenses:', err);
    return [];
  }
};

// Fetch all property units
export const fetchPropertyUnits = async (): Promise<PropertyUnit[]> => {
  try {
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
      hasLift: unit.has_lift || false,
      handoverDate: unit.handover_date,
      anticipatedHandoverDate: unit.anticipated_handover_date
    }));
  } catch (err) {
    console.error('Error in fetchPropertyUnits:', err);
    return [];
  }
};

// Fetch property service charges
export const fetchPropertyServiceCharges = async (): Promise<PropertyServiceCharge[]> => {
  try {
    // First fetch all property units
    const properties = await fetchPropertyUnits();
    
    // Fetch all service charge calculations
    const { data: calculations, error } = await supabase
      .from('service_charge_calculations')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching service charge calculations:', error);
      throw error;
    }
    
    // Map the calculations to property service charges
    // For each property, use the latest calculation
    const propertyCharges: PropertyServiceCharge[] = [];
    const processedPropertyIds = new Set();
    
    // Create a basic set of sample data if no real data exists
    if (calculations.length === 0) {
      return [
        {
          id: '1',
          unitNumber: 'Z3-061(1A)',
          zone: 'Zaha (Z3)',
          unitType: '2 Bedroom Small Apartment',
          bua: 115.47,
          hasLift: true,
          owner: 'Ahmed Al Balushi',
          baseOperatingShare: 1210.43,
          liftShare: 99.00,
          reserveFundContribution: 4.62,
          totalCharge: 1314.05,
          quarterlyCharge: 328.51,
          monthlyCharge: 109.50
        },
        {
          id: '2',
          unitNumber: 'Z5-008',
          zone: 'Nameer (Z5)',
          unitType: '4 Bedroom Nameer Villa',
          bua: 497.62,
          hasLift: false,
          owner: 'Mohammed Al Harthi',
          baseOperatingShare: 2840.54,
          liftShare: 0,
          reserveFundContribution: 24.88,
          totalCharge: 2865.42,
          quarterlyCharge: 716.36,
          monthlyCharge: 238.79
        },
        {
          id: '3',
          unitNumber: 'Z8-007',
          zone: 'Wajd (Z8)',
          unitType: '5 Bedroom Wajd Villa',
          bua: 750.35,
          hasLift: false,
          owner: 'Sara Johnson',
          baseOperatingShare: 4137.68,
          liftShare: 0,
          reserveFundContribution: 45.02,
          totalCharge: 4182.70,
          quarterlyCharge: 1045.68,
          monthlyCharge: 348.56
        }
      ];
    }
    
    // Get all zones to have zone names
    const zones = await fetchServiceChargeZones();
    const zoneMap = new Map(zones.map(zone => [zone.code, zone.name]));
    
    for (const calc of calculations) {
      // Skip if we already processed this property
      if (calc.property_id && processedPropertyIds.has(calc.property_id)) {
        continue;
      }
      
      // Find the property for this calculation
      const property = calc.property_id 
        ? properties.find(p => p.id === calc.property_id)
        : null;
      
      const zoneName = zoneMap.get(calc.zone_code) || calc.zone_code;
      
      propertyCharges.push({
        id: calc.id,
        unitNumber: property?.unitNo || `Property-${calc.id.substring(0, 8)}`,
        zone: zoneName,
        unitType: property?.unitType || 'Unknown',
        bua: property?.bua || calc.property_size,
        hasLift: property?.hasLift || calc.has_lift_access,
        owner: 'Owner information not available',
        baseOperatingShare: calc.operating_share,
        liftShare: calc.lift_share,
        reserveFundContribution: calc.reserve_contribution,
        totalCharge: calc.total_annual,
        quarterlyCharge: calc.quarterly,
        monthlyCharge: calc.monthly
      });
      
      if (calc.property_id) {
        processedPropertyIds.add(calc.property_id);
      }
    }
    
    return propertyCharges;
  } catch (err) {
    console.error('Error in fetchPropertyServiceCharges:', err);
    return [];
  }
};

// Save a service charge calculation
export const saveServiceChargeCalculation = async (calculation: ServiceChargeCalculation): Promise<ServiceChargeCalculation> => {
  try {
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
  } catch (err) {
    console.error('Error in saveServiceChargeCalculation:', err);
    throw err;
  }
};

// Get expense category summary for charts
export const getExpenseCategorySummary = async (): Promise<ExpenseCategorySummary[]> => {
  try {
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
  } catch (err) {
    console.error('Error in getExpenseCategorySummary:', err);
    return [];
  }
};

// Get zone expense summary for comparison
export const getZoneExpenseSummary = async (): Promise<ZoneExpenseSummary[]> => {
  try {
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
  } catch (err) {
    console.error('Error in getZoneExpenseSummary:', err);
    return [];
  }
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
