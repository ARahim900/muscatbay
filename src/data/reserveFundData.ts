
// Define types for our data model
export interface RFSZoneData {
  balance: number;
  contribution: number;
  expenditure: number;
}

export interface ComponentDue {
  year: number;
  component: string;
  location: string;
  cost?: number; // Optional cost data if available
}

export interface RFSYearData {
  year: number;
  totalBalance: number;
  totalContribution: number;
  totalExpenditure: number;
  zones: {
    [key: string]: RFSZoneData;
  };
  componentsDue: ComponentDue[];
}

// Sample RFS data based on provided documentation
export const rfsFullData: { [key: string]: RFSYearData } = {
  "2023": {
    year: 2023,
    totalBalance: 800982,
    totalContribution: 297530,
    totalExpenditure: 35553,
    zones: {
      "Typical (x21)": { balance: 121737, contribution: 51897, expenditure: 35553 },
      "Zone 3 (Zaha)": { balance: 41694, contribution: 13760, expenditure: 0 },
      "Zone 5 (Nameer)": { balance: 35413, contribution: 18093, expenditure: 0 },
      "Zone 8 (Wajd)": { balance: 22282, contribution: 7354, expenditure: 0 },
      "Staff Acc & CF": { balance: 161082, contribution: 53163, expenditure: 0 },
      "Master Community": { balance: 418774, contribution: 153263, expenditure: 0 }
    },
    componentsDue: [
      { year: 2023, component: "Roofing System Finishing", location: "Typical Buildings" }
    ]
  },
  "2024": {
    year: 2024,
    totalBalance: 1100000,
    totalContribution: 300000,
    totalExpenditure: 40000,
    zones: {
      "Typical (x21)": { balance: 180000, contribution: 52000, expenditure: 10000 },
      "Zone 3 (Zaha)": { balance: 55000, contribution: 13800, expenditure: 0 },
      "Zone 5 (Nameer)": { balance: 50000, contribution: 18200, expenditure: 5000 },
      "Zone 8 (Wajd)": { balance: 30000, contribution: 7400, expenditure: 0 },
      "Staff Acc & CF": { balance: 200000, contribution: 53400, expenditure: 5000 },
      "Master Community": { balance: 585000, contribution: 155200, expenditure: 20000 }
    },
    componentsDue: [
      { year: 2024, component: "External Painting", location: "Typical Buildings" },
      { year: 2024, component: "Landscape Refurbishment", location: "Zone 5" }
    ]
  },
  "2025": {
    year: 2025,
    totalBalance: 1474951,
    totalContribution: 315446,
    totalExpenditure: 65591,
    zones: {
      "Typical (x21)": { balance: 228018, contribution: 52437, expenditure: 0 },
      "Zone 3 (Zaha)": { balance: 63604, contribution: 13898, expenditure: 0 },
      "Zone 5 (Nameer)": { balance: 73215, contribution: 18275, expenditure: 9633 },
      "Zone 8 (Wajd)": { balance: 37884, contribution: 7428, expenditure: 0 },
      "Staff Acc & CF": { balance: 273878, contribution: 53696, expenditure: 0 },
      "Master Community": { balance: 798352, contribution: 169712, expenditure: 55958 }
    },
    componentsDue: [
      { year: 2025, component: "Roads Kerb Length", location: "Zone 5" },
      { year: 2025, component: "Concrete Pavements", location: "Master Community" },
      { year: 2025, component: "Metal Guards", location: "Master Community" },
      { year: 2025, component: "Wooden Benches", location: "Village Square" },
      { year: 2025, component: "Signage", location: "Village Square" },
      { year: 2025, component: "Swimming Pool Pump System", location: "Zone 3 Community Pool", cost: 12500 },
      { year: 2025, component: "HVAC System", location: "Village Square", cost: 80000 },
      { year: 2025, component: "External Painting", location: "Zone 1 Staff Buildings", cost: 42000 }
    ]
  },
  "2026": {
    year: 2026,
    totalBalance: 1650000,
    totalContribution: 318000,
    totalExpenditure: 120000,
    zones: {
      "Typical (x21)": { balance: 260000, contribution: 52700, expenditure: 20000 },
      "Zone 3 (Zaha)": { balance: 72000, contribution: 14000, expenditure: 5000 },
      "Zone 5 (Nameer)": { balance: 80000, contribution: 18350, expenditure: 12000 },
      "Zone 8 (Wajd)": { balance: 42000, contribution: 7500, expenditure: 3000 },
      "Staff Acc & CF": { balance: 290000, contribution: 54000, expenditure: 40000 },
      "Master Community": { balance: 906000, contribution: 171450, expenditure: 40000 }
    },
    componentsDue: [
      { year: 2026, component: "Landscaping Renovation", location: "Zone 5 Common Areas", cost: 32000 },
      { year: 2026, component: "Security System Upgrade", location: "All Zones", cost: 60000 },
      { year: 2026, component: "Tennis Court Resurfacing", location: "Zone 3 Sports Area", cost: 15000 }
    ]
  },
  "2027": {
    year: 2027,
    totalBalance: 1780000,
    totalContribution: 320000,
    totalExpenditure: 180000,
    zones: {
      "Typical (x21)": { balance: 280000, contribution: 53000, expenditure: 35000 },
      "Zone 3 (Zaha)": { balance: 75000, contribution: 14100, expenditure: 10000 },
      "Zone 5 (Nameer)": { balance: 85000, contribution: 18450, expenditure: 15000 },
      "Zone 8 (Wajd)": { balance: 45000, contribution: 7550, expenditure: 5000 },
      "Staff Acc & CF": { balance: 310000, contribution: 54300, expenditure: 35000 },
      "Master Community": { balance: 985000, contribution: 172600, expenditure: 80000 }
    },
    componentsDue: [
      { year: 2027, component: "Walkway & Pavement Renovation", location: "Zones 3 & 5", cost: 45000 },
      { year: 2027, component: "Clubhouse Renovation", location: "Zone 8", cost: 120000 },
      { year: 2027, component: "Water Feature Repair", location: "Main Entrance", cost: 25000 }
    ]
  },
  "2028": {
    year: 2028,
    totalBalance: 1923594,
    totalContribution: 304056,
    totalExpenditure: 258611,
    zones: {
      "Typical (x21)": { balance: 217560, contribution: 53214, expenditure: 252 },
      "Zone 3 (Zaha)": { balance: 76233, contribution: 14108, expenditure: 0 },
      "Zone 5 (Nameer)": { balance: 90963, contribution: 18550, expenditure: 9778 },
      "Zone 8 (Wajd)": { balance: 47436, contribution: 7540, expenditure: 0 },
      "Staff Acc & CF": { balance: 451538, contribution: 54506, expenditure: 0 },
      "Master Community": { balance: 1044864, contribution: 156138, expenditure: 248821 }
    },
    componentsDue: [
      { year: 2028, component: "Roof Finishing", location: "Typical Buildings", cost: 25000 },
      { year: 2028, component: "Street Lighting Replacement", location: "All Zones", cost: 55000 },
      { year: 2028, component: "STP Components (Pumps/Chlorine)", location: "Master Community", cost: 40000 },
      { year: 2028, component: "Footpath PCC Tiles", location: "Zone 5", cost: 32000 },
      { year: 2028, component: "Irrigation System Upgrade", location: "All Landscaped Areas", cost: 45000 },
      { year: 2028, component: "Gym Equipment Replacement", location: "Fitness Center", cost: 35000 }
    ]
  }
};

