
// Mock data for Reserve Fund app

// Reserve fund contribution rates per sqm for 2025
export const rates2025 = {
  masterCommunity: 1.75,     // Master community rate
  typicalBuilding: 1.65,     // Rate for typical buildings
  zone3: 0.44,               // Zone 3 (Al Zaha) specific rate
  zone5: 1.10,               // Zone 5 (Al Nameer) specific rate 
  zone8: 0.33,               // Zone 8 (Al Wajd) specific rate
  staffAccommodation: 3.95   // Staff Accommodation rate
};

// Zones data
export const mockZones = [
  { id: '3', name: 'Zone 3 (Al Zaha)', propertyTypes: ['Apartment', 'Villa'] },
  { id: '5', name: 'Zone 5 (Al Nameer)', propertyTypes: ['Apartment', 'Villa'] },
  { id: '8', name: 'Zone 8 (Al Wajd)', propertyTypes: ['Villa'] },
  { id: 'staff', name: 'Staff Accommodation', propertyTypes: ['Studio', 'One Bedroom', 'Shared'] }
];

// Building data per zone and property type
export const mockBuildings = {
  '3': {
    'Apartment': ['A', 'B', 'C', 'D']
  },
  '5': {
    'Apartment': ['E', 'F', 'G']
  }
};

// Mock units data
export const mockUnits = {
  '3': {
    'Apartment': {
      'A': [
        { id: '3A1', unitNo: 'Z3-A-101', type: 'Apartment 2BR', bua: 120.5 },
        { id: '3A2', unitNo: 'Z3-A-102', type: 'Apartment 3BR', bua: 150.8 },
        { id: '3A3', unitNo: 'Z3-A-103', type: 'Apartment 1BR', bua: 85.2 }
      ],
      'B': [
        { id: '3B1', unitNo: 'Z3-B-101', type: 'Apartment 2BR', bua: 122.0 },
        { id: '3B2', unitNo: 'Z3-B-102', type: 'Apartment 3BR', bua: 148.5 }
      ],
      'C': [
        { id: '3C1', unitNo: 'Z3-C-101', type: 'Apartment 2BR', bua: 121.7 },
        { id: '3C2', unitNo: 'Z3-C-102', type: 'Apartment 3BR', bua: 151.2 }
      ],
      'D': [
        { id: '3D1', unitNo: 'Z3-D-101', type: 'Apartment 2BR', bua: 119.8 },
        { id: '3D2', unitNo: 'Z3-D-102', type: 'Apartment 3BR', bua: 149.3 }
      ]
    },
    'Villa': [
      { id: '3V1', unitNo: 'Z3-V-01', type: 'Villa 4BR', bua: 280.5 },
      { id: '3V2', unitNo: 'Z3-V-02', type: 'Villa 5BR', bua: 350.8 },
      { id: '3V3', unitNo: 'Z3-V-03', type: 'Villa 3BR', bua: 225.3 }
    ]
  },
  '5': {
    'Apartment': {
      'E': [
        { id: '5E1', unitNo: 'Z5-E-101', type: 'Apartment 2BR', bua: 118.4 },
        { id: '5E2', unitNo: 'Z5-E-102', type: 'Apartment 3BR', bua: 152.1 }
      ],
      'F': [
        { id: '5F1', unitNo: 'Z5-F-101', type: 'Apartment 2BR', bua: 117.9 },
        { id: '5F2', unitNo: 'Z5-F-102', type: 'Apartment 3BR', bua: 150.6 }
      ],
      'G': [
        { id: '5G1', unitNo: 'Z5-G-101', type: 'Apartment 2BR', bua: 119.2 },
        { id: '5G2', unitNo: 'Z5-G-102', type: 'Apartment 3BR', bua: 151.7 }
      ]
    },
    'Villa': [
      { id: '5V1', unitNo: 'Z5-V-01', type: 'Villa 4BR', bua: 275.2 },
      { id: '5V2', unitNo: 'Z5-V-02', type: 'Villa 5BR', bua: 345.1 },
      { id: '5V3', unitNo: 'Z5-V-03', type: 'Villa 3BR', bua: 220.7 }
    ]
  },
  '8': {
    'Villa': [
      { id: '8V1', unitNo: 'Z8-V-01', type: 'Villa 4BR', bua: 270.8 },
      { id: '8V2', unitNo: 'Z8-V-02', type: 'Villa 5BR', bua: 340.5 },
      { id: '8V3', unitNo: 'Z8-V-03', type: 'Villa 6BR', bua: 410.3 },
      { id: '8V4', unitNo: 'Z8-V-04', type: 'Villa 3BR', bua: 215.2 }
    ]
  },
  'staff': {
    'Studio': [
      { id: 'S1', unitNo: 'SA-S-01', type: 'Studio', bua: 35.0 },
      { id: 'S2', unitNo: 'SA-S-02', type: 'Studio', bua: 32.5 },
      { id: 'S3', unitNo: 'SA-S-03', type: 'Studio', bua: 34.0 }
    ],
    'One Bedroom': [
      { id: 'O1', unitNo: 'SA-1B-01', type: 'One Bedroom', bua: 55.0 },
      { id: 'O2', unitNo: 'SA-1B-02', type: 'One Bedroom', bua: 56.5 },
      { id: 'O3', unitNo: 'SA-1B-03', type: 'One Bedroom', bua: 54.0 }
    ],
    'Shared': [
      { id: 'SH1', unitNo: 'SA-SH-01', type: 'Shared Unit', bua: 75.0 },
      { id: 'SH2', unitNo: 'SA-SH-02', type: 'Shared Unit', bua: 72.5 },
      { id: 'SH3', unitNo: 'SA-SH-03', type: 'Shared Unit', bua: 78.0 }
    ]
  }
};

