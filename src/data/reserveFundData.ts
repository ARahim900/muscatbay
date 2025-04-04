
// 2025 rates for reserve fund contribution calculations
export const rates2025 = {
  masterCommunity: 1.75, // OMR per sqm for master community
  typicalBuilding: 1.65, // OMR per sqm for typical building (apartments in Zone 3)
  zone3: 0.44, // OMR per sqm for Zone 3 specific
  zone5: 1.10, // OMR per sqm for Zone 5 specific
  zone8: 0.33, // OMR per sqm for Zone 8 specific
  staffAccommodation: 3.95, // OMR per sqm for Zone 1 (Staff Accommodation)
};

// Mock zones data
export const mockZones = [
  { id: '1', name: 'Zone 1 (Staff Accommodation)', propertyTypes: ['Staff Accommodation'] },
  { id: '2', name: 'Zone 2 (Village Square)', propertyTypes: ['Commercial'] },
  { id: '3', name: 'Zone 3 (Zaha)', propertyTypes: ['Villa', 'Apartment'] },
  { id: '5', name: 'Zone 5 (Nameer)', propertyTypes: ['Villa'] },
  { id: '8', name: 'Zone 8 (Wajd)', propertyTypes: ['Villa'] },
];

// Mock buildings data by zone and property type
export const mockBuildings = {
  '1': {
    'Staff Accommodation': ['Building B1', 'Building B2', 'Building B3', 'Building B4', 'Building B5', 'Building B6', 'Building B7', 'Building B8', 'CIF Building']
  },
  '3': {
    'Apartment': ['Building 044', 'Building 045', 'Building 046', 'Building 047', 'Building 048', 
      'Building 049', 'Building 050', 'Building 051', 'Building 052', 'Building 053', 
      'Building 054', 'Building 055', 'Building 056', 'Building 057', 'Building 058', 
      'Building 059', 'Building 060', 'Building 061', 'Building 062', 'Building 074', 
      'Building 075']
  }
};

