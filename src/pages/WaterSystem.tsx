import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';
import StandardPageLayout from '@/components/layout/StandardPageLayout';
import { Droplets } from 'lucide-react';

// Actual calculated data from our analysis
const actualData = {
  // Monthly metrics
  monthlyMetrics: {
    'Jan-25': {
      L1: 32580,
      L2: 35224,
      L3: 7900,
      DC: 19897
    },
    'Feb-25': {
      L1: 44043,
      L2: 36054,
      L3: 7274,
      DC: 21338
    },
    'Mar-25': {
      L1: 34915,
      L2: 11826,
      L3: 2118,
      DC: 7726
    },
    'Total': {
      L1: 111538,
      L2: 83104,
      L3: 17292,
      DC: 48961
    }
  },
  // Loss metrics
  lossMetrics: {
    'Jan-25': {
      stage1Loss: -2644,
      stage2Loss: 7427,
      totalLoss: 4783,
      stage1LossPercent: -8.12,
      totalLossPercent: 14.68,
      stage2LossPercent: 21.09
    },
    'Feb-25': {
      stage1Loss: 7989,
      stage2Loss: 7442,
      totalLoss: 15431,
      stage1LossPercent: 18.14,
      totalLossPercent: 35.04,
      stage2LossPercent: 20.64
    },
    'Mar-25': {
      stage1Loss: 23089,
      stage2Loss: 1982,
      totalLoss: 25071,
      stage1LossPercent: 66.13,
      totalLossPercent: 71.81,
      stage2LossPercent: 16.76
    },
    'Total': {
      stage1Loss: 28434,
      stage2Loss: 16851,
      totalLoss: 45285,
      stage1LossPercent: 25.49,
      totalLossPercent: 40.60,
      stage2LossPercent: 20.28
    }
  },
  // Zone metrics
  zoneMetrics: {
    'Zone_01_(FM)': {
      'Jan-25': {
        L2: 2008,
        L3: 2062,
        loss: -54,
        lossPercent: -2.69
      },
      'Feb-25': {
        L2: 1740,
        L3: 1832,
        loss: -92,
        lossPercent: -5.29
      },
      'Mar-25': {
        L2: 561,
        L3: 546,
        loss: 15,
        lossPercent: 2.67
      },
      'Total': {
        L2: 4309,
        L3: 4440,
        loss: -131,
        lossPercent: -3.04
      }
    },
    'Zone_03_(A)': {
      'Jan-25': {
        L2: 4235,
        L3: 1359,
        loss: 2876,
        lossPercent: 67.91
      },
      'Feb-25': {
        L2: 4273,
        L3: 1349,
        loss: 2924,
        lossPercent: 68.43
      },
      'Mar-25': {
        L2: 985,
        L3: 365,
        loss: 620,
        lossPercent: 62.94
      },
      'Total': {
        L2: 9493,
        L3: 3073,
        loss: 6420,
        lossPercent: 67.63
      }
    },
    'Zone_03_(B)': {
      'Jan-25': {
        L2: 3256,
        L3: 1713,
        loss: 1543,
        lossPercent: 47.39
      },
      'Feb-25': {
        L2: 2962,
        L3: 1451,
        loss: 1511,
        lossPercent: 51.01
      },
      'Mar-25': {
        L2: 699,
        L3: 336,
        loss: 363,
        lossPercent: 51.93
      },
      'Total': {
        L2: 6917,
        L3: 3500,
        loss: 3417,
        lossPercent: 49.40
      }
    },
    'Zone_05': {
      'Jan-25': {
        L2: 4267,
        L3: 1254,
        loss: 3013,
        lossPercent: 70.61
      },
      'Feb-25': {
        L2: 4231,
        L3: 1233,
        loss: 2998,
        lossPercent: 70.86
      },
      'Mar-25': {
        L2: 1243,
        L3: 294,
        loss: 949,
        lossPercent: 76.35
      },
      'Total': {
        L2: 9741,
        L3: 2781,
        loss: 6960,
        lossPercent: 71.45
      }
    },
    'Zone_08': {
      'Jan-25': {
        L2: 1547,
        L3: 1477,
        loss: 70,
        lossPercent: 4.52
      },
      'Feb-25': {
        L2: 1498,
        L3: 1379,
        loss: 119,
        lossPercent: 7.94
      },
      'Mar-25': {
        L2: 609,
        L3: 563,
        loss: 46,
        lossPercent: 7.55
      },
      'Total': {
        L2: 3654,
        L3: 3419,
        loss: 235,
        lossPercent: 6.43
      }
    },
    'Zone_VS': {
      'Jan-25': {
        L2: 14,
        L3: 35,
        loss: -21,
        lossPercent: -150.00
      },
      'Feb-25': {
        L2: 12,
        L3: 28,
        loss: -16,
        lossPercent: -133.33
      },
      'Mar-25': {
        L2: 3,
        L3: 13,
        loss: -10,
        lossPercent: -333.33
      },
      'Total': {
        L2: 29,
        L3: 76,
        loss: -47,
        lossPercent: -162.07
      }
    }
  },
  // Type consumption breakdown
  typeBreakdown: [{
    type: 'Retail',
    value: 52354,
    percentage: 79.02,
    color: '#3182CE'
  }, {
    type: 'Residential (Villa)',
    value: 9912,
    percentage: 14.96,
    color: '#63B3ED'
  }, {
    type: 'Residential (Apart)',
    value: 2712,
    percentage: 4.09,
    color: '#90CDF4'
  }, {
    type: 'IRR_Servies',
    value: 585,
    percentage: 0.88,
    color: '#BEE3F8'
  }, {
    type: 'MB_Common',
    value: 353,
    percentage: 0.53,
    color: '#EBF8FF'
  }, {
    type: 'Building',
    value: 143,
    percentage: 0.22,
    color: '#4299E1'
  }, {
    type: 'D_Building_Common',
    value: 38,
    percentage: 0.06,
    color: '#E2E8F0'
  }],
  // Detailed consumer data by zone (sample data based on screenshots)
  consumerDetails: {
    'Zone_01_(FM)': [{
      acctNum: '4300298',
      meterLabel: 'Building Taxi',
      parent: 'ZONE FM ( BULK ZONE FM )',
      consumption: 31,
      type: 'Retail'
    }, {
      acctNum: '4300300',
      meterLabel: 'Building B1',
      parent: 'ZONE FM ( BULK ZONE FM )',
      consumption: 523,
      type: 'Retail'
    }, {
      acctNum: '4300301',
      meterLabel: 'Building B2',
      parent: 'ZONE FM ( BULK ZONE FM )',
      consumption: 511,
      type: 'Retail'
    }, {
      acctNum: '4300302',
      meterLabel: 'Building B3',
      parent: 'ZONE FM ( BULK ZONE FM )',
      consumption: 373,
      type: 'Retail'
    }, {
      acctNum: '4300303',
      meterLabel: 'Building B4',
      parent: 'ZONE FM ( BULK ZONE FM )',
      consumption: 255,
      type: 'Retail'
    }, {
      acctNum: '4300304',
      meterLabel: 'Building B5',
      parent: 'ZONE FM ( BULK ZONE FM )',
      consumption: 3,
      type: 'Retail'
    }, {
      acctNum: '4300305',
      meterLabel: 'Building B6',
      parent: 'ZONE FM ( BULK ZONE FM )',
      consumption: 576,
      type: 'Retail'
    }, {
      acctNum: '4300306',
      meterLabel: 'Building B7',
      parent: 'ZONE FM ( BULK ZONE FM )',
      consumption: 421,
      type: 'Retail'
    }, {
      acctNum: '4300307',
      meterLabel: 'Building B8',
      parent: 'ZONE FM ( BULK ZONE FM )',
      consumption: 586,
      type: 'Retail'
    }, {
      acctNum: '4300324',
      meterLabel: 'Building CIF/CB',
      parent: 'ZONE FM ( BULK ZONE FM )',
      consumption: 841,
      type: 'Retail'
    }, {
      acctNum: '4300325',
      meterLabel: 'Building Nursery Building',
      parent: 'ZONE FM ( BULK ZONE FM )',
      consumption: 10,
      type: 'Retail'
    }, {
      acctNum: '4300337',
      meterLabel: 'Cabinet FM (CONTRACTORS OFFICE)',
      parent: 'ZONE FM ( BULK ZONE FM )',
      consumption: 143,
      type: 'Building'
    }, {
      acctNum: '4300296',
      meterLabel: 'Building FM',
      parent: 'ZONE FM ( BULK ZONE FM )',
      consumption: 84,
      type: 'MB_Common'
    }, {
      acctNum: '4300309',
      meterLabel: 'Room PUMP (FIRE)',
      parent: 'ZONE FM ( BULK ZONE FM )',
      consumption: 78,
      type: 'MB_Common'
    }, {
      acctNum: '4300310',
      meterLabel: 'Building (MEP)',
      parent: 'ZONE FM ( BULK ZONE FM )',
      consumption: 5,
      type: 'MB_Common'
    }],
    'Zone_03_(A)': [{
      acctNum: '4300002',
      meterLabel: 'Z3-42 (Villa)',
      parent: 'ZONE 3A (BULK ZONE 3A)',
      consumption: 82,
      type: 'Residential (Villa)'
    }, {
      acctNum: '4300005',
      meterLabel: 'Z3-38 (Villa)',
      parent: 'ZONE 3A (BULK ZONE 3A)',
      consumption: 19,
      type: 'Residential (Villa)'
    }, {
      acctNum: '4300007',
      meterLabel: 'Z3-46(3A) (Building)',
      parent: 'D-46 Building Bulk Meter',
      consumption: 78,
      type: 'Residential (Apart)'
    }, {
      acctNum: '4300010',
      meterLabel: 'Z3-049(4) (Building)',
      parent: 'D-49 Building Bulk Meter',
      consumption: 13,
      type: 'Residential (Apart)'
    }, {
      acctNum: '4300034',
      meterLabel: 'Z3-44(5) (Building)',
      parent: 'D-44 Building Bulk Meter',
      consumption: 288,
      type: 'Residential (Apart)'
    }, {
      acctNum: '4300035',
      meterLabel: 'Z3-44(6) (Building)',
      parent: 'D-44 Building Bulk Meter',
      consumption: 79,
      type: 'Residential (Apart)'
    }, {
      acctNum: '4300044',
      meterLabel: 'Z3-41 (Villa)',
      parent: 'ZONE 3A (BULK ZONE 3A)',
      consumption: 37,
      type: 'Residential (Villa)'
    }, {
      acctNum: '4300049',
      meterLabel: 'Z3-37 (Villa)',
      parent: 'ZONE 3A (BULK ZONE 3A)',
      consumption: 42,
      type: 'Residential (Villa)'
    }, {
      acctNum: '4300050',
      meterLabel: 'Z3-43 (Villa)',
      parent: 'ZONE 3A (BULK ZONE 3A)',
      consumption: 154,
      type: 'Residential (Villa)'
    }, {
      acctNum: '4300052',
      meterLabel: 'Z3-31 (Villa)',
      parent: 'ZONE 3A (BULK ZONE 3A)',
      consumption: 328,
      type: 'Residential (Villa)'
    }, {
      acctNum: '4300075',
      meterLabel: 'Z3-35 (Villa)',
      parent: 'ZONE 3A (BULK ZONE 3A)',
      consumption: 140,
      type: 'Residential (Villa)'
    }, {
      acctNum: '4300082',
      meterLabel: 'Z3-33 (Villa)',
      parent: 'ZONE 3A (BULK ZONE 3A)',
      consumption: 101,
      type: 'Residential (Villa)'
    }, {
      acctNum: '4300084',
      meterLabel: 'Z3-36 (Villa)',
      parent: 'ZONE 3A (BULK ZONE 3A)',
      consumption: 184,
      type: 'Residential (Villa)'
    }, {
      acctNum: '4300085',
      meterLabel: 'Z3-32 (Villa)',
      parent: 'ZONE 3A (BULK ZONE 3A)',
      consumption: 86,
      type: 'Residential (Villa)'
    }, {
      acctNum: '4300086',
      meterLabel: 'Z3-39 (Villa)',
      parent: 'ZONE 3A (BULK ZONE 3A)',
      consumption: 83,
      type: 'Residential (Villa)'
    }],
    'Zone_05': [{
      acctNum: '4300001',
      meterLabel: 'Z5-17',
      parent: 'ZONE 5 (Bulk Zone 5)',
      consumption: 219,
      type: 'Residential (Villa)'
    }, {
      acctNum: '4300058',
      meterLabel: 'Z5-13',
      parent: 'ZONE 5 (Bulk Zone 5)',
      consumption: 206,
      type: 'Residential (Villa)'
    }, {
      acctNum: '4300059',
      meterLabel: 'Z5-14',
      parent: 'ZONE 5 (Bulk Zone 5)',
      consumption: 164,
      type: 'Residential (Villa)'
    }, {
      acctNum: '4300147',
      meterLabel: 'Z5-30',
      parent: 'ZONE 5 (Bulk Zone 5)',
      consumption: 178,
      type: 'Residential (Villa)'
    }, {
      acctNum: '4300149',
      meterLabel: 'Z5-10',
      parent: 'ZONE 5 (Bulk Zone 5)',
      consumption: 37,
      type: 'Residential (Villa)'
    }, {
      acctNum: '4300150',
      meterLabel: 'Z5-4',
      parent: 'ZONE 5 (Bulk Zone 5)',
      consumption: 184,
      type: 'Residential (Villa)'
    }, {
      acctNum: '4300152',
      meterLabel: 'Z5 020',
      parent: 'ZONE 5 (Bulk Zone 5)',
      consumption: 95,
      type: 'Residential (Villa)'
    }, {
      acctNum: '4300154',
      meterLabel: 'Z5-15',
      parent: 'ZONE 5 (Bulk Zone 5)',
      consumption: 59,
      type: 'Residential (Villa)'
    }, {
      acctNum: '4300155',
      meterLabel: 'Z5-9',
      parent: 'ZONE 5 (Bulk Zone 5)',
      consumption: 100,
      type: 'Residential (Villa)'
    }, {
      acctNum: '4300156',
      meterLabel: 'Z5-26',
      parent: 'ZONE 5 (Bulk Zone 5)',
      consumption: 105,
      type: 'Residential (Villa)'
    }, {
      acctNum: '4300157',
      meterLabel: 'Z5-25',
      parent: 'ZONE 5 (Bulk Zone 5)',
      consumption: 63,
      type: 'Residential (Villa)'
    }, {
      acctNum: '4300158',
      meterLabel: 'Z5-31',
      parent: 'ZONE 5 (Bulk Zone 5)',
      consumption: 61,
      type: 'Residential (Villa)'
    }, {
      acctNum: '4300160',
      meterLabel: 'Z5-29',
      parent: 'ZONE 5 (Bulk Zone 5)',
      consumption: 120,
      type: 'Residential (Villa)'
    }, {
      acctNum: '4300162',
      meterLabel: 'Z5-32',
      parent: 'ZONE 5 (Bulk Zone 5)',
      consumption: 199,
      type: 'Residential (Villa)'
    }, {
      acctNum: '4300163',
      meterLabel: 'Z5-22',
      parent: 'ZONE 5 (Bulk Zone 5)',
      consumption: 104,
      type: 'Residential (Villa)'
    }],
    'Zone_08': [{
      acctNum: '4300196',
      meterLabel: 'Z8-12',
      parent: 'BULK ZONE 8',
      consumption: 509,
      type: 'Residential (Villa)'
    }, {
      acctNum: '4300198',
      meterLabel: 'Z8-15',
      parent: 'BULK ZONE 8',
      consumption: 182,
      type: 'Residential (Villa)'
    }, {
      acctNum: '4300199',
      meterLabel: 'Z8-16',
      parent: 'BULK ZONE 8',
      consumption: 161,
      type: 'Residential (Villa)'
    }, {
      acctNum: '4300200',
      meterLabel: 'Z8-17',
      parent: 'BULK ZONE 8',
      consumption: 380,
      type: 'Residential (Villa)'
    }, {
      acctNum: '4300287',
      meterLabel: 'Z8-5',
      parent: 'BULK ZONE 8',
      consumption: 643,
      type: 'Residential (Villa)'
    }, {
      acctNum: '4300288',
      meterLabel: 'Z8-9',
      parent: 'BULK ZONE 8',
      consumption: 20,
      type: 'Residential (Villa)'
    }, {
      acctNum: '4300289',
      meterLabel: 'Z8-18',
      parent: 'BULK ZONE 8',
      consumption: 291,
      type: 'Residential (Villa)'
    }, {
      acctNum: '4300290',
      meterLabel: 'Z8-19',
      parent: 'BULK ZONE 8',
      consumption: 235,
      type: 'Residential (Villa)'
    }, {
      acctNum: '4300291',
      meterLabel: 'Z8-20',
      parent: 'BULK ZONE 8',
      consumption: 335,
      type: 'Residential (Villa)'
    }, {
      acctNum: '4300292',
      meterLabel: 'Z8-21',
      parent: 'BULK ZONE 8',
      consumption: 217,
      type: 'Residential (Villa)'
    }, {
      acctNum: '4300293',
      meterLabel: 'Z8-22',
      parent: 'BULK ZONE 8',
      consumption: 441,
      type: 'Residential (Villa)'
    }],
    'Zone_03_(B)': [{
      acctNum: '4300009',
      meterLabel: 'Z3-21 (Villa)',
      parent: 'ZONE 3B (BULK ZONE 3B)',
      consumption: 105,
      type: 'Residential (Villa)'
    }, {
      acctNum: '4300020',
      meterLabel: 'Z3-20 (Villa)',
      parent: 'ZONE 3B (BULK ZONE 3B)',
      consumption: 29,
      type: 'Residential (Villa)'
    }, {
      acctNum: '4300025',
      meterLabel: 'Z3-13 (Villa)',
      parent: 'ZONE 3B (BULK ZONE 3B)',
      consumption: 46,
      type: 'Residential (Villa)'
    }, {
      acctNum: '4300057',
      meterLabel: 'Z3-15 (Villa)',
      parent: 'ZONE 3B (BULK ZONE 3B)',
      consumption: 91,
      type: 'Residential (Villa)'
    }, {
      acctNum: '4300060',
      meterLabel: 'Z3-14 (Villa)',
      parent: 'ZONE 3B (BULK ZONE 3B)',
      consumption: 274,
      type: 'Residential (Villa)'
    }, {
      acctNum: '4300076',
      meterLabel: 'Z3-12 (Villa)',
      parent: 'ZONE 3B (BULK ZONE 3B)',
      consumption: 145,
      type: 'Residential (Villa)'
    }, {
      acctNum: '4300078',
      meterLabel: 'Z3-4 (Villa)',
      parent: 'ZONE 3B (BULK ZONE 3B)',
      consumption: 161,
      type: 'Residential (Villa)'
    }, {
      acctNum: '4300083',
      meterLabel: 'Z3-18 (Villa)',
      parent: 'ZONE 3B (BULK ZONE 3B)',
      consumption: 80,
      type: 'Residential (Villa)'
    }, {
      acctNum: '4300088',
      meterLabel: 'Z3-3 (Villa)',
      parent: 'ZONE 3B (BULK ZONE 3B)',
      consumption: 139,
      type: 'Residential (Villa)'
    }, {
      acctNum: '4300090',
      meterLabel: 'Z3-7 (Villa)',
      parent: 'ZONE 3B (BULK ZONE 3B)',
      consumption: 96,
      type: 'Residential (Villa)'
    }, {
      acctNum: '4300092',
      meterLabel: 'Z3-10 (Villa)',
      parent: 'ZONE 3B (BULK ZONE 3B)',
      consumption: 175,
      type: 'Residential (Villa)'
    }, {
      acctNum: '4300096',
      meterLabel: 'Z3-9 (Villa)',
      parent: 'ZONE 3B (BULK ZONE 3B)',
      consumption: 129,
      type: 'Residential (Villa)'
    }, {
      acctNum: '4300099',
      meterLabel: 'Z3-19 (Villa)',
      parent: 'ZONE 3B (BULK ZONE 3B)',
      consumption: 145,
      type: 'Residential (Villa)'
    }, {
      acctNum: '4300100',
      meterLabel: 'Z3-6 (Villa)',
      parent: 'ZONE 3B (BULK ZONE 3B)',
      consumption: 69,
      type: 'Residential (Villa)'
    }, {
      acctNum: '4300102',
      meterLabel: 'Z3-22 (Villa)',
      parent: 'ZONE 3B (BULK ZONE 3B)',
      consumption: 62,
      type: 'Residential (Villa)'
    }],
    'Zone_VS': [{
      acctNum: '4300327',
      meterLabel: 'Coffee 1 (GF Shop No.591)',
      parent: 'Village Square (Zone Bulk)',
      consumption: 3,
      type: 'Retail'
    }, {
      acctNum: '4300329',
      meterLabel: 'Coffee 2 (GF Shop No.594 A)',
      parent: 'Village Square (Zone Bulk)',
      consumption: 7,
      type: 'Retail'
    }, {
      acctNum: '4300330',
      meterLabel: 'Supermarket (FF Shop No.591)',
      parent: 'Village Square (Zone Bulk)',
      consumption: 0,
      type: 'Retail'
    }, {
      acctNum: '4300331',
      meterLabel: 'Pharmacy (FF Shop No.591 A)',
      parent: 'Village Square (Zone Bulk)',
      consumption: 0,
      type: 'Retail'
    }, {
      acctNum: '4300332',
      meterLabel: 'Laundry Services (FF Shop No.593)',
      parent: 'Village Square (Zone Bulk)',
      consumption: 66,
      type: 'Retail'
    }],
    'Direct Connection': [{
      acctNum: '4300295',
      meterLabel: 'Sales Center Common Building',
      parent: 'Main Bulk (NAMA)',
      consumption: 156,
      type: 'Zone Bulk'
    }, {
      acctNum: '4300297',
      meterLabel: 'Building (Security)',
      parent: 'Main Bulk (NAMA)',
      consumption: 39,
      type: 'MB_Common'
    }, {
      acctNum: '4300299',
      meterLabel: 'Building (ROP)',
      parent: 'Main Bulk (NAMA)',
      consumption: 52,
      type: 'MB_Common'
    }, {
      acctNum: '4300334',
      meterLabel: 'Hotel Main Building',
      parent: 'Main Bulk (NAMA)',
      consumption: 44384,
      type: 'Retail'
    }, {
      acctNum: '4300336',
      meterLabel: 'Community Mgmt - Technical Zone, STP',
      parent: 'Main Bulk (NAMA)',
      consumption: 74,
      type: 'MB_Common'
    }, {
      acctNum: '4300338',
      meterLabel: 'PHASE 02, MAIN ENTRANCE (Infrastructure)',
      parent: 'Main Bulk (NAMA)',
      consumption: 21,
      type: 'MB_Common'
    }, {
      acctNum: '4300341',
      meterLabel: 'Irrigation- Controller DOWN',
      parent: 'Main Bulk (NAMA)',
      consumption: 474,
      type: 'IRR_Servies'
    }, {
      acctNum: '4300347',
      meterLabel: 'Al Adrak Construction',
      parent: 'Main Bulk (NAMA)',
      consumption: 2099,
      type: 'Retail'
    }, {
      acctNum: '4300348',
      meterLabel: 'Al Adrak Camp',
      parent: 'Main Bulk (NAMA)',
      consumption: 1662,
      type: 'Retail'
    }]
  },
  parentMeters: {
    'ZONE FM ( BULK ZONE FM )': {
      acctNum: '4300346',
      zone: 'Zone_01_(FM)',
      label: 'L2'
    },
    'ZONE 3A (BULK ZONE 3A)': {
      acctNum: '4300343',
      zone: 'Zone_03_(A)',
      label: 'L2'
    },
    'ZONE 3B (BULK ZONE 3B)': {
      acctNum: '4300344',
      zone: 'Zone_03_(B)',
      label: 'L2'
    },
    'ZONE 5 (Bulk Zone 5)': {
      acctNum: '4300345',
      zone: 'Zone_05',
      label: 'L2'
    },
    'BULK ZONE 8': {
      acctNum: '4300342',
      zone: 'Zone_08',
      label: 'L2'
    },
    'Village Square (Zone Bulk)': {
      acctNum: '4300335',
      zone: 'Zone_VS',
      label: 'L2'
    },
    'Main Bulk (NAMA)': {
      acctNum: 'C43659',
      zone: 'Main Bulk',
      label: 'L1'
    },
    'D-46 Building Bulk Meter': {
      acctNum: '4300138',
      zone: 'Zone_03_(A)',
      label: 'L3'
    },
    'D-49 Building Bulk Meter': {
      acctNum: '4300140',
      zone: 'Zone_03_(A)',
      label: 'L3'
    },
    'D-44 Building Bulk Meter': {
      acctNum: '4300144',
      zone: 'Zone_03_(A)',
      label: 'L3'
    }
  }
};

