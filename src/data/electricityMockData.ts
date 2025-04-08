import { ElectricityRecord } from '@/types/electricity';

// Convert the raw data table into structured records
export const mockElectricityData: ElectricityRecord[] = [
  {
    id: '1',
    zone: 'Infrastructure',
    type: 'MC',
    name: 'Pumping Station 01',
    meterAccountNo: 'R52330',
    consumption: {
      'Apr-24': 1608,
      'May-24': 1940,
      'Jun-24': 1783,
      'Jul-24': 1874,
      'Aug-24': 1662,
      'Sep-24': 3822,
      'Oct-24': 6876,
      'Nov-24': 1629,
      'Dec-24': 1640,
      'Jan-25': 1903,
      'Feb-25': 2095,
      'Mar-25': 3032
    }
  },
  {
    id: '2',
    zone: 'Infrastructure',
    type: 'MC',
    name: 'Pumping Station 03',
    meterAccountNo: 'R52329',
    consumption: {
      'Apr-24': 31,
      'May-24': 47,
      'Jun-24': 25,
      'Jul-24': 3,
      'Aug-24': 0,
      'Sep-24': 0,
      'Oct-24': 33,
      'Nov-24': 0,
      'Dec-24': 179,
      'Jan-25': 32.5,
      'Feb-25': 137.2,
      'Mar-25': 130.7
    }
  },
  {
    id: '3',
    zone: 'Infrastructure',
    type: 'MC',
    name: 'Pumping Station 04',
    meterAccountNo: 'R52327',
    consumption: {
      'Apr-24': 830,
      'May-24': 818,
      'Jun-24': 720,
      'Jul-24': 731,
      'Aug-24': 857,
      'Sep-24': 1176,
      'Oct-24': 445,
      'Nov-24': 919,
      'Dec-24': 921,
      'Jan-25': 245.1,
      'Feb-25': 869.5,
      'Mar-25': 646.1
    }
  },
  {
    id: '4',
    zone: 'Infrastructure',
    type: 'MC',
    name: 'Pumping Station 05',
    meterAccountNo: 'R52325',
    consumption: {
      'Apr-24': 1774,
      'May-24': 2216,
      'Jun-24': 2011,
      'Jul-24': 2059,
      'Aug-24': 2229,
      'Sep-24': 5217,
      'Oct-24': 2483,
      'Nov-24': 2599,
      'Dec-24': 1952,
      'Jan-25': 2069,
      'Feb-25': 2521,
      'Mar-25': 2601
    }
  },
  {
    id: '5',
    zone: 'Infrastructure',
    type: 'MC',
    name: 'Lifting Station 02',
    meterAccountNo: 'R52328',
    consumption: {
      'Apr-24': 44,
      'May-24': 0,
      'Jun-24': 0,
      'Jul-24': 0,
      'Aug-24': 153,
      'Sep-24': 125,
      'Oct-24': 0,
      'Nov-24': 0,
      'Dec-24': 0,
      'Jan-25': 0,
      'Feb-25': 0,
      'Mar-25': 0
    }
  },
  {
    id: '6',
    zone: 'Infrastructure',
    type: 'MC',
    name: 'Lifting Station 03',
    meterAccountNo: 'R52333',
    consumption: {
      'Apr-24': 198,
      'May-24': 269,
      'Jun-24': 122,
      'Jul-24': 203,
      'Aug-24': 208,
      'Sep-24': 257,
      'Oct-24': 196,
      'Nov-24': 91,
      'Dec-24': 185,
      'Jan-25': 28,
      'Feb-25': 40,
      'Mar-25': 58
    }
  },
  {
    id: '7',
    zone: 'Infrastructure',
    type: 'MC',
    name: 'Lifting Station 04',
    meterAccountNo: 'R52324',
    consumption: {
      'Apr-24': 644,
      'May-24': 865,
      'Jun-24': 791,
      'Jul-24': 768,
      'Aug-24': 747,
      'Sep-24': 723,
      'Oct-24': 628,
      'Nov-24': 686,
      'Dec-24': 631,
      'Jan-25': 701,
      'Feb-25': 638,
      'Mar-25': 572
    }
  },
  {
    id: '8',
    zone: 'Infrastructure',
    type: 'MC',
    name: 'Lifting Station 05',
    meterAccountNo: 'R52332',
    consumption: {
      'Apr-24': 2056,
      'May-24': 2577,
      'Jun-24': 2361,
      'Jul-24': 3016,
      'Aug-24': 3684,
      'Sep-24': 5866,
      'Oct-24': 1715,
      'Nov-24': 2413,
      'Dec-24': 2643,
      'Jan-25': 2873,
      'Feb-25': 3665,
      'Mar-25': 3069
    }
  },
  {
    id: '9',
    zone: 'Infrastructure',
    type: 'Irrigation',
    name: 'Irrigation Tank 01',
    meterAccountNo: 'R52324 (R52326)',
    consumption: {
      'Apr-24': 1543,
      'May-24': 2673,
      'Jun-24': 2763,
      'Jul-24': 2623,
      'Aug-24': 1467,
      'Sep-24': 1290,
      'Oct-24': 1244,
      'Nov-24': 1432,
      'Dec-24': 1268,
      'Jan-25': 1689,
      'Feb-25': 2214,
      'Mar-25': 1718
    }
  },
  {
    id: '10',
    zone: 'Infrastructure',
    type: 'Irrigation',
    name: 'Irrigation Tank 02',
    meterAccountNo: 'R52331',
    consumption: {
      'Apr-24': 1272,
      'May-24': 2839,
      'Jun-24': 3118,
      'Jul-24': 2330,
      'Aug-24': 2458,
      'Sep-24': 1875,
      'Oct-24': 893,
      'Nov-24': 974,
      'Dec-24': 1026,
      'Jan-25': 983,
      'Feb-25': 1124,
      'Mar-25': 1110
    }
  },
  {
    id: '11',
    zone: 'Infrastructure',
    type: 'Irrigation',
    name: 'Irrigation Tank 03',
    meterAccountNo: 'R52323',
    consumption: {
      'Apr-24': 894,
      'May-24': 866,
      'Jun-24': 1869,
      'Jul-24': 1543,
      'Aug-24': 1793,
      'Sep-24': 524,
      'Oct-24': 266,
      'Nov-24': 269,
      'Dec-24': 417,
      'Jan-25': 840,
      'Feb-25': 1009,
      'Mar-25': 845
    }
  },
  {
    id: '12',
    zone: 'Infrastructure',
    type: 'Irrigation',
    name: 'Irrigation Tank 04',
    meterAccountNo: 'R53195',
    consumption: {
      'Apr-24': 880,
      'May-24': 827,
      'Jun-24': 555,
      'Jul-24': 443,
      'Aug-24': 336,
      'Sep-24': 195,
      'Oct-24': 183,
      'Nov-24': 212,
      'Dec-24': 213,
      'Jan-25': 39.7,
      'Feb-25': 233.2,
      'Mar-25': 234.9
    }
  },
  {
    id: '13',
    zone: 'Infrastructure',
    type: 'Actuator',
    name: 'Actuator DB 01 (Z8)',
    meterAccountNo: 'R53196',
    consumption: {
      'Apr-24': 39,
      'May-24': 49,
      'Jun-24': 43,
      'Jul-24': 43,
      'Aug-24': 45,
      'Sep-24': 43,
      'Oct-24': 36,
      'Nov-24': 34,
      'Dec-24': 29,
      'Jan-25': 7.3,
      'Feb-25': 27.7,
      'Mar-25': 24.4
    }
  },
  {
    id: '14',
    zone: 'Infrastructure',
    type: 'Actuator',
    name: 'Actuator DB 02',
    meterAccountNo: 'R51900',
    consumption: {
      'Apr-24': 285,
      'May-24': 335,
      'Jun-24': 275,
      'Jul-24': 220,
      'Aug-24': 210,
      'Sep-24': 219,
      'Oct-24': 165,
      'Nov-24': 232,
      'Dec-24': 161,
      'Jan-25': 33,
      'Feb-25': 134,
      'Mar-25': 138.5
    }
  },
  {
    id: '15',
    zone: 'Infrastructure',
    type: 'Actuator',
    name: 'Actuator DB 03',
    meterAccountNo: 'R51904',
    consumption: {
      'Apr-24': 188,
      'May-24': 226,
      'Jun-24': 197,
      'Jul-24': 203,
      'Aug-24': 212,
      'Sep-24': 203,
      'Oct-24': 196,
      'Nov-24': 220,
      'Dec-24': 199,
      'Jan-25': 55.7,
      'Feb-25': 203.3,
      'Mar-25': 196
    }
  },
  {
    id: '16',
    zone: 'Infrastructure',
    type: 'Actuator',
    name: 'Actuator DB 04',
    meterAccountNo: 'R51901',
    consumption: {
      'Apr-24': 159,
      'May-24': 275,
      'Jun-24': 258,
      'Jul-24': 210,
      'Aug-24': 184,
      'Sep-24': 201,
      'Oct-24': 144,
      'Nov-24': 172,
      'Dec-24': 173,
      'Jan-25': 186,
      'Feb-25': 161,
      'Mar-25': 227
    }
  },
  {
    id: '17',
    zone: 'Infrastructure',
    type: 'Actuator',
    name: 'Actuator DB 05',
    meterAccountNo: 'R51907',
    consumption: {
      'Apr-24': 15,
      'May-24': 18,
      'Jun-24': 15,
      'Jul-24': 16,
      'Aug-24': 16,
      'Sep-24': 16,
      'Oct-24': 15,
      'Nov-24': 18,
      'Dec-24': 16,
      'Jan-25': 4.2,
      'Feb-25': 17.8,
      'Mar-25': 14
    }
  },
  {
    id: '18',
    zone: 'Infrastructure',
    type: 'Actuator',
    name: 'Actuator DB 06',
    meterAccountNo: 'R51909',
    consumption: {
      'Apr-24': 39,
      'May-24': 50,
      'Jun-24': 42,
      'Jul-24': 48,
      'Aug-24': 46,
      'Sep-24': 129,
      'Oct-24': 43,
      'Nov-24': 49,
      'Dec-24': 44,
      'Jan-25': 47,
      'Feb-25': 45,
      'Mar-25': 38
    }
  },
  {
    id: '19',
    zone: 'Infrastructure',
    type: 'Street Light',
    name: 'Street Light FP 01 (Z8)',
    meterAccountNo: 'R53197',
    consumption: {
      'Apr-24': 2773,
      'May-24': 3276,
      'Jun-24': 3268,
      'Jul-24': 3040,
      'Aug-24': 3203,
      'Sep-24': 3225,
      'Oct-24': 3064,
      'Nov-24': 3593,
      'Dec-24': 3147,
      'Jan-25': 787,
      'Feb-25': 3228,
      'Mar-25': 2663
    }
  },
  {
    id: '20',
    zone: 'Infrastructure',
    type: 'Street Light',
    name: 'Street Light FP 02',
    meterAccountNo: 'R51906',
    consumption: {
      'Apr-24': 1705,
      'May-24': 2076,
      'Jun-24': 1758,
      'Jul-24': 1738,
      'Aug-24': 1940,
      'Sep-24': 2006,
      'Oct-24': 1944,
      'Nov-24': 2361,
      'Dec-24': 2258,
      'Jan-25': 633,
      'Feb-25': 2298,
      'Mar-25': 1812
    }
  },
  {
    id: '21',
    zone: 'Infrastructure',
    type: 'Street Light',
    name: 'Street Light FP 03',
    meterAccountNo: 'R51905',
    consumption: {
      'Apr-24': 1399,
      'May-24': 1608,
      'Jun-24': 1365,
      'Jul-24': 1380,
      'Aug-24': 1457,
      'Sep-24': 1499,
      'Oct-24': 1561,
      'Nov-24': 2060,
      'Dec-24': 1966,
      'Jan-25': 1868,
      'Feb-25': 1974,
      'Mar-25': 1562
    }
  },
  {
    id: '22',
    zone: 'Infrastructure',
    type: 'Street Light',
    name: 'Street Light FP 04',
    meterAccountNo: 'R51908',
    consumption: {
      'Apr-24': 861,
      'May-24': 1045,
      'Jun-24': 1051,
      'Jul-24': 2268,
      'Aug-24': 2478,
      'Sep-24': 2513,
      'Oct-24': 2341,
      'Nov-24': 2299,
      'Dec-24': 1389,
      'Jan-25': 325,
      'Feb-25': 1406,
      'Mar-25': 1401
    }
  },
  {
    id: '23',
    zone: 'Infrastructure',
    type: 'Street Light',
    name: 'Street Light FP 05',
    meterAccountNo: 'R51902',
    consumption: {
      'Apr-24': 532,
      'May-24': 587,
      'Jun-24': 575,
      'Jul-24': 770,
      'Aug-24': 1341,
      'Sep-24': 1895,
      'Oct-24': 1844,
      'Nov-24': 1477,
      'Dec-24': 1121,
      'Jan-25': 449,
      'Feb-25': 2069.9,
      'Mar-25': 1870.1
    }
  },
  {
    id: '24',
    zone: 'Infrastructure',
    type: 'Building',
    name: 'Beachwell',
    meterAccountNo: 'R51903',
    consumption: {
      'Apr-24': 16908,
      'May-24': 46,
      'Jun-24': 19332,
      'Jul-24': 23170,
      'Aug-24': 42241,
      'Sep-24': 15223,
      'Oct-24': 25370,
      'Nov-24': 24383,
      'Dec-24': 37236,
      'Jan-25': 38168,
      'Feb-25': 18422,
      'Mar-25': 40
    }
  },
  {
    id: '25',
    zone: 'Infrastructure',
    type: 'Building',
    name: 'Helipad',
    meterAccountNo: 'R52334',
    consumption: {
      'Apr-24': 0,
      'May-24': 0,
      'Jun-24': 0,
      'Jul-24': 0,
      'Aug-24': 0,
      'Sep-24': 0,
      'Oct-24': 0,
      'Nov-24': 0,
      'Dec-24': 0,
      'Jan-25': 0,
      'Feb-25': 0,
      'Mar-25': 0
    }
  },
  {
    id: '26',
    zone: 'Central Park',
    type: 'Building',
    name: 'Central Park',
    meterAccountNo: 'R54672',
    consumption: {
      'Apr-24': 12208,
      'May-24': 21845,
      'Jun-24': 29438,
      'Jul-24': 28186,
      'Aug-24': 21995,
      'Sep-24': 20202,
      'Oct-24': 14900,
      'Nov-24': 9604,
      'Dec-24': 19032,
      'Jan-25': 22819,
      'Feb-25': 19974,
      'Mar-25': 14190
    }
  },
  {
    id: '27',
    zone: 'Ancilary',
    type: 'Building',
    name: 'Guard House',
    meterAccountNo: 'R53651',
    consumption: {
      'Apr-24': 823,
      'May-24': 1489,
      'Jun-24': 1573.6,
      'Jul-24': 1586.4,
      'Aug-24': 1325,
      'Sep-24': 1391,
      'Oct-24': 1205,
      'Nov-24': 1225,
      'Dec-24': 814,
      'Jan-25': 798,
      'Feb-25': 936,
      'Mar-25': 879
    }
  },
  {
    id: '28',
    zone: 'Ancilary',
    type: 'Building',
    name: 'Security Building',
    meterAccountNo: 'R53649',
    consumption: {
      'Apr-24': 3529,
      'May-24': 3898,
      'Jun-24': 4255,
      'Jul-24': 4359,
      'Aug-24': 3728,
      'Sep-24': 3676,
      'Oct-24': 3140,
      'Nov-24': 5702,
      'Dec-24': 5131,
      'Jan-25': 5559,
      'Feb-25': 5417,
      'Mar-25': 4504
    }
  },
  {
    id: '29',
    zone: 'Ancilary',
    type: 'Building',
    name: 'ROP Building',
    meterAccountNo: 'R53648',
    consumption: {
      'Apr-24': 2047,
      'May-24': 4442,
      'Jun-24': 3057,
      'Jul-24': 4321,
      'Aug-24': 4185,
      'Sep-24': 3554,
      'Oct-24': 3692,
      'Nov-24': 3581,
      'Dec-24': 2352,
      'Jan-25': 2090,
      'Feb-25': 2246,
      'Mar-25': 1939
    }
  },
  {
    id: '30',
    zone: 'Zone 3',
    type: 'Apartment',
    name: 'D 44',
    meterAccountNo: 'R53705',
    consumption: {
      'Apr-24': 463,
      'May-24': 2416,
      'Jun-24': 2036,
      'Jul-24': 2120,
      'Aug-24': 1645,
      'Sep-24': 1717,
      'Oct-24': 1643,
      'Nov-24': 1377,
      'Dec-24': 764,
      'Jan-25': 647,
      'Feb-25': 657,
      'Mar-25': 650
    }
  },
  {
    id: '31',
    zone: 'Zone 3',
    type: 'Apartment',
    name: 'D 45',
    meterAccountNo: 'R53665',
    consumption: {
      'Apr-24': 709,
      'May-24': 2944,
      'Jun-24': 1267,
      'Jul-24': 262,
      'Aug-24': 3212,
      'Sep-24': 1330,
      'Oct-24': 1570,
      'Nov-24': 1252,
      'Dec-24': 841,
      'Jan-25': 670,
      'Feb-25': 556,
      'Mar-25': 608
    }
  },
  {
    id: '32',
    zone: 'Zone 3',
    type: 'Apartment',
    name: 'D 46',
    meterAccountNo: 'R53700',
    consumption: {
      'Apr-24': 818,
      'May-24': 2392,
      'Jun-24': 1620,
      'Jul-24': 2216,
      'Aug-24': 1671,
      'Sep-24': 1718,
      'Oct-24': 1734,
      'Nov-24': 1577,
      'Dec-24': 890,
      'Jan-25': 724,
      'Feb-25': 690,
      'Mar-25': 752
    }
  },
  // Add a few more records to keep the list at a reasonable size
  {
    id: '51',
    zone: 'Retail',
    type: 'Commercial',
    name: 'Village Square',
    meterAccountNo: 'R56628',
    consumption: {
      'Apr-24': 2550,
      'May-24': 2550,
      'Jun-24': 0,
      'Jul-24': 0,
      'Aug-24': 8117,
      'Sep-24': 9087,
      'Oct-24': 4038,
      'Nov-24': 6229,
      'Dec-24': 3695,
      'Jan-25': 3304,
      'Feb-25': 3335,
      'Mar-25': 3383
    }
  },
  {
    id: '55',
    zone: 'Retail',
    type: 'Commercial',
    name: 'Bank Muscat',
    meterAccountNo: 'R9999',
    consumption: {
      'Apr-24': 0,
      'May-24': 0,
      'Jun-24': 0,
      'Jul-24': 3.49,
      'Aug-24': 70.89,
      'Sep-24': -2.39,
      'Oct-24': 1406.97,
      'Nov-24': 148,
      'Dec-24': 72,
      'Jan-25': 59,
      'Feb-25': 98,
      'Mar-25': 88
    }
  },
  {
    id: '56',
    zone: 'Retail',
    type: 'Commercial',
    name: 'CIF Kitchen',
    meterAccountNo: 'R8888',
    consumption: {
      'Apr-24': 0,
      'May-24': 0,
      'Jun-24': 0,
      'Jul-24': 17895,
      'Aug-24': 16532,
      'Sep-24': 18955,
      'Oct-24': 15071,
      'Nov-24': 16742,
      'Dec-24': 15554,
      'Jan-25': 16788,
      'Feb-25': 16154,
      'Mar-25': 14971
    }
  }
];

// Electricity rate per kWh
export const ELECTRICITY_RATE = 0.025; // OMR per kWh