// Mock units data by zone and property type
export const mockUnits = {
  '1': {
    'Staff Accommodation': {
      'Building B1': [
        { id: 'FM-B1', unitNo: 'FM B1', type: 'Staff Building B1', bua: 1615.44 }
      ],
      'Building B2': [
        { id: 'FM-B2', unitNo: 'FM B2', type: 'Staff Building B2', bua: 1615.44 }
      ],
      'Building B3': [
        { id: 'FM-B3', unitNo: 'FM B3', type: 'Staff Building B3', bua: 1615.44 }
      ],
      'Building B4': [
        { id: 'FM-B4', unitNo: 'FM B4', type: 'Staff Building B4', bua: 1615.44 }
      ],
      'Building B5': [
        { id: 'FM-B5', unitNo: 'FM B5', type: 'Staff Building B5', bua: 1615.44 }
      ],
      'Building B6': [
        { id: 'FM-B6', unitNo: 'FM B6', type: 'Staff Building B6', bua: 1615.44 }
      ],
      'Building B7': [
        { id: 'FM-B7', unitNo: 'FM B7', type: 'Staff Building B7', bua: 1615.44 }
      ],
      'Building B8': [
        { id: 'FM-B8', unitNo: 'FM B8', type: 'Staff Building B8', bua: 1615.44 }
      ],
      'CIF Building': [
        { id: 'FM-CIF', unitNo: 'FM CIF', type: 'CIF Building', bua: 548.5 }
      ]
    }
  },
  '2': {
    'Commercial': [
      { id: 'Z2-VS-01', unitNo: 'Z2 VS-01', type: 'Commercial Unit (e.g., Spar)', bua: 150 },
      { id: 'Z2-VS-02', unitNo: 'Z2 VS-02', type: 'Commercial Unit (e.g., Laundry)', bua: 80 },
      { id: 'Z2-VS-03', unitNo: 'Z2 VS-03', type: 'Commercial Unit (e.g., Gym)', bua: 200 }
    ]
  },
  '3': {
    'Villa': [
      // 4 Bedroom Zaha Villas
      { id: 'Z3-001', unitNo: 'Z3 001', type: '4 Bedroom Zaha Villa', bua: 422 },
      { id: 'Z3-002', unitNo: 'Z3 002', type: '4 Bedroom Zaha Villa', bua: 422 },
      { id: 'Z3-003', unitNo: 'Z3 003', type: '4 Bedroom Zaha Villa', bua: 422 },
      { id: 'Z3-004', unitNo: 'Z3 004', type: '4 Bedroom Zaha Villa', bua: 422 },
      { id: 'Z3-005', unitNo: 'Z3 005', type: '4 Bedroom Zaha Villa', bua: 422 },
      { id: 'Z3-006', unitNo: 'Z3 006', type: '4 Bedroom Zaha Villa', bua: 422 },
      { id: 'Z3-007', unitNo: 'Z3 007', type: '4 Bedroom Zaha Villa', bua: 422 },
      { id: 'Z3-008', unitNo: 'Z3 008', type: '4 Bedroom Zaha Villa', bua: 422 },
      { id: 'Z3-009', unitNo: 'Z3 009', type: '4 Bedroom Zaha Villa', bua: 422 },
      { id: 'Z3-010', unitNo: 'Z3 010', type: '4 Bedroom Zaha Villa', bua: 422 },
      { id: 'Z3-011', unitNo: 'Z3 011', type: '4 Bedroom Zaha Villa', bua: 422 },
      { id: 'Z3-012', unitNo: 'Z3 012', type: '4 Bedroom Zaha Villa', bua: 422 },
      { id: 'Z3-013', unitNo: 'Z3 013', type: '4 Bedroom Zaha Villa', bua: 422 },
      { id: 'Z3-014', unitNo: 'Z3 014', type: '4 Bedroom Zaha Villa', bua: 422 },
      { id: 'Z3-015', unitNo: 'Z3 015', type: '4 Bedroom Zaha Villa', bua: 422 },
      { id: 'Z3-016', unitNo: 'Z3 016', type: '4 Bedroom Zaha Villa', bua: 422 },
      { id: 'Z3-031', unitNo: 'Z3 031', type: '4 Bedroom Zaha Villa', bua: 422 },
      { id: 'Z3-032', unitNo: 'Z3 032', type: '4 Bedroom Zaha Villa', bua: 422 },
      { id: 'Z3-033', unitNo: 'Z3 033', type: '4 Bedroom Zaha Villa', bua: 422 },
      { id: 'Z3-034', unitNo: 'Z3 034', type: '4 Bedroom Zaha Villa', bua: 422 },
      { id: 'Z3-035', unitNo: 'Z3 035', type: '4 Bedroom Zaha Villa', bua: 422 },
      { id: 'Z3-036', unitNo: 'Z3 036', type: '4 Bedroom Zaha Villa', bua: 422 },
      { id: 'Z3-037', unitNo: 'Z3 037', type: '4 Bedroom Zaha Villa', bua: 422 },
      { id: 'Z3-038', unitNo: 'Z3 038', type: '4 Bedroom Zaha Villa', bua: 422 },
      { id: 'Z3-039', unitNo: 'Z3 039', type: '4 Bedroom Zaha Villa', bua: 422 },
      { id: 'Z3-040', unitNo: 'Z3 040', type: '4 Bedroom Zaha Villa', bua: 422 },
      { id: 'Z3-041', unitNo: 'Z3 041', type: '4 Bedroom Zaha Villa', bua: 422 },
      { id: 'Z3-042', unitNo: 'Z3 042', type: '4 Bedroom Zaha Villa', bua: 422 },
      { id: 'Z3-043', unitNo: 'Z3 043', type: '4 Bedroom Zaha Villa', bua: 422 },
      
      // 3 Bedroom Zaha Villas
      { id: 'Z3-017', unitNo: 'Z3 017', type: '3 Bedroom Zaha Villa', bua: 357 },
      { id: 'Z3-018', unitNo: 'Z3 018', type: '3 Bedroom Zaha Villa', bua: 357 },
      { id: 'Z3-019', unitNo: 'Z3 019', type: '3 Bedroom Zaha Villa', bua: 357 },
      { id: 'Z3-020', unitNo: 'Z3 020', type: '3 Bedroom Zaha Villa', bua: 357 },
      { id: 'Z3-021', unitNo: 'Z3 021', type: '3 Bedroom Zaha Villa', bua: 357 },
      { id: 'Z3-022', unitNo: 'Z3 022', type: '3 Bedroom Zaha Villa', bua: 357 },
      { id: 'Z3-023', unitNo: 'Z3 023', type: '3 Bedroom Zaha Villa', bua: 357 },
      { id: 'Z3-024', unitNo: 'Z3 024', type: '3 Bedroom Zaha Villa', bua: 357 },
      { id: 'Z3-025', unitNo: 'Z3 025', type: '3 Bedroom Zaha Villa', bua: 357 },
      { id: 'Z3-026', unitNo: 'Z3 026', type: '3 Bedroom Zaha Villa', bua: 357 },
      { id: 'Z3-027', unitNo: 'Z3 027', type: '3 Bedroom Zaha Villa', bua: 357 },
      { id: 'Z3-028', unitNo: 'Z3 028', type: '3 Bedroom Zaha Villa', bua: 357 },
      { id: 'Z3-029', unitNo: 'Z3 029', type: '3 Bedroom Zaha Villa', bua: 357 },
      { id: 'Z3-030', unitNo: 'Z3 030', type: '3 Bedroom Zaha Villa', bua: 357 }
    ],
    'Apartment': {
      'Building 044': [
        { id: 'Z3-044-1', unitNo: 'Z3 044(1)', type: '2 Bedroom Premium Apartment', bua: 199 },
        { id: 'Z3-044-2', unitNo: 'Z3 044(2)', type: '2 Bedroom Premium Apartment', bua: 199 },
        { id: 'Z3-044-3', unitNo: 'Z3 044(3)', type: '2 Bedroom Premium Apartment', bua: 199 },
        { id: 'Z3-044-4', unitNo: 'Z3 044(4)', type: '2 Bedroom Premium Apartment', bua: 199 },
        { id: 'Z3-044-5', unitNo: 'Z3 044(5)', type: '3 Bedroom Zaha Apartment', bua: 355 },
        { id: 'Z3-044-6', unitNo: 'Z3 044(6)', type: '3 Bedroom Zaha Apartment', bua: 361 }
      ],
      'Building 045': [
        { id: 'Z3-045-1', unitNo: 'Z3 045(1)', type: '2 Bedroom Premium Apartment', bua: 199 },
        { id: 'Z3-045-2', unitNo: 'Z3 045(2)', type: '2 Bedroom Premium Apartment', bua: 199 },
        { id: 'Z3-045-3', unitNo: 'Z3 045(3)', type: '2 Bedroom Premium Apartment', bua: 199 },
        { id: 'Z3-045-4', unitNo: 'Z3 045(4)', type: '2 Bedroom Premium Apartment', bua: 199 },
        { id: 'Z3-045-5', unitNo: 'Z3 045(5)', type: '3 Bedroom Zaha Apartment', bua: 355 },
        { id: 'Z3-045-6', unitNo: 'Z3 045(6)', type: '3 Bedroom Zaha Apartment', bua: 361 }
      ],
      'Building 046': [
        { id: 'Z3-046-1', unitNo: 'Z3 046(1)', type: '2 Bedroom Premium Apartment', bua: 199 },
        { id: 'Z3-046-2', unitNo: 'Z3 046(2)', type: '2 Bedroom Premium Apartment', bua: 199 },
        { id: 'Z3-046-3', unitNo: 'Z3 046(3)', type: '2 Bedroom Premium Apartment', bua: 199 },
        { id: 'Z3-046-4', unitNo: 'Z3 046(4)', type: '2 Bedroom Premium Apartment', bua: 199 },
        { id: 'Z3-046-5', unitNo: 'Z3 046(5)', type: '3 Bedroom Zaha Apartment', bua: 355 },
        { id: 'Z3-046-6', unitNo: 'Z3 046(6)', type: '3 Bedroom Zaha Apartment', bua: 361 }
      ],
      'Building 047': [
        { id: 'Z3-047-1', unitNo: 'Z3 047(1)', type: '2 Bedroom Premium Apartment', bua: 199 },
        { id: 'Z3-047-2', unitNo: 'Z3 047(2)', type: '2 Bedroom Premium Apartment', bua: 199 },
        { id: 'Z3-047-3', unitNo: 'Z3 047(3)', type: '2 Bedroom Premium Apartment', bua: 199 },
        { id: 'Z3-047-4', unitNo: 'Z3 047(4)', type: '2 Bedroom Premium Apartment', bua: 199 },
        { id: 'Z3-047-5', unitNo: 'Z3 047(5)', type: '3 Bedroom Zaha Apartment', bua: 355 },
        { id: 'Z3-047-6', unitNo: 'Z3 047(6)', type: '3 Bedroom Zaha Apartment', bua: 361 }
      ],
      'Building 048': [
        { id: 'Z3-048-1', unitNo: 'Z3 048(1)', type: '2 Bedroom Premium Apartment', bua: 199 },
        { id: 'Z3-048-2', unitNo: 'Z3 048(2)', type: '2 Bedroom Premium Apartment', bua: 199 },
        { id: 'Z3-048-3', unitNo: 'Z3 048(3)', type: '2 Bedroom Premium Apartment', bua: 199 },
        { id: 'Z3-048-4', unitNo: 'Z3 048(4)', type: '2 Bedroom Premium Apartment', bua: 199 },
        { id: 'Z3-048-5', unitNo: 'Z3 048(5)', type: '3 Bedroom Zaha Apartment', bua: 355 },
        { id: 'Z3-048-6', unitNo: 'Z3 048(6)', type: '3 Bedroom Zaha Apartment', bua: 361 }
      ],
      'Building 049': [
        { id: 'Z3-049-1', unitNo: 'Z3 049(1)', type: '2 Bedroom Premium Apartment', bua: 199 },
        { id: 'Z3-049-2', unitNo: 'Z3 049(2)', type: '2 Bedroom Premium Apartment', bua: 199 },
        { id: 'Z3-049-3', unitNo: 'Z3 049(3)', type: '2 Bedroom Premium Apartment', bua: 199 },
        { id: 'Z3-049-4', unitNo: 'Z3 049(4)', type: '2 Bedroom Premium Apartment', bua: 199 },
        { id: 'Z3-049-5', unitNo: 'Z3 049(5)', type: '3 Bedroom Zaha Apartment', bua: 355 },
        { id: 'Z3-049-6', unitNo: 'Z3 049(6)', type: '3 Bedroom Zaha Apartment', bua: 361 }
      ],
      'Building 050': [
        { id: 'Z3-050-1', unitNo: 'Z3 050(1)', type: '2 Bedroom Premium Apartment', bua: 199 },
        { id: 'Z3-050-2', unitNo: 'Z3 050(2)', type: '2 Bedroom Premium Apartment', bua: 199 },
        { id: 'Z3-050-3', unitNo: 'Z3 050(3)', type: '2 Bedroom Premium Apartment', bua: 199 },
        { id: 'Z3-050-4', unitNo: 'Z3 050(4)', type: '2 Bedroom Premium Apartment', bua: 199 },
        { id: 'Z3-050-5', unitNo: 'Z3 050(5)', type: '3 Bedroom Zaha Apartment', bua: 355 },
        { id: 'Z3-050-6', unitNo: 'Z3 050(6)', type: '3 Bedroom Zaha Apartment', bua: 361 }
      ],
      'Building 051': [
        { id: 'Z3-051-1', unitNo: 'Z3 051(1)', type: '2 Bedroom Premium Apartment', bua: 199 },
        { id: 'Z3-051-2', unitNo: 'Z3 051(2)', type: '2 Bedroom Premium Apartment', bua: 199 },
        { id: 'Z3-051-3', unitNo: 'Z3 051(3)', type: '2 Bedroom Premium Apartment', bua: 199 },
        { id: 'Z3-051-4', unitNo: 'Z3 051(4)', type: '2 Bedroom Premium Apartment', bua: 199 },
        { id: 'Z3-051-5', unitNo: 'Z3 051(5)', type: '3 Bedroom Zaha Apartment', bua: 355 },
        { id: 'Z3-051-6', unitNo: 'Z3 051(6)', type: '3 Bedroom Zaha Apartment', bua: 361 }
      ],
      'Building 052': [
        { id: 'Z3-052-1', unitNo: 'Z3 052(1)', type: '2 Bedroom Premium Apartment', bua: 199 },
        { id: 'Z3-052-2', unitNo: 'Z3 052(2)', type: '2 Bedroom Premium Apartment', bua: 199 },
        { id: 'Z3-052-3', unitNo: 'Z3 052(3)', type: '2 Bedroom Premium Apartment', bua: 199 },
        { id: 'Z3-052-4', unitNo: 'Z3 052(4)', type: '2 Bedroom Premium Apartment', bua: 199 },
        { id: 'Z3-052-5', unitNo: 'Z3 052(5)', type: '3 Bedroom Zaha Apartment', bua: 355 },
        { id: 'Z3-052-6', unitNo: 'Z3 052(6)', type: '3 Bedroom Zaha Apartment', bua: 361 }
      ],
      'Building 053': [
        { id: 'Z3-053-1A', unitNo: 'Z3 053(1A)', type: '2 Bedroom Small Apartment', bua: 115 },
        { id: 'Z3-053-1B', unitNo: 'Z3 053(1B)', type: '1 Bedroom Apartment', bua: 79 },
        { id: 'Z3-053-2A', unitNo: 'Z3 053(2A)', type: '2 Bedroom Small Apartment', bua: 115 },
        { id: 'Z3-053-2B', unitNo: 'Z3 053(2B)', type: '1 Bedroom Apartment', bua: 79 },
        { id: 'Z3-053-3A', unitNo: 'Z3 053(3A)', type: '2 Bedroom Small Apartment', bua: 115 },
        { id: 'Z3-053-3B', unitNo: 'Z3 053(3B)', type: '1 Bedroom Apartment', bua: 79 },
        { id: 'Z3-053-4A', unitNo: 'Z3 053(4A)', type: '2 Bedroom Small Apartment', bua: 115 },
        { id: 'Z3-053-4B', unitNo: 'Z3 053(4B)', type: '1 Bedroom Apartment', bua: 79 },
        { id: 'Z3-053-5', unitNo: 'Z3 053(5)', type: '3 Bedroom Zaha Apartment', bua: 355 },
        { id: 'Z3-053-6', unitNo: 'Z3 053(6)', type: '3 Bedroom Zaha Apartment', bua: 361 }
      ],
      'Building 054': [
        { id: 'Z3-054-1A', unitNo: 'Z3 054(1A)', type: '2 Bedroom Small Apartment', bua: 115 },
        { id: 'Z3-054-1B', unitNo: 'Z3 054(1B)', type: '1 Bedroom Apartment', bua: 79 },
        { id: 'Z3-054-2A', unitNo: 'Z3 054(2A)', type: '2 Bedroom Small Apartment', bua: 115 },
        { id: 'Z3-054-2B', unitNo: 'Z3 054(2B)', type: '1 Bedroom Apartment', bua: 79 },
        { id: 'Z3-054-3A', unitNo: 'Z3 054(3A)', type: '2 Bedroom Small Apartment', bua: 115 },
        { id: 'Z3-054-3B', unitNo: 'Z3 054(3B)', type: '1 Bedroom Apartment', bua: 79 },
        { id: 'Z3-054-4A', unitNo: 'Z3 054(4A)', type: '2 Bedroom Small Apartment', bua: 115 },
        { id: 'Z3-054-4B', unitNo: 'Z3 054(4B)', type: '1 Bedroom Apartment', bua: 79 },
        { id: 'Z3-054-5', unitNo: 'Z3 054(5)', type: '3 Bedroom Zaha Apartment', bua: 355 },
        { id: 'Z3-054-6', unitNo: 'Z3 054(6)', type: '3 Bedroom Zaha Apartment', bua: 361 }
      ],
      'Building 055': [
        { id: 'Z3-055-1A', unitNo: 'Z3 055(1A)', type: '2 Bedroom Small Apartment', bua: 115 },
        { id: 'Z3-055-1B', unitNo: 'Z3 055(1B)', type: '1 Bedroom Apartment', bua: 79 },
        { id: 'Z3-055-2A', unitNo: 'Z3 055(2A)', type: '2 Bedroom Small Apartment', bua: 115 },
        { id: 'Z3-055-2B', unitNo: 'Z3 055(2B)', type: '1 Bedroom Apartment', bua: 79 },
        { id: 'Z3-055-3A', unitNo: 'Z3 055(3A)', type: '2 Bedroom Small Apartment', bua: 115 },
        { id: 'Z3-055-3B', unitNo: 'Z3 055(3B)', type: '1 Bedroom Apartment', bua: 79 },
        { id: 'Z3-055-4A', unitNo: 'Z3 055(4A)', type: '2 Bedroom Small Apartment', bua: 115 },
        { id: 'Z3-055-4B', unitNo: 'Z3 055(4B)', type: '1 Bedroom Apartment', bua: 79 },
        { id: 'Z3-055-5', unitNo: 'Z3 055(5)', type: '3 Bedroom Zaha Apartment', bua: 355 },
        { id: 'Z3-055-6', unitNo: 'Z3 055(6)', type: '3 Bedroom Zaha Apartment', bua: 361 }
      ],
      'Building 056': [
        { id: 'Z3-056-1A', unitNo: 'Z3 056(1A)', type: '2 Bedroom Small Apartment', bua: 115 },
        { id: 'Z3-056-1B', unitNo: 'Z3 056(1B)', type: '1 Bedroom Apartment', bua: 79 },
        { id: 'Z3-056-2A', unitNo: 'Z3 056(2A)', type: '2 Bedroom Small Apartment', bua: 115 },
        { id: 'Z3-056-2B', unitNo: 'Z3 056(2B)', type: '1 Bedroom Apartment', bua: 79 },
        { id: 'Z3-056-3A', unitNo: 'Z3 056(3A)', type: '2 Bedroom Small Apartment', bua: 115 },
        { id: 'Z3-056-3B', unitNo: 'Z3 056(3B)', type: '1 Bedroom Apartment', bua: 79 },
        { id: 'Z3-056-4A', unitNo: 'Z3 056(4A)', type: '2 Bedroom Small Apartment', bua: 115 },
        { id: 'Z3-056-4B', unitNo: 'Z3 056(4B)', type: '1 Bedroom Apartment', bua: 79 },
        { id: 'Z3-056-5', unitNo: 'Z3 056(5)', type: '3 Bedroom Zaha Apartment', bua: 355 },
        { id: 'Z3-056-6', unitNo: 'Z3 056(6)', type: '3 Bedroom Zaha Apartment', bua: 361 }
      ],
      'Building 057': [
        { id: 'Z3-057-1A', unitNo: 'Z3 057(1A)', type: '2 Bedroom Small Apartment', bua: 115 },
        { id: 'Z3-057-1B', unitNo: 'Z3 057(1B)', type: '1 Bedroom Apartment', bua: 79 },
        { id: 'Z3-057-2A', unitNo: 'Z3 057(2A)', type: '2 Bedroom Small Apartment', bua: 115 },
        { id: 'Z3-057-2B', unitNo: 'Z3 057(2B)', type: '1 Bedroom Apartment', bua: 79 },
        { id: 'Z3-057-3A', unitNo: 'Z3 057(3A)', type: '2 Bedroom Small Apartment', bua: 115 },
        { id: 'Z3-057-3B', unitNo: 'Z3 057(3B)', type: '1 Bedroom Apartment', bua: 79 },
        { id: 'Z3-057-4A', unitNo: 'Z3 057(4A)', type: '2 Bedroom Small Apartment', bua: 115 },
        { id: 'Z3-057-4B', unitNo: 'Z3 057(4B)', type: '1 Bedroom Apartment', bua: 79 },
        { id: 'Z3-057-5', unitNo: 'Z3 057(5)', type: '3 Bedroom Zaha Apartment', bua: 355 },
        { id: 'Z3-057-6', unitNo: 'Z3 057(6)', type: '3 Bedroom Zaha Apartment', bua: 361 }
      ],
      'Building 058': [
        { id: 'Z3-058-1A', unitNo: 'Z3 058(1A)', type: '2 Bedroom Small Apartment', bua: 115 },
        { id: 'Z3-058-1B', unitNo: 'Z3 058(1B)', type: '1 Bedroom Apartment', bua: 79 },
        { id: 'Z3-058-2A', unitNo: 'Z3 058(2A)', type: '2 Bedroom Small Apartment', bua: 115 },
        { id: 'Z3-058-2B', unitNo: 'Z3 058(2B)', type: '1 Bedroom Apartment', bua: 79 },
        { id: 'Z3-058-3A', unitNo: 'Z3 058(3A)', type: '2 Bedroom Small Apartment', bua: 115 },
        { id: 'Z3-058-3B', unitNo: 'Z3 058(3B)', type: '1 Bedroom Apartment', bua: 79 },
        { id: 'Z3-058-4A', unitNo: 'Z3 058(4A)', type: '2 Bedroom Small Apartment', bua: 115 },
        { id: 'Z3-058-4B', unitNo: 'Z3 058(4B)', type: '1 Bedroom Apartment', bua: 79 },
        { id: 'Z3-058-5', unitNo: 'Z3 058(5)', type: '3 Bedroom Zaha Apartment', bua: 355 },
        { id: 'Z3-058-6', unitNo: 'Z3 058(6)', type: '3 Bedroom Zaha Apartment', bua: 361 }
      ],
      'Building 059': [
        { id: 'Z3-059-1A', unitNo: 'Z3 059(1A)', type: '2 Bedroom Small Apartment', bua: 115 },
        { id: 'Z3-059-1B', unitNo: 'Z3 059(1B)', type: '1 Bedroom Apartment', bua: 79 },
        { id: 'Z3-059-2A', unitNo: 'Z3 059(2A)', type: '2 Bedroom Small Apartment', bua: 115 },
        { id: 'Z3-059-2B', unitNo: 'Z3 059(2B)', type: '1 Bedroom Apartment', bua: 79 },
        { id: 'Z3-059-3A', unitNo: 'Z3 059(3A)', type: '2 Bedroom Small Apartment', bua: 115 },
        { id: 'Z3-059-3B', unitNo: 'Z3 059(3B)', type: '1 Bedroom Apartment', bua: 79 },
        { id: 'Z3-059-4A', unitNo: 'Z3 059(4A)', type: '2 Bedroom Small Apartment', bua: 115 },
        { id: 'Z3-059-4B', unitNo: 'Z3 059(4B)', type: '1 Bedroom Apartment', bua: 79 },
        { id: 'Z3-059-5', unitNo: 'Z3 059(5)', type: '3 Bedroom Zaha Apartment', bua: 355 },
        { id: 'Z3-059-6', unitNo: 'Z3 059(6)', type: '3 Bedroom Zaha Apartment', bua: 361 }
      ],
      'Building 060': [
        { id: 'Z3-060-1A', unitNo: 'Z3 060(1A)', type: '2 Bedroom Small Apartment', bua: 115 },
        { id: 'Z3-060-1B', unitNo: 'Z3 060(1B)', type: '1 Bedroom Apartment', bua: 79 },
        { id: 'Z3-060-2A', unitNo: 'Z3 060(2A)', type: '2 Bedroom Small Apartment', bua: 115 },
        { id: 'Z3-060-2B', unitNo: 'Z3 060(2B)', type: '1 Bedroom Apartment', bua: 79 },
        { id: 'Z3-060-3A', unitNo: 'Z3 060(3A)', type: '2 Bedroom Small Apartment', bua: 115 },
        { id: 'Z3-060-3B', unitNo: 'Z3 060(3B)', type: '1 Bedroom Apartment', bua: 79 },
        { id: 'Z3-060-4A', unitNo: 'Z3 060(4A)', type: '2 Bedroom Small Apartment', bua: 115 },
        { id: 'Z3-060-4B', unitNo: 'Z3 060(4B)', type: '1 Bedroom Apartment', bua: 79 },
        { id: 'Z3-060-5', unitNo: 'Z3 060(5)', type: '3 Bedroom Zaha Apartment', bua: 355 },
        { id: 'Z3-060-6', unitNo: 'Z3 060(6)', type: '3 Bedroom Zaha Apartment', bua: 361 }
      ],
      'Building 061': [
        { id: 'Z3-061-1A', unitNo: 'Z3 061(1A)', type: '2 Bedroom Small Apartment', bua: 115 },
        { id: 'Z3-061-1B', unitNo: 'Z3 061(1B)', type: '1 Bedroom Apartment', bua: 79 },
        { id: 'Z3-061-2A', unitNo: 'Z3 061(2A)', type: '2 Bedroom Small Apartment', bua: 115 },
        { id: 'Z3-061-2B', unitNo: 'Z3 061(2B)', type: '1 Bedroom Apartment', bua: 79 },
        { id: 'Z3-061-3A', unitNo: 'Z3 061(3A)', type: '2 Bedroom Small Apartment', bua: 115 },
        { id: 'Z3-061-3B', unitNo: 'Z3 061(3B)', type: '1 Bedroom Apartment', bua: 79 },
        { id: 'Z3-061-4A', unitNo: 'Z3 061(4A)', type: '2 Bedroom Small Apartment', bua: 115 },
        { id: 'Z3-061-4B', unitNo: 'Z3 061(4B)', type: '1 Bedroom Apartment', bua: 79 },
        { id: 'Z3-061-5', unitNo: 'Z3 061(5)', type: '3 Bedroom Zaha Apartment', bua: 355 },
        { id: 'Z3-061-6', unitNo: 'Z3 061(6)', type: '3 Bedroom Zaha Apartment', bua: 361 }
      ],
      'Building 062': [
        { id: 'Z3-062-1', unitNo: 'Z3 062(1)', type: '2 Bedroom Premium Apartment', bua: 199 },
        { id: 'Z3-062-2', unitNo: 'Z3 062(2)', type: '2 Bedroom Premium Apartment', bua: 199 },
        { id: 'Z3-062-3', unitNo: 'Z3 062(3)', type: '2 Bedroom Premium Apartment', bua: 199 },
        { id: 'Z3-062-4', unitNo: 'Z3 062(4)', type: '2 Bedroom Premium Apartment', bua: 199 },
        { id: 'Z3-062-5', unitNo: 'Z3 062(5)', type: '3 Bedroom Zaha Apartment', bua: 355 },
        { id: 'Z3-062-6', unitNo: 'Z3 062(6)', type: '3 Bedroom Zaha Apartment', bua: 361 }
      ],
      'Building 074': [
        { id: 'Z3-074-1', unitNo: 'Z3 074(1)', type: '2 Bedroom Premium Apartment', bua: 199 },
        { id: 'Z3-074-2', unitNo: 'Z3 074(2)', type: '2 Bedroom Premium Apartment', bua: 199 },
        { id: 'Z3-074-3', unitNo: 'Z3 074(3)', type: '2 Bedroom Premium Apartment', bua: 199 },
        { id: 'Z3-074-4', unitNo: 'Z3 074(4)', type: '2 Bedroom Premium Apartment', bua: 199 },
        { id: 'Z3-074-5', unitNo: 'Z3 074(5)', type: '3 Bedroom Zaha Apartment', bua: 355 },
        { id: 'Z3-074-6', unitNo: 'Z3 074(6)', type: '3 Bedroom Zaha Apartment', bua: 361 }
      ],
      'Building 075': [
        { id: 'Z3-075-1', unitNo: 'Z3 075(1)', type: '2 Bedroom Premium Apartment', bua: 199 },
        { id: 'Z3-075-2', unitNo: 'Z3 075(2)', type: '2 Bedroom Premium Apartment', bua: 199 },
        { id: 'Z3-075-3', unitNo: 'Z3 075(3)', type: '2 Bedroom Premium Apartment', bua: 199 },
        { id: 'Z3-075-4', unitNo: 'Z3 075(4)', type: '2 Bedroom Premium Apartment', bua: 199 },
        { id: 'Z3-075-5', unitNo: 'Z3 075(5)', type: '3 Bedroom Zaha Apartment', bua: 355 },
        { id: 'Z3-075-6', unitNo: 'Z3 075(6)', type: '3 Bedroom Zaha Apartment', bua: 361 }
      ]
    }
  },
  '5': {
    'Villa': [
      // 4 Bedroom Nameer Villas
      { id: 'Z5-001', unitNo: 'Z5 001', type: '4 Bedroom Nameer Villa', bua: 498 },
      { id: 'Z5-003', unitNo: 'Z5 003', type: '4 Bedroom Nameer Villa', bua: 498 },
      { id: 'Z5-005', unitNo: 'Z5 005', type: '4 Bedroom Nameer Villa', bua: 498 },
      { id: 'Z5-006', unitNo: 'Z5 006', type: '4 Bedroom Nameer Villa', bua: 498 },
      { id: 'Z5-008', unitNo: 'Z5 008', type: '4 Bedroom Nameer Villa', bua: 498 },
      { id: 'Z5-010', unitNo: 'Z5 010', type: '4 Bedroom Nameer Villa', bua: 498 },
      { id: 'Z5-011', unitNo: 'Z5 011', type: '4 Bedroom Nameer Villa', bua: 498 },
      { id: 'Z5-012', unitNo: 'Z5 012', type: '4 Bedroom Nameer Villa', bua: 498 },
      { id: 'Z5-013', unitNo: 'Z5 013', type: '4 Bedroom Nameer Villa', bua: 498 },
      { id: 'Z5-014', unitNo: 'Z5 014', type: '4 Bedroom Nameer Villa', bua: 498 },
      { id: 'Z5-015', unitNo: 'Z5 015', type: '4 Bedroom Nameer Villa', bua: 498 },
      { id: 'Z5-016', unitNo: 'Z5 016', type: '4 Bedroom Nameer Villa', bua: 498 },
      { id: 'Z5-017', unitNo: 'Z5 017', type: '4 Bedroom Nameer Villa', bua: 498 },
      { id: 'Z5-018', unitNo: 'Z5 018', type: '4 Bedroom Nameer Villa', bua: 498 },
      { id: 'Z5-019', unitNo: 'Z5 019', type: '4 Bedroom Nameer Villa', bua: 498 },
      { id: 'Z5-020', unitNo: 'Z5 020', type: '4 Bedroom Nameer Villa', bua: 498 },
      { id: 'Z5-022', unitNo: 'Z5 022', type: '4 Bedroom Nameer Villa', bua: 498 },
      { id: 'Z5-023', unitNo: 'Z5 023', type: '4 Bedroom Nameer Villa', bua: 498 },
      { id: 'Z5-025', unitNo: 'Z5 025', type: '4 Bedroom Nameer Villa', bua: 498 },
      { id: 'Z5-026', unitNo: 'Z5 026', type: '4 Bedroom Nameer Villa', bua: 498 },
      { id: 'Z5-028', unitNo: 'Z5 028', type: '4 Bedroom Nameer Villa', bua: 498 },
      { id: 'Z5-029', unitNo: 'Z5 029', type: '4 Bedroom Nameer Villa', bua: 498 },
      { id: 'Z5-030', unitNo: 'Z5 030', type: '4 Bedroom Nameer Villa', bua: 498 },
      { id: 'Z5-031', unitNo: 'Z5 031', type: '4 Bedroom Nameer Villa', bua: 498 },
      { id: 'Z5-032', unitNo: 'Z5 032', type: '4 Bedroom Nameer Villa', bua: 498 },
      { id: 'Z5-033', unitNo: 'Z5 033', type: '4 Bedroom Nameer Villa', bua: 498 },
      
      // 3 Bedroom Nameer Villas
      { id: 'Z5-002', unitNo: 'Z5 002', type: '3 Bedroom Nameer Villa', bua: 427 },
      { id: 'Z5-004', unitNo: 'Z5 004', type: '3 Bedroom Nameer Villa', bua: 427 },
      { id: 'Z5-007', unitNo: 'Z5 007', type: '3 Bedroom Nameer Villa', bua: 427 },
      { id: 'Z5-009', unitNo: 'Z5 009', type: '3 Bedroom Nameer Villa', bua: 427 },
      { id: 'Z5-021', unitNo: 'Z5 021', type: '3 Bedroom Nameer Villa', bua: 427 },
      { id: 'Z5-024', unitNo: 'Z5 024', type: '3 Bedroom Nameer Villa', bua: 427 },
      { id: 'Z5-027', unitNo: 'Z5 027', type: '3 Bedroom Nameer Villa', bua: 427 }
    ]
  },
  '8': {
    'Villa': [
      // Wajd Villas
      { id: 'Z8-001', unitNo: 'Z8 001', type: '5 Bedroom Wajd Villa', bua: 750 },
      { id: 'Z8-002', unitNo: 'Z8 002', type: '5 Bedroom Wajd Villa', bua: 750 },
      { id: 'Z8-003', unitNo: 'Z8 003', type: '5 Bedroom Wajd Villa', bua: 750 },
      { id: 'Z8-004', unitNo: 'Z8 004', type: '5 Bedroom Wajd Villa', bua: 750 },
      { id: 'Z8-005', unitNo: 'Z8 005', type: '5 Bedroom Wajd Villa', bua: 943 },
      { id: 'Z8-006', unitNo: 'Z8 006', type: '5 Bedroom Wajd Villa', bua: 760 },
      { id: 'Z8-007', unitNo: 'Z8 007', type: '5 Bedroom Wajd Villa', bua: 750 },
      { id: 'Z8-008', unitNo: 'Z8 008', type: '5 Bedroom Wajd Villa', bua: 760 },
      { id: 'Z8-009', unitNo: 'Z8 009', type: '5 Bedroom Wajd Villa', bua: 1187 },
      { id: 'Z8-010', unitNo: 'Z8 010', type: '5 Bedroom Wajd Villa', bua: 760 },
      { id: 'Z8-011', unitNo: 'Z8 011', type: '5 Bedroom Wajd Villa', bua: 750 },
      { id: 'Z8-012', unitNo: 'Z8 012', type: '5 Bedroom Wajd Villa', bua: 760 },
      { id: 'Z8-013', unitNo: 'Z8 013', type: '5 Bedroom Wajd Villa', bua: 760 },
      { id: 'Z8-014', unitNo: 'Z8 014', type: '5 Bedroom Wajd Villa', bua: 760 },
      { id: 'Z8-015', unitNo: 'Z8 015', type: '5 Bedroom Wajd Villa', bua: 760 },
      { id: 'Z8-016', unitNo: 'Z8 016', type: '5 Bedroom Wajd Villa', bua: 760 },
      { id: 'Z8-017', unitNo: 'Z8 017', type: '5 Bedroom Wajd Villa', bua: 750 },
      { id: 'Z8-018', unitNo: 'Z8 018', type: '5 Bedroom Wajd Villa', bua: 760 },
      { id: 'Z8-019', unitNo: 'Z8 019', type: '5 Bedroom Wajd Villa', bua: 750 },
      { id: 'Z8-020', unitNo: 'Z8 020', type: '5 Bedroom Wajd Villa', bua: 760 },
      { id: 'Z8-021', unitNo: 'Z8 021', type: '5 Bedroom Wajd Villa', bua: 750 },
      { id: 'Z8-022', unitNo: 'Z8 022', type: 'King Villa', bua: 1845 }
    ]
  }
};

