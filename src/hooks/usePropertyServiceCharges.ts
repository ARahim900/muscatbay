
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PropertyServiceCharge {
  propertyId: string;
  unitNo: string;
  sector: string;
  unitType: string;
  bua: number;
  hasLift: boolean;
  zoneCode: string;
  zoneName: string;
  ownerName: string | null;
  expenses: ExpenseItem[];
}

export interface ExpenseItem {
  category: string;
  serviceProvider: string;
  monthlyCost: number;
  annualCost: number;
  allocation: string;
}

export interface ZoneInfo {
  code: string;
  name: string;
  totalBua: number;
  unitCount: number;
  serviceChargeRate: number;
  reserveFundRate: number;
}

export const usePropertyServiceCharges = () => {
  const [properties, setProperties] = useState<PropertyServiceCharge[]>([]);
  const [zones, setZones] = useState<ZoneInfo[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<PropertyServiceCharge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Filter properties by zone
  const filterPropertiesByZone = (zoneCode: string) => {
    if (!zoneCode) {
      setFilteredProperties(properties);
      return;
    }
    
    const filtered = properties.filter(property => property.zoneCode === zoneCode);
    setFilteredProperties(filtered);
  };

  // Filter properties by search term (unitNo or owner name)
  const filterPropertiesBySearch = (searchTerm: string) => {
    if (!searchTerm) {
      setFilteredProperties(properties);
      return;
    }
    
    const term = searchTerm.toLowerCase();
    const filtered = properties.filter(
      property => 
        property.unitNo.toLowerCase().includes(term) || 
        (property.ownerName && property.ownerName.toLowerCase().includes(term))
    );
    setFilteredProperties(filtered);
  };

  useEffect(() => {
    const fetchPropertyData = async () => {
      setLoading(true);
      try {
        // Fetch zones
        const { data: zonesData, error: zonesError } = await supabase
          .from('service_charge_zones')
          .select('*')
          .order('name');
          
        if (zonesError) throw zonesError;
        
        // Fetch all property units
        const { data: propertyUnitsData, error: propertyUnitsError } = await supabase
          .from('property_units')
          .select(`
            id,
            unit_no,
            sector,
            unit_type,
            bua,
            has_lift,
            zone_code,
            property_transactions(
              property_owners(client_name)
            )
          `)
          .order('unit_no');
          
        if (propertyUnitsError) throw propertyUnitsError;
        
        // Fetch expense data
        const { data: expensesData, error: expensesError } = await supabase
          .from('operating_expenses')
          .select('*')
          .eq('status', 'Active');
          
        if (expensesError) throw expensesError;
        
        // Process and organize the data
        const propertyList: PropertyServiceCharge[] = [];
        
        // Map for zone code to name
        const zoneMap = new Map(zonesData.map(zone => [zone.code, zone.name]));
        
        // Process property units
        propertyUnitsData.forEach((unit) => {
          const propertyExpenses = expensesData.map(expense => ({
            category: expense.category,
            serviceProvider: expense.service_provider,
            monthlyCost: expense.monthly_cost,
            annualCost: expense.annual_cost,
            allocation: expense.allocation
          }));
          
          propertyList.push({
            propertyId: unit.id,
            unitNo: unit.unit_no,
            sector: unit.sector || 'Unknown',
            unitType: unit.unit_type || 'Unknown',
            bua: unit.bua || 0,
            hasLift: unit.has_lift || false,
            zoneCode: unit.zone_code || 'Unknown',
            zoneName: zoneMap.get(unit.zone_code) || unit.zone_code || 'Unknown',
            ownerName: unit.property_transactions?.[0]?.property_owners?.client_name || null,
            expenses: propertyExpenses
          });
        });
        
        setProperties(propertyList);
        setFilteredProperties(propertyList);
        
        // Format zones
        const formattedZones = zonesData.map(zone => ({
          code: zone.code,
          name: zone.name,
          totalBua: zone.total_bua,
          unitCount: zone.unit_count,
          serviceChargeRate: zone.service_charge_rate,
          reserveFundRate: zone.reserve_fund_rate
        }));
        setZones(formattedZones);
        
      } catch (err) {
        console.error('Error fetching property service charge data:', err);
        setError('Failed to load property data');
        toast({
          title: 'Error',
          description: 'Failed to load property data from the database',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchPropertyData();
  }, [toast]);

  return {
    properties,
    filteredProperties,
    zones,
    loading,
    error,
    filterPropertiesByZone,
    filterPropertiesBySearch
  };
};
