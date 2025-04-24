
import { supabase } from '@/integrations/supabase/client';
import { STPDailyData } from '@/types/stp';

// Mock data for STP daily records
export const stpDailyData = [
  {
    id: "1",
    date: "2024-03-01",
    tankerTrips: 12,
    expectedVolumeTankers: 240,
    directSewageMB: 380,
    totalInfluent: 620,
    totalWaterProcessed: 595,
    tseToIrrigation: 520
  },
  {
    id: "2",
    date: "2024-03-02",
    tankerTrips: 10,
    expectedVolumeTankers: 200,
    directSewageMB: 400,
    totalInfluent: 600,
    totalWaterProcessed: 580,
    tseToIrrigation: 510
  },
  {
    id: "3",
    date: "2024-03-03",
    tankerTrips: 14,
    expectedVolumeTankers: 280,
    directSewageMB: 350,
    totalInfluent: 630,
    totalWaterProcessed: 605,
    tseToIrrigation: 530
  }
];

// Mock data for monthly STP data
export const stpMonthlyData = [
  {
    month: "2024-01",
    tankerTrips: 320,
    expectedVolumeTankers: 6400,
    directSewageMB: 10500,
    totalInfluent: 16900,
    totalWaterProcessed: 16200,
    tseToIrrigation: 14800
  },
  {
    month: "2024-02",
    tankerTrips: 290,
    expectedVolumeTankers: 5800,
    directSewageMB: 11200,
    totalInfluent: 17000,
    totalWaterProcessed: 16400,
    tseToIrrigation: 15000
  },
  {
    month: "2024-03",
    tankerTrips: 310,
    expectedVolumeTankers: 6200,
    directSewageMB: 11000,
    totalInfluent: 17200,
    totalWaterProcessed: 16700,
    tseToIrrigation: 15200
  }
];

export const importSTPData = async (data: STPDailyData[]): Promise<{ success: boolean; message: string }> => {
  try {
    if (!Array.isArray(data) || data.length === 0) {
      return { success: false, message: "Invalid data format." };
    }
    
    // Mock successful import for now
    console.log("Importing STP data:", data.length, "records");
    
    return { success: true, message: `Successfully imported ${data.length} STP records.` };
  } catch (error) {
    console.error("Error in importSTPData:", error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : "Unknown error occurred" 
    };
  }
};

export const fetchSTPData = async (): Promise<STPDailyData[]> => {
  try {
    // Mock data fetch
    return stpDailyData.map(item => ({
      date: item.date,
      tankerTrips: item.tankerTrips,
      expectedVolumeTankers: item.expectedVolumeTankers,
      directSewageMB: item.directSewageMB,
      totalInfluent: item.totalInfluent,
      totalWaterProcessed: item.totalWaterProcessed,
      tseToIrrigation: item.tseToIrrigation,
      utilizationPercentage: ((item.tseToIrrigation / item.totalWaterProcessed) * 100).toFixed(1),
      processingEfficiency: ((item.totalWaterProcessed / item.totalInfluent) * 100).toFixed(1)
    }));
  } catch (error) {
    console.error("Error fetching STP data:", error);
    throw new Error("Failed to fetch STP data");
  }
};

// Format month for display
export const formatMonth = (monthStr: string): string => {
  const date = new Date(monthStr + "-01");
  return date.toLocaleDateString('default', { month: 'short', year: 'numeric' });
};

// Format date for display
export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('default', { month: 'short', day: 'numeric' });
};

// Calculate monthly metrics
export const calculateMonthlyMetrics = (selectedMonth: string) => {
  const monthData = stpMonthlyData.find(m => m.month === selectedMonth);
  
  if (!monthData) return null;
  
  const processingEfficiency = Number(monthData.totalWaterProcessed) / Number(monthData.totalInfluent);
  const irrigationUtilization = Number(monthData.tseToIrrigation) / Number(monthData.totalWaterProcessed);
  const directSewagePercentage = Number(monthData.directSewageMB) / Number(monthData.totalInfluent);
  const tankerPercentage = Number(monthData.expectedVolumeTankers) / Number(monthData.totalInfluent);
  
  return {
    processingEfficiency,
    irrigationUtilization,
    directSewagePercentage,
    tankerPercentage
  };
};

// Calculate efficiency statistics
export const calculateEfficiencyStats = (data: typeof stpDailyData) => {
  if (!data || data.length === 0) return null;
  
  const totalInfluent = data.reduce((sum, day) => sum + day.totalInfluent, 0);
  const totalProcessed = data.reduce((sum, day) => sum + day.totalWaterProcessed, 0);
  const totalIrrigation = data.reduce((sum, day) => sum + day.tseToIrrigation, 0);
  
  return {
    processingEfficiency: totalProcessed / totalInfluent,
    irrigationUtilization: totalIrrigation / totalProcessed,
    averageInfluentVolume: totalInfluent / data.length,
    averageProcessingVolume: totalProcessed / data.length,
    totalDays: data.length
  };
};