// Sample data for yearly chart
export const mockYearlyData = [
  { year: '2023', balance: 800982, contribution: 297530, expenditure: 35553 },
  { year: '2024', balance: 1100000, contribution: 300000, expenditure: 40000 },
  { year: '2025', balance: 1474951, contribution: 315446, expenditure: 65591 },
  { year: '2026', balance: 1650000, contribution: 318000, expenditure: 120000 },
  { year: '2027', balance: 1780000, contribution: 320000, expenditure: 180000 },
  { year: '2028', balance: 1923594, contribution: 304056, expenditure: 258611 },
  { year: '2029', balance: 2100000, contribution: 325000, expenditure: 275000 },
  { year: '2030', balance: 2300000, contribution: 330000, expenditure: 355000 },
  { year: '2031', balance: 2500000, contribution: 335000, expenditure: 375000 },
  { year: '2032', balance: 2700000, contribution: 340000, expenditure: 300000 }
];

// Sample data for zone balances pie chart
export const mockZoneBalances = [
  { name: 'Typical Buildings', value: 228018, color: '#4E4456' },
  { name: 'Zone 3 (Zaha)', value: 63604, color: '#6D5D7B' },
  { name: 'Zone 5 (Nameer)', value: 73215, color: '#AD9BBD' },
  { name: 'Zone 8 (Wajd)', value: 37884, color: '#866E96' },
  { name: 'Staff Acc & CF', value: 273878, color: '#B6A4C2' },
  { name: 'Master Community', value: 798352, color: '#3A333F' }
];

