
// Mock data for zones
export const mockZones = [
  { id: '1', name: 'Zone 1 (Staff Accommodation)' },
  { id: '3', name: 'Zone 3 (Zaha)' },
  { id: '5', name: 'Zone 5 (Nameer)' },
  { id: '8', name: 'Zone 8 (Wajd)' },
  { id: 'C', name: 'C Sector (Commercial)' },
];

// Mock data for property types by zone
export const mockPropertyTypes = {
  '1': ['Staff Accommodation'],
  '3': ['Apartment', 'Villa'],
  '5': ['Villa'],
  '8': ['Villa'],
  'C': ['Commercial'],
};

// Mock data for buildings by zone and property type
export const mockBuildings = {
  '3': {
    'Apartment': ['44', '45', '46', '47', '48', '49', '50', '51', '52', '53', '54', '55', '56', '57', '58', '59', '60', '61', '62', '74', '75'],
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
      { id: 'Z1-B01', unitNo: 'Z1 B01', type: 'Staff Accommodation', bua: null, plot: null, status: 'Occupied', ownerName: 'SBJ' },
      { id: 'Z1-B02', unitNo: 'Z1 B02', type: 'Staff Accommodation', bua: null, plot: null, status: 'Occupied', ownerName: 'SBJ' },
      { id: 'Z1-B03', unitNo: 'Z1 B03', type: 'Staff Accommodation', bua: null, plot: null, status: 'Occupied', ownerName: 'SBJ' },
      { id: 'Z1-B04', unitNo: 'Z1 B04', type: 'Staff Accommodation', bua: null, plot: null, status: 'Occupied', ownerName: 'SBJ' },
      { id: 'Z1-B05', unitNo: 'Z1 B05', type: 'Staff Accommodation', bua: null, plot: null, status: 'Occupied', ownerName: 'SBJ' },
      { id: 'Z1-B06', unitNo: 'Z1 B06', type: 'Staff Accommodation', bua: null, plot: null, status: 'Occupied', ownerName: 'SBJ' },
      { id: 'Z1-B07', unitNo: 'Z1 B07', type: 'Staff Accommodation', bua: null, plot: null, status: 'Occupied', ownerName: 'SBJ' },
      { id: 'Z1-B08', unitNo: 'Z1 B08', type: 'Staff Accommodation', bua: null, plot: null, status: 'Occupied', ownerName: 'SBJ' },
      { id: 'Z1-CIF', unitNo: 'Z1 CIF', type: 'Staff Accommodation', bua: null, plot: null, status: 'Occupied', ownerName: 'SBJ' },
    ]
  },
  '3': {
    'Villa': [
      { id: 'Z3-001', unitNo: 'Z3 001', type: '4 Bedroom Zaha Villa', bua: 422.24, plot: '1008', status: 'Sold', ownerName: 'SBJ', reserveFund: 909.08 },
      { id: 'Z3-002', unitNo: 'Z3 002', type: '4 Bedroom Zaha Villa', bua: 422.24, plot: '999', status: 'Sold', ownerName: 'Asara Abdulamir Abdul RidhaAl Lawati', reserveFund: 909.08 },
      { id: 'Z3-003', unitNo: 'Z3 003', type: '4 Bedroom Zaha Villa', bua: 422.24, plot: '873', status: 'Sold', ownerName: 'Arun Kumar Prasad & Seema Arun Kumar', reserveFund: 909.08 },
      { id: 'Z3-004', unitNo: 'Z3 004', type: '4 Bedroom Zaha Villa', bua: 422.24, plot: '826', status: 'Sold', ownerName: 'Yaqoob Khalfan Salim Al Fulaiti', reserveFund: 909.08 },
      { id: 'Z3-017', unitNo: 'Z3 017', type: '3 Bedroom Zaha Villa', bua: 357.12, plot: '636', status: 'Sold', ownerName: 'Kamal Kumar Gidwani', reserveFund: 768.88 },
      { id: 'Z3-018', unitNo: 'Z3 018', type: '3 Bedroom Zaha Villa', bua: 357.12, plot: '496', status: 'Sold', ownerName: 'Nikosadat Seyedjafar Mirzaghavami & Sepanta Masoud Daneshmand', reserveFund: 768.88 },
      { id: 'Z3-019', unitNo: 'Z3 019', type: '3 Bedroom Zaha Villa', bua: 357.12, plot: '471', status: 'Sold', ownerName: 'Timothy S. Parker', reserveFund: 768.88 },
    ],
    'Apartment': {
      '44': [
        { id: 'Z3-044(1)', unitNo: 'Z3 044(1)', type: '2 Bedroom Premium Apartment', bua: 199.13, plot: '1168', status: 'Sold', ownerName: 'Abdul Alim Rakhiyoot & Jahat Al Shahri', reserveFund: 750.32 },
        { id: 'Z3-044(2)', unitNo: 'Z3 044(2)', type: '2 Bedroom Premium Apartment', bua: 199.13, plot: '1168', status: 'Sold', ownerName: 'Abdul Alim Rakhiyoot & Jahat Al Shahri', reserveFund: 750.32 },
        { id: 'Z3-044(3)', unitNo: 'Z3 044(3)', type: '2 Bedroom Premium Apartment', bua: 199.13, plot: '1168', status: 'Sold', ownerName: 'Abdul Alim Rakhiyoot & Jahat Al Shahri', reserveFund: 750.32 },
        { id: 'Z3-044(4)', unitNo: 'Z3 044(4)', type: '2 Bedroom Premium Apartment', bua: 199.13, plot: '1168', status: 'Sold', ownerName: 'Abdul Alim Rakhiyoot & Jahat Al Shahri', reserveFund: 750.32 },
        { id: 'Z3-044(5)', unitNo: 'Z3 044(5)', type: '3 Bedroom Zaha Apartment', bua: 355.07, plot: '1168', status: 'Sold', ownerName: 'Abdul Alim Rakhiyoot & Jahat Al Shahri', reserveFund: 1337.74 },
        { id: 'Z3-044(6)', unitNo: 'Z3 044(6)', type: '3 Bedroom Zaha Apartment', bua: 361.42, plot: '1168', status: 'Sold', ownerName: 'Abdul Alim Rakhiyoot & Jahat Al Shahri', reserveFund: 1361.67 },
      ],
      '45': [
        { id: 'Z3-045(1)', unitNo: 'Z3 045(1)', type: '2 Bedroom Premium Apartment', bua: 199.13, plot: '1136', status: 'Sold', ownerName: 'Nashat Fuad Mohamed Al Sukaiti', reserveFund: 750.32 },
        { id: 'Z3-045(2)', unitNo: 'Z3 045(2)', type: '2 Bedroom Premium Apartment', bua: 199.13, plot: '1136', status: 'Sold', ownerName: 'Izdor International LLC', reserveFund: 750.32 },
        { id: 'Z3-045(3)', unitNo: 'Z3 045(3)', type: '2 Bedroom Premium Apartment', bua: 199.13, plot: '1136', status: 'Sold', ownerName: 'Al Sayyed Sultan Ya\'rub Qahtan Al Busaidi', reserveFund: 750.32 },
        { id: 'Z3-045(4)', unitNo: 'Z3 045(4)', type: '2 Bedroom Premium Apartment', bua: 199.13, plot: '1136', status: 'Sold', ownerName: 'Ruksana Thawer', reserveFund: 750.32 },
        { id: 'Z3-045(5)', unitNo: 'Z3 045(5)', type: '3 Bedroom Zaha Apartment', bua: 355.07, plot: '1136', status: 'Sold', ownerName: 'Hamood Sulaiman Salim Al Maskary', reserveFund: 1337.74 },
        { id: 'Z3-045(6)', unitNo: 'Z3 045(6)', type: '3 Bedroom Zaha Apartment', bua: 361.42, plot: '1136', status: 'Sold', ownerName: 'Yaqoob Hamed Sulaiman Al Harthi', reserveFund: 1361.67 },
      ],
      '62': [
        { id: 'Z3-062(1)', unitNo: 'Z3 062(1)', type: '2 Bedroom Premium Apartment', bua: 199.13, plot: '1149', status: 'Sold', ownerName: 'Vanguard Oil Tools and Services LLC(VOTS)', reserveFund: 750.32 },
        { id: 'Z3-062(2)', unitNo: 'Z3 062(2)', type: '2 Bedroom Premium Apartment', bua: 199.13, plot: '1149', status: 'Sold', ownerName: 'Oleg Andreev', reserveFund: 750.32 },
        { id: 'Z3-062(3)', unitNo: 'Z3 062(3)', type: '2 Bedroom Premium Apartment', bua: 199.13, plot: '1149', status: 'Sold', ownerName: 'Mohammed Nasib Ahmed Al Raiisi', reserveFund: 750.32 },
        { id: 'Z3-062(4)', unitNo: 'Z3 062(4)', type: '2 Bedroom Premium Apartment', bua: 199.13, plot: '1149', status: 'Sold', ownerName: 'Mir Al Nisa Siddiq Mohammed Al Balushi', reserveFund: 750.32 },
        { id: 'Z3-062(5)', unitNo: 'Z3 062(5)', type: '3 Bedroom Zaha Apartment', bua: 355.07, plot: '1149', status: 'Sold', ownerName: 'Michel Marc C Louwagie', reserveFund: 1337.74 },
        { id: 'Z3-062(6)', unitNo: 'Z3 062(6)', type: '3 Bedroom Zaha Apartment', bua: 361.42, plot: '1149', status: 'Sold', ownerName: 'Nekmohamed Manji & Zahara Manji', reserveFund: 1361.67 },
      ],
      '74': [
        { id: 'Z3-074(1)', unitNo: 'Z3 074(1)', type: '2 Bedroom Premium Apartment', bua: 199.13, plot: '1181', status: 'Sold', ownerName: 'John Alexander Campbell', reserveFund: 750.32 },
        { id: 'Z3-074(2)', unitNo: 'Z3 074(2)', type: '2 Bedroom Premium Apartment', bua: 199.13, plot: '1181', status: 'Sold', ownerName: 'Said Ali Hamood Al Wahaibi', reserveFund: 750.32 },
        { id: 'Z3-074(3)', unitNo: 'Z3 074(3)', type: '2 Bedroom Premium Apartment', bua: 199.13, plot: '1181', status: 'Sold', ownerName: 'Daniel John Griffith & Stine Meling Rees', reserveFund: 750.32 },
        { id: 'Z3-074(4)', unitNo: 'Z3 074(4)', type: '2 Bedroom Premium Apartment', bua: 199.13, plot: '1181', status: 'Sold', ownerName: 'Hamed Soud Hamed Al Mauly', reserveFund: 750.32 },
        { id: 'Z3-074(5)', unitNo: 'Z3 074(5)', type: '3 Bedroom Zaha Apartment', bua: 355.07, plot: '1181', status: 'Sold', ownerName: 'H.H Al Sayyida Alya Thuwaini Shihab Al Said', reserveFund: 1337.74 },
        { id: 'Z3-074(6)', unitNo: 'Z3 074(6)', type: '3 Bedroom Zaha Apartment', bua: 361.42, plot: '1181', status: 'Sold', ownerName: 'Sayyida Zeyana Nasser Hamood Al Busaidi', reserveFund: 1361.67 },
      ],
      '75': [
        { id: 'Z3-075(1)', unitNo: 'Z3 075(1)', type: '2 Bedroom Premium Apartment', bua: 199.13, plot: '1214', status: 'Sold', ownerName: 'Gloria Alicia Urcina Fontana', reserveFund: 750.32 },
        { id: 'Z3-075(2)', unitNo: 'Z3 075(2)', type: '2 Bedroom Premium Apartment', bua: 199.13, plot: '1214', status: 'Sold', ownerName: 'Aziz Solaiman Zahrouni', reserveFund: 750.32 },
        { id: 'Z3-075(3)', unitNo: 'Z3 075(3)', type: '2 Bedroom Premium Apartment', bua: 199.13, plot: '1214', status: 'Sold', ownerName: 'Frank Richard Crepin Wattel', reserveFund: 750.32 },
        { id: 'Z3-075(4)', unitNo: 'Z3 075(4)', type: '2 Bedroom Premium Apartment', bua: 199.13, plot: '1214', status: 'Sold', ownerName: 'Mona Farouk Maassarani', reserveFund: 750.32 },
        { id: 'Z3-075(5)', unitNo: 'Z3 075(5)', type: '3 Bedroom Zaha Apartment', bua: 355.07, plot: '1214', status: 'Sold', ownerName: 'Talal Ventures Limited', reserveFund: 1337.74 },
        { id: 'Z3-075(6)', unitNo: 'Z3 075(6)', type: '3 Bedroom Zaha Apartment', bua: 361.42, plot: '1214', status: 'Sold', ownerName: 'Talal Ventures Limited', reserveFund: 1361.67 },
      ]
    }
  },
  '5': {
    'Villa': [
      { id: 'Z5-001', unitNo: 'Z5 001', type: '4 Bedroom Nameer Villa', bua: 497.62, plot: '770', status: 'Sold', ownerName: 'ROXANA MESHGINNAFAS', reserveFund: 1392.34 },
      { id: 'Z5-002', unitNo: 'Z5 002', type: '3 Bedroom Nameer Villa', bua: 426.78, plot: '770', status: 'Sold', ownerName: 'Natheer Mohamed Ali', reserveFund: 1194.13 },
      { id: 'Z5-003', unitNo: 'Z5 003', type: '4 Bedroom Nameer Villa', bua: 497.62, plot: '769', status: 'Sold', ownerName: 'Rocky Hamilton Parker', reserveFund: 1392.34 },
      { id: 'Z5-004', unitNo: 'Z5 004', type: '3 Bedroom Nameer Villa', bua: 426.78, plot: '769', status: 'Sold', ownerName: 'Najoua Ezzedini', reserveFund: 1194.13 },
      { id: 'Z5-005', unitNo: 'Z5 005', type: '4 Bedroom Nameer Villa', bua: 497.62, plot: '770', status: 'Sold', ownerName: 'RENJIE WANG', reserveFund: 1392.34 },
    ]
  },
  '8': {
    'Villa': [
      { id: 'Z8-001', unitNo: 'Z8 001', type: '5 Bedroom Wajd Villa', bua: 750.35, plot: '1441.6', status: 'Inventory', ownerName: 'SBJ', reserveFund: 1534.47 },
      { id: 'Z8-002', unitNo: 'Z8 002', type: '5 Bedroom Wajd Villa', bua: 750.35, plot: '1418.7', status: 'Inventory', ownerName: 'SBJ', reserveFund: 1534.47 },
      { id: 'Z8-003', unitNo: 'Z8 003', type: '5 Bedroom Wajd Villa', bua: 750.35, plot: '1373', status: 'Sold', ownerName: 'TAS Capital International Holding Co.', reserveFund: 1534.47 },
      { id: 'Z8-005', unitNo: 'Z8 005', type: '5 Bedroom Wajd Villa', bua: 943, plot: '1684.4', status: 'Sold', ownerName: 'Mohsin Mohamed Ali Al Shaikh', reserveFund: 1928.44 },
      { id: 'Z8-007', unitNo: 'Z8 007', type: '5 Bedroom Wajd Villa', bua: 750.35, plot: '1293.9', status: 'Sold', ownerName: 'Yuri Soloviev', reserveFund: 1534.47 },
    ]
  },
  'C': {
    'Commercial': [
      { id: '3C', unitNo: '3C', type: 'Development Land', bua: 5656, plot: 'N/A', status: 'Sold', ownerName: 'Zen Development and Investment LLC', reserveFund: 21917 },
    ]
  }
};
