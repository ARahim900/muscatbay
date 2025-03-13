
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Upload } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Papa from 'papaparse';

interface WaterData {
  meter_label: string;
  account_number: string;
  zone: string;
  type: string;
  parent_meter: string;
  jan_24: number;
  feb_24: number;
  mar_24: number;
  apr_24: number;
  may_24: number;
  jun_24: number;
  jul_24: number;
  aug_24: number;
  sep_24: number;
  oct_24: number;
  nov_24: number;
  dec_24: number;
  jan_25: number;
  feb_25: number;
  total: number;
}

// Define a more specific type for the CSV row data
interface CSVRowData {
  'Meter Label': string;
  'Acct #': string;
  'Zone': string;
  'Type': string;
  'Parent Meter': string;
  'Jan-24': string;
  'Feb-24': string;
  'Mar-24': string;
  'Apr-24': string;
  'May-24': string;
  'Jun-24': string;
  'Jul-24': string;
  'Aug-24': string;
  'Sep-24': string;
  'Oct-24': string;
  'Nov-24': string;
  'Dec-24': string;
  'Jan-25': string;
  'Feb-25': string;
  'Total': string;
  [key: string]: string; // Allow for additional properties
}

const ImportWaterData: React.FC = () => {
  const [importing, setImporting] = useState(false);
  
  const handlePasteData = async () => {
    try {
      setImporting(true);
      
      // Request clipboard content
      const text = await navigator.clipboard.readText();
      if (!text) {
        toast({
          title: "No data on clipboard",
          description: "Please copy some CSV data to your clipboard first.",
          variant: "destructive"
        });
        return;
      }
      
      // Parse CSV from clipboard
      Papa.parse<CSVRowData>(text, {
        header: true,
        skipEmptyLines: true,
        complete: async (results: Papa.ParseResult<CSVRowData>) => {
          const { data, errors } = results;
          
          if (errors.length > 0) {
            console.error("Error parsing CSV:", errors);
            toast({
              title: "Error parsing data",
              description: "The clipboard data couldn't be parsed as CSV.",
              variant: "destructive"
            });
            return;
          }
          
          if (data.length === 0) {
            toast({
              title: "No data found",
              description: "The clipboard contains CSV headers but no data rows.",
              variant: "destructive"
            });
            return;
          }
          
          console.log("Parsed data:", data);
          
          // Transform data for Supabase
          const transformedData: WaterData[] = data.map((row: CSVRowData) => ({
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
          
          // Clear existing data
          const { error: clearError } = await supabase
            .from('water_distribution_master')
            .delete()
            .neq('id', 0); // Delete all records
            
          if (clearError) {
            console.error("Error clearing existing data:", clearError);
            toast({
              title: "Error clearing existing data",
              description: clearError.message,
              variant: "destructive"
            });
            return;
          }
          
          // Insert new data
          const { error: insertError } = await supabase
            .from('water_distribution_master')
            .insert(transformedData);
            
          if (insertError) {
            console.error("Error inserting data:", insertError);
            toast({
              title: "Error importing data",
              description: insertError.message,
              variant: "destructive"
            });
            return;
          }
          
          // Refresh materialized views
          await supabase.rpc('refresh_water_consumption_views');
          
          toast({
            title: "Data imported successfully",
            description: `Imported ${transformedData.length} water distribution records.`
          });
          
          console.log(`Imported ${transformedData.length} records`);
        },
        error: (error: Papa.ParseError) => {
          console.error("Error parsing CSV:", error);
          toast({
            title: "Error parsing data",
            description: "Could not parse the clipboard content.",
            variant: "destructive"
          });
        }
      });
    } catch (error) {
      console.error("Error during import:", error);
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setImporting(false);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-medium text-gray-700 mb-4 flex items-center">
        <FileText className="h-5 w-5 mr-2 text-gray-500" />
        Import Water Distribution Data
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        Copy water distribution data from Excel or similar spreadsheet applications to your clipboard, 
        then click the button below to import. The data should include columns for Meter Label, Acct #, 
        Zone, Type, Parent Meter, and monthly consumption values.
      </p>
      <Button 
        onClick={handlePasteData}
        disabled={importing}
        className="flex items-center"
      >
        <Upload className="mr-2 h-4 w-4" />
        {importing ? "Importing..." : "Import from Clipboard"}
      </Button>
    </div>
  );
};

export default ImportWaterData;