// Sample data for asset categories
export const mockAssetCategories = [
  { name: 'Structural', value: 3100000, color: '#4E4456' },
  { name: 'MEP', value: 2700000, color: '#6D5D7B' },
  { name: 'Civil Works', value: 1800000, color: '#AD9BBD' },
  { name: 'Landscape', value: 900000, color: '#D9CCE3' },
  { name: 'Common Areas', value: 700000, color: '#866E96' }
];

// Sample data for upcoming replacements
export const mockUpcomingReplacements = [
  { year: 2025, component: 'Swimming Pool Pump System', location: 'Zone 3 Community Pool', cost: 125000 },
  { year: 2025, component: 'HVAC System', location: 'Village Square', cost: 800000 },
  { year: 2025, component: 'External Painting', location: 'Zone 1 Staff Buildings', cost: 420000 },
  { year: 2025, component: 'Roads Kerb Length', location: 'Zone 5', cost: 96330 },
  { year: 2025, component: 'Concrete Pavements', location: 'Master Community', cost: 359580 },
  { year: 2025, component: 'Metal Guards', location: 'Master Community', cost: 200000 },
  { year: 2026, component: 'Landscaping Renovation', location: 'Zone 5 Common Areas', cost: 320000 },
  { year: 2026, component: 'Security System Upgrade', location: 'All Zones', cost: 600000 },
  { year: 2026, component: 'Tennis Court Resurfacing', location: 'Zone 3 Sports Area', cost: 150000 },
  { year: 2027, component: 'Walkway & Pavement Renovation', location: 'Zones 3 & 5', cost: 450000 },
  { year: 2027, component: 'Clubhouse Renovation', location: 'Zone 8', cost: 1200000 },
  { year: 2027, component: 'Water Feature Repair', location: 'Main Entrance', cost: 250000 },
  { year: 2028, component: 'Street Lighting Replacement', location: 'All Zones', cost: 550000 },
  { year: 2028, component: 'Irrigation System Upgrade', location: 'All Landscaped Areas', cost: 450000 },
  { year: 2028, component: 'Gym Equipment Replacement', location: 'Fitness Center', cost: 350000 }
];

export const propertyData = [
  {
    id: '1',
    unitNumber: 'Z3-061(1A)',
    zone: 'Zaha (Z3)',
    unitType: '2 Bedroom Small Apartment',
    bua: 115.47,
    hasLift: true,
    owner: 'Ahmed Al Balushi',
    baseOperatingShare: 1210.43,
    liftShare: 99.00,
    reserveFundContribution: 4.62,
    totalCharge: 1314.05,
    quarterlyCharge: 328.51,
    monthlyCharge: 109.50
  },
  {
    id: '2',
    unitNumber: 'Z5-008',
    zone: 'Nameer (Z5)',
    unitType: '4 Bedroom Nameer Villa',
    bua: 497.62,
    hasLift: false,
    owner: 'Mohammed Al Harthi',
    baseOperatingShare: 2840.54,
    liftShare: 0,
    reserveFundContribution: 24.88,
    totalCharge: 2865.42,
    quarterlyCharge: 716.36,
    monthlyCharge: 238.79
  },
  {
    id: '3',
    unitNumber: 'Z8-007',
    zone: 'Wajd (Z8)',
    unitType: '5 Bedroom Wajd Villa',
    bua: 750.35,
    hasLift: false,
    owner: 'Sara Johnson',
    baseOperatingShare: 4137.68,
    liftShare: 0,
    reserveFundContribution: 45.02,
    totalCharge: 4182.70,
    quarterlyCharge: 1045.68,
    monthlyCharge: 348.56
  }
];