// Add the missing mock data needed for the Dashboard component
export const mockYearlyData = [
  { year: '2022', balance: 435000, contribution: 180000, expenditure: 65000 },
  { year: '2023', balance: 550000, contribution: 190000, expenditure: 75000 },
  { year: '2024', balance: 665000, contribution: 195000, expenditure: 80000 },
  { year: '2025', balance: 795000, contribution: 200000, expenditure: 70000 },
  { year: '2026', balance: 950000, contribution: 205000, expenditure: 50000 },
  { year: '2027', balance: 1100000, contribution: 210000, expenditure: 60000 },
  { year: '2028', balance: 1235000, contribution: 215000, expenditure: 80000 },
  { year: '2029', balance: 1345000, contribution: 220000, expenditure: 110000 },
  { year: '2030', balance: 1420000, contribution: 225000, expenditure: 150000 },
  { year: '2031', balance: 1480000, contribution: 230000, expenditure: 170000 },
  { year: '2032', balance: 1525000, contribution: 235000, expenditure: 190000 },
  { year: '2033', balance: 1560000, contribution: 240000, expenditure: 205000 },
  { year: '2034', balance: 1585000, contribution: 245000, expenditure: 220000 },
  { year: '2035', balance: 1600000, contribution: 250000, expenditure: 235000 },
  { year: '2036', balance: 1605000, contribution: 255000, expenditure: 250000 },
  { year: '2037', balance: 1600000, contribution: 260000, expenditure: 265000 },
  { year: '2038', balance: 1580000, contribution: 265000, expenditure: 285000 },
  { year: '2039', balance: 1550000, contribution: 270000, expenditure: 300000 },
  { year: '2040', balance: 1510000, contribution: 275000, expenditure: 315000 },
  { year: '2041', balance: 1460000, contribution: 280000, expenditure: 330000 }
];