// Mock yearly data for the reserve fund balances
export const mockYearlyData = [
  { year: '2021', balance: 52636, contribution: 52636, expenditure: 0 },
  { year: '2022', balance: 106324, contribution: 52899, expenditure: 0 },
  { year: '2023', balance: 161082, contribution: 53163, expenditure: 0 },
  { year: '2024', balance: 216927, contribution: 53429, expenditure: 0 },
  { year: '2025', balance: 273878, contribution: 53696, expenditure: 0 },
  { year: '2026', balance: 328233, contribution: 53964, expenditure: 0 },
  { year: '2027', balance: 348774, contribution: 54234, expenditure: 35000 },
  { year: '2028', balance: 402867, contribution: 54505, expenditure: 0 },
  { year: '2029', balance: 442821, contribution: 54778, expenditure: 15000 },
  { year: '2030', balance: 496845, contribution: 55052, expenditure: 0 },
  { year: '2031', balance: 531521, contribution: 55327, expenditure: 20000 },
  { year: '2032', balance: 587401, contribution: 55604, expenditure: 0 },
  { year: '2033', balance: 600000, contribution: 55882, expenditure: 45000 },
  { year: '2034', balance: 655941, contribution: 56161, expenditure: 0 },
  { year: '2035', balance: 680102, contribution: 56442, expenditure: 32000 }
];

// Mock zone distributions
export const mockZoneBalances = [
  { name: 'Master Community', value: 798352, color: '#4E4456' },
  { name: 'Typical Buildings', value: 227018, color: '#6D5D7B' },
  { name: 'Zone 3 (Al Zaha)', value: 63604, color: '#8F7C9B' },
  { name: 'Zone 5 (Al Nameer)', value: 63581, color: '#AD9BBD' },
  { name: 'Zone 8 (Al Wajd)', value: 37884, color: '#CBB9DB' },
  { name: 'Staff Accommodation', value: 273878, color: '#E9D7F5' }
];

// Mock asset category distributions
export const mockAssetCategories = [
  { name: 'Infrastructure', value: 2000000, color: '#4E4456' },
  { name: 'MEP Systems', value: 1500000, color: '#6D5D7B' },
  { name: 'Finishes/Structure', value: 500000, color: '#8F7C9B' },
  { name: 'Landscaping', value: 500000, color: '#CBB9DB' }
];

// Mock upcoming replacements
export const mockUpcomingReplacements = [
  { component: 'Helipad Electrical Works', location: 'Master Community', year: 2025, cost: 10920 },
  { component: 'Primary Irrigation Pumps', location: 'Master Community', year: 2026, cost: 25780 },
  { component: 'Fire Extinguishers', location: 'Typical Buildings', year: 2026, cost: 12900 },
  { component: 'Elevator Controllers Building A', location: 'Zone 3', year: 2027, cost: 18500 },
  { component: 'HVAC Chillers', location: 'Zone 5', year: 2027, cost: 35000 },
  { component: 'Lagoon Infrastructure', location: 'Master Community', year: 2027, cost: 42000 },
  { component: 'Staff Accommodation Roofing', location: 'Staff Accommodation', year: 2028, cost: 26400 },
  { component: 'Villa District Landscape Lighting', location: 'Zone 8', year: 2028, cost: 14700 },
  { component: 'Roadway Resurfacing Phase 1', location: 'Master Community', year: 2029, cost: 85000 }
];
