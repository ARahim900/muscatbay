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

export const fetchAssets = async (): Promise<any[]> => {
  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .order('unit_no');
  
  if (error) {
    console.error('Error fetching assets:', error);
    throw error;
  }
  
  return data || [];
};

export const getAssetCategorySummary = async (): Promise<any[]> => {
  return [
    {
      id: "CAT-001",
      name: "HVAC Systems",
      subCategory: "Chillers",
      assetCount: 12,
      totalReplacementCost: 250000,
      lifeExpectancyRange: "15-20",
      zoneCoverage: "Zones 3, 5, 8"
    },
    {
      id: "CAT-002",
      name: "Electrical Systems",
      subCategory: "Transformers",
      assetCount: 8,
      totalReplacementCost: 180000,
      lifeExpectancyRange: "20-25",
      zoneCoverage: "All Zones"
    },
    {
      id: "CAT-003",
      name: "Plumbing",
      subCategory: "Water Pumps",
      assetCount: 24,
      totalReplacementCost: 120000,
      lifeExpectancyRange: "10-15",
      zoneCoverage: "All Zones"
    }
  ];
};

export const getAssetLocationSummary = async (): Promise<any[]> => {
  return [
    {
      zone: "Zone 3",
      assetCount: 45,
      totalValue: 540000,
      criticalAssetCount: 3
    },
    {
      zone: "Zone 5",
      assetCount: 32,
      totalValue: 420000,
      criticalAssetCount: 2
    },
    {
      zone: "Zone 8",
      assetCount: 28,
      totalValue: 650000,
      criticalAssetCount: 1
    }
  ];
};

export const getCriticalAssets = async (): Promise<any[]> => {
  return [
    {
      id: "CRIT-001",
      assetName: "Main Chiller Unit",
      location: "Zone 3 - Plant Room",
      criticality: "High",
      riskScore: 8.5,
      lastInspectionDate: "2025-01-15",
      nextInspectionDate: "2025-04-15",
      replacementValue: 85000
    },
    {
      id: "CRIT-002",
      assetName: "Primary Electrical Transformer",
      location: "Zone 5 - Utility Room",
      criticality: "High",
      riskScore: 9.0,
      lastInspectionDate: "2025-02-01",
      nextInspectionDate: "2025-05-01",
      replacementValue: 110000
    },
    {
      id: "CRIT-003",
      assetName: "Emergency Generator",
      location: "Zone 8 - Service Building",
      criticality: "Medium",
      riskScore: 7.2,
      lastInspectionDate: "2025-01-20",
      nextInspectionDate: "2025-04-20",
      replacementValue: 65000
    }
  ];
};

export const getAssetConditions = async (): Promise<any[]> => {
  return [
    {
      id: "COND-001",
      conditionRating: "Excellent",
      description: "Asset is new or like new",
      assetCount: 42,
      percentage: 35,
      recommendedAction: "Standard maintenance only"
    },
    {
      id: "COND-002",
      conditionRating: "Good",
      description: "Asset shows minor wear but functions well",
      assetCount: 56,
      percentage: 45,
      recommendedAction: "Regular preventive maintenance"
    },
    {
      id: "COND-003",
      conditionRating: "Fair",
      description: "Asset shows moderate wear, some components may need attention",
      assetCount: 18,
      percentage: 15,
      recommendedAction: "Targeted maintenance within 6 months"
    },
    {
      id: "COND-004",
      conditionRating: "Poor",
      description: "Asset has significant wear, function may be compromised",
      assetCount: 5,
      percentage: 4,
      recommendedAction: "Plan for replacement within 12-24 months"
    },
    {
      id: "COND-005",
      conditionRating: "Critical",
      description: "Asset at risk of failure or unsafe operation",
      assetCount: 1,
      percentage: 1,
      recommendedAction: "Immediate replacement required"
    }
  ];
};

export const getAssetMaintenanceSchedule = async (): Promise<any[]> => {
  return [
    {
      id: "MAINT-001",
      assetName: "Cooling Tower",
      zone: "Zone 3",
      installationYear: 2020,
      currentCondition: "Good",
      nextMaintenanceYear: 2025,
      maintenanceType: "Major Overhaul",
      estimatedCost: 25000,
      lifeExpectancy: 15
    },
    {
      id: "MAINT-002",
      assetName: "Fire Pump System",
      zone: "Zone 5",
      installationYear: 2019,
      currentCondition: "Good",
      nextMaintenanceYear: 2024,
      maintenanceType: "Component Replacement",
      estimatedCost: 18000,
      lifeExpectancy: 20
    },
    {
      id: "MAINT-003",
      assetName: "Elevator - Tower B",
      zone: "Zone 8",
      installationYear: 2018,
      currentCondition: "Fair",
      nextMaintenanceYear: 2025,
      maintenanceType: "Motor Replacement",
      estimatedCost: 35000,
      lifeExpectancy: 25
    }
  ];
};

export const getAssetLifecycleForecast = async (): Promise<any[]> => {
  return [
    {
      year: 2025,
      totalPlannedExpenditure: 125000,
      criticalReplacements: 2,
      majorMaintenanceEvents: 5
    },
    {
      year: 2026,
      totalPlannedExpenditure: 180000,
      criticalReplacements: 3,
      majorMaintenanceEvents: 7
    },
    {
      year: 2027,
      totalPlannedExpenditure: 95000,
      criticalReplacements: 1,
      majorMaintenanceEvents: 4
    },
    {
      year: 2028,
      totalPlannedExpenditure: 210000,
      criticalReplacements: 4,
      majorMaintenanceEvents: 9
    },
    {
      year: 2029,
      totalPlannedExpenditure: 150000,
      criticalReplacements: 2,
      majorMaintenanceEvents: 6
    }
  ];
};
