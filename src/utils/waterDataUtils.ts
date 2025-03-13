
import { CSVRowData, WaterData } from '@/types/water';
import Papa from 'papaparse';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

export const parseCSVFromClipboard = async (
  onSuccess: (data: WaterData[]) => void,
  onError: (message: string) => void
) => {
  try {
    const text = await navigator.clipboard.readText();
    if (!text) {
      onError("Please copy some CSV data to your clipboard first.");
      return;
    }
    
    Papa.parse<CSVRowData>(text, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const { data, errors } = results;
        
        if (errors.length > 0) {
          console.error("Error parsing CSV:", errors);
          onError("The clipboard data couldn't be parsed as CSV.");
          return;
        }
        
        if (data.length === 0) {
          onError("The clipboard contains CSV headers but no data rows.");
          return;
        }
        
        console.log("Parsed data:", data);
        const transformedData = transformCSVData(data);
        onSuccess(transformedData);
      },
      error: (error: Error | string) => {
        const errorMessage = typeof error === 'string' ? error : error.message;
        console.error("Error parsing CSV:", errorMessage);
        onError("Could not parse the clipboard content.");
      }
    });
  } catch (error) {
    console.error("Error reading clipboard:", error);
    onError("Failed to read clipboard data.");
  }
};

export const transformCSVData = (csvData: CSVRowData[]): WaterData[] => {
  return csvData.map((row: CSVRowData) => ({
    meter_label: row['Meter Label'] || '',
    account_number: row['Acct #'] || '',
    zone: row['Zone'] || '',
    type: row['Type'] || '',
    parent_meter: row['Parent Meter'] || '',
    jan_24: parseFloat(row['Jan-24']) || 0,
    feb_24: parseFloat(row['Feb-24']) || 0,
    mar_24: parseFloat(row['Mar-24']) || 0,
    apr_24: parseFloat(row['Apr-24']) || 0,
    may_24: parseFloat(row['May-24']) || 0,
    jun_24: parseFloat(row['Jun-24']) || 0,
    jul_24: parseFloat(row['Jul-24']) || 0,
    aug_24: parseFloat(row['Aug-24']) || 0,
    sep_24: parseFloat(row['Sep-24']) || 0,
    oct_24: parseFloat(row['Oct-24']) || 0,
    nov_24: parseFloat(row['Nov-24']) || 0,
    dec_24: parseFloat(row['Dec-24']) || 0,
    jan_25: parseFloat(row['Jan-25']) || 0,
    feb_25: parseFloat(row['Feb-25']) || 0,
    total: parseFloat(row['Total']) || 0
  }));
};

export const saveWaterData = async (data: WaterData[]): Promise<{ success: boolean; message: string }> => {
  try {
    // Clear existing data
    const { error: clearError } = await supabase
      .from('water_distribution_master')
      .delete()
      .neq('id', 0); // Delete all records
      
    if (clearError) {
      console.error("Error clearing existing data:", clearError);
      return { 
        success: false, 
        message: clearError.message 
      };
    }
    
    // Insert new data
    const { error: insertError } = await supabase
      .from('water_distribution_master')
      .insert(data);
      
    if (insertError) {
      console.error("Error inserting data:", insertError);
      return { 
        success: false, 
        message: insertError.message 
      };
    }
    
    // Refresh materialized views
    await supabase.rpc('refresh_water_consumption_views');
    
    return {
      success: true,
      message: `Imported ${data.length} water distribution records.`
    };
    
  } catch (error) {
    console.error("Error during data save:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
};
