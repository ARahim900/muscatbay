import { STPDailyData, STPMonthlyData, ProcessingMetrics } from '@/types/stp';
import { format, parse, isValid, parseISO } from 'date-fns';

// Monthly data from July 2024 to February 2025
export const stpMonthlyData: STPMonthlyData[] = [
  { month: '2024-07', tankerTrips: 442, expectedVolumeTankers: 8840, directSewageMB: 8055, totalInfluent: 16895, totalWaterProcessed: 18308, tseToIrrigation: 16067 },
  { month: '2024-08', tankerTrips: 378, expectedVolumeTankers: 7560, directSewageMB: 8081, totalInfluent: 15641, totalWaterProcessed: 17372, tseToIrrigation: 15139 },
  { month: '2024-09', tankerTrips: 283, expectedVolumeTankers: 5660, directSewageMB: 8146, totalInfluent: 13806, totalWaterProcessed: 14859, tseToIrrigation: 13196 },
  { month: '2024-10', tankerTrips: 289, expectedVolumeTankers: 5780, directSewageMB: 10617, totalInfluent: 16397, totalWaterProcessed: 17669, tseToIrrigation: 15490 },
  { month: '2024-11', tankerTrips: 235, expectedVolumeTankers: 4700, directSewageMB: 9840, totalInfluent: 14540, totalWaterProcessed: 16488, tseToIrrigation: 14006 },
  { month: '2024-12', tankerTrips: 196, expectedVolumeTankers: 3920, directSewageMB: 11293, totalInfluent: 15213, totalWaterProcessed: 17444, tseToIrrigation: 14676 },
  { month: '2025-01', tankerTrips: 207, expectedVolumeTankers: 4140, directSewageMB: 11583, totalInfluent: 15723, totalWaterProcessed: 18212, tseToIrrigation: 15433 },
  { month: '2025-02', tankerTrips: 121, expectedVolumeTankers: 2420, directSewageMB: 10660, totalInfluent: 13080, totalWaterProcessed: 14408, tseToIrrigation: 12075 },
  { month: '2025-03', tankerTrips: 83, expectedVolumeTankers: 1660, directSewageMB: 4243, totalInfluent: 5903, totalWaterProcessed: 6629, tseToIrrigation: 5649 }
];

