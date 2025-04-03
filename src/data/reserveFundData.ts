
export const mockYearlyData = [
  { year: '2021', balance: 52636, contribution: 52636, expenditure: 0 },
  { year: '2022', balance: 106324, contribution: 52899, expenditure: 0 },
  { year: '2023', balance: 161082, contribution: 53163, expenditure: 0 },
  { year: '2024', balance: 216927, contribution: 53429, expenditure: 0 },
  { year: '2025', balance: 273878, contribution: 53696, expenditure: 0 },
  { year: '2026', balance: 331951, contribution: 53965, expenditure: 0 },
  { year: '2027', balance: 391164, contribution: 54235, expenditure: 0 },
  { year: '2028', balance: 451538, contribution: 54506, expenditure: 0 },
  { year: '2029', balance: 513089, contribution: 54778, expenditure: 0 },
  { year: '2030', balance: 559944, contribution: 55052, expenditure: 15893 },
  { year: '2031', balance: 619783, contribution: 55327, expenditure: 3888 },
  { year: '2032', balance: 541103, contribution: 55604, expenditure: 143581 },
  { year: '2033', balance: 452039, contribution: 55882, expenditure: 153062 },
  { year: '2034', balance: 509909, contribution: 56161, expenditure: 5072 },
  { year: '2035', balance: 305725, contribution: 56442, expenditure: 268275 },
  { year: '2036', balance: 254388, contribution: 56725, expenditure: 112647 },
  { year: '2037', balance: 285738, contribution: 57008, expenditure: 29474 },
  { year: '2038', balance: 125242, contribution: 57293, expenditure: 222075 },
  { year: '2039', balance: 184700, contribution: 57580, expenditure: 0 },
  { year: '2040', balance: 34961, contribution: 57868, expenditure: 210377 }
];

export const mockZoneBalances = [
  { name: 'Master Community', value: 798352, color: '#4E4456' },
  { name: 'Typical Buildings', value: 227018, color: '#6D5D7B' },
  { name: 'Zone 3 (Al Zaha)', value: 63604, color: '#8F7C9B' },
  { name: 'Zone 5 (Al Nameer)', value: 63581, color: '#AD9BBD' },
  { name: 'Zone 8 (Al Wajd)', value: 37884, color: '#CBB9DB' },
  { name: 'Staff Accommodation', value: 273878, color: '#E9D7F5' }
];

export const mockAssetCategories = [
  { name: 'Infrastructure', value: 2000000, color: '#4E4456' },
  { name: 'MEP Systems', value: 1500000, color: '#6D5D7B' },
  { name: 'Finishes/Structure', value: 500000, color: '#8F7C9B' },
  { name: 'Landscaping', value: 500000, color: '#CBB9DB' }
];

export const mockUpcomingReplacements = [
  { component: 'Helipad Electrical Works', location: 'Master Community', year: 2025, cost: 10920 },
  { component: 'Fire Extinguishers', location: 'Typical Buildings', year: 2026, cost: 129 },
  { component: 'Lagoon Infrastructure', location: 'Master Community', year: 2027, cost: 42000 },
  { component: 'Elevator Wire Ropes', location: 'Typical Buildings', year: 2027, cost: 2450 },
  { component: 'External Wall Paint', location: 'Typical Buildings', year: 2028, cost: 1465 },
  { component: 'Tree Uplighters', location: 'Zone 3', year: 2031, cost: 1120 }
];

export const mockZones = [
  { id: '3', name: 'Zone 3 (Al Zaha)', propertyTypes: ['Apartment', 'Villa'] },
  { id: '5', name: 'Zone 5 (Al Nameer)', propertyTypes: ['Villa'] },
  { id: '8', name: 'Zone 8 (Al Wajd)', propertyTypes: ['Villa'] },
  { id: 'staff', name: 'Staff Accommodation', propertyTypes: ['Staff Accommodation'] }
];

// Buildings within zones/property types
export const mockBuildings = {
  '3': {
    'Apartment': [
      'D44', 'D45', 'D46', 'D47', 'D48', 'D49', 'D50', 'D51', 'D52', 'D53',
      'D54', 'D55', 'D56', 'D57', 'D58', 'D59', 'D60', 'D61', 'D62', 'D74', 'D75'
    ]
  },
  'staff': {
    'Staff Accommodation': ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'CIF']
  }
};