// Define zones for the calculator
export const mockZones = [
  { id: '1', name: 'Zone 1 (Staff Accommodation)' },
  { id: '3', name: 'Zone 3 (Al Zaha)' },
  { id: '5', name: 'Zone 5 (Al Nameer)' },
  { id: '8', name: 'Zone 8 (Al Wajd)' }
];

// Define property types per zone for the calculator
export const mockBuildings = {
  '3': {
    'Apartment': ['Building A', 'Building B', 'Building C', 'Building D', 'Building E']
  }
};

// Define units for the calculator
export const mockUnits = {
  '1': {
    'Staff Accommodation': [
      { id: 'sa-1', unitNo: 'SA-001', type: 'Staff Accommodation Unit', bua: 75.0 },
      { id: 'sa-2', unitNo: 'SA-002', type: 'Staff Accommodation Unit', bua: 75.0 },
      { id: 'sa-3', unitNo: 'SA-003', type: 'Staff Accommodation Unit', bua: 75.0 }
    ]
  },
  '3': {
    'Villa': [
      { id: 'z3-v1', unitNo: 'Z3-001', type: '4 Bedroom Zaha Villa', bua: 422.0 },
      { id: 'z3-v2', unitNo: 'Z3-002', type: '4 Bedroom Zaha Villa', bua: 422.0 },
      { id: 'z3-v3', unitNo: 'Z3-017', type: '3 Bedroom Zaha Villa', bua: 357.0 }
    ],
    'Apartment': {
      'Building A': [
        { id: 'z3-a1', unitNo: 'Z3-044(1)', type: '2 Bedroom Premium Apartment', bua: 199.0 },
        { id: 'z3-a2', unitNo: 'Z3-044(5)', type: '3 Bedroom Zaha Apartment', bua: 355.0 },
        { id: 'z3-a3', unitNo: 'Z3-044(6)', type: '3 Bedroom Zaha Apartment', bua: 361.0 }
      ],
      'Building B': [
        { id: 'z3-b1', unitNo: 'Z3-053(1A)', type: '2 Bedroom Small Apartment', bua: 115.0 },
        { id: 'z3-b2', unitNo: 'Z3-053(1B)', type: '1 Bedroom Apartment', bua: 79.0 }
      ]
    }
  },
  '5': {
    'Villa': [
      { id: 'z5-v1', unitNo: 'Z5-001', type: '4 Bedroom Nameer Villa', bua: 498.0 },
      { id: 'z5-v2', unitNo: 'Z5-002', type: '3 Bedroom Nameer Villa', bua: 427.0 },
      { id: 'z5-v3', unitNo: 'Z5-003', type: '4 Bedroom Nameer Villa', bua: 498.0 }
    ]
  },
  '8': {
    'Villa': [
      { id: 'z8-v1', unitNo: 'Z8-001', type: '5 Bedroom Wajd Villa', bua: 750.0 },
      { id: 'z8-v2', unitNo: 'Z8-002', type: '5 Bedroom Wajd Villa', bua: 750.0 },
      { id: 'z8-v3', unitNo: 'Z8-005', type: '5 Bedroom Wajd Villa', bua: 943.0 }
    ]
  }
};

// Reserve fund rates for 2025 (OMR per sqm)
export const rates2025 = {
  masterCommunity: 1.75,
  typicalBuilding: 1.65,
  zone3: 0.44,
  zone5: 1.10,
  zone8: 0.33,
  staffAccommodation: 3.95
};
