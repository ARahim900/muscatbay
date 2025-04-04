
// Base 2021 RFS rates in OMR per Square Meter (SqM)
// Updated with the exact rates from the provided data
export const RFS_BASE_RATES_2021 = {
  // Zones
  zaha: 2.153,          // Zone 3 Villa Rate
  zahaApartment: 3.768, // Zone 3 Apartment Rate
  nameer: 2.798,        // Zone 5
  wajd: 2.045,          // Zone 8
  staffAccommodation: 3.875, // Staff Acc & CF
  masterCommunity: 1.722,    // Master Community areas
  commercial: 1.722,         // Commercial (based on Master Community rate)
};

// Annual growth rate as per RFS (updated with precise value)
export const ANNUAL_GROWTH_RATE = 0.00500; // 0.5% per year

// Escalation factor from 2021 to 2025 (pre-calculated)
export const ESCALATION_FACTOR_2025 = 1.02015;

// Square meter to square foot conversion factor
export const SQM_TO_SQFT = 10.7639;

// Calculate the adjusted rate for a given year based on the 2021 base rate
export const calculateAdjustedRate = (baseRate: number, year: number): number => {
  const yearsSince2021 = year - 2021;
  return baseRate * Math.pow(1 + ANNUAL_GROWTH_RATE, yearsSince2021);
};

// Get the appropriate base rate for a zone and property type
export const getBaseRateForZone = (zone: string, propertyType?: string): number => {
  switch (zone) {
    case '3': // Zaha
      // Special handling for Zaha properties - apartments have a different rate
      if (propertyType && (propertyType.includes('Apartment') || propertyType.includes('apartment'))) {
        return RFS_BASE_RATES_2021.zahaApartment;
      }
      return RFS_BASE_RATES_2021.zaha;
    case '5': // Nameer
      return RFS_BASE_RATES_2021.nameer;
    case '8': // Wajd
      return RFS_BASE_RATES_2021.wajd;
    case '1': // Staff Accommodation
      return RFS_BASE_RATES_2021.staffAccommodation;
    case '2': // Commercial
    case 'C': // C Sector Commercial
      return RFS_BASE_RATES_2021.commercial;
    case 'MC': // Master Community
      return RFS_BASE_RATES_2021.masterCommunity;
    default:
      return RFS_BASE_RATES_2021.masterCommunity; // Default to Master Community rate
  }
};

// Calculate the total annual contribution for a property unit
export const calculateTotalContribution = (
  buaSqm: number,
  zone: string,
  propertyType?: string,
  year: number = 2025 // Default to 2025
): number => {
  if (!buaSqm || buaSqm <= 0) {
    return 0;
  }

  // Step 1: Get the base rate for the zone in OMR/SqM
  const baseRate = getBaseRateForZone(zone, propertyType);
  
  // Step 2: Calculate the contribution using the pre-calculated escalation factor for 2025
  // or calculate it dynamically for any other year
  let adjustedRate: number;
  
  if (year === 2025) {
    adjustedRate = baseRate * ESCALATION_FACTOR_2025;
  } else {
    adjustedRate = calculateAdjustedRate(baseRate, year);
  }
  
  // Step 3: Calculate the total contribution (BUA in SqM × Rate per SqM)
  const totalContribution = buaSqm * adjustedRate;
  
  return totalContribution;
};

// Function to get the zone display name
export const getZoneDisplayName = (zone: string): string => {
  switch (zone) {
    case '3':
      return 'Zone 3 (Zaha)';
    case '5':
      return 'Zone 5 (Nameer)';
    case '8':
      return 'Zone 8 (Wajd)';
    case '1':
      return 'Staff Accommodation & CF';
    case '2':
      return 'Zone 2 (Commercial)';
    case 'C':
      return 'C Sector (Commercial)';
    case 'MC':
      return 'Master Community';
    default:
      return `Zone ${zone}`;
  }
};
