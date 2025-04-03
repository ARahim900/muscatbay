
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
  { id: '1', name: 'Zone 1 (Staff Accommodation)', propertyTypes: ['Staff Accommodation', 'CIF Building'] },
  { id: '3', name: 'Zone 3 (Al Zaha)', propertyTypes: ['Villa', 'Apartment'] },
  { id: '5', name: 'Zone 5 (Al Nameer)', propertyTypes: ['Villa'] },
  { id: '8', name: 'Zone 8 (Al Wajd)', propertyTypes: ['Villa'] }
];

// Building data per zone and property type
export const mockBuildings = {
  '1': {
    'Staff Accommodation': ['Building 1', 'Building 2', 'Building 3', 'Building 4', 'Building 5', 'Building 6', 'Building 7', 'Building 8'],
    'CIF Building': ['CIF']
  },
  '3': {
    'Apartment': ['Building A', 'Building B', 'Building C', 'Building D'],
    'Villa': []
  },
  '5': {
    'Villa': []
  },
  '8': {
    'Villa': []
  }
};

// Mock units data
export const mockUnits = {
  '1': {
    'Staff Accommodation': {
      'Building 1': [
        { id: 'B1-1', unitNo: 'B1-001', type: 'Studio', bua: 35.0 },
        { id: 'B1-2', unitNo: 'B1-002', type: 'Studio', bua: 35.0 },
        { id: 'B1-3', unitNo: 'B1-003', type: 'One Bedroom', bua: 55.0 },
        { id: 'B1-4', unitNo: 'B1-004', type: 'One Bedroom', bua: 55.0 }
      ],
      'Building 2': [
        { id: 'B2-1', unitNo: 'B2-001', type: 'Studio', bua: 32.5 },
        { id: 'B2-2', unitNo: 'B2-002', type: 'Studio', bua: 32.5 },
        { id: 'B2-3', unitNo: 'B2-003', type: 'One Bedroom', bua: 56.5 },
        { id: 'B2-4', unitNo: 'B2-004', type: 'One Bedroom', bua: 56.5 }
      ],
      'Building 3': [
        { id: 'B3-1', unitNo: 'B3-001', type: 'Studio', bua: 34.0 },
        { id: 'B3-2', unitNo: 'B3-002', type: 'Studio', bua: 34.0 },
        { id: 'B3-3', unitNo: 'B3-003', type: 'One Bedroom', bua: 54.0 },
        { id: 'B3-4', unitNo: 'B3-004', type: 'Shared Unit', bua: 75.0 }
      ],
      'Building 4': [
        { id: 'B4-1', unitNo: 'B4-001', type: 'Studio', bua: 35.0 },
        { id: 'B4-2', unitNo: 'B4-002', type: 'One Bedroom', bua: 55.0 },
        { id: 'B4-3', unitNo: 'B4-003', type: 'Shared Unit', bua: 72.5 }
      ],
      'Building 5': [
        { id: 'B5-1', unitNo: 'B5-001', type: 'Studio', bua: 35.0 },
        { id: 'B5-2', unitNo: 'B5-002', type: 'One Bedroom', bua: 55.0 },
        { id: 'B5-3', unitNo: 'B5-003', type: 'Shared Unit', bua: 78.0 }
      ],
      'Building 6': [
        { id: 'B6-1', unitNo: 'B6-001', type: 'Studio', bua: 35.0 },
        { id: 'B6-2', unitNo: 'B6-002', type: 'One Bedroom', bua: 55.0 },
        { id: 'B6-3', unitNo: 'B6-003', type: 'Shared Unit', bua: 78.0 }
      ],
      'Building 7': [
        { id: 'B7-1', unitNo: 'B7-001', type: 'Studio', bua: 35.0 },
        { id: 'B7-2', unitNo: 'B7-002', type: 'One Bedroom', bua: 55.0 },
        { id: 'B7-3', unitNo: 'B7-003', type: 'Shared Unit', bua: 78.0 }
      ],
      'Building 8': [
        { id: 'B8-1', unitNo: 'B8-001', type: 'Studio', bua: 35.0 },
        { id: 'B8-2', unitNo: 'B8-002', type: 'One Bedroom', bua: 55.0 },
        { id: 'B8-3', unitNo: 'B8-003', type: 'Shared Unit', bua: 78.0 }
      ]
    },
    'CIF Building': {
      'CIF': [
        { id: 'CIF-1', unitNo: 'CIF-001', type: 'Office', bua: 120.0 },
        { id: 'CIF-2', unitNo: 'CIF-002', type: 'Office', bua: 150.0 },
        { id: 'CIF-3', unitNo: 'CIF-003', type: 'Meeting Space', bua: 200.0 }
      ]
    }
  },
  '3': {
    'Villa': [
      // 4 Bedroom Zaha Villas
      { id: 'Z3-001', unitNo: 'Z3 001', type: '4 Bedroom Zaha Villa', bua: 422.0 },
      { id: 'Z3-002', unitNo: 'Z3 002', type: '4 Bedroom Zaha Villa', bua: 422.0 },
      { id: 'Z3-003', unitNo: 'Z3 003', type: '4 Bedroom Zaha Villa', bua: 422.0 },
      { id: 'Z3-004', unitNo: 'Z3 004', type: '4 Bedroom Zaha Villa', bua: 422.0 },
      { id: 'Z3-005', unitNo: 'Z3 005', type: '4 Bedroom Zaha Villa', bua: 422.0 },
      { id: 'Z3-006', unitNo: 'Z3 006', type: '4 Bedroom Zaha Villa', bua: 422.0 },
      { id: 'Z3-007', unitNo: 'Z3 007', type: '4 Bedroom Zaha Villa', bua: 422.0 },
      { id: 'Z3-008', unitNo: 'Z3 008', type: '4 Bedroom Zaha Villa', bua: 422.0 },
      { id: 'Z3-009', unitNo: 'Z3 009', type: '4 Bedroom Zaha Villa', bua: 422.0 },
      { id: 'Z3-010', unitNo: 'Z3 010', type: '4 Bedroom Zaha Villa', bua: 422.0 },
      { id: 'Z3-011', unitNo: 'Z3 011', type: '4 Bedroom Zaha Villa', bua: 422.0 },
      { id: 'Z3-012', unitNo: 'Z3 012', type: '4 Bedroom Zaha Villa', bua: 422.0 },
      { id: 'Z3-013', unitNo: 'Z3 013', type: '4 Bedroom Zaha Villa', bua: 422.0 },
      { id: 'Z3-014', unitNo: 'Z3 014', type: '4 Bedroom Zaha Villa', bua: 422.0 },
      { id: 'Z3-015', unitNo: 'Z3 015', type: '4 Bedroom Zaha Villa', bua: 422.0 },
      { id: 'Z3-016', unitNo: 'Z3 016', type: '4 Bedroom Zaha Villa', bua: 422.0 },
      
      // 3 Bedroom Zaha Villas
      { id: 'Z3-017', unitNo: 'Z3 017', type: '3 Bedroom Zaha Villa', bua: 357.0 },
      { id: 'Z3-018', unitNo: 'Z3 018', type: '3 Bedroom Zaha Villa', bua: 357.0 },
      { id: 'Z3-019', unitNo: 'Z3 019', type: '3 Bedroom Zaha Villa', bua: 357.0 },
      { id: 'Z3-020', unitNo: 'Z3 020', type: '3 Bedroom Zaha Villa', bua: 357.0 },
      { id: 'Z3-021', unitNo: 'Z3 021', type: '3 Bedroom Zaha Villa', bua: 357.0 },
      { id: 'Z3-022', unitNo: 'Z3 022', type: '3 Bedroom Zaha Villa', bua: 357.0 },
      { id: 'Z3-023', unitNo: 'Z3 023', type: '3 Bedroom Zaha Villa', bua: 357.0 },
      { id: 'Z3-024', unitNo: 'Z3 024', type: '3 Bedroom Zaha Villa', bua: 357.0 },
      { id: 'Z3-025', unitNo: 'Z3 025', type: '3 Bedroom Zaha Villa', bua: 357.0 },
      { id: 'Z3-026', unitNo: 'Z3 026', type: '3 Bedroom Zaha Villa', bua: 357.0 },
      { id: 'Z3-027', unitNo: 'Z3 027', type: '3 Bedroom Zaha Villa', bua: 357.0 },
      { id: 'Z3-028', unitNo: 'Z3 028', type: '3 Bedroom Zaha Villa', bua: 357.0 },
      { id: 'Z3-029', unitNo: 'Z3 029', type: '3 Bedroom Zaha Villa', bua: 357.0 },
      { id: 'Z3-030', unitNo: 'Z3 030', type: '3 Bedroom Zaha Villa', bua: 357.0 },
      
      // More 4 Bedroom Zaha Villas
      { id: 'Z3-031', unitNo: 'Z3 031', type: '4 Bedroom Zaha Villa', bua: 422.0 },
      { id: 'Z3-032', unitNo: 'Z3 032', type: '4 Bedroom Zaha Villa', bua: 422.0 },
      { id: 'Z3-033', unitNo: 'Z3 033', type: '4 Bedroom Zaha Villa', bua: 422.0 },
      { id: 'Z3-034', unitNo: 'Z3 034', type: '4 Bedroom Zaha Villa', bua: 422.0 },
      { id: 'Z3-035', unitNo: 'Z3 035', type: '4 Bedroom Zaha Villa', bua: 422.0 },
      { id: 'Z3-036', unitNo: 'Z3 036', type: '4 Bedroom Zaha Villa', bua: 422.0 },
      { id: 'Z3-037', unitNo: 'Z3 037', type: '4 Bedroom Zaha Villa', bua: 422.0 },
      { id: 'Z3-038', unitNo: 'Z3 038', type: '4 Bedroom Zaha Villa', bua: 422.0 },
      { id: 'Z3-039', unitNo: 'Z3 039', type: '4 Bedroom Zaha Villa', bua: 422.0 },
      { id: 'Z3-040', unitNo: 'Z3 040', type: '4 Bedroom Zaha Villa', bua: 422.0 },
      { id: 'Z3-041', unitNo: 'Z3 041', type: '4 Bedroom Zaha Villa', bua: 422.0 },
      { id: 'Z3-042', unitNo: 'Z3 042', type: '4 Bedroom Zaha Villa', bua: 422.0 },
      { id: 'Z3-043', unitNo: 'Z3 043', type: '4 Bedroom Zaha Villa', bua: 422.0 }
    ],
    'Apartment': {
      'Building A': [
        // Premium apartments for buildings 44-52
        { id: 'Z3-044-1', unitNo: 'Z3 044(1)', type: '2 Bedroom Premium Apartment', bua: 199.0 },
        { id: 'Z3-044-2', unitNo: 'Z3 044(2)', type: '2 Bedroom Premium Apartment', bua: 199.0 },
        { id: 'Z3-044-3', unitNo: 'Z3 044(3)', type: '2 Bedroom Premium Apartment', bua: 199.0 },
        { id: 'Z3-044-4', unitNo: 'Z3 044(4)', type: '2 Bedroom Premium Apartment', bua: 199.0 },
        { id: 'Z3-044-5', unitNo: 'Z3 044(5)', type: '3 Bedroom Zaha Apartment', bua: 355.0 },
        { id: 'Z3-044-6', unitNo: 'Z3 044(6)', type: '3 Bedroom Zaha Apartment', bua: 361.0 }
      ],
      'Building B': [
        { id: 'Z3-045-1', unitNo: 'Z3 045(1)', type: '2 Bedroom Premium Apartment', bua: 199.0 },
        { id: 'Z3-045-2', unitNo: 'Z3 045(2)', type: '2 Bedroom Premium Apartment', bua: 199.0 },
        { id: 'Z3-045-3', unitNo: 'Z3 045(3)', type: '2 Bedroom Premium Apartment', bua: 199.0 },
        { id: 'Z3-045-4', unitNo: 'Z3 045(4)', type: '2 Bedroom Premium Apartment', bua: 199.0 },
        { id: 'Z3-045-5', unitNo: 'Z3 045(5)', type: '3 Bedroom Zaha Apartment', bua: 355.0 },
        { id: 'Z3-045-6', unitNo: 'Z3 045(6)', type: '3 Bedroom Zaha Apartment', bua: 361.0 }
      ],
      'Building C': [
        // Small apartments and 1-bedroom apartments for buildings 53-61
        { id: 'Z3-053-1A', unitNo: 'Z3 053(1A)', type: '2 Bedroom Small Apartment', bua: 115.0 },
        { id: 'Z3-053-1B', unitNo: 'Z3 053(1B)', type: '1 Bedroom Apartment', bua: 79.0 },
        { id: 'Z3-053-2A', unitNo: 'Z3 053(2A)', type: '2 Bedroom Small Apartment', bua: 115.0 },
        { id: 'Z3-053-2B', unitNo: 'Z3 053(2B)', type: '1 Bedroom Apartment', bua: 79.0 },
        { id: 'Z3-053-3A', unitNo: 'Z3 053(3A)', type: '2 Bedroom Small Apartment', bua: 115.0 },
        { id: 'Z3-053-3B', unitNo: 'Z3 053(3B)', type: '1 Bedroom Apartment', bua: 79.0 },
        { id: 'Z3-053-4A', unitNo: 'Z3 053(4A)', type: '2 Bedroom Small Apartment', bua: 115.0 },
        { id: 'Z3-053-4B', unitNo: 'Z3 053(4B)', type: '1 Bedroom Apartment', bua: 79.0 },
        { id: 'Z3-053-5', unitNo: 'Z3 053(5)', type: '3 Bedroom Zaha Apartment', bua: 355.0 },
        { id: 'Z3-053-6', unitNo: 'Z3 053(6)', type: '3 Bedroom Zaha Apartment', bua: 361.0 }
      ],
      'Building D': [
        { id: 'Z3-054-1A', unitNo: 'Z3 054(1A)', type: '2 Bedroom Small Apartment', bua: 115.0 },
        { id: 'Z3-054-1B', unitNo: 'Z3 054(1B)', type: '1 Bedroom Apartment', bua: 79.0 },
        { id: 'Z3-054-2A', unitNo: 'Z3 054(2A)', type: '2 Bedroom Small Apartment', bua: 115.0 },
        { id: 'Z3-054-2B', unitNo: 'Z3 054(2B)', type: '1 Bedroom Apartment', bua: 79.0 },
        { id: 'Z3-054-3A', unitNo: 'Z3 054(3A)', type: '2 Bedroom Small Apartment', bua: 115.0 },
        { id: 'Z3-054-3B', unitNo: 'Z3 054(3B)', type: '1 Bedroom Apartment', bua: 79.0 },
        { id: 'Z3-054-4A', unitNo: 'Z3 054(4A)', type: '2 Bedroom Small Apartment', bua: 115.0 },
        { id: 'Z3-054-4B', unitNo: 'Z3 054(4B)', type: '1 Bedroom Apartment', bua: 79.0 },
        { id: 'Z3-054-5', unitNo: 'Z3 054(5)', type: '3 Bedroom Zaha Apartment', bua: 355.0 },
        { id: 'Z3-054-6', unitNo: 'Z3 054(6)', type: '3 Bedroom Zaha Apartment', bua: 361.0 }
      ]
    }
  },
  '5': {
    'Villa': [
      // Nameer Villas
      { id: 'Z5-001', unitNo: 'Z5 001', type: '4 Bedroom Nameer Villa', bua: 498.0 },
      { id: 'Z5-002', unitNo: 'Z5 002', type: '3 Bedroom Nameer Villa', bua: 427.0 },
      { id: 'Z5-003', unitNo: 'Z5 003', type: '4 Bedroom Nameer Villa', bua: 498.0 },
      { id: 'Z5-004', unitNo: 'Z5 004', type: '3 Bedroom Nameer Villa', bua: 427.0 },
      { id: 'Z5-005', unitNo: 'Z5 005', type: '4 Bedroom Nameer Villa', bua: 498.0 },
      { id: 'Z5-006', unitNo: 'Z5 006', type: '4 Bedroom Nameer Villa', bua: 498.0 },
      { id: 'Z5-007', unitNo: 'Z5 007', type: '3 Bedroom Nameer Villa', bua: 427.0 },
      { id: 'Z5-008', unitNo: 'Z5 008', type: '4 Bedroom Nameer Villa', bua: 498.0 },
      { id: 'Z5-009', unitNo: 'Z5 009', type: '3 Bedroom Nameer Villa', bua: 427.0 },
      { id: 'Z5-010', unitNo: 'Z5 010', type: '4 Bedroom Nameer Villa', bua: 498.0 },
      { id: 'Z5-011', unitNo: 'Z5 011', type: '4 Bedroom Nameer Villa', bua: 498.0 },
      { id: 'Z5-012', unitNo: 'Z5 012', type: '4 Bedroom Nameer Villa', bua: 498.0 },
      { id: 'Z5-013', unitNo: 'Z5 013', type: '4 Bedroom Nameer Villa', bua: 498.0 },
      { id: 'Z5-014', unitNo: 'Z5 014', type: '4 Bedroom Nameer Villa', bua: 498.0 },
      { id: 'Z5-015', unitNo: 'Z5 015', type: '4 Bedroom Nameer Villa', bua: 498.0 },
      { id: 'Z5-016', unitNo: 'Z5 016', type: '4 Bedroom Nameer Villa', bua: 498.0 },
      { id: 'Z5-017', unitNo: 'Z5 017', type: '4 Bedroom Nameer Villa', bua: 498.0 },
      { id: 'Z5-018', unitNo: 'Z5 018', type: '4 Bedroom Nameer Villa', bua: 498.0 },
      { id: 'Z5-019', unitNo: 'Z5 019', type: '4 Bedroom Nameer Villa', bua: 498.0 },
      { id: 'Z5-020', unitNo: 'Z5 020', type: '4 Bedroom Nameer Villa', bua: 498.0 },
      { id: 'Z5-021', unitNo: 'Z5 021', type: '3 Bedroom Nameer Villa', bua: 427.0 },
      { id: 'Z5-022', unitNo: 'Z5 022', type: '4 Bedroom Nameer Villa', bua: 498.0 },
      { id: 'Z5-023', unitNo: 'Z5 023', type: '4 Bedroom Nameer Villa', bua: 498.0 },
      { id: 'Z5-024', unitNo: 'Z5 024', type: '3 Bedroom Nameer Villa', bua: 427.0 },
      { id: 'Z5-025', unitNo: 'Z5 025', type: '4 Bedroom Nameer Villa', bua: 498.0 },
      { id: 'Z5-026', unitNo: 'Z5 026', type: '4 Bedroom Nameer Villa', bua: 498.0 },
      { id: 'Z5-027', unitNo: 'Z5 027', type: '3 Bedroom Nameer Villa', bua: 427.0 },
      { id: 'Z5-028', unitNo: 'Z5 028', type: '4 Bedroom Nameer Villa', bua: 498.0 },
      { id: 'Z5-029', unitNo: 'Z5 029', type: '4 Bedroom Nameer Villa', bua: 498.0 },
      { id: 'Z5-030', unitNo: 'Z5 030', type: '4 Bedroom Nameer Villa', bua: 498.0 },
      { id: 'Z5-031', unitNo: 'Z5 031', type: '4 Bedroom Nameer Villa', bua: 498.0 },
      { id: 'Z5-032', unitNo: 'Z5 032', type: '4 Bedroom Nameer Villa', bua: 498.0 },
      { id: 'Z5-033', unitNo: 'Z5 033', type: '4 Bedroom Nameer Villa', bua: 498.0 }
    ]
  },
  '8': {
    'Villa': [
      // Wajd Villas
      { id: 'Z8-001', unitNo: 'Z8 001', type: '5 Bedroom Wajd Villa', bua: 750.0 },
      { id: 'Z8-002', unitNo: 'Z8 002', type: '5 Bedroom Wajd Villa', bua: 750.0 },
      { id: 'Z8-003', unitNo: 'Z8 003', type: '5 Bedroom Wajd Villa', bua: 750.0 },
      { id: 'Z8-004', unitNo: 'Z8 004', type: '5 Bedroom Wajd Villa', bua: 750.0 },
      { id: 'Z8-005', unitNo: 'Z8 005', type: '5 Bedroom Wajd Villa', bua: 943.0 },
      { id: 'Z8-006', unitNo: 'Z8 006', type: '5 Bedroom Wajd Villa', bua: 760.0 },
      { id: 'Z8-007', unitNo: 'Z8 007', type: '5 Bedroom Wajd Villa', bua: 750.0 },
      { id: 'Z8-008', unitNo: 'Z8 008', type: '5 Bedroom Wajd Villa', bua: 760.0 },
      { id: 'Z8-009', unitNo: 'Z8 009', type: '5 Bedroom Wajd Villa', bua: 1187.0 },
      { id: 'Z8-010', unitNo: 'Z8 010', type: '5 Bedroom Wajd Villa', bua: 760.0 },
      { id: 'Z8-011', unitNo: 'Z8 011', type: '5 Bedroom Wajd Villa', bua: 750.0 },
      { id: 'Z8-012', unitNo: 'Z8 012', type: '5 Bedroom Wajd Villa', bua: 760.0 },
      { id: 'Z8-013', unitNo: 'Z8 013', type: '5 Bedroom Wajd Villa', bua: 760.0 },
      { id: 'Z8-014', unitNo: 'Z8 014', type: '5 Bedroom Wajd Villa', bua: 760.0 },
      { id: 'Z8-015', unitNo: 'Z8 015', type: '5 Bedroom Wajd Villa', bua: 760.0 },
      { id: 'Z8-016', unitNo: 'Z8 016', type: '5 Bedroom Wajd Villa', bua: 760.0 },
      { id: 'Z8-017', unitNo: 'Z8 017', type: '5 Bedroom Wajd Villa', bua: 750.0 },
      { id: 'Z8-018', unitNo: 'Z8 018', type: '5 Bedroom Wajd Villa', bua: 760.0 },
      { id: 'Z8-019', unitNo: 'Z8 019', type: '5 Bedroom Wajd Villa', bua: 750.0 },
      { id: 'Z8-020', unitNo: 'Z8 020', type: '5 Bedroom Wajd Villa', bua: 760.0 },
      { id: 'Z8-021', unitNo: 'Z8 021', type: '5 Bedroom Wajd Villa', bua: 750.0 },
      { id: 'Z8-022', unitNo: 'Z8 022', type: 'King Villa', bua: 1845.0 }
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
