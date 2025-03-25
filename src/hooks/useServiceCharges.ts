
import { useState, useEffect } from 'react';
import { 
  fetchServiceChargeZones,
  fetchReserveFundRates,
  fetchOperatingExpenses,
  fetchPropertyUnits,
  saveServiceChargeCalculation,
  calculateExpenseBreakdown
} from '@/services/serviceChargeService';
import {
  ServiceChargeZone,
  ReserveFundRate,
  OperatingExpense,
  PropertyUnit,
  ServiceChargeCalculation,
  ExpenseBreakdownItem
} from '@/types/serviceCharges';
import { useToast } from '@/hooks/use-toast';

export const useServiceCharges = () => {
  const [zones, setZones] = useState<ServiceChargeZone[]>([]);
  const [rates, setRates] = useState<ReserveFundRate[]>([]);
  const [expenses, setExpenses] = useState<OperatingExpense[]>([]);
  const [properties, setProperties] = useState<PropertyUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [zonesData, ratesData, expensesData, propertiesData] = await Promise.all([
          fetchServiceChargeZones(),
          fetchReserveFundRates(),
          fetchOperatingExpenses(),
          fetchPropertyUnits()
        ]);
        
        setZones(zonesData);
        setRates(ratesData);
        setExpenses(expensesData);
        setProperties(propertiesData);
      } catch (err) {
        console.error('Error fetching service charge data:', err);
        setError('Failed to load service charge data. Please try again later.');
        toast({
          title: 'Error',
          description: 'Failed to load service charge data. Please try again later.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [toast]);

  // Calculate service charges for a property
  const calculateServiceCharge = (
    zoneCode: string,
    propertySize: number,
    hasLiftAccess: boolean,
    propertyId?: string
  ): { 
    calculation: ServiceChargeCalculation; 
    breakdown: ExpenseBreakdownItem[] 
  } => {
    // Find the zone data
    const zone = zones.find(z => z.code === zoneCode);
    if (!zone) {
      throw new Error(`Zone with code ${zoneCode} not found`);
    }
    
    // Find the current reserve fund rate
    const reserveFundRate = rates
      .filter(r => r.zoneCode === zoneCode)
      .sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime())[0]?.rate || zone.reserveFundRate;
    
    // Get lift maintenance expense
    const liftExpense = expenses.find(e => e.category === 'Lift Maintenance');
    const liftMaintenanceCost = liftExpense?.annualCost || 0;
    
    // Calculate operating expenses excluding lift
    const nonLiftExpenses = expenses
      .filter(e => e.category !== 'Lift Maintenance')
      .reduce((sum, e) => sum + e.annualCost, 0);
    
    // Get properties with lifts for lift cost distribution
    const propertiesWithLifts = properties.filter(p => p.hasLift);
    const liftAreaTotal = propertiesWithLifts.reduce((sum, p) => sum + p.bua, 0);
    
    // Calculate rates
    const baseRate = nonLiftExpenses / zone.totalBUA;
    const liftRate = liftAreaTotal > 0 ? liftMaintenanceCost / liftAreaTotal : 0;
    
    // Calculate shares
    const operatingShare = baseRate * propertySize;
    const liftShare = hasLiftAccess ? liftRate * propertySize : 0;
    const reserveContribution = reserveFundRate * propertySize;
    
    // Calculate totals
    const totalAnnual = operatingShare + liftShare + reserveContribution;
    const quarterly = totalAnnual / 4;
    const monthly = totalAnnual / 12;
    
    // Create calculation object
    const calculation: ServiceChargeCalculation = {
      propertyId,
      calculationDate: new Date().toISOString(),
      zoneCode,
      propertySize,
      hasLiftAccess,
      baseRate,
      liftRate,
      reserveRate: reserveFundRate,
      operatingShare,
      liftShare,
      reserveContribution,
      totalAnnual,
      quarterly,
      monthly
    };
    
    // Generate expense breakdown
    const breakdown = calculateExpenseBreakdown(
      expenses,
      propertySize,
      hasLiftAccess,
      operatingShare
    );
    
    return { calculation, breakdown };
  };

  // Save calculation to database
  const saveCalculation = async (calculation: ServiceChargeCalculation) => {
    try {
      setLoading(true);
      const savedCalculation = await saveServiceChargeCalculation(calculation);
      toast({
        title: 'Success',
        description: 'Service charge calculation saved successfully',
      });
      return savedCalculation;
    } catch (err) {
      console.error('Error saving calculation:', err);
      toast({
        title: 'Error',
        description: 'Failed to save calculation. Please try again.',
        variant: 'destructive'
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    zones,
    rates,
    expenses,
    properties,
    loading,
    error,
    calculateServiceCharge,
    saveCalculation
  };
};
