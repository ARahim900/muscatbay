
// Property database with comprehensive information sourced from the master database
// Contains unit details and their corresponding reserve fund contributions

export interface PropertyUnit {
  id: string;
  unitNo: string;
  sector: string;
  zone: string;
  propertyType: 'Villa' | 'Apartment' | 'Staff Accommodation' | 'Commercial' | 'Development Land';
  unitTypeDetail: string;
  buaSqm: number | null;
  clientName: string;
  reserveFund: number | null; // Annual contribution in OMR
}

// Full property database with reserve fund values
export const propertyDatabase: PropertyUnit[] = [
  // Zone 1 - Staff Accommodation
  { id: "Z1-B01", unitNo: "Z1 B01", sector: "FM", zone: "1", propertyType: "Staff Accommodation", unitTypeDetail: "Staff Accommodation", buaSqm: null, clientName: "SBJ", reserveFund: null },
  { id: "Z1-B02", unitNo: "Z1 B02", sector: "FM", zone: "1", propertyType: "Staff Accommodation", unitTypeDetail: "Staff Accommodation", buaSqm: null, clientName: "SBJ", reserveFund: null },
  { id: "Z1-B03", unitNo: "Z1 B03", sector: "FM", zone: "1", propertyType: "Staff Accommodation", unitTypeDetail: "Staff Accommodation", buaSqm: null, clientName: "SBJ", reserveFund: null },
  { id: "Z1-B04", unitNo: "Z1 B04", sector: "FM", zone: "1", propertyType: "Staff Accommodation", unitTypeDetail: "Staff Accommodation", buaSqm: null, clientName: "SBJ", reserveFund: null },
  { id: "Z1-B05", unitNo: "Z1 B05", sector: "FM", zone: "1", propertyType: "Staff Accommodation", unitTypeDetail: "Staff Accommodation", buaSqm: null, clientName: "SBJ", reserveFund: null },
  { id: "Z1-B06", unitNo: "Z1 B06", sector: "FM", zone: "1", propertyType: "Staff Accommodation", unitTypeDetail: "Staff Accommodation", buaSqm: null, clientName: "SBJ", reserveFund: null },
  { id: "Z1-B07", unitNo: "Z1 B07", sector: "FM", zone: "1", propertyType: "Staff Accommodation", unitTypeDetail: "Staff Accommodation", buaSqm: null, clientName: "SBJ", reserveFund: null },
  { id: "Z1-B08", unitNo: "Z1 B08", sector: "FM", zone: "1", propertyType: "Staff Accommodation", unitTypeDetail: "Staff Accommodation", buaSqm: null, clientName: "SBJ", reserveFund: null },
  { id: "Z1-CIF", unitNo: "Z1 CIF", sector: "FM", zone: "1", propertyType: "Staff Accommodation", unitTypeDetail: "Staff Accommodation", buaSqm: null, clientName: "SBJ", reserveFund: null },
  
  // Commercial
  { id: "3C", unitNo: "3C", sector: "C Sector", zone: "3C", propertyType: "Commercial", unitTypeDetail: "Development Land", buaSqm: 5656, clientName: "Zen Development and Investment LLC", reserveFund: 21917 },
  
  // Zone 3 - Zaha (sampling from the large dataset)
  { id: "Z3-001", unitNo: "Z3 001", sector: "Zaha", zone: "3", propertyType: "Villa", unitTypeDetail: "4 Bedroom Zaha Villa", buaSqm: 422.24, clientName: "SBJ", reserveFund: 909.08 },
  { id: "Z3-002", unitNo: "Z3 002", sector: "Zaha", zone: "3", propertyType: "Villa", unitTypeDetail: "4 Bedroom Zaha Villa", buaSqm: 422.24, clientName: "Asara Abdulamir Abdul RidhaAl Lawati", reserveFund: 909.08 },
  { id: "Z3-003", unitNo: "Z3 003", sector: "Zaha", zone: "3", propertyType: "Villa", unitTypeDetail: "4 Bedroom Zaha Villa", buaSqm: 422.24, clientName: "Arun Kumar Prasad & Seema Arun Kumar", reserveFund: 909.08 },
  { id: "Z3-017", unitNo: "Z3 017", sector: "Zaha", zone: "3", propertyType: "Villa", unitTypeDetail: "3 Bedroom Zaha Villa", buaSqm: 357.12, clientName: "Kamal Kumar Gidwani", reserveFund: 768.88 },
  { id: "Z3-019", unitNo: "Z3 019", sector: "Zaha", zone: "3", propertyType: "Villa", unitTypeDetail: "3 Bedroom Zaha Villa", buaSqm: 357.12, clientName: "Timothy S. Parker", reserveFund: 768.88 },
  
  // Zone 3 - Zaha Apartments (sampling)
  { id: "Z3-044(1)", unitNo: "Z3 044(1)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "2 Bedroom Premium Apartment", buaSqm: 199.13, clientName: "Abdul Alim Rakhiyoot & Jahat Al Shahri", reserveFund: 750.32 },
  { id: "Z3-044(5)", unitNo: "Z3 044(5)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "3 Bedroom Zaha Apartment", buaSqm: 355.07, clientName: "Abdul Alim Rakhiyoot & Jahat Al Shahri", reserveFund: 1337.74 },
  { id: "Z3-053(1A)", unitNo: "Z3 053(1A)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "2 Bedroom Small Apartment", buaSqm: 115.47, clientName: "Eihab Saleh Moahmed Al Yafii", reserveFund: 435.12 },
  { id: "Z3-053(1B)", unitNo: "Z3 053(1B)", sector: "Zaha", zone: "3", propertyType: "Apartment", unitTypeDetail: "1 Bedroom Apartment", buaSqm: 79.09, clientName: "Nadarsha Mohmed Kunju & Sheheen Nadarsha", reserveFund: 298.01 },
  
  // Zone 5 - Nameer (sampling)
  { id: "Z5-001", unitNo: "Z5 001", sector: "Nameer", zone: "5", propertyType: "Villa", unitTypeDetail: "4 Bedroom Nameer Villa", buaSqm: 497.62, clientName: "ROXANA MESHGINNAFAS", reserveFund: 1392.34 },
  { id: "Z5-002", unitNo: "Z5 002", sector: "Nameer", zone: "5", propertyType: "Villa", unitTypeDetail: "3 Bedroom Nameer Villa", buaSqm: 426.78, clientName: "Natheer Mohamed Ali", reserveFund: 1194.13 },
  { id: "Z5-007", unitNo: "Z5 007", sector: "Nameer", zone: "5", propertyType: "Villa", unitTypeDetail: "3 Bedroom Nameer Villa", buaSqm: 426.78, clientName: "Eihab Saleh Moahmed Al Yafii", reserveFund: 1194.13 },
  
  // Zone 8 - Wajd (sampling)
  { id: "Z8-001", unitNo: "Z8 001", sector: "Wajd", zone: "8", propertyType: "Villa", unitTypeDetail: "5 Bedroom Wajd Villa", buaSqm: 750.35, clientName: "SBJ", reserveFund: 1534.47 },
  { id: "Z8-003", unitNo: "Z8 003", sector: "Wajd", zone: "8", propertyType: "Villa", unitTypeDetail: "5 Bedroom Wajd Villa", buaSqm: 750.35, clientName: "TAS Capital International Holding Co.", reserveFund: 1534.47 },
  { id: "Z8-005", unitNo: "Z8 005", sector: "Wajd", zone: "8", propertyType: "Villa", unitTypeDetail: "5 Bedroom Wajd Villa", buaSqm: 943, clientName: "Mohsin Mohamed Ali Al Shaikh", reserveFund: 1928.44 },
  { id: "Z8-009", unitNo: "Z8 009", sector: "Wajd", zone: "8", propertyType: "Villa", unitTypeDetail: "5 Bedroom Wajd Villa", buaSqm: 1187.47, clientName: "Juma Darwish Juma Al Bulushi", reserveFund: 2428.38 },
  { id: "Z8-022", unitNo: "Z8 022", sector: "Wajd", zone: "8", propertyType: "Villa", unitTypeDetail: "King Villa", buaSqm: 1844.67, clientName: "Royal Court Affairs.", reserveFund: 3772.35 }
  
  // Note: This is a sample of the full database. In production, all properties from the table would be included.
];

// Helper functions to work with the property database
export const getZones = (): string[] => {
  const zonesSet = new Set<string>();
  propertyDatabase.forEach(property => {
    if (property.zone) zonesSet.add(property.zone);
  });
  
  return Array.from(zonesSet).sort((a, b) => {
    // Sort numerically for numeric zones
    const numA = parseInt(a);
    const numB = parseInt(b);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return a.localeCompare(b);
  });
};

export const getPropertyTypes = (zone: string): string[] => {
  const typesSet = new Set<string>();
  propertyDatabase
    .filter(property => property.zone === zone)
    .forEach(property => {
      if (property.propertyType) typesSet.add(property.propertyType);
    });
  
  return Array.from(typesSet).sort();
};

export const getUnitsByZoneAndType = (zone: string, propertyType: string) => {
  return propertyDatabase
    .filter(property => 
      property.zone === zone && 
      property.propertyType === propertyType
    )
    .sort((a, b) => a.unitNo.localeCompare(b.unitNo));
};

export const searchProperties = (searchTerm: string) => {
  if (!searchTerm) return [];
  
  const lowerSearchTerm = searchTerm.toLowerCase();
  return propertyDatabase.filter(property => 
    property.unitNo.toLowerCase().includes(lowerSearchTerm) ||
    property.unitTypeDetail.toLowerCase().includes(lowerSearchTerm) ||
    (property.clientName && property.clientName.toLowerCase().includes(lowerSearchTerm))
  );
};

// Get a specific property by its ID
export const getPropertyById = (id: string) => {
  return propertyDatabase.find(property => property.id === id);
};
