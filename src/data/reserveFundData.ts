
// Mock data for zones
export const mockZones = [
  { id: '1', name: 'Zone 1 (Staff Accommodation & CF)' },
  { id: '2', name: 'Zone 2 (Commercial / Village Square)' }, 
  { id: '3', name: 'Zone 3 (Zaha)' },
  { id: '5', name: 'Zone 5 (Nameer)' },
  { id: '8', name: 'Zone 8 (Wajd)' },
  { id: 'MC', name: 'Master Community' },
];

// Mock data for property buildings (only relevant for some zones/types)
export const mockBuildings: Record<string, Record<string, string[]>> = {
  '3': {
    'Apartment': ['Building A', 'Building B', 'Building C', 'Building D'],
  }
};

// Mock data for property units
export const mockUnits: Record<string, Record<string, any>> = {
  '1': {
    'Staff Accommodation': [
      { id: '1-1', unitNo: 'FM B1', type: 'Staff Building B1', bua: 1615.44 },
      { id: '1-2', unitNo: 'FM B2', type: 'Staff Building B2', bua: 1615.44 },
      { id: '1-3', unitNo: 'FM B3', type: 'Staff Building B3', bua: 1615.44 },
      { id: '1-4', unitNo: 'FM CIF', type: 'CIF Building', bua: 548.5 },
    ]
  },
  '2': {
    'Commercial': [
      { id: '2-1', unitNo: 'Z2 VS-01', type: 'Commercial Unit (Spar)', bua: 150 },
      { id: '2-2', unitNo: 'Z2 VS-02', type: 'Commercial Unit (Laundry)', bua: 80 },
      { id: '2-3', unitNo: 'Z2 VS-03', type: 'Commercial Unit (Gym)', bua: 200 },
    ]
  },
  '3': {
    'Villa': [
      { id: '3-v1', unitNo: 'Z3 001', type: '4 Bedroom Zaha Villa', bua: 422.24 },
      { id: '3-v2', unitNo: 'Z3 002', type: '3 Bedroom Zaha Villa', bua: 357.12 },
      { id: '3-v3', unitNo: 'Z3 019', type: '3 Bedroom Zaha Villa', bua: 357.12 },
    ],
    'Apartment': {
      'Building A': [
        { id: '3-a1', unitNo: 'Z3 061(1A)', type: '2 Bedroom Small Apartment', bua: 115.47 },
        { id: '3-a2', unitNo: 'Z3 054(4A)', type: '2 Bedroom Small Apartment', bua: 115.47 },
        { id: '3-a3', unitNo: 'Z3 057(5)', type: '3 Bedroom Zaha Apartment', bua: 355.07 },
      ],
      'Building B': [
        { id: '3-b1', unitNo: 'Z3 050(1)', type: '2 Bedroom Premium Apartment', bua: 199.13 },
        { id: '3-b2', unitNo: 'Z3 046(1)', type: '2 Bedroom Premium Apartment', bua: 199.13 },
        { id: '3-b3', unitNo: 'Z3 059(1B)', type: '1 Bedroom Apartment', bua: 79.09 },
      ]
    }
  },
  '5': {
    'Villa': [
      { id: '5-1', unitNo: 'Z5 007', type: '3 Bedroom Nameer Villa', bua: 426.78 },
      { id: '5-2', unitNo: 'Z5 008', type: '4 Bedroom Nameer Villa', bua: 497.62 },
      { id: '5-3', unitNo: 'Z5 019', type: '4 Bedroom Nameer Villa', bua: 497.62 },
      { id: '5-4', unitNo: 'Z5 020', type: '4 Bedroom Nameer Villa', bua: 497.62 },
    ]
  },
  '8': {
    'Villa': [
      { id: '8-1', unitNo: 'Z8 002', type: '5 Bedroom Wajd Villa', bua: 750.35 },
      { id: '8-2', unitNo: 'Z8 003', type: '5 Bedroom Wajd Villa', bua: 750.35 },
      { id: '8-3', unitNo: 'Z8 005', type: '5 Bedroom Wajd Villa', bua: 943 },
      { id: '8-4', unitNo: 'Z8 007', type: '5 Bedroom Wajd Villa', bua: 750.35 },
    ]
  },
  'MC': {
    'Development Land': [
      { id: 'MC-1', unitNo: '3C', type: 'Development Land', bua: 5656 },
    ]
  }
};
