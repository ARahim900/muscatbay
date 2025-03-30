
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

export interface ContributionBreakdown {
  name: string;
  category: string;
  share: number;
}

export interface ContributionCalculation {
  propertyDetails: PropertyUnit;
  calculation: {
    totalAnnualContribution: number;
    zoneBreakdown: {
      master: number;
      zone: number;
      building: number;
    };
    componentBreakdown: Array<{
      name: string;
      category: string;
      share: number;
    }>;
  };
}
