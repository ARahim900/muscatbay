
import { supabase } from '@/integrations/supabase/client';
import type { STPDailyData, STPMonthlyData } from '@/types/stp';

/**
 * Fetches all STP daily data from Supabase
 */
export const fetchSTPDailyData = async (): Promise<{ data: STPDailyData[] | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('stp_daily_data')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) {
      console.error("Error fetching STP daily data:", error);
      return { data: null, error: error.message };
    }
    
    return { data, error: null };
  } catch (error) {
    console.error("Error fetching STP daily data:", error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : "Unknown error occurred" 
    };
  }
};

/**
 * Fetches STP daily data for a specific date range
 */
export const fetchSTPDailyDataByDateRange = async (
  startDate: string, 
  endDate: string
): Promise<{ data: STPDailyData[] | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('stp_daily_data')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });
    
    if (error) {
      console.error("Error fetching STP daily data by date range:", error);
      return { data: null, error: error.message };
    }
    
    return { data, error: null };
  } catch (error) {
    console.error("Error fetching STP daily data by date range:", error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : "Unknown error occurred" 
    };
  }
};

/**
 * Fetches all STP monthly data from Supabase
 */
export const fetchSTPMonthlyData = async (): Promise<{ data: STPMonthlyData[] | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('stp_monthly_data')
      .select('*')
      .order('month', { ascending: true });
    
    if (error) {
      console.error("Error fetching STP monthly data:", error);
      return { data: null, error: error.message };
    }
    
    return { data, error: null };
  } catch (error) {
    console.error("Error fetching STP monthly data:", error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : "Unknown error occurred" 
    };
  }
};

/**
 * Creates or updates STP daily data
 */
export const upsertSTPDailyData = async (
  stpData: Omit<STPDailyData, 'id' | 'created_at' | 'updated_at'>
): Promise<{ success: boolean; message: string; id?: string }> => {
  try {
    // Check if data exists for this date
    const { data: existingData, error: checkError } = await supabase
      .from('stp_daily_data')
      .select('id')
      .eq('date', stpData.date);
    
    if (checkError) {
      console.error("Error checking existing STP data:", checkError);
      return { 
        success: false, 
        message: "Error checking existing STP data: " + checkError.message
      };
    }
    
    // If data exists for this date, update it
    if (existingData && existingData.length > 0) {
      const { error: updateError } = await supabase
        .from('stp_daily_data')
        .update({
          ...stpData,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingData[0].id);
      
      if (updateError) {
        console.error("Error updating STP daily data:", updateError);
        return { 
          success: false, 
          message: "Failed to update STP daily data: " + updateError.message
        };
      }
      
      return { 
        success: true, 
        message: "STP daily data updated successfully.",
        id: existingData[0].id
      };
    }
    
    // If no data exists for this date, insert new record
    const { data: insertedData, error: insertError } = await supabase
      .from('stp_daily_data')
      .insert([stpData])
      .select();
    
    if (insertError) {
      console.error("Error inserting STP daily data:", insertError);
      return { 
        success: false, 
        message: "Failed to insert STP daily data: " + insertError.message
      };
    }
    
    return { 
      success: true, 
      message: "STP daily data inserted successfully.",
      id: insertedData?.[0]?.id
    };
  } catch (error) {
    console.error("Error upserting STP daily data:", error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
};

/**
 * Updates STP monthly data or inserts new record if it doesn't exist
 */
export const upsertSTPMonthlyData = async (
  monthlyData: Omit<STPMonthlyData, 'id' | 'created_at' | 'updated_at'>
): Promise<{ success: boolean; message: string; id?: string }> => {
  try {
    // Check if data exists for this month
    const { data: existingData, error: checkError } = await supabase
      .from('stp_monthly_data')
      .select('id')
      .eq('month', monthlyData.month);
    
    if (checkError) {
      console.error("Error checking existing STP monthly data:", checkError);
      return { 
        success: false, 
        message: "Error checking existing STP monthly data: " + checkError.message
      };
    }
    
    // If data exists for this month, update it
    if (existingData && existingData.length > 0) {
      const { error: updateError } = await supabase
        .from('stp_monthly_data')
        .update({
          ...monthlyData,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingData[0].id);
      
      if (updateError) {
        console.error("Error updating STP monthly data:", updateError);
        return { 
          success: false, 
          message: "Failed to update STP monthly data: " + updateError.message
        };
      }
      
      return { 
        success: true, 
        message: "STP monthly data updated successfully.",
        id: existingData[0].id
      };
    }
    
    // If no data exists for this month, insert new record
    const { data: insertedData, error: insertError } = await supabase
      .from('stp_monthly_data')
      .insert([monthlyData])
      .select();
    
    if (insertError) {
      console.error("Error inserting STP monthly data:", insertError);
      return { 
        success: false, 
        message: "Failed to insert STP monthly data: " + insertError.message
      };
    }
    
    return { 
      success: true, 
      message: "STP monthly data inserted successfully.",
      id: insertedData?.[0]?.id
    };
  } catch (error) {
    console.error("Error upserting STP monthly data:", error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
};
