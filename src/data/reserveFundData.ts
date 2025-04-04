
// Mock data for the Reserve Fund Calculator
// This file contains mock data for zones, buildings and units for the calculator

// Zones
export const mockZones = [
  { id: '3', name: 'Zone 3 (Zaha)' },
  { id: '5', name: 'Zone 5 (Nameer)' },
  { id: '8', name: 'Zone 8 (Wajd)' },
  { id: '1', name: 'Staff Accommodation & CF' },
  { id: 'MC', name: 'Master Community' },
  { id: '2', name: 'Commercial' },
];

// Buildings by zone and property type
export const mockBuildings = {
  '3': {
    'Apartment': ['Building A', 'Building B', 'Building C'],
    'Villa': [],
  },
  '5': {
    'Apartment': ['Nameer Heights', 'Nameer Residences'],
    'Villa': [],
  },
  '8': {
    'Villa': [],
  },
  '1': {
    'Staff Accommodation': [],
  },
  'MC': {
    'Common Areas': [],
  },
  '2': {
    'Commercial': [],
  },
};

// Units by zone, property type, and building (if applicable)
export const mockUnits = {
  '3': {
    'Apartment': {
      'Building A': [
        { id: 'Z3A101', unitNo: 'Z3A 101', type: '1 Bedroom', bua: 85 },
        { id: 'Z3A102', unitNo: 'Z3A 102', type: '2 Bedroom', bua: 125 },
        { id: 'Z3A201', unitNo: 'Z3A 201', type: '3 Bedroom', bua: 175 },
      ],
      'Building B': [
        { id: 'Z3B101', unitNo: 'Z3B 101', type: '2 Bedroom', bua: 130 },
        { id: 'Z3B102', unitNo: 'Z3B 102', type: '3 Bedroom', bua: 180 },
      ],
      'Building C': [
        { id: 'Z3C101', unitNo: 'Z3C 101', type: '1 Bedroom', bua: 90 },
        { id: 'Z3C201', unitNo: 'Z3C 201', type: 'Penthouse', bua: 250 },
      ],
    },
    'Villa': [
      { id: 'Z3001', unitNo: 'Z3 001', type: '4 Bedroom Zaha Villa', bua: 422 },
      { id: 'Z3002', unitNo: 'Z3 002', type: '5 Bedroom Zaha Villa', bua: 520 },
      { id: 'Z3003', unitNo: 'Z3 003', type: '6 Bedroom Zaha Villa', bua: 650 },
    ],
  },
  '5': {
    'Apartment': {
      'Nameer Heights': [
        { id: 'Z5NH101', unitNo: 'Z5NH 101', type: 'Studio', bua: 65 },
        { id: 'Z5NH102', unitNo: 'Z5NH 102', type: '1 Bedroom', bua: 95 },
        { id: 'Z5NH201', unitNo: 'Z5NH 201', type: '2 Bedroom', bua: 135 },
      ],
      'Nameer Residences': [
        { id: 'Z5NR101', unitNo: 'Z5NR 101', type: '3 Bedroom', bua: 190 },
        { id: 'Z5NR201', unitNo: 'Z5NR 201', type: '4 Bedroom', bua: 240 },
      ],
    },
    'Villa': [
      { id: 'Z5001', unitNo: 'Z5 001', type: '4 Bedroom Nameer Villa', bua: 450 },
      { id: 'Z5002', unitNo: 'Z5 002', type: '5 Bedroom Nameer Villa', bua: 580 },
    ],
  },
  '8': {
    'Villa': [
      { id: 'Z8001', unitNo: 'Z8 001', type: '4 Bedroom Wajd Villa', bua: 435 },
      { id: 'Z8002', unitNo: 'Z8 002', type: '5 Bedroom Wajd Villa', bua: 540 },
      { id: 'Z8003', unitNo: 'Z8 003', type: '6 Bedroom Wajd Villa', bua: 680 },
    ],
  },
  '1': {
    'Staff Accommodation': [
      { id: 'Z1001', unitNo: 'Z1 001', type: 'Studio', bua: 40 },
      { id: 'Z1002', unitNo: 'Z1 002', type: '1 Bedroom', bua: 65 },
      { id: 'Z1003', unitNo: 'Z1 003', type: 'Common Facilities', bua: 350 },
    ],
  },
  'MC': {
    'Common Areas': [
      { id: 'MC001', unitNo: 'MC 001', type: 'Village Square', bua: 2500 },
      { id: 'MC002', unitNo: 'MC 002', type: 'Landscaped Areas', bua: 15000 },
      { id: 'MC003', unitNo: 'MC 003', type: 'Community Facilities', bua: 3500 },
    ],
  },
  '2': {
    'Commercial': [
      { id: 'Z2001', unitNo: 'Z2 001', type: 'Retail Unit', bua: 120 },
      { id: 'Z2002', unitNo: 'Z2 002', type: 'Restaurant', bua: 350 },
      { id: 'Z2003', unitNo: 'Z2 003', type: 'Office Space', bua: 500 },
    ],
  },
};