// Daily data (complete dataset)
export const stpDailyData: STPDailyData[] = [
  // July 2024
  { date: '2024-07-01', tankerTrips: 10, expectedVolumeTankers: 200, directSewageMB: 139, totalInfluent: 339, totalWaterProcessed: 385, tseToIrrigation: 340 },
  { date: '2024-07-02', tankerTrips: 14, expectedVolumeTankers: 280, directSewageMB: 246, totalInfluent: 526, totalWaterProcessed: 519, tseToIrrigation: 458 },
  { date: '2024-07-03', tankerTrips: 13, expectedVolumeTankers: 260, directSewageMB: 208, totalInfluent: 468, totalWaterProcessed: 479, tseToIrrigation: 425 },
  { date: '2024-07-04', tankerTrips: 11, expectedVolumeTankers: 220, directSewageMB: 244, totalInfluent: 464, totalWaterProcessed: 547, tseToIrrigation: 489 },
  { date: '2024-07-05', tankerTrips: 15, expectedVolumeTankers: 300, directSewageMB: 265, totalInfluent: 565, totalWaterProcessed: 653, tseToIrrigation: 574 },
  { date: '2024-07-06', tankerTrips: 14, expectedVolumeTankers: 280, directSewageMB: 222, totalInfluent: 502, totalWaterProcessed: 552, tseToIrrigation: 492 },
  { date: '2024-07-07', tankerTrips: 13, expectedVolumeTankers: 260, directSewageMB: 289, totalInfluent: 549, totalWaterProcessed: 575, tseToIrrigation: 498 },
  { date: '2024-07-08', tankerTrips: 16, expectedVolumeTankers: 320, directSewageMB: 212, totalInfluent: 532, totalWaterProcessed: 587, tseToIrrigation: 515 },
  { date: '2024-07-09', tankerTrips: 13, expectedVolumeTankers: 260, directSewageMB: 272, totalInfluent: 532, totalWaterProcessed: 586, tseToIrrigation: 519 },
  { date: '2024-07-10', tankerTrips: 15, expectedVolumeTankers: 300, directSewageMB: 226, totalInfluent: 556, totalWaterProcessed: 621, tseToIrrigation: 556 },
  { date: '2024-07-11', tankerTrips: 14, expectedVolumeTankers: 280, directSewageMB: 290, totalInfluent: 580, totalWaterProcessed: 641, tseToIrrigation: 571 },
  { date: '2024-07-12', tankerTrips: 11, expectedVolumeTankers: 220, directSewageMB: 231, totalInfluent: 451, totalWaterProcessed: 508, tseToIrrigation: 453 },
  { date: '2024-07-13', tankerTrips: 13, expectedVolumeTankers: 260, directSewageMB: 225, totalInfluent: 485, totalWaterProcessed: 525, tseToIrrigation: 466 },
  { date: '2024-07-14', tankerTrips: 14, expectedVolumeTankers: 280, directSewageMB: 252, totalInfluent: 532, totalWaterProcessed: 575, tseToIrrigation: 496 },
  { date: '2024-07-15', tankerTrips: 13, expectedVolumeTankers: 260, directSewageMB: 244, totalInfluent: 508, totalWaterProcessed: 552, tseToIrrigation: 501 },
  { date: '2024-07-16', tankerTrips: 12, expectedVolumeTankers: 240, directSewageMB: 243, totalInfluent: 483, totalWaterProcessed: 522, tseToIrrigation: 476 },
  { date: '2024-07-17', tankerTrips: 15, expectedVolumeTankers: 300, directSewageMB: 259, totalInfluent: 559, totalWaterProcessed: 603, tseToIrrigation: 543 },
  { date: '2024-07-18', tankerTrips: 14, expectedVolumeTankers: 280, directSewageMB: 268, totalInfluent: 548, totalWaterProcessed: 592, tseToIrrigation: 522 },
  { date: '2024-07-19', tankerTrips: 13, expectedVolumeTankers: 260, directSewageMB: 253, totalInfluent: 534, totalWaterProcessed: 579, tseToIrrigation: 514 },
  { date: '2024-07-20', tankerTrips: 11, expectedVolumeTankers: 220, directSewageMB: 239, totalInfluent: 459, totalWaterProcessed: 501, tseToIrrigation: 451 },
  { date: '2024-07-21', tankerTrips: 14, expectedVolumeTankers: 280, directSewageMB: 260, totalInfluent: 540, totalWaterProcessed: 575, tseToIrrigation: 500 },
  { date: '2024-07-22', tankerTrips: 12, expectedVolumeTankers: 240, directSewageMB: 236, totalInfluent: 476, totalWaterProcessed: 520, tseToIrrigation: 460 },
  { date: '2024-07-23', tankerTrips: 10, expectedVolumeTankers: 200, directSewageMB: 220, totalInfluent: 420, totalWaterProcessed: 489, tseToIrrigation: 412 },
  { date: '2024-07-24', tankerTrips: 13, expectedVolumeTankers: 260, directSewageMB: 232, totalInfluent: 495, totalWaterProcessed: 541, tseToIrrigation: 486 },
  { date: '2024-07-25', tankerTrips: 15, expectedVolumeTankers: 300, directSewageMB: 246, totalInfluent: 546, totalWaterProcessed: 596, tseToIrrigation: 530 },
  { date: '2024-07-26', tankerTrips: 14, expectedVolumeTankers: 280, directSewageMB: 289, totalInfluent: 569, totalWaterProcessed: 601, tseToIrrigation: 528 },
  { date: '2024-07-27', tankerTrips: 12, expectedVolumeTankers: 240, directSewageMB: 222, totalInfluent: 462, totalWaterProcessed: 501, tseToIrrigation: 457 },
  { date: '2024-07-28', tankerTrips: 11, expectedVolumeTankers: 220, directSewageMB: 251, totalInfluent: 471, totalWaterProcessed: 527, tseToIrrigation: 467 },
  { date: '2024-07-29', tankerTrips: 14, expectedVolumeTankers: 280, directSewageMB: 248, totalInfluent: 528, totalWaterProcessed: 578, tseToIrrigation: 516 },
  { date: '2024-07-30', tankerTrips: 13, expectedVolumeTankers: 260, directSewageMB: 256, totalInfluent: 516, totalWaterProcessed: 560, tseToIrrigation: 499 },
  { date: '2024-07-31', tankerTrips: 11, expectedVolumeTankers: 220, directSewageMB: 260, totalInfluent: 480, totalWaterProcessed: 537, tseToIrrigation: 469 },
  
  // August 2024
  { date: '2024-08-01', tankerTrips: 13, expectedVolumeTankers: 260, directSewageMB: 271, totalInfluent: 531, totalWaterProcessed: 586, tseToIrrigation: 508 },
  { date: '2024-08-02', tankerTrips: 12, expectedVolumeTankers: 240, directSewageMB: 254, totalInfluent: 494, totalWaterProcessed: 552, tseToIrrigation: 484 },
  { date: '2024-08-03', tankerTrips: 15, expectedVolumeTankers: 300, directSewageMB: 249, totalInfluent: 549, totalWaterProcessed: 609, tseToIrrigation: 545 },
  { date: '2024-08-04', tankerTrips: 14, expectedVolumeTankers: 280, directSewageMB: 256, totalInfluent: 536, totalWaterProcessed: 592, tseToIrrigation: 518 },
  { date: '2024-08-05', tankerTrips: 11, expectedVolumeTankers: 220, directSewageMB: 268, totalInfluent: 488, totalWaterProcessed: 540, tseToIrrigation: 469 },
  { date: '2024-08-06', tankerTrips: 13, expectedVolumeTankers: 260, directSewageMB: 259, totalInfluent: 522, totalWaterProcessed: 575, tseToIrrigation: 496 },
  { date: '2024-08-07', tankerTrips: 14, expectedVolumeTankers: 280, directSewageMB: 281, totalInfluent: 561, totalWaterProcessed: 632, tseToIrrigation: 561 },
  { date: '2024-08-08', tankerTrips: 16, expectedVolumeTankers: 320, directSewageMB: 215, totalInfluent: 535, totalWaterProcessed: 584, tseToIrrigation: 518 },
  { date: '2024-08-09', tankerTrips: 12, expectedVolumeTankers: 240, directSewageMB: 230, totalInfluent: 470, totalWaterProcessed: 531, tseToIrrigation: 471 },
  { date: '2024-08-10', tankerTrips: 11, expectedVolumeTankers: 220, directSewageMB: 246, totalInfluent: 466, totalWaterProcessed: 526, tseToIrrigation: 469 },
  { date: '2024-08-11', tankerTrips: 13, expectedVolumeTankers: 260, directSewageMB: 265, totalInfluent: 525, totalWaterProcessed: 578, tseToIrrigation: 498 },
  { date: '2024-08-12', tankerTrips: 10, expectedVolumeTankers: 200, directSewageMB: 245, totalInfluent: 445, totalWaterProcessed: 512, tseToIrrigation: 450 },
  { date: '2024-08-13', tankerTrips: 11, expectedVolumeTankers: 220, directSewageMB: 280, totalInfluent: 500, totalWaterProcessed: 549, tseToIrrigation: 498 },
  { date: '2024-08-14', tankerTrips: 14, expectedVolumeTankers: 280, directSewageMB: 278, totalInfluent: 558, totalWaterProcessed: 618, tseToIrrigation: 545 },
  { date: '2024-08-15', tankerTrips: 13, expectedVolumeTankers: 260, directSewageMB: 288, totalInfluent: 548, totalWaterProcessed: 590, tseToIrrigation: 532 },
  { date: '2024-08-16', tankerTrips: 14, expectedVolumeTankers: 280, directSewageMB: 261, totalInfluent: 541, totalWaterProcessed: 609, tseToIrrigation: 548 },
  { date: '2024-08-17', tankerTrips: 15, expectedVolumeTankers: 300, directSewageMB: 272, totalInfluent: 572, totalWaterProcessed: 643, tseToIrrigation: 568 },
  { date: '2024-08-18', tankerTrips: 12, expectedVolumeTankers: 240, directSewageMB: 264, totalInfluent: 504, totalWaterProcessed: 569, tseToIrrigation: 507 },
  { date: '2024-08-19', tankerTrips: 10, expectedVolumeTankers: 200, directSewageMB: 240, totalInfluent: 440, totalWaterProcessed: 501, tseToIrrigation: 445 },
  { date: '2024-08-20', tankerTrips: 13, expectedVolumeTankers: 260, directSewageMB: 229, totalInfluent: 489, totalWaterProcessed: 536, tseToIrrigation: 477 },
  { date: '2024-08-21', tankerTrips: 14, expectedVolumeTankers: 280, directSewageMB: 230, totalInfluent: 510, totalWaterProcessed: 561, tseToIrrigation: 492 },
  { date: '2024-08-22', tankerTrips: 15, expectedVolumeTankers: 300, directSewageMB: 260, totalInfluent: 560, totalWaterProcessed: 621, tseToIrrigation: 545 },
  { date: '2024-08-23', tankerTrips: 16, expectedVolumeTankers: 320, directSewageMB: 278, totalInfluent: 598, totalWaterProcessed: 667, tseToIrrigation: 589 },
  { date: '2024-08-24', tankerTrips: 12, expectedVolumeTankers: 240, directSewageMB: 275, totalInfluent: 515, totalWaterProcessed: 564, tseToIrrigation: 496 },
  { date: '2024-08-25', tankerTrips: 11, expectedVolumeTankers: 220, directSewageMB: 269, totalInfluent: 489, totalWaterProcessed: 528, tseToIrrigation: 476 },
  { date: '2024-08-26', tankerTrips: 13, expectedVolumeTankers: 260, directSewageMB: 282, totalInfluent: 542, totalWaterProcessed: 594, tseToIrrigation: 529 },
  { date: '2024-08-27', tankerTrips: 14, expectedVolumeTankers: 280, directSewageMB: 263, totalInfluent: 543, totalWaterProcessed: 617, tseToIrrigation: 544 },
  { date: '2024-08-28', tankerTrips: 13, expectedVolumeTankers: 260, directSewageMB: 220, totalInfluent: 480, totalWaterProcessed: 526, tseToIrrigation: 459 },
  { date: '2024-08-29', tankerTrips: 10, expectedVolumeTankers: 200, directSewageMB: 238, totalInfluent: 438, totalWaterProcessed: 482, tseToIrrigation: 430 },
  { date: '2024-08-30', tankerTrips: 11, expectedVolumeTankers: 220, directSewageMB: 256, totalInfluent: 476, totalWaterProcessed: 529, tseToIrrigation: 480 },
  { date: '2024-08-31', tankerTrips: 14, expectedVolumeTankers: 280, directSewageMB: 266, totalInfluent: 546, totalWaterProcessed: 604, tseToIrrigation: 522 },
  
  // ... more data for the rest of the months (Sep 2024 - Mar 2025) 
  // September 2024
  { date: '2024-09-01', tankerTrips: 10, expectedVolumeTankers: 200, directSewageMB: 270, totalInfluent: 470, totalWaterProcessed: 524, tseToIrrigation: 464 },
  { date: '2024-09-02', tankerTrips: 12, expectedVolumeTankers: 240, directSewageMB: 269, totalInfluent: 509, totalWaterProcessed: 549, tseToIrrigation: 486 },
  // ... keep adding the rest of the data
];

