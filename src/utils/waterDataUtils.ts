import { supabase } from '@/lib/supabase';
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
    
    const transformedData: WaterData[] = data.map(row => {
      const monthlyReadings: { [key: string]: number | null } = {};
      
      // Dynamically collect monthly readings based on headers
      headers.forEach(header => {
        if (header.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i)) {
          const year = new Date().getFullYear();
          const monthYear = `${header}-${year}`;
          try {
            const parsedDate = parse(monthYear, 'MMM-yyyy', new Date());
            const isoDate = parsedDate.toISOString().slice(0, 7); // Format as YYYY-MM
            monthlyReadings[isoDate] = row[header] ? parseFloat(row[header]) : null;
          } catch (dateError) {
            console.error(`Error parsing date ${monthYear}:`, dateError);
          }
        }
      });
      
      return {
        meterLabel: row['Meter Label'] || row['Meter_Label'] || row['MeterLabel'] || 'N/A',
        accountNumber: row['Acct #'] || row['Acct#'] || row['AccountNumber'] || 'N/A',
        zone: row['Zone'] || 'N/A',
        type: row['Type'] || 'N/A',
        parentMeter: row['Parent Meter'] || row['ParentMeter'] || '',
        monthlyReadings: monthlyReadings,
      };
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
      .filter(item => !existingMeterLabels.has(item.meterLabel))
      .map(item => ({
        meter_label: item.meterLabel,
        account_number: item.accountNumber,
        zone: item.zone,
        type: item.type,
        parent_meter: item.parentMeter || null,
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
      const meterId = meterMap.get(item.meterLabel);
      if (!meterId) continue;
      
      for (const [month, value] of Object.entries(item.monthlyReadings)) {
        if (value !== null && value !== undefined) {
          readingsToInsert.push({
            meter_id: meterId,
            reading_date: month,
            consumption: value,
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
