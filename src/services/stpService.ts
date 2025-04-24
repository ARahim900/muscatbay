
import { STPDailyRecord, STPMonthlyData } from '@/types/stp';

export const fetchSTPDailyData = async (): Promise<STPDailyRecord[]> => {
  // Mock data
  const mockData: STPDailyRecord[] = [
    {
      id: 'stp001',
      date: '2023-04-15',
      plantId: 'plant-01',
      plantName: 'Main STP',
      influentFlow: 1250,
      effluentFlow: 1175,
      totalSuspendedSolids: 35.2,
      biochemicalOxygenDemand: 22.5,
      chemicalOxygenDemand: 68.4,
      pH: 7.2,
      dissolvedOxygen: 5.8,
      temperature: 26.3,
      remarks: 'Normal operation'
    },
    {
      id: 'stp002',
      date: '2023-04-16',
      plantId: 'plant-01',
      plantName: 'Main STP',
      influentFlow: 1280,
      effluentFlow: 1210,
      totalSuspendedSolids: 33.8,
      biochemicalOxygenDemand: 23.1,
      chemicalOxygenDemand: 67.9,
      pH: 7.3,
      dissolvedOxygen: 5.7,
      temperature: 26.5,
      remarks: 'Normal operation'
    }
  ];
  
  return mockData;
};

export const fetchSTPMonthlyData = async (): Promise<STPMonthlyData[]> => {
  // Mock data
  const mockData: STPMonthlyData[] = [
    {
      month: 'Jan 2023',
      tankerTrips: 120,
      expectedVolumeTankers: 3600,
      directSewageMB: 28500,
      totalInfluent: 32100,
      totalWaterProcessed: 30950,
      tseToIrrigation: 29400,
      utilizationPercentage: '92%',
      processingEfficiency: '96%',
      capacity: 35000
    },
    {
      month: 'Feb 2023',
      tankerTrips: 115,
      expectedVolumeTankers: 3450,
      directSewageMB: 27800,
      totalInfluent: 31250,
      totalWaterProcessed: 30100,
      tseToIrrigation: 28600,
      utilizationPercentage: '91%',
      processingEfficiency: '96%',
      capacity: 35000
    }
  ];
  
  return mockData;
};

export const processData = (data: STPDailyRecord[]): STPDailyRecord[] => {
  return data; // Add any processing needed here
};
