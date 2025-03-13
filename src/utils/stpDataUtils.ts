
import { STPDailyData, STPMonthlyData, ProcessingMetrics } from '@/types/stp';
import { format, parse } from 'date-fns';

// Monthly data from July 2024 to February 2025
export const stpMonthlyData: STPMonthlyData[] = [
  { month: '2024-07', tankerTrips: 442, expectedVolumeTankers: 8840, directSewageMB: 8055, totalInfluent: 16895, totalWaterProcessed: 18308, tseToIrrigation: 16067 },
  { month: '2024-08', tankerTrips: 378, expectedVolumeTankers: 7560, directSewageMB: 8081, totalInfluent: 15641, totalWaterProcessed: 17372, tseToIrrigation: 15139 },
  { month: '2024-09', tankerTrips: 283, expectedVolumeTankers: 5660, directSewageMB: 8146, totalInfluent: 13806, totalWaterProcessed: 14859, tseToIrrigation: 13196 },
  { month: '2024-10', tankerTrips: 289, expectedVolumeTankers: 5780, directSewageMB: 10617, totalInfluent: 16397, totalWaterProcessed: 17669, tseToIrrigation: 15490 },
  { month: '2024-11', tankerTrips: 235, expectedVolumeTankers: 4700, directSewageMB: 9840, totalInfluent: 14540, totalWaterProcessed: 16488, tseToIrrigation: 14006 },
  { month: '2024-12', tankerTrips: 196, expectedVolumeTankers: 3920, directSewageMB: 11293, totalInfluent: 15213, totalWaterProcessed: 17444, tseToIrrigation: 14676 },
  { month: '2025-01', tankerTrips: 207, expectedVolumeTankers: 4140, directSewageMB: 11583, totalInfluent: 15723, totalWaterProcessed: 18212, tseToIrrigation: 15433 },
  { month: '2025-02', tankerTrips: 121, expectedVolumeTankers: 2420, directSewageMB: 10660, totalInfluent: 13080, totalWaterProcessed: 14408, tseToIrrigation: 12075 }
];

// Daily data (just the first few entries for brevity)
export const stpDailyData: STPDailyData[] = [
  { date: '2024-07-01', tankerTrips: 10, expectedVolumeTankers: 200, directSewageMB: 139, totalInfluent: 339, totalWaterProcessed: 385, tseToIrrigation: 340 },
  { date: '2024-07-02', tankerTrips: 14, expectedVolumeTankers: 280, directSewageMB: 246, totalInfluent: 526, totalWaterProcessed: 519, tseToIrrigation: 458 },
  { date: '2024-07-03', tankerTrips: 13, expectedVolumeTankers: 260, directSewageMB: 208, totalInfluent: 468, totalWaterProcessed: 479, tseToIrrigation: 425 },
  { date: '2024-07-04', tankerTrips: 11, expectedVolumeTankers: 220, directSewageMB: 244, totalInfluent: 464, totalWaterProcessed: 547, tseToIrrigation: 489 },
  { date: '2024-07-05', tankerTrips: 15, expectedVolumeTankers: 300, directSewageMB: 265, totalInfluent: 565, totalWaterProcessed: 653, tseToIrrigation: 574 },
  // ... more daily data would be added here
];

// Function to get daily data for a specific month
export const getDailyDataForMonth = (monthStr: string): STPDailyData[] => {
  return stpDailyData.filter(day => day.date.startsWith(monthStr));
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
  const date = parse(monthStr, 'yyyy-MM', new Date());
  return format(date, 'MMMM yyyy');
};
