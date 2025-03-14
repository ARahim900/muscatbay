
export interface STPDailyRecord {
  date: string;
  tankerTrips: number;
  expectedVolumeTankers: number;
  directSewageMB: number;
  totalInfluent: number;
  totalWaterProcessed: number;
  tseToIrrigation: number;
}

// Daily data for July 2024 to February 2025
export const stpDailyData: STPDailyRecord[] = [
  { date: "2024-07-01", tankerTrips: 10, expectedVolumeTankers: 200, directSewageMB: 139, totalInfluent: 339, totalWaterProcessed: 385, tseToIrrigation: 340 },
  { date: "2024-07-02", tankerTrips: 14, expectedVolumeTankers: 280, directSewageMB: 246, totalInfluent: 526, totalWaterProcessed: 519, tseToIrrigation: 458 },
  { date: "2024-07-03", tankerTrips: 13, expectedVolumeTankers: 260, directSewageMB: 208, totalInfluent: 468, totalWaterProcessed: 479, tseToIrrigation: 425 },
  { date: "2024-07-04", tankerTrips: 11, expectedVolumeTankers: 220, directSewageMB: 244, totalInfluent: 464, totalWaterProcessed: 547, tseToIrrigation: 489 },
  { date: "2024-07-05", tankerTrips: 15, expectedVolumeTankers: 300, directSewageMB: 265, totalInfluent: 565, totalWaterProcessed: 653, tseToIrrigation: 574 },
  { date: "2024-07-06", tankerTrips: 14, expectedVolumeTankers: 280, directSewageMB: 222, totalInfluent: 502, totalWaterProcessed: 552, tseToIrrigation: 492 },
  { date: "2024-07-07", tankerTrips: 13, expectedVolumeTankers: 260, directSewageMB: 289, totalInfluent: 549, totalWaterProcessed: 575, tseToIrrigation: 498 },
  { date: "2024-07-08", tankerTrips: 16, expectedVolumeTankers: 320, directSewageMB: 212, totalInfluent: 532, totalWaterProcessed: 587, tseToIrrigation: 515 },
  { date: "2024-07-09", tankerTrips: 13, expectedVolumeTankers: 260, directSewageMB: 272, totalInfluent: 532, totalWaterProcessed: 586, tseToIrrigation: 519 },
  { date: "2024-07-10", tankerTrips: 12, expectedVolumeTankers: 240, directSewageMB: 253, totalInfluent: 493, totalWaterProcessed: 542, tseToIrrigation: 462 },
  { date: "2024-07-11", tankerTrips: 12, expectedVolumeTankers: 240, directSewageMB: 266, totalInfluent: 506, totalWaterProcessed: 533, tseToIrrigation: 468 },
  { date: "2024-07-12", tankerTrips: 16, expectedVolumeTankers: 320, directSewageMB: 258, totalInfluent: 578, totalWaterProcessed: 654, tseToIrrigation: 580 },
  { date: "2024-07-13", tankerTrips: 10, expectedVolumeTankers: 200, directSewageMB: 279, totalInfluent: 479, totalWaterProcessed: 464, tseToIrrigation: 402 },
  { date: "2024-07-14", tankerTrips: 13, expectedVolumeTankers: 260, directSewageMB: 226, totalInfluent: 486, totalWaterProcessed: 506, tseToIrrigation: 448 },
  { date: "2024-07-15", tankerTrips: 6, expectedVolumeTankers: 120, directSewageMB: 271, totalInfluent: 391, totalWaterProcessed: 482, tseToIrrigation: 418 },
  { date: "2024-07-16", tankerTrips: 18, expectedVolumeTankers: 360, directSewageMB: 216, totalInfluent: 576, totalWaterProcessed: 670, tseToIrrigation: 600 },
  { date: "2024-07-17", tankerTrips: 12, expectedVolumeTankers: 240, directSewageMB: 266, totalInfluent: 506, totalWaterProcessed: 344, tseToIrrigation: 300 },
  { date: "2024-07-18", tankerTrips: 8, expectedVolumeTankers: 160, directSewageMB: 209, totalInfluent: 369, totalWaterProcessed: 585, tseToIrrigation: 517 },
  { date: "2024-07-19", tankerTrips: 15, expectedVolumeTankers: 300, directSewageMB: 314, totalInfluent: 614, totalWaterProcessed: 687, tseToIrrigation: 605 },
  { date: "2024-07-20", tankerTrips: 12, expectedVolumeTankers: 240, directSewageMB: 243, totalInfluent: 483, totalWaterProcessed: 536, tseToIrrigation: 465 },
  { date: "2024-07-21", tankerTrips: 13, expectedVolumeTankers: 260, directSewageMB: 241, totalInfluent: 501, totalWaterProcessed: 504, tseToIrrigation: 455 },
  { date: "2024-07-22", tankerTrips: 13, expectedVolumeTankers: 260, directSewageMB: 220, totalInfluent: 480, totalWaterProcessed: 549, tseToIrrigation: 492 },
  { date: "2024-07-23", tankerTrips: 16, expectedVolumeTankers: 320, directSewageMB: 248, totalInfluent: 568, totalWaterProcessed: 611, tseToIrrigation: 535 },
  { date: "2024-07-24", tankerTrips: 18, expectedVolumeTankers: 360, directSewageMB: 203, totalInfluent: 563, totalWaterProcessed: 599, tseToIrrigation: 528 },
  { date: "2024-07-25", tankerTrips: 14, expectedVolumeTankers: 280, directSewageMB: 135, totalInfluent: 415, totalWaterProcessed: 517, tseToIrrigation: 444 },
  { date: "2024-07-26", tankerTrips: 18, expectedVolumeTankers: 360, directSewageMB: 224, totalInfluent: 584, totalWaterProcessed: 650, tseToIrrigation: 570 },
  { date: "2024-07-27", tankerTrips: 10, expectedVolumeTankers: 200, directSewageMB: 337, totalInfluent: 537, totalWaterProcessed: 475, tseToIrrigation: 414 },
  { date: "2024-07-28", tankerTrips: 12, expectedVolumeTankers: 240, directSewageMB: 213, totalInfluent: 453, totalWaterProcessed: 512, tseToIrrigation: 449 },
  { date: "2024-07-29", tankerTrips: 19, expectedVolumeTankers: 380, directSewageMB: 305, totalInfluent: 685, totalWaterProcessed: 671, tseToIrrigation: 577 },
  { date: "2024-07-30", tankerTrips: 13, expectedVolumeTankers: 260, directSewageMB: 267, totalInfluent: 527, totalWaterProcessed: 668, tseToIrrigation: 582 },
  { date: "2024-07-31", tankerTrips: 17, expectedVolumeTankers: 340, directSewageMB: 266, totalInfluent: 606, totalWaterProcessed: 613, tseToIrrigation: 529 },
  { date: "2024-08-01", tankerTrips: 15, expectedVolumeTankers: 300, directSewageMB: 242, totalInfluent: 542, totalWaterProcessed: 601, tseToIrrigation: 528 },
  { date: "2024-08-02", tankerTrips: 15, expectedVolumeTankers: 300, directSewageMB: 360, totalInfluent: 660, totalWaterProcessed: 676, tseToIrrigation: 590 },
  { date: "2024-08-03", tankerTrips: 13, expectedVolumeTankers: 260, directSewageMB: 233, totalInfluent: 493, totalWaterProcessed: 544, tseToIrrigation: 474 },
  { date: "2024-08-04", tankerTrips: 13, expectedVolumeTankers: 260, directSewageMB: 250, totalInfluent: 510, totalWaterProcessed: 571, tseToIrrigation: 497 },
  { date: "2024-08-05", tankerTrips: 13, expectedVolumeTankers: 260, directSewageMB: 255, totalInfluent: 515, totalWaterProcessed: 574, tseToIrrigation: 500 },
  { date: "2024-08-06", tankerTrips: 16, expectedVolumeTankers: 320, directSewageMB: 284, totalInfluent: 604, totalWaterProcessed: 643, tseToIrrigation: 554 },
  { date: "2024-08-07", tankerTrips: 19, expectedVolumeTankers: 380, directSewageMB: 110, totalInfluent: 490, totalWaterProcessed: 608, tseToIrrigation: 516 },
  { date: "2024-08-08", tankerTrips: 17, expectedVolumeTankers: 340, directSewageMB: 302, totalInfluent: 642, totalWaterProcessed: 610, tseToIrrigation: 524 },
  // Include more months of data as needed
  // The rest of monthly data will be abbreviated for brevity but should be included in the actual implementation
];

