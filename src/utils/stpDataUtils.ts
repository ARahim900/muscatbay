
import { supabase } from '@/integrations/supabase/client';
import { STPDailyData } from '@/types/stp';

export const importSTPData = async (data: STPDailyData[]): Promise<{ success: boolean; message: string }> => {
  try {
    if (!Array.isArray(data) || data.length === 0) {
      return { success: false, message: "Invalid data format." };
    }
    
    const { error } = await supabase.from('stp_daily_data').insert(data.map(item => ({
      date: item.date,
      tanker_trips: item.tankerTrips,
      expected_volume_tankers: item.expectedVolumeTankers,
      direct_sewage_mb: item.directSewageMB,
      total_influent: item.totalInfluent,
      total_water_processed: item.totalWaterProcessed,
      tse_to_irrigation: item.tseToIrrigation
    })));
    
    if (error) {
      console.error("Error inserting STP data:", error);
      return { success: false, message: `Failed to import STP data: ${error.message}` };
    }
    
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
    const { data, error } = await supabase
      .from('stp_daily_data')
      .select('*')
      .order('date', { ascending: false });
      
    if (error) throw error;
    
    return data?.map(item => ({
      date: item.date,
      tankerTrips: item.tanker_trips,
      expectedVolumeTankers: item.expected_volume_tankers,
      directSewageMB: item.direct_sewage_mb,
      totalInfluent: item.total_influent,
      totalWaterProcessed: item.total_water_processed,
      tseToIrrigation: item.tse_to_irrigation,
      utilizationPercentage: item.utilization_percentage,
      processingEfficiency: item.processing_efficiency
    }));
  } catch (error) {
    console.error("Error fetching STP data:", error);
    throw new Error("Failed to fetch STP data");
  }
};
