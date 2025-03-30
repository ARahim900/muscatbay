
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
    if (!zoneCode || zoneCode === 'all') {
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
        
        // Fetch property and expense data
        const { data, error: dataError } = await supabase
          .from('property_service_charge_data')
          .select('*');
          
        if (dataError) throw dataError;
        
        // Process and organize the data
        const propertyMap = new Map<string, PropertyServiceCharge>();
        
        data.forEach((row) => {
          const propertyId = row.property_id;
          
          if (!propertyMap.has(propertyId)) {
            propertyMap.set(propertyId, {
              propertyId,
              unitNo: row.unit_no,
              sector: row.sector,
              unitType: row.unit_type,
              bua: row.bua,
              hasLift: row.has_lift,
              zoneCode: row.zone_code,
              zoneName: row.zone_name,
              ownerName: row.owner_name,
              expenses: []
            });
          }
          
          // Add expense to property
          const property = propertyMap.get(propertyId);
          if (property) {
            // Only add unique expenses (avoiding duplicates from the CROSS JOIN)
            const expenseExists = property.expenses.some(e => e.category === row.expense_category);
            if (!expenseExists) {
              property.expenses.push({
                category: row.expense_category,
                serviceProvider: row.service_provider,
                monthlyCost: row.monthly_cost,
                annualCost: row.annual_cost,
                allocation: row.allocation
              });
            }
          }
        });
        
        const propertiesArray = Array.from(propertyMap.values());
        setProperties(propertiesArray);
        setFilteredProperties(propertiesArray);
        
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