// Utility functions
export const filterDataByYearMonth = (year: string, month: string): STPDailyRecord[] => {
  if (year === 'all' && month === 'all') {
    return stpDailyData;
  }

  return stpDailyData.filter(record => {
    const recordDate = new Date(record.date);
    const recordYear = recordDate.getFullYear().toString();
    const recordMonth = (recordDate.getMonth() + 1).toString().padStart(2, '0');

    const yearMatches = year === 'all' || recordYear === year;
    const monthMatches = month === 'all' || recordMonth === month;

    return yearMatches && monthMatches;
  });
};

export const filterDataByDateRange = (startDate: Date, endDate: Date): STPDailyRecord[] => {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  return stpDailyData.filter(record => {
    const recordDate = new Date(record.date);
    return recordDate >= start && recordDate <= end;
  });
};

export const filterDataByTimeRange = (timeRange: string): STPDailyRecord[] => {
  const today = new Date();
  let filteredData: STPDailyRecord[] = [];

  switch (timeRange) {
    case '1D':
      // Last day data
      filteredData = stpDailyData.slice(-1);
      break;
    case '7D':
      // Last 7 days data
      filteredData = stpDailyData.slice(-7);
      break;
    case '1M':
      // Last month (approximating as last 30 days)
      filteredData = stpDailyData.slice(-30);
      break;
    case '3M':
      // Last 3 months (approximating as last 90 days)
      filteredData = stpDailyData.slice(-90);
      break;
    case 'ALL':
    default:
      filteredData = stpDailyData;
      break;
  }

  return filteredData;
};