// Define color constants
const COLORS = {
  primary: '#3182CE',
  secondary: '#38B2AC',
  accent: '#805AD5',
  warning: '#DD6B20',
  danger: '#E53E3E',
  success: '#38A169',
  gradientStart: '#4299E1',
  gradientEnd: '#319795'
};

// Utility functions
const formatNumber = num => {
  return new Intl.NumberFormat('en-US').format(num);
};
const formatPercent = num => {
  if (num === undefined || num === null || isNaN(num)) {
    return "0.00%";
  }
  return `${Number(num).toFixed(2)}%`;
};

// Custom tooltip for charts
const CustomTooltip = ({
  active,
  payload,
  label
}) => {
  if (active && payload && payload.length) {
    return <div className="bg-white p-4 border border-gray-200 rounded shadow-lg">
        <p className="font-bold text-gray-700">{label}</p>
        {payload.map((entry, index) => <p key={index} style={{
        color: entry.color || entry.fill
      }}>
            {`${entry.name}: ${entry.value.toLocaleString()} m³`}
          </p>)}
      </div>;
  }
  return null;
};

// Gauge Chart Component for circular progress indicators
const GaugeChart = ({
  value,
  max,
  label,
  color,
  percentage,
  size = 'large'
}) => {
  const strokeWidth = size === 'large' ? 10 : 8;
  const radius = size === 'large' ? 70 : 50;
  const fontSize = size === 'large' ? 'text-4xl' : 'text-2xl';
  const labelSize = size === 'large' ? 'text-sm' : 'text-xs';
  return <div className="flex flex-col items-center justify-center">
      <div className="relative">
        <svg width={radius * 2 + strokeWidth} height={radius * 2 + strokeWidth} viewBox={`0 0 ${radius * 2 + strokeWidth} ${radius * 2 + strokeWidth}`}>
          <circle cx={radius + strokeWidth / 2} cy={radius + strokeWidth / 2} r={radius} fill="none" stroke="#E2E8F0" strokeWidth={strokeWidth} />
          <circle cx={radius + strokeWidth / 2} cy={radius + strokeWidth / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth} strokeDasharray={2 * Math.PI * radius} strokeDashoffset={2 * Math.PI * radius * (1 - Math.min(1, value / max))} strokeLinecap="round" transform={`rotate(-90 ${radius + strokeWidth / 2} ${radius + strokeWidth / 2})`} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`${fontSize} font-bold`}>{formatNumber(value)}</span>
          {percentage !== undefined && <span className="text-xs">{formatPercent(percentage)}</span>}
        </div>
      </div>
      <span className={`${labelSize} font-medium text-gray-500 mt-2`}>{label}</span>
    </div>;
};