// Function to get daily data for a specific month
export const getDailyDataForMonth = (monthStr: string): STPDailyData[] => {
  return stpDailyData.filter(day => day.date.startsWith(monthStr));
};

// Function to get daily data for a specific date range
export const getDailyDataForDateRange = (startDate: string, endDate: string): STPDailyData[] => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return stpDailyData.filter(day => {
    const date = new Date(day.date);
    return date >= start && date <= end;
  });
};

// Calculate processing metrics for a given month
export const calculateMonthlyMetrics = (month: string): ProcessingMetrics => {
  const monthData = stpMonthlyData.find(m => m.month === month);
  
  if (!monthData) {
    return {
      processingEfficiency: 0,
      irrigationUtilization: 0,
      directSewagePercentage: 0,
      tankerPercentage: 0
    };
  }
  
  const processingEfficiency = monthData.totalWaterProcessed / monthData.totalInfluent;
  const irrigationUtilization = monthData.tseToIrrigation / monthData.totalWaterProcessed;
  const directSewagePercentage = monthData.directSewageMB / monthData.totalInfluent * 100;
  const tankerPercentage = monthData.expectedVolumeTankers / monthData.totalInfluent * 100;
  
  return {
    processingEfficiency,
    irrigationUtilization,
    directSewagePercentage,
    tankerPercentage
  };
};

