
import { supabase } from '@/integrations/supabase/client';

export interface PropertyUnit {
  id: number;
  unit_no: string;
  zone: string;
  sector_zone: string;
  unit_type: string;
  property_type: string;
  status: string;
  bua: number;
  plot: number | null;
  building: string | null;
  bedrooms: number | null;
}

export interface ContributionRate {
  category: string;
  zone: string;
  property_type: string;
  rate: number;
}

export const fetchPropertyUnits = async (filters?: {
  zone?: string, 
  property_type?: string, 
  building?: string
}): Promise<PropertyUnit[]> => {
  let query = supabase.from('assets').select('*');
  
  if (filters?.zone) query = query.eq('zone', filters.zone);
  if (filters?.property_type) query = query.eq('property_type', filters.property_type);
  if (filters?.building) query = query.eq('building', filters.building);
  
  const { data, error } = await query.order('unit_no');
  
  if (error) {
    console.error('Error fetching property units:', error);
    throw error;
  }
  
  return data || [];
};

export const fetchContributionRates = async (year: number = 2025): Promise<ContributionRate[]> => {
  const { data, error } = await supabase
    .from('contribution_rates')
    .select('*')
    .eq('year', year);
  
  if (error) {
    console.error('Error fetching contribution rates:', error);
    throw error;
  }
  
  return data || [];
};

export const calculateReserveFundContribution = async (unit: PropertyUnit): Promise<any> => {
  try {
    const rates = await fetchContributionRates();
    
    // Get rates for different levels
    const masterRate = rates.find(r => r.category === 'masterCommunity' && r.zone === 'all' && r.property_type === 'all')?.rate || 0;
    const zoneRate = rates.find(r => r.category === 'zone' && r.zone === unit.zone && (r.property_type === unit.property_type || r.property_type === 'all'))?.rate || 0;
    const buildingRate = rates.find(r => 
      r.category === 'building' && 
      r.zone === unit.zone && 
      r.property_type === unit.property_type
    )?.rate || 0;
    
    // Calculate shares
    const masterShare = unit.bua * masterRate;
    const zoneShare = unit.bua * zoneRate;
    const buildingShare = unit.property_type === 'Apartment' ? unit.bua * buildingRate : 0;
    
    const totalContribution = masterShare + zoneShare + buildingShare;
    
    // Prepare breakdown
    const breakdown = [
      { 
        name: 'Master Community Infrastructure', 
        category: 'Infrastructure', 
        share: masterShare 
      },
      { 
        name: `Zone ${unit.zone} Specific Assets`, 
        category: 'Zone Specific', 
        share: zoneShare 
      },
      ...(buildingShare > 0 ? [{
        name: 'Building Specific Assets',
        category: 'Building Assets',
        share: buildingShare
      }] : [])
    ];
    
    // Save calculation result
    const { data, error } = await supabase
      .from('contribution_calculations')
      .insert({
        unit_no: unit.unit_no,
        total_annual_contribution: totalContribution,
        master_share: masterShare,
        zone_share: zoneShare,
        building_share: buildingShare,
        year: 2025,
        breakdown: breakdown
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      propertyDetails: unit,
      calculation: {
        totalAnnualContribution: totalContribution,
        zoneBreakdown: {
          master: masterShare,
          zone: zoneShare,
          building: buildingShare
        },
        componentBreakdown: breakdown
      }
    };
  } catch (err) {
    console.error('Calculation error:', err);
    throw err;
  }
};
