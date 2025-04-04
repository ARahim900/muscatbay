
// Mock data for the Reserve Fund Calculator
// This file contains data for zones, buildings and units for the calculator

// Zones with their display names
export const mockZones = [
  { id: '3', name: 'Zone 3 (Zaha)' },
  { id: '5', name: 'Zone 5 (Nameer)' },
  { id: '8', name: 'Zone 8 (Wajd)' },
  { id: '1', name: 'Staff Accommodation & CF' },
  { id: 'MC', name: 'Master Community' },
  { id: '2', name: 'Commercial' },
  { id: 'C', name: 'C Sector (Commercial)' },
];

// Buildings by zone and property type
export const mockBuildings = {
  '1': {
    'Staff Accommodation': ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'CIF Building'],
  },
  '3': {
    'Apartment': ['Premium Apartments', 'Small Apartments', 'Zaha Apartments'],
    'Villa': [],
  },
  '5': {
    'Villa': [],
  },
  '8': {
    'Villa': [],
  },
  'MC': {
    'Common Areas': [],
  },
  '2': {
    'Commercial': [],
  },
  'C': {
    'Development Land': [],
  },
};

// Units by zone, property type, and building (if applicable)
// Updated with the exact BUA values from the provided data
export const mockUnits = {
  'C': {
    'Development Land': [
      { id: '3C', unitNo: '3C', type: 'Development Land', bua: 5656, status: 'Commercial Owner' },
    ],
  },
  '1': {
    'Staff Accommodation': {
      'B1': [
        { id: 'Z1B1', unitNo: 'Z1 B01', type: 'Staff Accommodation', bua: 0, status: 'Funded Separately' },
      ],
      'B2': [
        { id: 'Z1B2', unitNo: 'Z1 B02', type: 'Staff Accommodation', bua: 0, status: 'Funded Separately' },
      ],
      'B3': [
        { id: 'Z1B3', unitNo: 'Z1 B03', type: 'Staff Accommodation', bua: 0, status: 'Funded Separately' },
      ],
      'B4': [
        { id: 'Z1B4', unitNo: 'Z1 B04', type: 'Staff Accommodation', bua: 0, status: 'Funded Separately' },
      ],
      'B5': [
        { id: 'Z1B5', unitNo: 'Z1 B05', type: 'Staff Accommodation', bua: 0, status: 'Funded Separately' },
      ],
      'B6': [
        { id: 'Z1B6', unitNo: 'Z1 B06', type: 'Staff Accommodation', bua: 0, status: 'Funded Separately' },
      ],
      'B7': [
        { id: 'Z1B7', unitNo: 'Z1 B07', type: 'Staff Accommodation', bua: 0, status: 'Funded Separately' },
      ],
      'B8': [
        { id: 'Z1B8', unitNo: 'Z1 B08', type: 'Staff Accommodation', bua: 0, status: 'Funded Separately' },
      ],
      'CIF Building': [
        { id: 'Z1CIF', unitNo: 'Z1 CIF', type: 'Staff Accomm. CF Building', bua: 0, status: 'Funded Separately' },
      ],
    },
  },
  '3': {
    'Villa': [
      { id: 'Z3001', unitNo: 'Z3 001', type: '4 Bedroom Zaha Villa', bua: 422.24, status: 'Developer/Inventory' },
      { id: 'Z3002', unitNo: 'Z3 002', type: '4 Bedroom Zaha Villa', bua: 422.24, status: 'Owner Billed' },
      { id: 'Z3003', unitNo: 'Z3 003', type: '4 Bedroom Zaha Villa', bua: 422.24, status: 'Owner Billed' },
      { id: 'Z3004', unitNo: 'Z3 004', type: '4 Bedroom Zaha Villa', bua: 422.24, status: 'Owner Billed' },
      { id: 'Z3005', unitNo: 'Z3 005', type: '4 Bedroom Zaha Villa', bua: 422.24, status: 'Owner Billed' },
      { id: 'Z3006', unitNo: 'Z3 006', type: '4 Bedroom Zaha Villa', bua: 422.24, status: 'Owner Billed' },
      { id: 'Z3007', unitNo: 'Z3 007', type: '4 Bedroom Zaha Villa', bua: 422.24, status: 'Owner Billed' },
      { id: 'Z3008', unitNo: 'Z3 008', type: '4 Bedroom Zaha Villa', bua: 422, status: 'Owner Billed' },
      { id: 'Z3009', unitNo: 'Z3 009', type: '4 Bedroom Zaha Villa', bua: 422.24, status: 'Owner Billed' },
      { id: 'Z3010', unitNo: 'Z3 010', type: '4 Bedroom Zaha Villa', bua: 422.24, status: 'Owner Billed' },
      { id: 'Z3011', unitNo: 'Z3 011', type: '4 Bedroom Zaha Villa', bua: 422.24, status: 'Owner Billed' },
      { id: 'Z3012', unitNo: 'Z3 012', type: '4 Bedroom Zaha Villa', bua: 422.24, status: 'Owner Billed' },
      { id: 'Z3013', unitNo: 'Z3 013', type: '4 Bedroom Zaha Villa', bua: 422.24, status: 'Owner Billed' },
      { id: 'Z3014', unitNo: 'Z3 014', type: '4 Bedroom Zaha Villa', bua: 422.24, status: 'Owner Billed' },
      { id: 'Z3015', unitNo: 'Z3 015', type: '4 Bedroom Zaha Villa', bua: 422.24, status: 'Owner Billed' },
      { id: 'Z3016', unitNo: 'Z3 016', type: '4 Bedroom Zaha Villa', bua: 422.24, status: 'Owner Billed' },
      { id: 'Z3017', unitNo: 'Z3 017', type: '3 Bedroom Zaha Villa', bua: 357.12, status: 'Owner Billed' },
      { id: 'Z3018', unitNo: 'Z3 018', type: '3 Bedroom Zaha Villa', bua: 357.12, status: 'Owner Billed' },
      { id: 'Z3019', unitNo: 'Z3 019', type: '3 Bedroom Zaha Villa', bua: 357.12, status: 'Owner Billed' },
      { id: 'Z3020', unitNo: 'Z3 020', type: '3 Bedroom Zaha Villa', bua: 357.12, status: 'Owner Billed' },
      { id: 'Z3021', unitNo: 'Z3 021', type: '3 Bedroom Zaha Villa', bua: 357.12, status: 'Owner Billed' },
      { id: 'Z3022', unitNo: 'Z3 022', type: '3 Bedroom Zaha Villa', bua: 357.12, status: 'Owner Billed' },
      { id: 'Z3023', unitNo: 'Z3 023', type: '3 Bedroom Zaha Villa', bua: 357.12, status: 'Owner Billed' },
      { id: 'Z3024', unitNo: 'Z3 024', type: '3 Bedroom Zaha Villa', bua: 357.12, status: 'Owner Billed' },
      { id: 'Z3025', unitNo: 'Z3 025', type: '3 Bedroom Zaha Villa', bua: 357.12, status: 'Owner Billed' },
      { id: 'Z3026', unitNo: 'Z3 026', type: '3 Bedroom Zaha Villa', bua: 357.12, status: 'Owner Billed' },
      { id: 'Z3027', unitNo: 'Z3 027', type: '3 Bedroom Zaha Villa', bua: 357.12, status: 'Owner Billed' },
      { id: 'Z3028', unitNo: 'Z3 028', type: '3 Bedroom Zaha Villa', bua: 357.12, status: 'Owner Billed' },
      { id: 'Z3029', unitNo: 'Z3 029', type: '3 Bedroom Zaha Villa', bua: 357.12, status: 'Owner Billed' },
      { id: 'Z3030', unitNo: 'Z3 030', type: '3 Bedroom Zaha Villa', bua: 357.12, status: 'Owner Billed' },
      { id: 'Z3031', unitNo: 'Z3 031', type: '4 Bedroom Zaha Villa', bua: 422.24, status: 'Owner Billed' },
      { id: 'Z3032', unitNo: 'Z3 032', type: '4 Bedroom Zaha Villa', bua: 422.24, status: 'Owner Billed' },
      { id: 'Z3033', unitNo: 'Z3 033', type: '4 Bedroom Zaha Villa', bua: 422.24, status: 'Owner Billed' },
      { id: 'Z3034', unitNo: 'Z3 034', type: '4 Bedroom Zaha Villa', bua: 422.24, status: 'Owner Billed' },
      { id: 'Z3035', unitNo: 'Z3 035', type: '4 Bedroom Zaha Villa', bua: 422.24, status: 'Owner Billed' },
      { id: 'Z3036', unitNo: 'Z3 036', type: '4 Bedroom Zaha Villa', bua: 422.24, status: 'Owner Billed' },
      { id: 'Z3037', unitNo: 'Z3 037', type: '4 Bedroom Zaha Villa', bua: 422.24, status: 'Owner Billed' },
      { id: 'Z3038', unitNo: 'Z3 038', type: '4 Bedroom Zaha Villa', bua: 422.24, status: 'Owner Billed' },
      { id: 'Z3039', unitNo: 'Z3 039', type: '4 Bedroom Zaha Villa', bua: 422.24, status: 'Owner Billed' },
      { id: 'Z3040', unitNo: 'Z3 040', type: '4 Bedroom Zaha Villa', bua: 422.24, status: 'Owner Billed' },
      { id: 'Z3041', unitNo: 'Z3 041', type: '4 Bedroom Zaha Villa', bua: 422.24, status: 'Owner Billed' },
      { id: 'Z3042', unitNo: 'Z3 042', type: '4 Bedroom Zaha Villa', bua: 422.24, status: 'Owner Billed' },
      { id: 'Z3043', unitNo: 'Z3 043', type: '4 Bedroom Zaha Villa', bua: 422.24, status: 'Owner Billed' },
    ],
    'Apartment': {
      'Premium Apartments': [
        { id: 'Z3044-1', unitNo: 'Z3 044(1)', type: '2 Bedroom Premium Apartment', bua: 199.13, status: 'Owner Billed' },
        { id: 'Z3044-2', unitNo: 'Z3 044(2)', type: '2 Bedroom Premium Apartment', bua: 199.13, status: 'Owner Billed' },
        { id: 'Z3044-3', unitNo: 'Z3 044(3)', type: '2 Bedroom Premium Apartment', bua: 199.13, status: 'Owner Billed' },
        { id: 'Z3044-4', unitNo: 'Z3 044(4)', type: '2 Bedroom Premium Apartment', bua: 199.13, status: 'Owner Billed' },
        { id: 'Z3045-1', unitNo: 'Z3 045(1)', type: '2 Bedroom Premium Apartment', bua: 199.13, status: 'Owner Billed' },
        { id: 'Z3045-2', unitNo: 'Z3 045(2)', type: '2 Bedroom Premium Apartment', bua: 199.13, status: 'Owner Billed' },
        { id: 'Z3045-3', unitNo: 'Z3 045(3)', type: '2 Bedroom Premium Apartment', bua: 199.13, status: 'Owner Billed' },
        { id: 'Z3045-4', unitNo: 'Z3 045(4)', type: '2 Bedroom Premium Apartment', bua: 199.13, status: 'Owner Billed' },
        { id: 'Z3046-1', unitNo: 'Z3 046(1)', type: '2 Bedroom Premium Apartment', bua: 199.13, status: 'Owner Billed' },
        { id: 'Z3046-2', unitNo: 'Z3 046(2)', type: '2 Bedroom Premium Apartment', bua: 199.13, status: 'Owner Billed' },
        { id: 'Z3046-3', unitNo: 'Z3 046(3)', type: '2 Bedroom Premium Apartment', bua: 199.13, status: 'Owner Billed' },
        { id: 'Z3046-4', unitNo: 'Z3 046(4)', type: '2 Bedroom Premium Apartment', bua: 199.13, status: 'Owner Billed' },
        { id: 'Z3047-1', unitNo: 'Z3 047(1)', type: '2 Bedroom Premium Apartment', bua: 199.13, status: 'Owner Billed' },
        { id: 'Z3047-2', unitNo: 'Z3 047(2)', type: '2 Bedroom Premium Apartment', bua: 199.13, status: 'Owner Billed' },
        { id: 'Z3047-3', unitNo: 'Z3 047(3)', type: '2 Bedroom Premium Apartment', bua: 199.13, status: 'Owner Billed' },
        { id: 'Z3047-4', unitNo: 'Z3 047(4)', type: '2 Bedroom Premium Apartment', bua: 199.13, status: 'Owner Billed' },
        { id: 'Z3048-1', unitNo: 'Z3 048(1)', type: '2 Bedroom Premium Apartment', bua: 199.13, status: 'Owner Billed' },
        { id: 'Z3048-2', unitNo: 'Z3 048(2)', type: '2 Bedroom Premium Apartment', bua: 199.13, status: 'Owner Billed' },
        { id: 'Z3048-3', unitNo: 'Z3 048(3)', type: '2 Bedroom Premium Apartment', bua: 199.13, status: 'Owner Billed' },
        { id: 'Z3048-4', unitNo: 'Z3 048(4)', type: '2 Bedroom Premium Apartment', bua: 199.13, status: 'Owner Billed' },
        { id: 'Z3049-1', unitNo: 'Z3 049(1)', type: '2 Bedroom Premium Apartment', bua: 199.13, status: 'Owner Billed' },
        { id: 'Z3049-2', unitNo: 'Z3 049(2)', type: '2 Bedroom Premium Apartment', bua: 199.13, status: 'Owner Billed' },
        { id: 'Z3049-3', unitNo: 'Z3 049(3)', type: '2 Bedroom Premium Apartment', bua: 199.13, status: 'Owner Billed' },
        { id: 'Z3049-4', unitNo: 'Z3 049(4)', type: '2 Bedroom Premium Apartment', bua: 199.13, status: 'Owner Billed' },
        { id: 'Z3050-1', unitNo: 'Z3 050(1)', type: '2 Bedroom Premium Apartment', bua: 199.13, status: 'Owner Billed' },
        { id: 'Z3050-2', unitNo: 'Z3 050(2)', type: '2 Bedroom Premium Apartment', bua: 199.13, status: 'Owner Billed' },
        { id: 'Z3050-3', unitNo: 'Z3 050(3)', type: '2 Bedroom Premium Apartment', bua: 199.13, status: 'Owner Billed' },
        { id: 'Z3050-4', unitNo: 'Z3 050(4)', type: '2 Bedroom Premium Apartment', bua: 199.13, status: 'Owner Billed' },
        { id: 'Z3051-1', unitNo: 'Z3 051(1)', type: '2 Bedroom Premium Apartment', bua: 199.13, status: 'Owner Billed' },
        { id: 'Z3051-2', unitNo: 'Z3 051(2)', type: '2 Bedroom Premium Apartment', bua: 199.13, status: 'Owner Billed' },
        { id: 'Z3051-3', unitNo: 'Z3 051(3)', type: '2 Bedroom Premium Apartment', bua: 199.13, status: 'Owner Billed' },
        { id: 'Z3051-4', unitNo: 'Z3 051(4)', type: '2 Bedroom Premium Apartment', bua: 199.13, status: 'Owner Billed' },
        { id: 'Z3052-1', unitNo: 'Z3 052(1)', type: '2 Bedroom Premium Apartment', bua: 199.13, status: 'Owner Billed' },
        { id: 'Z3052-2', unitNo: 'Z3 052(2)', type: '2 Bedroom Premium Apartment', bua: 199.13, status: 'Owner Billed' },
        { id: 'Z3052-3', unitNo: 'Z3 052(3)', type: '2 Bedroom Premium Apartment', bua: 199.13, status: 'Owner Billed' },
        { id: 'Z3052-4', unitNo: 'Z3 052(4)', type: '2 Bedroom Premium Apartment', bua: 199.13, status: 'Owner Billed' },
        { id: 'Z3062-1', unitNo: 'Z3 062(1)', type: '2 Bedroom Premium Apartment', bua: 199.13, status: 'Owner Billed' },
        { id: 'Z3062-2', unitNo: 'Z3 062(2)', type: '2 Bedroom Premium Apartment', bua: 199.13, status: 'Owner Billed' },
        { id: 'Z3062-3', unitNo: 'Z3 062(3)', type: '2 Bedroom Premium Apartment', bua: 199.13, status: 'Owner Billed' },
        { id: 'Z3062-4', unitNo: 'Z3 062(4)', type: '2 Bedroom Premium Apartment', bua: 199.13, status: 'Owner Billed' },
        { id: 'Z3074-1', unitNo: 'Z3 074(1)', type: '2 Bedroom Premium Apartment', bua: 199.13, status: 'Owner Billed' },
        { id: 'Z3074-2', unitNo: 'Z3 074(2)', type: '2 Bedroom Premium Apartment', bua: 199.13, status: 'Owner Billed' },
        { id: 'Z3074-3', unitNo: 'Z3 074(3)', type: '2 Bedroom Premium Apartment', bua: 199.13, status: 'Owner Billed' },
        { id: 'Z3074-4', unitNo: 'Z3 074(4)', type: '2 Bedroom Premium Apartment', bua: 199.13, status: 'Owner Billed' },
        { id: 'Z3075-1', unitNo: 'Z3 075(1)', type: '2 Bedroom Premium Apartment', bua: 199.13, status: 'Owner Billed' },
        { id: 'Z3075-2', unitNo: 'Z3 075(2)', type: '2 Bedroom Premium Apartment', bua: 199.13, status: 'Owner Billed' },
        { id: 'Z3075-3', unitNo: 'Z3 075(3)', type: '2 Bedroom Premium Apartment', bua: 199.13, status: 'Owner Billed' },
        { id: 'Z3075-4', unitNo: 'Z3 075(4)', type: '2 Bedroom Premium Apartment', bua: 199.13, status: 'Owner Billed' },
      ],
      'Small Apartments': [
        { id: 'Z3053-1A', unitNo: 'Z3 053(1A)', type: '2 Bedroom Small Apartment', bua: 115.47, status: 'Owner Billed' },
        { id: 'Z3053-1B', unitNo: 'Z3 053(1B)', type: '1 Bedroom Apartment', bua: 79.09, status: 'Owner Billed' },
        { id: 'Z3053-2A', unitNo: 'Z3 053(2A)', type: '2 Bedroom Small Apartment', bua: 115.47, status: 'Owner Billed' },
        { id: 'Z3053-2B', unitNo: 'Z3 053(2B)', type: '1 Bedroom Apartment', bua: 79.09, status: 'Owner Billed' },
        { id: 'Z3053-3A', unitNo: 'Z3 053(3A)', type: '2 Bedroom Small Apartment', bua: 115.47, status: 'Owner Billed' },
        { id: 'Z3053-3B', unitNo: 'Z3 053(3B)', type: '1 Bedroom Apartment', bua: 79.09, status: 'Owner Billed' },
        { id: 'Z3053-4A', unitNo: 'Z3 053(4A)', type: '2 Bedroom Small Apartment', bua: 115.47, status: 'Owner Billed' },
        { id: 'Z3053-4B', unitNo: 'Z3 053(4B)', type: '1 Bedroom Apartment', bua: 79.09, status: 'Owner Billed' },
        { id: 'Z3054-1A', unitNo: 'Z3 054(1A)', type: '2 Bedroom Small Apartment', bua: 115.47, status: 'Owner Billed' },
        { id: 'Z3054-1B', unitNo: 'Z3 054(1B)', type: '1 Bedroom Apartment', bua: 79.09, status: 'Owner Billed' },
        { id: 'Z3054-2A', unitNo: 'Z3 054(2A)', type: '2 Bedroom Small Apartment', bua: 115.47, status: 'Owner Billed' },
        { id: 'Z3054-2B', unitNo: 'Z3 054(2B)', type: '1 Bedroom Apartment', bua: 79.09, status: 'Owner Billed' },
        { id: 'Z3054-3A', unitNo: 'Z3 054(3A)', type: '2 Bedroom Small Apartment', bua: 115.47, status: 'Owner Billed' },
        { id: 'Z3054-3B', unitNo: 'Z3 054(3B)', type: '1 Bedroom Apartment', bua: 79.09, status: 'Owner Billed' },
        { id: 'Z3054-4A', unitNo: 'Z3 054(4A)', type: '2 Bedroom Small Apartment', bua: 115.47, status: 'Owner Billed' },
        { id: 'Z3054-4B', unitNo: 'Z3 054(4B)', type: '1 Bedroom Apartment', bua: 79.09, status: 'Owner Billed' },
        { id: 'Z3055-1A', unitNo: 'Z3 055(1A)', type: '2 Bedroom Small Apartment', bua: 115.47, status: 'Owner Billed' },
        { id: 'Z3055-1B', unitNo: 'Z3 055(1B)', type: '1 Bedroom Apartment', bua: 79.09, status: 'Owner Billed' },
        { id: 'Z3055-2A', unitNo: 'Z3 055(2A)', type: '2 Bedroom Small Apartment', bua: 115.47, status: 'Owner Billed' },
        { id: 'Z3055-2B', unitNo: 'Z3 055(2B)', type: '1 Bedroom Apartment', bua: 79.09, status: 'Owner Billed' },
        { id: 'Z3055-3A', unitNo: 'Z3 055(3A)', type: '2 Bedroom Small Apartment', bua: 115.47, status: 'Owner Billed' },
        { id: 'Z3055-3B', unitNo: 'Z3 055(3B)', type: '1 Bedroom Apartment', bua: 79.09, status: 'Owner Billed' },
        { id: 'Z3055-4A', unitNo: 'Z3 055(4A)', type: '2 Bedroom Small Apartment', bua: 115.47, status: 'Owner Billed' },
        { id: 'Z3055-4B', unitNo: 'Z3 055(4B)', type: '1 Bedroom Apartment', bua: 79.09, status: 'Owner Billed' },
        { id: 'Z3056-1A', unitNo: 'Z3 056(1A)', type: '2 Bedroom Small Apartment', bua: 115.47, status: 'Owner Billed' },
        { id: 'Z3056-1B', unitNo: 'Z3 056(1B)', type: '1 Bedroom Apartment', bua: 79.09, status: 'Owner Billed' },
        { id: 'Z3056-2A', unitNo: 'Z3 056(2A)', type: '2 Bedroom Small Apartment', bua: 115.47, status: 'Owner Billed' },
        { id: 'Z3056-2B', unitNo: 'Z3 056(2B)', type: '1 Bedroom Apartment', bua: 79.09, status: 'Owner Billed' },
        { id: 'Z3056-3A', unitNo: 'Z3 056(3A)', type: '2 Bedroom Small Apartment', bua: 115.47, status: 'Owner Billed' },
        { id: 'Z3056-3B', unitNo: 'Z3 056(3B)', type: '1 Bedroom Apartment', bua: 0, status: 'Invalid BUA' },
        { id: 'Z3056-4A', unitNo: 'Z3 056(4A)', type: '2 Bedroom Small Apartment', bua: 115.47, status: 'Owner Billed' },
        { id: 'Z3056-4B', unitNo: 'Z3 056(4B)', type: '1 Bedroom Apartment', bua: 0, status: 'Invalid BUA' },
        { id: 'Z3057-1A', unitNo: 'Z3 057(1A)', type: '2 Bedroom Small Apartment', bua: 115.47, status: 'Owner Billed' },
        { id: 'Z3057-1B', unitNo: 'Z3 057(1B)', type: '1 Bedroom Apartment', bua: 79.09, status: 'Owner Billed' },
        { id: 'Z3057-2A', unitNo: 'Z3 057(2A)', type: '2 Bedroom Small Apartment', bua: 115.47, status: 'Owner Billed' },
        { id: 'Z3057-2B', unitNo: 'Z3 057(2B)', type: '1 Bedroom Apartment', bua: 79.09, status: 'Owner Billed' },
        { id: 'Z3057-3A', unitNo: 'Z3 057(3A)', type: '2 Bedroom Small Apartment', bua: 115.47, status: 'Owner Billed' },
        { id: 'Z3057-3B', unitNo: 'Z3 057(3B)', type: '1 Bedroom Apartment', bua: 79.09, status: 'Owner Billed' },
        { id: 'Z3057-4A', unitNo: 'Z3 057(4A)', type: '2 Bedroom Small Apartment', bua: 115.47, status: 'Owner Billed' },
        { id: 'Z3057-4B', unitNo: 'Z3 057(4B)', type: '1 Bedroom Apartment', bua: 79.09, status: 'Owner Billed' },
        { id: 'Z3058-1A', unitNo: 'Z3 058(1A)', type: '2 Bedroom Small Apartment', bua: 115.47, status: 'Owner Billed' },
        { id: 'Z3058-1B', unitNo: 'Z3 058(1B)', type: '1 Bedroom Apartment', bua: 79.09, status: 'Owner Billed' },
        { id: 'Z3058-2A', unitNo: 'Z3 058(2A)', type: '2 Bedroom Small Apartment', bua: 115.47, status: 'Owner Billed' },
        { id: 'Z3058-2B', unitNo: 'Z3 058(2B)', type: '1 Bedroom Apartment', bua: 79.09, status: 'Owner Billed' },
        { id: 'Z3058-3A', unitNo: 'Z3 058(3A)', type: '2 Bedroom Small Apartment', bua: 115.47, status: 'Owner Billed' },
        { id: 'Z3058-3B', unitNo: 'Z3 058(3B)', type: '1 Bedroom Apartment', bua: 79.09, status: 'Owner Billed' },
        { id: 'Z3058-4A', unitNo: 'Z3 058(4A)', type: '2 Bedroom Small Apartment', bua: 115.47, status: 'Owner Billed' },
        { id: 'Z3058-4B', unitNo: 'Z3 058(4B)', type: '1 Bedroom Apartment', bua: 79.09, status: 'Owner Billed' },
        { id: 'Z3059-1A', unitNo: 'Z3 059(1A)', type: '2 Bedroom Small Apartment', bua: 115.47, status: 'Owner Billed' },
        { id: 'Z3059-1B', unitNo: 'Z3 059(1B)', type: '1 Bedroom Apartment', bua: 79.09, status: 'Owner Billed' },
        { id: 'Z3059-2A', unitNo: 'Z3 059(2A)', type: '2 Bedroom Small Apartment', bua: 115.47, status: 'Owner Billed' },
        { id: 'Z3059-2B', unitNo: 'Z3 059(2B)', type: '1 Bedroom Apartment', bua: 79.09, status: 'Owner Billed' },
        { id: 'Z3059-3A', unitNo: 'Z3 059(3A)', type: '2 Bedroom Small Apartment', bua: 115.47, status: 'Owner Billed' },
        { id: 'Z3059-3B', unitNo: 'Z3 059(3B)', type: '1 Bedroom Apartment', bua: 79.09, status: 'Owner Billed' },
        { id: 'Z3059-4A', unitNo: 'Z3 059(4A)', type: '2 Bedroom Small Apartment', bua: 115.47, status: 'Owner Billed' },
        { id: 'Z3059-4B', unitNo: 'Z3 059(4B)', type: '1 Bedroom Apartment', bua: 79.09, status: 'Owner Billed' },
        { id: 'Z3060-1A', unitNo: 'Z3 060(1A)', type: '2 Bedroom Small Apartment', bua: 115.47, status: 'Owner Billed' },
        { id: 'Z3060-1B', unitNo: 'Z3 060(1B)', type: '1 Bedroom Apartment', bua: 79.09, status: 'Owner Billed' },
        { id: 'Z3060-2A', unitNo: 'Z3 060(2A)', type: '2 Bedroom Small Apartment', bua: 115.47, status: 'Owner Billed' },
        { id: 'Z3060-2B', unitNo: 'Z3 060(2B)', type: '1 Bedroom Apartment', bua: 79.09, status: 'Owner Billed' },
        { id: 'Z3060-3A', unitNo: 'Z3 060(3A)', type: '2 Bedroom Small Apartment', bua: 115.47, status: 'Owner Billed' },
        { id: 'Z3060-3B', unitNo: 'Z3 060(3B)', type: '1 Bedroom Apartment', bua: 79.09, status: 'Owner Billed' },
        { id: 'Z3060-4A', unitNo: 'Z3 060(4A)', type: '2 Bedroom Small Apartment', bua: 115.47, status: 'Owner Billed' },
        { id: 'Z3060-4B', unitNo: 'Z3 060(4B)', type: '1 Bedroom Apartment', bua: 79.09, status: 'Owner Billed' },
        { id: 'Z3061-1A', unitNo: 'Z3 061(1A)', type: '2 Bedroom Small Apartment', bua: 115.47, status: 'Owner Billed' },
        { id: 'Z3061-1B', unitNo: 'Z3 061(1B)', type: '1 Bedroom Apartment', bua: 79.09, status: 'Owner Billed' },
        { id: 'Z3061-2A', unitNo: 'Z3 061(2A)', type: '2 Bedroom Small Apartment', bua: 115.47, status: 'Owner Billed' },
        { id: 'Z3061-2B', unitNo: 'Z3 061(2B)', type: '1 Bedroom Apartment', bua: 79.09, status: 'Owner Billed' },
        { id: 'Z3061-3A', unitNo: 'Z3 061(3A)', type: '2 Bedroom Small Apartment', bua: 115.47, status: 'Owner Billed' },
        { id: 'Z3061-3B', unitNo: 'Z3 061(3B)', type: '1 Bedroom Apartment', bua: 79.09, status: 'Owner Billed' },
        { id: 'Z3061-4A', unitNo: 'Z3 061(4A)', type: '2 Bedroom Small Apartment', bua: 115.47, status: 'Owner Billed' },
        { id: 'Z3061-4B', unitNo: 'Z3 061(4B)', type: '1 Bedroom Apartment', bua: 79.09, status: 'Owner Billed' },
      ],
      'Zaha Apartments': [
        { id: 'Z3044-5', unitNo: 'Z3 044(5)', type: '3 Bedroom Zaha Apartment', bua: 355.07, status: 'Owner Billed' },
        { id: 'Z3044-6', unitNo: 'Z3 044(6)', type: '3 Bedroom Zaha Apartment', bua: 361.42, status: 'Owner Billed' },
        { id: 'Z3045-5', unitNo: 'Z3 045(5)', type: '3 Bedroom Zaha Apartment', bua: 355.07, status: 'Owner Billed' },
        { id: 'Z3045-6', unitNo: 'Z3 045(6)', type: '3 Bedroom Zaha Apartment', bua: 361.42, status: 'Owner Billed' },
        { id: 'Z3046-5', unitNo: 'Z3 046(5)', type: '3 Bedroom Zaha Apartment', bua: 355.07, status: 'Owner Billed' },
        { id: 'Z3046-6', unitNo: 'Z3 046(6)', type: '3 Bedroom Zaha Apartment', bua: 361.42, status: 'Owner Billed' },
        { id: 'Z3047-5', unitNo: 'Z3 047(5)', type: '3 Bedroom Zaha Apartment', bua: 355.07, status: 'Owner Billed' },
        { id: 'Z3047-6', unitNo: 'Z3 047(6)', type: '3 Bedroom Zaha Apartment', bua: 361.42, status: 'Owner Billed' },
        { id: 'Z3048-5', unitNo: 'Z3 048(5)', type: '3 Bedroom Zaha Apartment', bua: 355.07, status: 'Owner Billed' },
        { id: 'Z3048-6', unitNo: 'Z3 048(6)', type: '3 Bedroom Zaha Apartment', bua: 361.42, status: 'Owner Billed' },
        { id: 'Z3049-5', unitNo: 'Z3 049(5)', type: '3 Bedroom Zaha Apartment', bua: 355.07, status: 'Owner Billed' },
        { id: 'Z3049-6', unitNo: 'Z3 049(6)', type: '3 Bedroom Zaha Apartment', bua: 361.42, status: 'Owner Billed' },
        { id: 'Z3050-5', unitNo: 'Z3 050(5)', type: '3 Bedroom Zaha Apartment', bua: 355.07, status: 'Owner Billed' },
        { id: 'Z3050-6', unitNo: 'Z3 050(6)', type: '3 Bedroom Zaha Apartment', bua: 361.42, status: 'Owner Billed' },
        { id: 'Z3051-5', unitNo: 'Z3 051(5)', type: '3 Bedroom Zaha Apartment', bua: 355.07, status: 'Owner Billed' },
        { id: 'Z3051-6', unitNo: 'Z3 051(6)', type: '3 Bedroom Zaha Apartment', bua: 361.42, status: 'Owner Billed' },
        { id: 'Z3052-5', unitNo: 'Z3 052(5)', type: '3 Bedroom Zaha Apartment', bua: 355.07, status: 'Owner Billed' },
        { id: 'Z3052-6', unitNo: 'Z3 052(6)', type: '3 Bedroom Zaha Apartment', bua: 361.42, status: 'Owner Billed' },
        { id: 'Z3053-5', unitNo: 'Z3 053(5)', type: '3 Bedroom Zaha Apartment', bua: 355.07, status: 'Owner Billed' },
        { id: 'Z3053-6', unitNo: 'Z3 053(6)', type: '3 Bedroom Zaha Apartment', bua: 361.42, status: 'Owner Billed' },
        { id: 'Z3054-5', unitNo: 'Z3 054(5)', type: '3 Bedroom Zaha Apartment', bua: 355.07, status: 'Owner Billed' },
        { id: 'Z3054-6', unitNo: 'Z3 054(6)', type: '3 Bedroom Zaha Apartment', bua: 361.42, status: 'Owner Billed' },
        { id: 'Z3055-5', unitNo: 'Z3 055(5)', type: '3 Bedroom Zaha Apartment', bua: 355.07, status: 'Reserved' },
        { id: 'Z3055-6', unitNo: 'Z3 055(6)', type: '3 Bedroom Zaha Apartment', bua: 361.42, status: 'Owner Billed' },
        { id: 'Z3056-5', unitNo: 'Z3 056(5)', type: '3 Bedroom Zaha Apartment', bua: 355.07, status: 'Owner Billed' },
        { id: 'Z3056-6', unitNo: 'Z3 056(6)', type: '3 Bedroom Zaha Apartment', bua: 361.42, status: 'Owner Billed' },
        { id: 'Z3057-5', unitNo: 'Z3 057(5)', type: '3 Bedroom Zaha Apartment', bua: 355.07, status: 'Owner Billed' },
        { id: 'Z3057-6', unitNo: 'Z3 057(6)', type: '3 Bedroom Zaha Apartment', bua: 361.42, status: 'Owner Billed' },
        { id: 'Z3058-5', unitNo: 'Z3 058(5)', type: '3 Bedroom Zaha Apartment', bua: 355.07, status: 'Owner Billed' },
        { id: 'Z3058-6', unitNo: 'Z3 058(6)', type: '3 Bedroom Zaha Apartment', bua: 361.42, status: 'Owner Billed' },
        { id: 'Z3059-5', unitNo: 'Z3 059(5)', type: '3 Bedroom Zaha Apartment', bua: 355.07, status: 'Owner Billed' },
        { id: 'Z3059-6', unitNo: 'Z3 059(6)', type: '3 Bedroom Zaha Apartment', bua: 361.42, status: 'Owner Billed' },
        { id: 'Z3060-5', unitNo: 'Z3 060(5)', type: '3 Bedroom Zaha Apartment', bua: 355.07, status: 'Owner Billed' },
        { id: 'Z3060-6', unitNo: 'Z3 060(6)', type: '3 Bedroom Zaha Apartment', bua: 361.42, status: 'Owner Billed' },
        { id: 'Z3061-5', unitNo: 'Z3 061(5)', type: '3 Bedroom Zaha Apartment', bua: 355.07, status: 'Owner Billed' },
        { id: 'Z3061-6', unitNo: 'Z3 061(6)', type: '3 Bedroom Zaha Apartment', bua: 361.42, status: 'Owner Billed' },
        { id: 'Z3062-5', unitNo: 'Z3 062(5)', type: '3 Bedroom Zaha Apartment', bua: 355.07, status: 'Owner Billed' },
        { id: 'Z3062-6', unitNo: 'Z3 062(6)', type: '3 Bedroom Zaha Apartment', bua: 361.42, status: 'Owner Billed' },
        { id: 'Z3074-5', unitNo: 'Z3 074(5)', type: '3 Bedroom Zaha Apartment', bua: 355.07, status: 'Owner Billed' },
        { id: 'Z3074-6', unitNo: 'Z3 074(6)', type: '3 Bedroom Zaha Apartment', bua: 361.42, status: 'Owner Billed' },
        { id: 'Z3075-5', unitNo: 'Z3 075(5)', type: '3 Bedroom Zaha Apartment', bua: 355.07, status: 'Owner Billed' },
        { id: 'Z3075-6', unitNo: 'Z3 075(6)', type: '3 Bedroom Zaha Apartment', bua: 361.42, status: 'Owner Billed' },
      ],
    },
  },
  '5': {
    'Villa': [
      { id: 'Z5001', unitNo: 'Z5 001', type: '4 Bedroom Nameer Villa', bua: 497.62, status: 'Owner Billed' },
      { id: 'Z5002', unitNo: 'Z5 002', type: '3 Bedroom Nameer Villa', bua: 426.78, status: 'Terminated' },
      { id: 'Z5003', unitNo: 'Z5 003', type: '4 Bedroom Nameer Villa', bua: 497.62, status: 'Owner Billed' },
      { id: 'Z5004', unitNo: 'Z5 004', type: '3 Bedroom Nameer Villa', bua: 426.78, status: 'Owner Billed' },
      { id: 'Z5005', unitNo: 'Z5 005', type: '4 Bedroom Nameer Villa', bua: 497.62, status: 'Owner Billed' },
      { id: 'Z5006', unitNo: 'Z5 006', type: '4 Bedroom Nameer Villa', bua: 497.62, status: 'Owner Billed' },
      { id: 'Z5007', unitNo: 'Z5 007', type: '3 Bedroom Nameer Villa', bua: 426.78, status: 'Owner Billed' },
      { id: 'Z5008', unitNo: 'Z5 008', type: '4 Bedroom Nameer Villa', bua: 497.62, status: 'Owner Billed' },
      { id: 'Z5009', unitNo: 'Z5 009', type: '3 Bedroom Nameer Villa', bua: 426.78, status: 'Owner Billed' },
      { id: 'Z5010', unitNo: 'Z5 010', type: '4 Bedroom Nameer Villa', bua: 497.62, status: 'Owner Billed' },
      { id: 'Z5011', unitNo: 'Z5 011', type: '4 Bedroom Nameer Villa', bua: 497.62, status: 'Owner Billed' },
      { id: 'Z5012', unitNo: 'Z5 012', type: '4 Bedroom Nameer Villa', bua: 497.62, status: 'Owner Billed' },
      { id: 'Z5013', unitNo: 'Z5 013', type: '4 Bedroom Nameer Villa', bua: 497.62, status: 'Owner Billed' },
      { id: 'Z5014', unitNo: 'Z5 014', type: '4 Bedroom Nameer Villa', bua: 497.62, status: 'Owner Billed' },
      { id: 'Z5015', unitNo: 'Z5 015', type: '4 Bedroom Nameer Villa', bua: 497.62, status: 'Owner Billed' },
      { id: 'Z5016', unitNo: 'Z5 016', type: '4 Bedroom Nameer Villa', bua: 497.62, status: 'Owner Billed' },
      { id: 'Z5017', unitNo: 'Z5 017', type: '4 Bedroom Nameer Villa', bua: 497.62, status: 'Owner Billed' },
      { id: 'Z5018', unitNo: 'Z5 018', type: '4 Bedroom Nameer Villa', bua: 497.62, status: 'Owner Billed' },
      { id: 'Z5019', unitNo: 'Z5 019', type: '4 Bedroom Nameer Villa', bua: 497.62, status: 'Owner Billed' },
      { id: 'Z5020', unitNo: 'Z5 020', type: '4 Bedroom Nameer Villa', bua: 497.62, status: 'Owner Billed' },
      { id: 'Z5021', unitNo: 'Z5 021', type: '3 Bedroom Nameer Villa', bua: 426.78, status: 'Owner Billed' },
      { id: 'Z5022', unitNo: 'Z5 022', type: '4 Bedroom Nameer Villa', bua: 497.62, status: 'Owner Billed' },
      { id: 'Z5023', unitNo: 'Z5 023', type: '4 Bedroom Nameer Villa', bua: 497.62, status: 'Owner Billed' },
      { id: 'Z5024', unitNo: 'Z5 024', type: '3 Bedroom Nameer Villa', bua: 426.78, status: 'Owner Billed' },
      { id: 'Z5025', unitNo: 'Z5 025', type: '4 Bedroom Nameer Villa', bua: 497.62, status: 'Owner Billed' },
      { id: 'Z5026', unitNo: 'Z5 026', type: '4 Bedroom Nameer Villa', bua: 497.62, status: 'Owner Billed' },
      { id: 'Z5027', unitNo: 'Z5 027', type: '3 Bedroom Nameer Villa', bua: 426.78, status: 'Owner Billed' },
      { id: 'Z5028', unitNo: 'Z5 028', type: '4 Bedroom Nameer Villa', bua: 497.62, status: 'Reserved' },
      { id: 'Z5029', unitNo: 'Z5 029', type: '4 Bedroom Nameer Villa', bua: 497.62, status: 'Owner Billed' },
      { id: 'Z5030', unitNo: 'Z5 030', type: '4 Bedroom Nameer Villa', bua: 497.62, status: 'Owner Billed' },
      { id: 'Z5031', unitNo: 'Z5 031', type: '4 Bedroom Nameer Villa', bua: 497.62, status: 'Owner Billed' },
      { id: 'Z5032', unitNo: 'Z5 032', type: '4 Bedroom Nameer Villa', bua: 497.62, status: 'Owner Billed' },
      { id: 'Z5033', unitNo: 'Z5 033', type: '4 Bedroom Nameer Villa', bua: 497.62, status: 'Owner Billed' },
    ],
  },
  '8': {
    'Villa': [
      { id: 'Z8001', unitNo: 'Z8 001', type: '5 Bedroom Wajd Villa', bua: 750.35, status: 'Developer/Inventory' },
      { id: 'Z8002', unitNo: 'Z8 002', type: '5 Bedroom Wajd Villa', bua: 750.35, status: 'Developer/Inventory' },
      { id: 'Z8003', unitNo: 'Z8 003', type: '5 Bedroom Wajd Villa', bua: 750.35, status: 'Owner Billed' },
      { id: 'Z8004', unitNo: 'Z8 004', type: '5 Bedroom Wajd Villa', bua: 750.35, status: 'Developer/Inventory' },
      { id: 'Z8005', unitNo: 'Z8 005', type: '5 Bedroom Wajd Villa', bua: 943, status: 'Owner Billed' },
      { id: 'Z8006', unitNo: 'Z8 006', type: '5 Bedroom Wajd Villa', bua: 760.4, status: 'Developer/Inventory' },
      { id: 'Z8007', unitNo: 'Z8 007', type: '5 Bedroom Wajd Villa', bua: 750.35, status: 'Owner Billed' },
      { id: 'Z8008', unitNo: 'Z8 008', type: '5 Bedroom Wajd Villa', bua: 760.4, status: 'Developer/Inventory' },
      { id: 'Z8009', unitNo: 'Z8 009', type: '5 Bedroom Wajd Villa', bua: 1187.47, status: 'Owner Billed' },
      { id: 'Z8010', unitNo: 'Z8 010', type: '5 Bedroom Wajd Villa', bua: 760.4, status: 'Developer/Inventory' },
      { id: 'Z8011', unitNo: 'Z8 011', type: '5 Bedroom Wajd Villa', bua: 750.35, status: 'Owner Billed' },
      { id: 'Z8012', unitNo: 'Z8 012', type: '5 Bedroom Wajd Villa', bua: 760.4, status: 'Owner Billed' },
      { id: 'Z8013', unitNo: 'Z8 013', type: '5 Bedroom Wajd Villa', bua: 760.4, status: 'Owner Billed' },
      { id: 'Z8014', unitNo: 'Z8 014', type: '5 Bedroom Wajd Villa', bua: 760.4, status: 'Owner Billed' },
      { id: 'Z8015', unitNo: 'Z8 015', type: '5 Bedroom Wajd Villa', bua: 760.4, status: 'Owner Billed' },
      { id: 'Z8016', unitNo: 'Z8 016', type: '5 Bedroom Wajd Villa', bua: 760.4, status: 'Owner Billed' },
      { id: 'Z8017', unitNo: 'Z8 017', type: '5 Bedroom Wajd Villa', bua: 750.35, status: 'Owner Billed' },
      { id: 'Z8018', unitNo: 'Z8 018', type: '5 Bedroom Wajd Villa', bua: 760.4, status: 'Owner Billed' },
      { id: 'Z8019', unitNo: 'Z8 019', type: '5 Bedroom Wajd Villa', bua: 750.35, status: 'Owner Billed' },
      { id: 'Z8020', unitNo: 'Z8 020', type: '5 Bedroom Wajd Villa', bua: 760.4, status: 'Owner Billed' },
      { id: 'Z8021', unitNo: 'Z8 021', type: '5 Bedroom Wajd Villa', bua: 750.35, status: 'Owner Billed' },
      { id: 'Z8022', unitNo: 'Z8 022', type: 'King Villa', bua: 1844.67, status: 'Owner Billed' },
    ],
  },
  'MC': {
    'Common Areas': [
      { id: 'MC001', unitNo: 'MC 001', type: 'Village Square', bua: 2500, status: 'Master Community' },
      { id: 'MC002', unitNo: 'MC 002', type: 'Landscaped Areas', bua: 15000, status: 'Master Community' },
      { id: 'MC003', unitNo: 'MC 003', type: 'Community Facilities', bua: 3500, status: 'Master Community' },
    ],
  },
  '2': {
    'Commercial': [
      { id: 'Z2001', unitNo: 'Z2 001', type: 'Retail Unit', bua: 120, status: 'Commercial' },
      { id: 'Z2002', unitNo: 'Z2 002', type: 'Restaurant', bua: 350, status: 'Commercial' },
      { id: 'Z2003', unitNo: 'Z2 003', type: 'Office Space', bua: 500, status: 'Commercial' },
    ],
  },
};

