
import { supabase } from '@/integrations/supabase/client';
import { WaterData } from '@/types/water';
import { parse } from 'date-fns';

export const parseCSVFromClipboard = async (
  clipboardData: string | undefined,
  onSuccess: (transformedData: WaterData[]) => void,
  onError: (errorMessage: string) => void
) => {
  try {
    const text = clipboardData || await navigator.clipboard.readText();
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(header => header.trim());
    
    const data = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(value => value.trim());
      if (values.length !== headers.length) continue;
      
      const item: any = {};
      for (let j = 0; j < headers.length; j++) {
        item[headers[j]] = values[j];
      }
      data.push(item);
    }
    
    const transformedData = data.map(row => {
      // Create an object that matches the WaterData structure
      const waterDataEntry: WaterData = {
        meter_label: row['Meter Label'] || row['Meter_Label'] || row['MeterLabel'] || 'N/A',
        account_number: row['Acct #'] || row['Acct#'] || row['AccountNumber'] || 'N/A',
        zone: row['Zone'] || 'N/A',
        type: row['Type'] || 'N/A',
        parent_meter: row['Parent Meter'] || row['ParentMeter'] || '',
        jan_24: 0,
        feb_24: 0,
        mar_24: 0,
        apr_24: 0,
        may_24: 0,
        jun_24: 0,
        jul_24: 0,
        aug_24: 0,
        sep_24: 0,
        oct_24: 0,
        nov_24: 0,
        dec_24: 0,
        jan_25: 0,
        feb_25: 0,
        total: 0
      };
      
      // Populate the monthly readings
      headers.forEach(header => {
        if (header.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i)) {
          const match = header.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-(\d{2})$/i);
          if (match) {
            const month = match[1].toLowerCase();
            const year = match[2];
            const fieldName = `${month}_${year}` as keyof WaterData;
            
            if (fieldName in waterDataEntry && row[header]) {
              (waterDataEntry as any)[fieldName] = parseFloat(row[header]) || 0;
            }
          }
        }
      });
      
      return waterDataEntry;
    });
    
    onSuccess(transformedData);
  } catch (error) {
    console.error("Error parsing CSV data:", error);
    onError(error instanceof Error ? error.message : "Failed to parse CSV data from clipboard.");
  }
};

export const saveWaterData = async (data: WaterData[]): Promise<{ success: boolean; message: string }> => {
  try {
    // First, validate the data
    if (!Array.isArray(data) || data.length === 0) {
      return { 
        success: false, 
        message: "Invalid data format. Please ensure you're importing valid water data." 
      };
    }
    
    // Check if we already have any of these meters in the database
    const { data: existingMeters, error: metersError } = await supabase
      .from('water_meters')
      .select('meter_label');
    
    if (metersError) {
      console.error("Error checking existing meters:", metersError);
      return { 
        success: false, 
        message: "Database error when checking existing meters." 
      };
    }
    
    const existingMeterLabels = new Set(existingMeters?.map(m => m.meter_label) || []);
    
    // Prepare data for insertion
    const metersToInsert = data
      .filter(item => !existingMeterLabels.has(item.meter_label))
      .map(item => ({
        meter_label: item.meter_label,
        account_number: item.account_number,
        zone: item.zone,
        type: item.type,
        parent_meter: item.parent_meter || null,
      }));
    
    // Insert new meters if any
    if (metersToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('water_meters')
        .insert(metersToInsert as unknown as Record<string, any>[]);
      
      if (insertError) {
        console.error("Error inserting new meters:", insertError);
        return { 
          success: false, 
          message: "Failed to insert new water meters. " + insertError.message 
        };
      }
    }
    
    // Now fetch all meters to get their IDs
    const { data: allMeters, error: fetchError } = await supabase
      .from('water_meters')
      .select('id, meter_label');
    
    if (fetchError) {
      console.error("Error fetching meters:", fetchError);
      return { 
        success: false, 
        message: "Database error when fetching meter IDs." 
      };
    }
    
    // Create mapping of meter labels to IDs
    const meterMap = new Map();
    allMeters?.forEach(meter => {
      meterMap.set(meter.meter_label, meter.id);
    });
    
    // Now prepare the consumption data
    const readingsToInsert = [];
    for (const item of data) {
      const meterId = meterMap.get(item.meter_label);
      if (!meterId) continue;
      
      // Create entries for each month's reading
      const months = ['jan_24', 'feb_24', 'mar_24', 'apr_24', 'may_24', 'jun_24', 
                      'jul_24', 'aug_24', 'sep_24', 'oct_24', 'nov_24', 'dec_24',
                      'jan_25', 'feb_25'];
                      
      for (const monthKey of months) {
        const value = (item as any)[monthKey];
        if (value !== null && value !== undefined && value > 0) {
          // Convert from jan_24 to 2024-01 format
          const parts = monthKey.split('_');
          const month = parts[0].substring(0, 3);
          const year = '20' + parts[1];
          const monthMap: Record<string, string> = {
            'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04', 'may': '05', 'jun': '06',
            'jul': '07', 'aug': '08', 'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
          };
          const formattedDate = `${year}-${monthMap[month]}`;
          
          readingsToInsert.push({
            meter_id: meterId,
            reading_date: formattedDate,
            consumption: value
          });
        }
      }
    }
    
    // Insert consumption data
    if (readingsToInsert.length > 0) {
      const { error: readingsError } = await supabase
        .from('water_consumption')
        .insert(readingsToInsert as unknown as Record<string, any>[]);
      
      if (readingsError) {
        console.error("Error inserting consumption data:", readingsError);
        return { 
          success: false, 
          message: "Failed to insert consumption data. " + readingsError.message 
        };
      }
    }
    
    return { 
      success: true, 
      message: `Successfully imported ${data.length} meters and ${readingsToInsert.length} consumption readings.` 
    };
  } catch (error) {
    console.error("Error in saveWaterData:", error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : "Unknown error occurred" 
    };
  }
};
