
// Mock data for zones
export const mockZones = [
  { id: '1', name: 'Zone 1 (Staff Accommodation)' },
  { id: '3', name: 'Zone 3 (Zaha)' },
  { id: '5', name: 'Zone 5 (Nameer)' },
  { id: '8', name: 'Zone 8 (Wajd)' },
];

// Mock data for property types by zone
export const mockPropertyTypes = {
  '1': ['Staff Accommodation'],
  '3': ['Apartment', 'Villa'],
  '5': ['Villa'],
  '8': ['Villa'],
};

// Mock data for buildings by zone and property type
export const mockBuildings = {
  '3': {
    'Apartment': ['44', '45', '62', '74', '75'], // Updated to use building numbers
    'Villa': ['Block A', 'Block B', 'Block C']
  },
  '5': {
    'Villa': ['Block A', 'Block B']
  },
  '8': {
    'Villa': ['Block A', 'Block B']
  }
};

// Mock data for units by zone, property type, and building
export const mockUnits = {
  '1': {
    'Staff Accommodation': [
      { id: 'sa-1', unitNo: 'SA-101', type: 'Staff Studio', bua: 45 },
      { id: 'sa-2', unitNo: 'SA-102', type: 'Staff 1BR', bua: 60 },
      { id: 'sa-3', unitNo: 'SA-103', type: 'Staff 2BR', bua: 80 }
    ]
  },
  '3': {
    'Apartment': {
      '44': [
        { id: 'apt-44-1', unitNo: 'Z3-44-101', type: 'Studio', bua: 40 },
        { id: 'apt-44-2', unitNo: 'Z3-44-102', type: '1 Bedroom', bua: 65 },
        { id: 'apt-44-3', unitNo: 'Z3-44-201', type: '2 Bedroom', bua: 90 }
      ],
      '45': [
        { id: 'apt-45-1', unitNo: 'Z3-45-101', type: 'Studio', bua: 42 },
        { id: 'apt-45-2', unitNo: 'Z3-45-102', type: '1 Bedroom', bua: 67 },
        { id: 'apt-45-3', unitNo: 'Z3-45-201', type: '2 Bedroom', bua: 92 }
      ],
      '62': [
        { id: 'apt-62-1', unitNo: 'Z3-62-101', type: 'Studio', bua: 41 },
        { id: 'apt-62-2', unitNo: 'Z3-62-102', type: '1 Bedroom', bua: 66 },
        { id: 'apt-62-3', unitNo: 'Z3-62-201', type: '2 Bedroom', bua: 91 }
      ],
      '74': [
        { id: 'apt-74-1', unitNo: 'Z3-74-101', type: 'Studio', bua: 43 },
        { id: 'apt-74-2', unitNo: 'Z3-74-102', type: '1 Bedroom', bua: 68 },
        { id: 'apt-74-3', unitNo: 'Z3-74-201', type: '2 Bedroom', bua: 93 }
      ],
      '75': [
        { id: 'apt-75-1', unitNo: 'Z3-75-101', type: 'Studio', bua: 44 },
        { id: 'apt-75-2', unitNo: 'Z3-75-102', type: '1 Bedroom', bua: 69 },
        { id: 'apt-75-3', unitNo: 'Z3-75-201', type: '2 Bedroom', bua: 94 }
      ]
    },
    'Villa': [
      { id: 'villa-1', unitNo: 'Z3-V-101', type: '3 Bedroom Villa', bua: 200 },
      { id: 'villa-2', unitNo: 'Z3-V-102', type: '4 Bedroom Villa', bua: 250 },
      { id: 'villa-3', unitNo: 'Z3-V-103', type: '5 Bedroom Villa', bua: 300 }
    ]
  },
  '5': {
    'Villa': {
      'Block A': [
        { id: 'z5-villa-a1', unitNo: 'Z5-A-101', type: '4 Bedroom Villa', bua: 280 },
        { id: 'z5-villa-a2', unitNo: 'Z5-A-102', type: '5 Bedroom Villa', bua: 330 }
      ],
      'Block B': [
        { id: 'z5-villa-b1', unitNo: 'Z5-B-101', type: '4 Bedroom Villa', bua: 285 },
        { id: 'z5-villa-b2', unitNo: 'Z5-B-102', type: '5 Bedroom Villa', bua: 335 }
      ]
    }
  },
  '8': {
    'Villa': {
      'Block A': [
        { id: 'z8-villa-a1', unitNo: 'Z8-A-101', type: '4 Bedroom Luxury Villa', bua: 350 },
        { id: 'z8-villa-a2', unitNo: 'Z8-A-102', type: '5 Bedroom Luxury Villa', bua: 400 }
      ],
      'Block B': [
        { id: 'z8-villa-b1', unitNo: 'Z8-B-101', type: '4 Bedroom Luxury Villa', bua: 355 },
        { id: 'z8-villa-b2', unitNo: 'Z8-B-102', type: '5 Bedroom Luxury Villa', bua: 405 }
      ]
    }
  }
};