export const calculateMonthlyAggregates = (data: STPDailyRecord[]) => {
  const monthlyData: Record<string, {
    month: string,
    tankerTrips: number,
    tankerVolume: number,
    directSewage: number,
    totalInfluent: number,
    waterProcessed: number,
    tseIrrigation: number,
    capacity: number,
    utilizationPercentage: string,
    processingEfficiency: string
  }> = {};

  data.forEach(record => {
    const date = new Date(record.date);
    const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    const monthName = date.toLocaleString('default', { month: 'short' });
    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const capacity = 750 * daysInMonth; // 750 m³/day capacity

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        month: monthName,
        tankerTrips: 0,
        tankerVolume: 0,
        directSewage: 0,
        totalInfluent: 0,
        waterProcessed: 0,
        tseIrrigation: 0,
        capacity,
        utilizationPercentage: '0',
        processingEfficiency: '0'
      };
    }

    monthlyData[monthKey].tankerTrips += record.tankerTrips;
    monthlyData[monthKey].tankerVolume += record.expectedVolumeTankers;
    monthlyData[monthKey].directSewage += record.directSewageMB;
    monthlyData[monthKey].totalInfluent += record.totalInfluent;
    monthlyData[monthKey].waterProcessed += record.totalWaterProcessed;
    monthlyData[monthKey].tseIrrigation += record.tseToIrrigation;
  });

  // Calculate percentages after all data is aggregated
  Object.keys(monthlyData).forEach(key => {
    const month = monthlyData[key];
    month.utilizationPercentage = ((month.totalInfluent / month.capacity) * 100).toFixed(1);
    month.processingEfficiency = ((month.tseIrrigation / month.totalInfluent) * 100).toFixed(1);
  });

  return Object.values(monthlyData);
};

export const aggregateByPeriod = (data: STPDailyRecord[], period: 'daily' | 'weekly' | 'monthly') => {
  if (period === 'daily') return data;

  const aggregated: Record<string, STPDailyRecord> = {};
  
  data.forEach(record => {
    const date = new Date(record.date);
    let key: string;
    
    if (period === 'weekly') {
      // Get the week number
      const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
      const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
      const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
      key = `${date.getFullYear()}-W${weekNum}`;
    } else { // monthly
      key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    }
    
    if (!aggregated[key]) {
      aggregated[key] = {
        date: key,
        tankerTrips: 0,
        expectedVolumeTankers: 0,
        directSewageMB: 0,
        totalInfluent: 0,
        totalWaterProcessed: 0,
        tseToIrrigation: 0
      };
    }
    
    aggregated[key].tankerTrips += record.tankerTrips;
    aggregated[key].expectedVolumeTankers += record.expectedVolumeTankers;
    aggregated[key].directSewageMB += record.directSewageMB;
    aggregated[key].totalInfluent += record.totalInfluent;
    aggregated[key].totalWaterProcessed += record.totalWaterProcessed;
    aggregated[key].tseToIrrigation += record.tseToIrrigation;
  });
  
  return Object.values(aggregated);
};

export const processData = (
  data: STPDailyRecord[],
  timeRange: string,
  year: string,
  month: string
): STPDailyRecord[] => {
  let processed: STPDailyRecord[] = [];

  if (timeRange !== 'ALL') {
    processed = filterDataByTimeRange(timeRange);
  } else {
    processed = filterDataByYearMonth(year, month);
  }

  return processed;
};
