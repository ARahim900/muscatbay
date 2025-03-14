
import { toast } from "sonner";
import { STPDailyData } from "@/types/stp";
import { supabase } from "@/integrations/supabase/client";

interface RawSTPDataRow {
  date: string;
  'Total Treated Water Produced - m³': string;
  'Total TSE Water Output to Irrigation - m³': string;
  'Total Inlet Sewage Received from (MB+Tnk) -m³': string;
  'Number of Tankers Discharged:': string;
  'Expected Tanker Volume (m³) (20 m3)': string;
  'Direct In line Sewage (MB)': string;
}

export const parseRawSTPData = (rawData: string): STPDailyData[] => {
  try {
    // Split by rows
    const rows = rawData.trim().split('\n');
    
    // Get headers from first row
    const headers = rows[0].split('\t');
    
    // Process data rows
    const parsedData: STPDailyData[] = [];
    
    for (let i = 1; i < rows.length; i++) {
      const values = rows[i].split('\t');
      const rowData: Record<string, string> = {};
      
      // Map each column value to its header
      headers.forEach((header, index) => {
        rowData[header] = values[index];
      });
      
      // Convert to the required format
      const dateStr = rowData['date'];
      // Parse date from DD/MM/YYYY to YYYY-MM-DD format
      const dateParts = dateStr.split('/');
      const formattedDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
      
      parsedData.push({
        date: formattedDate,
        totalWaterProcessed: parseFloat(rowData['Total Treated Water Produced - m³']),
        tseToIrrigation: parseFloat(rowData['Total TSE Water Output to Irrigation - m³']),
        totalInfluent: parseFloat(rowData['Total Inlet Sewage Received from (MB+Tnk) -m³']),
        tankerTrips: parseInt(rowData['Number of Tankers Discharged:'], 10),
        expectedVolumeTankers: parseInt(rowData['Expected Tanker Volume (m³) (20 m3)'], 10),
        directSewageMB: parseFloat(rowData['Direct In line Sewage (MB)'])
      });
    }
    
    return parsedData;
  } catch (error) {
    console.error("Error parsing STP data:", error);
    toast.error("Failed to parse the STP data. Please check the format.");
    return [];
  }
};

export const importSTPData = async (rawData: string): Promise<{success: boolean, message: string}> => {
  try {
    const parsedData = parseRawSTPData(rawData);
    
    if (parsedData.length === 0) {
      return { success: false, message: "No data was parsed from the input" };
    }
    
    // If database is configured, save to Supabase
    if (supabase) {
      // First, check for existing records to avoid duplicates
      const dates = parsedData.map(item => item.date);
      
      const { data: existingRecords } = await supabase
        .from('stp_daily_data')
        .select('date')
        .in('date', dates);
      
      const existingDates = new Set(existingRecords?.map(record => record.date) || []);
      
      // Filter out records that already exist
      const newRecords = parsedData.filter(item => !existingDates.has(item.date));
      
      if (newRecords.length === 0) {
        return { success: true, message: "All records already exist in the database" };
      }
      
      // Insert new records
      const { error } = await supabase
        .from('stp_daily_data')
        .insert(newRecords.map(item => ({
          date: item.date,
          total_water_processed: item.totalWaterProcessed,
          tse_to_irrigation: item.tseToIrrigation,
          total_influent: item.totalInfluent,
          tanker_trips: item.tankerTrips,
          expected_volume_tankers: item.expectedVolumeTankers,
          direct_sewage_mb: item.directSewageMB
        })));
      
      if (error) {
        console.error("Error saving data to Supabase:", error);
        return { 
          success: false, 
          message: `Failed to save data: ${error.message}` 
        };
      }
      
      return { 
        success: true, 
        message: `Successfully imported ${newRecords.length} new records` 
      };
    }
    
    // If no database, just return success with the parsed data
    return { 
      success: true, 
      message: `Successfully parsed ${parsedData.length} records` 
    };
  } catch (error) {
    console.error("Error importing STP data:", error);
    return { 
      success: false, 
      message: `Error importing data: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
};