// Base 2021 RFS rates in OMR per Square Meter (SqM)
// Updated with the exact rates from the provided data
export const RFS_BASE_RATES_2021 = {
  // Zones
  zaha: 2.153,          // Zone 3 Villa Rate
  zahaApartment: 3.768, // Zone 3 Apartment Rate
  nameer: 2.798,        // Zone 5
  wajd: 2.045,          // Zone 8
  staffAccommodation: 3.875, // Staff Acc & CF
  masterCommunity: 1.722,    // Master Community areas
  commercial: 1.722,         // Commercial (based on Master Community rate)
};

// Annual growth rate as per RFS (updated with precise value)
export const ANNUAL_GROWTH_RATE = 0.00500; // 0.5% per year

// Escalation factor from 2021 to 2025 (pre-calculated)
export const ESCALATION_FACTOR_2025 = 1.02015;

// Square meter to square foot conversion factor
export const SQM_TO_SQFT = 10.7639;

// Calculate the adjusted rate for a given year based on the 2021 base rate
export const calculateAdjustedRate = (baseRate: number, year: number): number => {
  const yearsSince2021 = year - 2021;
  return baseRate * Math.pow(1 + ANNUAL_GROWTH_RATE, yearsSince2021);
};

// Get the appropriate base rate for a zone and property type
export const getBaseRateForZone = (zone: string, propertyType?: string): number => {
  switch (zone) {
    case '3': // Zaha
      // Special handling for Zaha properties - apartments have a different rate
      if (propertyType && (propertyType.includes('Apartment') || propertyType.includes('apartment'))) {
        return RFS_BASE_RATES_2021.zahaApartment;
      }
      return RFS_BASE_RATES_2021.zaha;
    case '5': // Nameer
      return RFS_BASE_RATES_2021.nameer;
    case '8': // Wajd
      return RFS_BASE_RATES_2021.wajd;
    case '1': // Staff Accommodation
      return RFS_BASE_RATES_2021.staffAccommodation;
    case '2': // Commercial
    case 'C': // C Sector Commercial
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
  propertyType?: string,
  year: number = 2025 // Default to 2025
): number => {
  if (!buaSqm || buaSqm <= 0) {
    return 0;
  }

  // Step 1: Get the base rate for the zone in OMR/SqM
  const baseRate = getBaseRateForZone(zone, propertyType);
  
  // Step 2: Calculate the contribution using the pre-calculated escalation factor for 2025
  // or calculate it dynamically for any other year
  let adjustedRate: number;
  
  if (year === 2025) {
    adjustedRate = baseRate * ESCALATION_FACTOR_2025;
  } else {
    adjustedRate = calculateAdjustedRate(baseRate, year);
  }
  
  // Step 3: Calculate the total contribution (BUA in SqM × Rate per SqM)
  const totalContribution = buaSqm * adjustedRate;
  
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
    case 'C':
      return 'C Sector (Commercial)';
    case 'MC':
      return 'Master Community';
    default:
      return `Zone ${zone}`;
  }
};
