
// Base 2021 RFS rates in OMR per Square Foot (SqFt)
export const RFS_BASE_RATES_2021 = {
  // Zones
  zaha: 0.04,          // Zone 3
  nameer: 0.10,        // Zone 5
  wajd: 0.03,          // Zone 8
  staffAccommodation: 0.36, // Staff Acc & CF
  masterCommunity: 0.16,    // Master Community areas
  commercial: 0.16,         // Commercial (based on Master Community rate)
};

// Annual growth rate as per RFS
export const ANNUAL_GROWTH_RATE = 0.005; // 0.5% per year

// Square meter to square foot conversion factor
export const SQM_TO_SQFT = 10.7639;

// Calculate the adjusted rate for a given year based on the 2021 base rate
export const calculateAdjustedRate = (baseRate: number, year: number): number => {
  const yearsSince2021 = year - 2021;
  return baseRate * Math.pow(1 + ANNUAL_GROWTH_RATE, yearsSince2021);
};

// Get the appropriate base rate for a zone
export const getBaseRateForZone = (zone: string): number => {
  switch (zone) {
    case '3': // Zaha
      return RFS_BASE_RATES_2021.zaha;
    case '5': // Nameer
      return RFS_BASE_RATES_2021.nameer;
    case '8': // Wajd
      return RFS_BASE_RATES_2021.wajd;
    case '1': // Staff Accommodation
      return RFS_BASE_RATES_2021.staffAccommodation;
    case '2': // Commercial
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
  year: number = 2025 // Default to 2025
): number => {
  if (!buaSqm || buaSqm <= 0) {
    return 0;
  }

  // Step 1: Get the base rate for the zone in OMR/SqFt
  const baseRate = getBaseRateForZone(zone);
  
  // Step 2: Adjust the rate for the selected year
  const adjustedRate = calculateAdjustedRate(baseRate, year);
  
  // Step 3: Convert area from SqM to SqFt
  const areaSqFt = buaSqm * SQM_TO_SQFT;
  
  // Step 4: Calculate the total contribution
  const totalContribution = areaSqFt * adjustedRate;
  
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
    case 'MC':
      return 'Master Community';
    default:
      return `Zone ${zone}`;
  }
};