// Define units
export const mockUnits = {
  '3': {
    'Villa': [
      { id: 'Z3-001', unitNo: 'Z3 001', type: '4 Bedroom Zaha Villa', bua: 422 },
      { id: 'Z3-002', unitNo: 'Z3 002', type: '4 Bedroom Zaha Villa', bua: 422 },
      { id: 'Z3-003', unitNo: 'Z3 003', type: '4 Bedroom Zaha Villa', bua: 422 },
      { id: 'Z3-004', unitNo: 'Z3 004', type: '4 Bedroom Zaha Villa', bua: 422 },
      { id: 'Z3-005', unitNo: 'Z3 005', type: '4 Bedroom Zaha Villa', bua: 422 },
      // More villas...
    ],
    'Apartment': {
      'D44': [
        { id: 'Z3-044-1', unitNo: 'Z3 044(1)', type: '2 Bedroom Premium Apartment', bua: 199 },
        { id: 'Z3-044-2', unitNo: 'Z3 044(2)', type: '2 Bedroom Premium Apartment', bua: 199 },
        { id: 'Z3-044-3', unitNo: 'Z3 044(3)', type: '2 Bedroom Premium Apartment', bua: 199 },
        { id: 'Z3-044-4', unitNo: 'Z3 044(4)', type: '2 Bedroom Premium Apartment', bua: 199 },
        { id: 'Z3-044-5', unitNo: 'Z3 044(5)', type: '3 Bedroom Zaha Apartment', bua: 355 },
        { id: 'Z3-044-6', unitNo: 'Z3 044(6)', type: '3 Bedroom Zaha Apartment', bua: 361 },
      ],
      'D45': [
        { id: 'Z3-045-1', unitNo: 'Z3 045(1)', type: '2 Bedroom Premium Apartment', bua: 199 },
        { id: 'Z3-045-2', unitNo: 'Z3 045(2)', type: '2 Bedroom Premium Apartment', bua: 199 },
        { id: 'Z3-045-3', unitNo: 'Z3 045(3)', type: '2 Bedroom Premium Apartment', bua: 199 },
        { id: 'Z3-045-4', unitNo: 'Z3 045(4)', type: '2 Bedroom Premium Apartment', bua: 199 },
        { id: 'Z3-045-5', unitNo: 'Z3 045(5)', type: '3 Bedroom Zaha Apartment', bua: 355 },
        { id: 'Z3-045-6', unitNo: 'Z3 045(6)', type: '3 Bedroom Zaha Apartment', bua: 361 },
      ],
      // More buildings...
    }
  },
  '5': {
    'Villa': [
      { id: 'Z5-001', unitNo: 'Z5 001', type: '4 Bedroom Nameer Villa', bua: 498 },
      { id: 'Z5-002', unitNo: 'Z5 002', type: '3 Bedroom Nameer Villa', bua: 427 },
      { id: 'Z5-003', unitNo: 'Z5 003', type: '4 Bedroom Nameer Villa', bua: 498 },
      { id: 'Z5-004', unitNo: 'Z5 004', type: '3 Bedroom Nameer Villa', bua: 427 },
      { id: 'Z5-005', unitNo: 'Z5 005', type: '4 Bedroom Nameer Villa', bua: 498 },
      // More villas...
    ]
  },
  '8': {
    'Villa': [
      { id: 'Z8-001', unitNo: 'Z8 001', type: '5 Bedroom Wajd Villa', bua: 750 },
      { id: 'Z8-002', unitNo: 'Z8 002', type: '5 Bedroom Wajd Villa', bua: 750 },
      { id: 'Z8-003', unitNo: 'Z8 003', type: '5 Bedroom Wajd Villa', bua: 750 },
      { id: 'Z8-004', unitNo: 'Z8 004', type: '5 Bedroom Wajd Villa', bua: 750 },
      { id: 'Z8-005', unitNo: 'Z8 005', type: '5 Bedroom Wajd Villa', bua: 943 },
      // More villas...
    ]
  },
  'staff': {
    'Staff Accommodation': {
      'B1': [
        { id: 'ST-B1-01', unitNo: 'B1-01', type: 'Staff Unit', bua: 50 },
        { id: 'ST-B1-02', unitNo: 'B1-02', type: 'Staff Unit', bua: 50 },
        { id: 'ST-B1-03', unitNo: 'B1-03', type: 'Staff Unit', bua: 50 },
      ],
      'B2': [
        { id: 'ST-B2-01', unitNo: 'B2-01', type: 'Staff Unit', bua: 50 },
        { id: 'ST-B2-02', unitNo: 'B2-02', type: 'Staff Unit', bua: 50 },
        { id: 'ST-B2-03', unitNo: 'B2-03', type: 'Staff Unit', bua: 50 },
      ],
      // More buildings...
    }
  }
};

// Base rates for 2025 (OMR per sq.m.)
export const rates2025 = {
  masterCommunity: 1.75,
  typicalBuilding: 1.65,
  zone3: 0.44,
  zone5: 1.10,
  zone8: 0.33,
  staffAccommodation: 3.95
};