// Progress bar component
const ProgressBar = ({
  value,
  max,
  label,
  color
}) => {
  const percentage = Math.min(100, value / max * 100);
  return <div className="w-full">
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-medium text-gray-700">{formatNumber(value)} m³</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div className="h-2.5 rounded-full" style={{
        width: `${percentage}%`,
        backgroundColor: color
      }}></div>
      </div>
    </div>;
};

// Dashboard Component
const Dashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('Total');
  const [selectedZone, setSelectedZone] = useState('Zone_01_(FM)');
  const [activeTab, setActiveTab] = useState('overview');
  const [showParentDetails, setShowParentDetails] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({
    key: 'consumption',
    direction: 'desc'
  });

  // Memoized data processing based on selectedPeriod
  const currentData = useMemo(() => {
    // Get KPIs for the selected period
    const kpis = {
      totalSupply: actualData.monthlyMetrics[selectedPeriod].L1,
      totalConsumption: actualData.monthlyMetrics[selectedPeriod].L3 + actualData.monthlyMetrics[selectedPeriod].DC,
      totalLossPercent: actualData.lossMetrics[selectedPeriod].totalLossPercent,
      stage1LossPercent: actualData.lossMetrics[selectedPeriod].stage1LossPercent,
      stage2LossPercent: actualData.lossMetrics[selectedPeriod].stage2LossPercent
    };

    // Get consumption trend data
    const monthlyData = Object.keys(actualData.monthlyMetrics).filter(month => month !== 'Total').map(month => ({
      month,
      Supply: actualData.monthlyMetrics[month].L1,
      Consumption: actualData.monthlyMetrics[month].L3 + actualData.monthlyMetrics[month].DC,
      Loss: actualData.lossMetrics[month].totalLoss
    }));

    // Top loss zones for the selected period
    const topLossZones = Object.entries(actualData.zoneMetrics).map(([zone, metrics]) => ({
      zone,
      lossPercent: metrics[selectedPeriod].lossPercent,
      loss: metrics[selectedPeriod].loss
    })).sort((a, b) => b.lossPercent - a.lossPercent).filter(zone => zone.lossPercent > 0); // Only show zones with positive loss

    // Zone details for all zones in the selected period
    const zoneDetails = Object.entries(actualData.zoneMetrics).reduce((acc, [zone, metrics]) => {
      acc[zone] = {
        l2Reading: metrics[selectedPeriod].L2,
        l3Sum: metrics[selectedPeriod].L3,
        loss: metrics[selectedPeriod].loss,
        lossPercent: metrics[selectedPeriod].lossPercent
      };
      return acc;
    }, {});

    // Calculate loss metrics for the chart
    const lossData = {
      stage1Loss: actualData.lossMetrics[selectedPeriod].stage1Loss,
      stage2Loss: actualData.lossMetrics[selectedPeriod].stage2Loss,
      totalLoss: actualData.lossMetrics[selectedPeriod].totalLoss,
      stage1LossPercent: actualData.lossMetrics[selectedPeriod].stage1LossPercent,
      stage2LossPercent: actualData.lossMetrics[selectedPeriod].stage2LossPercent,
      totalLossPercent: actualData.lossMetrics[selectedPeriod].totalLossPercent
    };
    return {
      kpis,
      monthlyData,
      topLossZones,
      zoneDetails,
      lossData,
      typeBreakdown: actualData.typeBreakdown,
      consumerDetails: actualData.consumerDetails
    };
  }, [selectedPeriod]);

  // Filter and sort consumer details
  const filteredConsumerDetails = useMemo(() => {
    if (!currentData.consumerDetails[selectedZone]) return [];
    const filtered = currentData.consumerDetails[selectedZone].filter(item => item.meterLabel.toLowerCase().includes(searchTerm.toLowerCase()) || item.acctNum.toLowerCase().includes(searchTerm.toLowerCase()) || item.parent.toLowerCase().includes(searchTerm.toLowerCase()) || item.type.toLowerCase().includes(searchTerm.toLowerCase()));

    // Sort the filtered data
    return [...filtered].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [currentData.consumerDetails, selectedZone, searchTerm, sortConfig]);

  // Group consumers by parent meter
  const consumersByParent = useMemo(() => {
    const grouped = {};
    if (currentData.consumerDetails[selectedZone]) {
      currentData.consumerDetails[selectedZone].forEach(consumer => {
        if (!grouped[consumer.parent]) {
          grouped[consumer.parent] = [];
        }
        grouped[consumer.parent].push(consumer);
      });
    }
    return grouped;
  }, [currentData.consumerDetails, selectedZone]);

  // Function to determine color based on loss percentage
  const getLossColor = lossPercent => {
    if (lossPercent < 0) return COLORS.success; // Negative loss (gain) is good
    if (lossPercent < 5) return COLORS.success;
    if (lossPercent < 20) return COLORS.secondary;
    if (lossPercent < 40) return COLORS.warning;
    return COLORS.danger;
  };

  // Function to sort table
  const requestSort = key => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({
      key,
      direction
    });
  };

  // Simple animation for value display
  const AnimatedValue = ({
    value,
    formatter,
    className
  }) => {
    const [displayValue, setDisplayValue] = useState(0);
    useEffect(() => {
      const timer = setTimeout(() => {
        setDisplayValue(value);
      }, 300);
      return () => clearTimeout(timer);
    }, [value]);
    return <span className={className}>
        {formatter ? formatter(displayValue) : displayValue}
      </span>;
  };

  // KPI Card Component
  const KpiCard = ({
    title,
    value,
    formatter,
    color,
    icon,
    trend
  }) => {
    return <div className="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-opacity-20 rounded-md p-3" style={{
            backgroundColor: `${color}20`
          }}>
              {icon && <span className="text-2xl" style={{
              color
            }}>{icon}</span>}
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
                <dd>
                  <div className="text-xl font-semibold text-gray-900">
                    <AnimatedValue value={value} formatter={formatter} />
                  </div>
                </dd>
              </dl>
            </div>
          </div>
          {trend && <div className="mt-3 text-sm">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${trend.value >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
              </span>
            </div>}
        </div>
      </div>;
  };
  return <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-teal-500 text-white shadow-md">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 bg-[4e4456] bg-[#484150]">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Muscat Bay Water Monitoring</h1>
              <p className="text-blue-100">Dashboard overview of water consumption and losses</p>
            </div>
            <div className="flex space-x-2">
              <select className="bg-white bg-opacity-20 rounded border border-blue-300 text-white px-3 py-1" value={selectedPeriod} onChange={e => setSelectedPeriod(e.target.value)}>
                <option value="Total">Total (Q1 2025)</option>
                <option value="Jan-25">January 2025</option>
                <option value="Feb-25">February 2025</option>
                <option value="Mar-25">March 2025</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button className={`px-3 py-4 text-sm font-medium border-b-2 ${activeTab === 'overview' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`} onClick={() => setActiveTab('overview')}>
              Overview
            </button>
            <button className={`px-3 py-4 text-sm font-medium border-b-2 ${activeTab === 'zones' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`} onClick={() => setActiveTab('zones')}>
              Zone Analysis
            </button>
            <button className={`px-3 py-4 text-sm font-medium border-b-2 ${activeTab === 'losses' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`} onClick={() => setActiveTab('losses')}>
              Loss Analysis
            </button>
            <button className={`px-3 py-4 text-sm font-medium border-b-2 ${activeTab === 'consumption' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`} onClick={() => setActiveTab('consumption')}>
              Consumption Patterns
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Overview Dashboard */}
        {activeTab === 'overview' && <div className="space-y-6">
            {/* KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <KpiCard title="Total Water Supply" value={currentData.kpis.totalSupply} formatter={formatNumber} color={COLORS.primary} icon="💧" />
              <KpiCard title="Total Consumption" value={currentData.kpis.totalConsumption} formatter={formatNumber} color={COLORS.secondary} icon="🚰" />
              <KpiCard title="Total Loss (NRW)" value={currentData.kpis.totalLossPercent} formatter={formatPercent} color={getLossColor(currentData.kpis.totalLossPercent)} icon="📉" />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Consumption Trend Chart */}
              <div className="bg-white rounded-xl shadow-md p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Consumption Trend (Q1 2025)</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={currentData.monthlyData} margin={{
                  top: 10,
                  right: 30,
                  left: 0,
                  bottom: 0
                }}>
                      <defs>
                        <linearGradient id="colorSupply" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8} />
                          <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0.1} />
                        </linearGradient>
                        <linearGradient id="colorConsumption" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.secondary} stopOpacity={0.8} />
                          <stop offset="95%" stopColor={COLORS.secondary} stopOpacity={0.1} />
                        </linearGradient>
                        <linearGradient id="colorLoss" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.danger} stopOpacity={0.8} />
                          <stop offset="95%" stopColor={COLORS.danger} stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Area type="monotone" dataKey="Supply" stroke={COLORS.primary} fillOpacity={1} fill="url(#colorSupply)" />
                      <Area type="monotone" dataKey="Consumption" stroke={COLORS.secondary} fillOpacity={1} fill="url(#colorConsumption)" />
                      <Area type="monotone" dataKey="Loss" stroke={COLORS.danger} fillOpacity={1} fill="url(#colorLoss)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Type Breakdown Pie Chart */}
              <div className="bg-white rounded-xl shadow-md p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Consumption by Type</h3>
                <div className="h-72 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={currentData.typeBreakdown} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value" nameKey="type" label={({
                    name,
                    percent
                  }) => `${name}: ${(percent * 100).toFixed(1)}%`}>
                        {currentData.typeBreakdown.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={value => formatNumber(value) + ' m³'} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Zone Loss Overview */}
            <div className="bg-white rounded-xl shadow-md p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Water Loss by Zone for {selectedPeriod}</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={Object.entries(currentData.zoneDetails).map(([zone, data]) => ({
                zone,
                lossPercentage: data.lossPercent,
                loss: data.loss
              }))} margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5
              }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="zone" />
                    <YAxis yAxisId="left" orientation="left" stroke={COLORS.primary} />
                    <YAxis yAxisId="right" orientation="right" stroke={COLORS.danger} />
                    <Tooltip content={<CustomTooltip />} formatter={(value, name) => [name === 'loss' ? `${formatNumber(value)} m³` : `${value.toFixed(2)}%`, name === 'loss' ? 'Loss Volume' : 'Loss Percentage']} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="loss" name="Loss Volume (m³)" fill={COLORS.primary} />
                    <Bar yAxisId="right" dataKey="lossPercentage" name="Loss Percentage (%)" fill={COLORS.danger} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>}

        {/* Zone Analysis Tab */}
        {activeTab === 'zones' && <div className="space-y-6">
            {/* Zone Selection and KPI Cards */}
            <div className="bg-white rounded-xl shadow-md p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">Zone Details for {selectedPeriod}</h3>
                <div className="mt-3 md:mt-0 flex space-x-4">
                  <select className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value={selectedZone} onChange={e => setSelectedZone(e.target.value)}>
                    {Object.keys(currentData.zoneDetails).map(zone => <option key={zone} value={zone}>{zone}</option>)}
                  </select>
                </div>
              </div>
              
              {/* Zone KPI Gauges */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="flex justify-center">
                  <GaugeChart value={currentData.zoneDetails[selectedZone].l2Reading} max={Math.max(currentData.zoneDetails[selectedZone].l2Reading, currentData.zoneDetails[selectedZone].l3Sum) * 1.2} label="L2 Bulk Meter Reading" color={COLORS.primary} />
                </div>
                <div className="flex justify-center">
                  <GaugeChart value={currentData.zoneDetails[selectedZone].l3Sum} max={Math.max(currentData.zoneDetails[selectedZone].l2Reading, currentData.zoneDetails[selectedZone].l3Sum) * 1.2} label="Sum of L3 Consumption" color={COLORS.secondary} />
                </div>
                <div className="flex justify-center">
                  <GaugeChart value={Math.abs(currentData.zoneDetails[selectedZone].loss)} max={Math.max(Math.abs(currentData.zoneDetails[selectedZone].loss), 1000)} label={currentData.zoneDetails[selectedZone].loss < 0 ? "Surplus Volume" : "Loss Volume"} color={currentData.zoneDetails[selectedZone].loss < 0 ? COLORS.success : COLORS.danger} />
                </div>
                <div className="flex justify-center">
                  <GaugeChart value={Math.abs(currentData.zoneDetails[selectedZone].lossPercent)} max={100} label={currentData.zoneDetails[selectedZone].lossPercent < 0 ? "Surplus Percentage" : "Loss Percentage"} color={currentData.zoneDetails[selectedZone].lossPercent < 0 ? COLORS.success : COLORS.danger} percentage={true} />
                </div>
              </div>
              
              {/* Search and Filter */}
              <div className="mb-4">
                <div className="max-w-lg">
                  <label htmlFor="search" className="block text-sm font-medium text-gray-700">Search Properties</label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <div className="relative flex items-stretch flex-grow">
                      <input type="text" name="search" id="search" className="focus:ring-blue-500 focus:border-blue-500 block w-full rounded-md sm:text-sm border-gray-300" placeholder="Search by meter label, account#, or type..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Consumer table - expanded with parent/child relationship display */}
              <div className="overflow-x-auto mt-4">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => requestSort('acctNum')}>
                        Account #
                        {sortConfig.key === 'acctNum' && <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => requestSort('meterLabel')}>
                        Meter Label
                        {sortConfig.key === 'meterLabel' && <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => requestSort('parent')}>
                        Parent Meter
                        {sortConfig.key === 'parent' && <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => requestSort('type')}>
                        Type
                        {sortConfig.key === 'type' && <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => requestSort('consumption')}>
                        Consumption
                        {sortConfig.key === 'consumption' && <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredConsumerDetails.map((item, index) => <tr key={item.acctNum} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.acctNum}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.meterLabel}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button className="text-blue-600 hover:text-blue-800 hover:underline focus:outline-none" onClick={() => setShowParentDetails(item.parent)}>
                            {item.parent}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-full max-w-xs">
                              <div className="bg-gray-200 rounded-full h-2.5 w-full">
                                <div className="bg-blue-600 h-2.5 rounded-full" style={{
                            width: `${Math.min(100, item.consumption / Math.max(...filteredConsumerDetails.map(i => i.consumption)) * 100)}%`
                          }}></div>
                              </div>
                            </div>
                            <span className="ml-3 text-sm text-gray-900">{formatNumber(item.consumption)} m³</span>
                          </div>
                        </td>
                      </tr>)}
                  </tbody>
                </table>
              </div>
              
              {/* Parent Meter Details Modal */}
              {showParentDetails && <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
                  <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 md:mx-auto">
                    <div className="p-4 border-b">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium text-gray-900">
                          Parent Meter: {showParentDetails}
                        </h3>
                        <button className="text-gray-400 hover:text-gray-500" onClick={() => setShowParentDetails(null)}>
                          <span className="sr-only">Close</span>
                          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="p-6">
                      {/* Parent details */}
                      {actualData.parentMeters[showParentDetails] && <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <p className="text-sm text-blue-700">Account Number</p>
                            <p className="text-lg font-semibold">{actualData.parentMeters[showParentDetails].acctNum}</p>
                          </div>
                          <div className="bg-purple-50 p-4 rounded-lg">
                            <p className="text-sm text-purple-700">Zone</p>
                            <p className="text-lg font-semibold">{actualData.parentMeters[showParentDetails].zone}</p>
                          </div>
                          <div className="bg-green-50 p-4 rounded-lg">
                            <p className="text-sm text-green-700">Level</p>
                            <p className="text-lg font-semibold">{actualData.parentMeters[showParentDetails].label}</p>
                          </div>
                        </div>}
                      
                      {/* Child meters */}
                      <h4 className="text-md font-medium text-gray-700 mb-2">Child Meters</h4>
                      {consumersByParent[showParentDetails] && consumersByParent[showParentDetails].length > 0 ? <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Account #
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Meter Label
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Type
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Consumption
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {consumersByParent[showParentDetails].map(child => <tr key={child.acctNum} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {child.acctNum}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {child.meterLabel}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {child.type}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {formatNumber(child.consumption)} m³
                                  </td>
                                </tr>)}
                            </tbody>
                          </table>
                        </div> : <p className="text-gray-500">No child meters found</p>}
                      
                      {/* Total consumption of children */}
                      {consumersByParent[showParentDetails] && consumersByParent[showParentDetails].length > 0 && <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                          <div className="flex justify-between">
                            <p className="font-medium text-gray-700">Total Consumption:</p>
                            <p className="font-bold text-gray-900">
                              {formatNumber(consumersByParent[showParentDetails].reduce((sum, child) => sum + child.consumption, 0))} m³
                            </p>
                          </div>
                        </div>}
                    </div>
                    <div className="px-4 py-3 bg-gray-50 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
                      <button type="button" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm" onClick={() => setShowParentDetails(null)}>
                        Close
                      </button>
                    </div>
                  </div>
                </div>}
              
              <div className="mt-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-md font-medium text-gray-800 mb-2">Analysis Notes</h4>
                  {currentData.zoneDetails[selectedZone].lossPercent < -10 ? <p className="text-sm text-gray-600">
                      This zone shows a significant surplus, with L3 consumption exceeding L2 bulk readings. This could indicate:
                      <ul className="list-disc ml-5 mt-2">
                        <li>Potential metering inaccuracies at the L2 bulk meter</li>
                        <li>Possible cross-zone supply not captured by this zone's bulk meter</li>
                        <li>Data recording or calculation issues</li>
                      </ul>
                    </p> : currentData.zoneDetails[selectedZone].lossPercent < 0 ? <p className="text-sm text-gray-600">
                      This zone shows a small surplus, with L3 consumption slightly exceeding L2 bulk readings. This is generally within acceptable metering tolerances.
                    </p> : currentData.zoneDetails[selectedZone].lossPercent < 10 ? <p className="text-sm text-gray-600">
                      This zone shows excellent performance with very low water losses, well within industry best practices.
                    </p> : currentData.zoneDetails[selectedZone].lossPercent < 25 ? <p className="text-sm text-gray-600">
                      This zone shows moderate water losses that could be improved with targeted interventions.
                    </p> : <p className="text-sm text-gray-600">
                      This zone shows significantly high water losses that require immediate investigation. Possible causes include:
                      <ul className="list-disc ml-5 mt-2">
                        <li>Physical leaks in the distribution network</li>
                        <li>Unauthorized connections or water theft</li>
                        <li>Metering inaccuracies or calibration issues</li>
                        <li>Data recording errors</li>
                      </ul>
                    </p>}
                </div>
              </div>
            </div>
          </div>}

        {/* Loss Analysis Tab */}
        {activeTab === 'losses' && <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <KpiCard title={`Stage 1 Loss (${selectedPeriod})`} value={currentData.kpis.stage1LossPercent} formatter={formatPercent} color={getLossColor(currentData.kpis.stage1LossPercent)} icon="🔍" />
              <KpiCard title={`Stage 2 Loss (${selectedPeriod})`} value={currentData.kpis.stage2LossPercent} formatter={formatPercent} color={getLossColor(currentData.kpis.stage2LossPercent)} icon="🔎" />
              <KpiCard title={`Total Loss (NRW) (${selectedPeriod})`} value={currentData.kpis.totalLossPercent} formatter={formatPercent} color={getLossColor(currentData.kpis.totalLossPercent)} icon="📉" />
            </div>

            <div className="bg-white rounded-xl shadow-md p-4 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Loss Breakdown in Volume (m³)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-700 font-medium">Stage 1 Loss (Trunk Main)</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {formatNumber(actualData.lossMetrics[selectedPeriod].stage1Loss)} m³
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Loss between Main Bulk and L2/DC meters
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-sm text-purple-700 font-medium">Stage 2 Loss (Distribution)</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {formatNumber(actualData.lossMetrics[selectedPeriod].stage2Loss)} m³
                  </p>
                  <p className="text-xs text-purple-600 mt-1">
                    Loss between L2 meters and L3 consumption
                  </p>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <p className="text-sm text-red-700 font-medium">Total Loss (NRW)</p>
                  <p className="text-2xl font-bold text-red-900">
                    {formatNumber(actualData.lossMetrics[selectedPeriod].totalLoss)} m³
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    Total Non-Revenue Water
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-md p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Top Water Loss Zones ({selectedPeriod})</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={currentData.topLossZones} margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5
                }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="zone" />
                      <YAxis />
                      <Tooltip formatter={(value, name) => [`${value.toFixed(2)}%`, 'Loss Percentage']} />
                      <Legend />
                      <Bar dataKey="lossPercent" name="Loss Percentage (%)" fill={COLORS.danger} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Loss Trend (Q1 2025)</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={[{
                  month: 'Jan-25',
                  Stage1: actualData.lossMetrics['Jan-25'].stage1LossPercent,
                  Stage2: actualData.lossMetrics['Jan-25'].stage2LossPercent,
                  Total: actualData.lossMetrics['Jan-25'].totalLossPercent
                }, {
                  month: 'Feb-25',
                  Stage1: actualData.lossMetrics['Feb-25'].stage1LossPercent,
                  Stage2: actualData.lossMetrics['Feb-25'].stage2LossPercent,
                  Total: actualData.lossMetrics['Feb-25'].totalLossPercent
                }, {
                  month: 'Mar-25',
                  Stage1: actualData.lossMetrics['Mar-25'].stage1LossPercent,
                  Stage2: actualData.lossMetrics['Mar-25'].stage2LossPercent,
                  Total: actualData.lossMetrics['Mar-25'].totalLossPercent
                }]} margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5
                }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={value => `${value.toFixed(2)}%`} />
                      <Legend />
                      <Line type="monotone" dataKey="Stage1" name="Stage 1 Loss %" stroke={COLORS.primary} activeDot={{
                    r: 8
                  }} strokeWidth={2} />
                      <Line type="monotone" dataKey="Stage2" name="Stage 2 Loss %" stroke={COLORS.secondary} activeDot={{
                    r: 8
                  }} strokeWidth={2} />
                      <Line type="monotone" dataKey="Total" name="Total Loss %" stroke={COLORS.danger} activeDot={{
                    r: 8
                  }} strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">All Zones Loss Analysis ({selectedPeriod})</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zone</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">L2 Reading (m³)</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">L3 Sum (m³)</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loss (m³)</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loss %</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.entries(currentData.zoneDetails).sort((a, b) => b[1].lossPercent - a[1].lossPercent).map(([zone, data]) => <tr key={zone} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{zone}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatNumber(data.l2Reading)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatNumber(data.l3Sum)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatNumber(data.loss)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatPercent(data.lossPercent)}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${data.lossPercent < 0 ? 'bg-green-100 text-green-800' : data.lossPercent < 10 ? 'bg-blue-100 text-blue-800' : data.lossPercent < 30 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                              {data.lossPercent < 0 ? 'Surplus' : data.lossPercent < 10 ? 'Excellent' : data.lossPercent < 30 ? 'Moderate' : 'Critical'}
                            </span>
                          </td>
                        </tr>)}
                  </tbody>
                </table>
              </div>
            </div>
          </div>}

        {/* Consumption Patterns Tab */}
        {activeTab === 'consumption' && <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Consumption by Type ({selectedPeriod})</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={currentData.typeBreakdown} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value" nameKey="type" label={({
                    name,
                    percent
                  }) => `${name}: ${(percent * 100).toFixed(1)}%`}>
                        {currentData.typeBreakdown.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={value => formatNumber(value) + ' m³'} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={currentData.typeBreakdown} margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5
                }} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="type" width={150} />
                      <Tooltip formatter={value => formatNumber(value) + ' m³'} />
                      <Legend />
                      <Bar dataKey="value" name="Consumption (m³)" fill={COLORS.secondary} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Consumption Trend (Q1 2025)</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={currentData.monthlyData} margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5
              }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={value => formatNumber(value) + ' m³'} />
                    <Legend />
                    <Line type="monotone" dataKey="Consumption" name="Consumption (m³)" stroke={COLORS.secondary} activeDot={{
                  r: 8
                }} strokeWidth={2} />
                    <Line type="monotone" dataKey="Supply" name="Supply (m³)" stroke={COLORS.primary} activeDot={{
                  r: 8
                }} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Consumption by Zone ({selectedPeriod})</h3>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={Object.entries(currentData.zoneDetails).map(([zone, data]) => ({
                zone,
                consumption: data.l3Sum
              }))} margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5
              }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="zone" />
                    <YAxis />
                    <Tooltip formatter={value => formatNumber(value) + ' m³'} />
                    <Legend />
                    <Bar dataKey="consumption" name="Consumption (m³)" fill={COLORS.secondary} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Consumption Statistics</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supply (m³)</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Consumption (m³)</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loss (m³)</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loss %</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {['Jan-25', 'Feb-25', 'Mar-25', 'Total'].map(month => {
                  const supply = actualData.monthlyMetrics[month].L1;
                  const consumption = actualData.monthlyMetrics[month].L3 + actualData.monthlyMetrics[month].DC;
                  const loss = actualData.lossMetrics[month].totalLoss;
                  const lossPercent = actualData.lossMetrics[month].totalLossPercent;
                  return <tr key={month} className={month === selectedPeriod ? "bg-blue-50" : "hover:bg-gray-50"}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{month}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatNumber(supply)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatNumber(consumption)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatNumber(loss)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatPercent(lossPercent)}</td>
                        </tr>;
                })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>}
      </div>
    </div>;
};
const WaterSystem = () => {
  return <StandardPageLayout title="Water System" description="Management and monitoring of water distribution across Muscat Bay" icon={<Droplets className="h-6 w-6 text-blue-500" />} headerColor="bg-gradient-to-r from-blue-100 to-cyan-50">
      <Dashboard />
    </StandardPageLayout>;
};
export default WaterSystem;