export const mockZoneBalances = [
  { name: 'Zone 1 (Staff Accommodation)', value: 120000, color: '#4E4456' },
  { name: 'Zone 2 (Village Square)', value: 80000, color: '#6D5D7B' },
  { name: 'Zone 3 (Zaha)', value: 290000, color: '#AD9BBD' },
  { name: 'Zone 5 (Nameer)', value: 195000, color: '#E4BCF7' },
  { name: 'Zone 8 (Wajd)', value: 110000, color: '#8C7A99' }
];

export const mockAssetCategories = [
  { name: 'Structural', value: 3100000, color: '#4E4456' },
  { name: 'MEP', value: 2700000, color: '#6D5D7B' },
  { name: 'Civil Works', value: 1800000, color: '#AD9BBD' },
  { name: 'Landscape', value: 950000, color: '#E4BCF7' },
  { name: 'Common Areas', value: 650000, color: '#8C7A99' }
];

export const mockUpcomingReplacements = [
  { component: 'Swimming Pool Pump System', location: 'Zone 3 Community Pool', year: 2025, cost: 12500 },
  { component: 'HVAC System', location: 'Village Square', year: 2025, cost: 85000 },
  { component: 'External Painting', location: 'Zone 1 Staff Buildings', year: 2025, cost: 45000 },
  { component: 'Landscaping Renovation', location: 'Zone 5 Common Areas', year: 2026, cost: 32000 },
  { component: 'Security System Upgrade', location: 'All Zones', year: 2026, cost: 65000 },
  { component: 'Tennis Court Resurfacing', location: 'Zone 3 Sports Area', year: 2026, cost: 18500 },
  { component: 'Walkway & Pavement Renovation', location: 'Zones 3 & 5', year: 2027, cost: 42000 },
  { component: 'Clubhouse Renovation', location: 'Zone 8', year: 2027, cost: 125000 },
  { component: 'Water Feature Repair', location: 'Main Entrance', year: 2027, cost: 28000 },
  { component: 'Street Lighting Replacement', location: 'All Zones', year: 2028, cost: 56000 },
  { component: 'Irrigation System Upgrade', location: 'All Landscaped Areas', year: 2028, cost: 41500 },
  { component: 'Gym Equipment Replacement', location: 'Fitness Center', year: 2028, cost: 35000 }
];