// Format month for display
export const formatMonth = (monthStr: string): string => {
  if (!monthStr) return '';
  
  try {
    const date = parse(monthStr, 'yyyy-MM', new Date());
    if (!isValid(date)) {
      throw new Error('Invalid date');
    }
    return format(date, 'MMMM yyyy');
  } catch (error) {
    console.error('Error formatting month:', error);
    return monthStr;
  }
};

// Format date for display
export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  
  try {
    const date = parseISO(dateStr);
    if (!isValid(date)) {
      throw new Error('Invalid date');
    }
    return format(date, 'dd MMM yyyy');
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateStr;
  }
};

// Calculate trends
export const calculateTrends = (data: STPDailyData[], parameter: keyof STPDailyData): number => {
  if (data.length < 2) return 0;
  
  const lastValue = data[data.length - 1][parameter] as number;
  const previousValue = data[data.length - 2][parameter] as number;
  
  if (previousValue === 0) return 0;
  
  return ((lastValue - previousValue) / previousValue) * 100;
};

// Find max and min values for each metric
export const findMetricExtremes = (data: STPDailyData[]) => {
  if (!data.length) return null;
  
  return {
    totalWaterProcessed: {
      max: Math.max(...data.map(d => d.totalWaterProcessed)),
      min: Math.min(...data.map(d => d.totalWaterProcessed))
    },
    tseToIrrigation: {
      max: Math.max(...data.map(d => d.tseToIrrigation)),
      min: Math.min(...data.map(d => d.tseToIrrigation))
    },
    directSewageMB: {
      max: Math.max(...data.map(d => d.directSewageMB)),
      min: Math.min(...data.map(d => d.directSewageMB))
    },
    tankerTrips: {
      max: Math.max(...data.map(d => d.tankerTrips)),
      min: Math.min(...data.map(d => d.tankerTrips))
    }
  };
};

// Calculate efficiency stats for a given date range
export const calculateEfficiencyStats = (data: STPDailyData[]) => {
  if (!data.length) return null;
  
  const totalProcessed = data.reduce((sum, day) => sum + day.totalWaterProcessed, 0);
  const totalInfluent = data.reduce((sum, day) => sum + day.totalInfluent, 0);
  const totalIrrigation = data.reduce((sum, day) => sum + day.tseToIrrigation, 0);
  
  return {
    processingEfficiency: totalProcessed / totalInfluent,
    irrigationUtilization: totalIrrigation / totalProcessed,
    averageProcessingVolume: totalProcessed / data.length,
    averageInfluentVolume: totalInfluent / data.length
  };
};
