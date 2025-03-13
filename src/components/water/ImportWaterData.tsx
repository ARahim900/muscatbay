
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { FileUp, Check, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/components/ui/use-toast';

const ImportWaterData = () => {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalRows, setTotalRows] = useState(0);
  const [importedRows, setImportedRows] = useState(0);

  const processRawData = (data: string) => {
    // Split the data into rows
    const rows = data.trim().split('\n');
    
    // Extract headers
    const headers = rows[0].split('\t').map(h => h.trim());
    
    // Process the data rows
    const processedData = [];
    for (let i = 1; i < rows.length; i++) {
      const values = rows[i].split('\t').map(v => v.trim());
      if (values.length !== headers.length) continue;
      
      const row: any = {};
      headers.forEach((header, index) => {
        // Map the header names to database column names
        switch(header) {
          case 'Meter Label':
            row.meter_label = values[index];
            break;
          case 'Acct #':
            row.account_number = values[index];
            break;
          case 'Zone':
            row.zone = values[index];
            break;
          case 'Type':
            row.type = values[index];
            break;
          case 'Parent Meter':
            row.parent_meter = values[index];
            break;
          case 'Jan-24':
            row.jan_24 = values[index] === '' ? null : Number(values[index]);
            break;
          case 'Feb-24':
            row.feb_24 = values[index] === '' ? null : Number(values[index]);
            break;
          case 'Mar-24':
            row.mar_24 = values[index] === '' ? null : Number(values[index]);
            break;
          case 'Apr-24':
            row.apr_24 = values[index] === '' ? null : Number(values[index]);
            break;
          case 'May-24':
            row.may_24 = values[index] === '' ? null : Number(values[index]);
            break;
          case 'Jun-24':
            row.jun_24 = values[index] === '' ? null : Number(values[index]);
            break;
          case 'Jul-24':
            row.jul_24 = values[index] === '' ? null : Number(values[index]);
            break;
          case 'Aug-24':
            row.aug_24 = values[index] === '' ? null : Number(values[index]);
            break;
          case 'Sep-24':
            row.sep_24 = values[index] === '' ? null : Number(values[index]);
            break;
          case 'Oct-24':
            row.oct_24 = values[index] === '' ? null : Number(values[index]);
            break;
          case 'Nov-24':
            row.nov_24 = values[index] === '' ? null : Number(values[index]);
            break;
          case 'Dec-24':
            row.dec_24 = values[index] === '' ? null : Number(values[index]);
            break;
          case 'Jan-25':
            row.jan_25 = values[index] === '' ? null : Number(values[index]);
            break;
          case 'Feb-25':
            row.feb_25 = values[index] === '' ? null : Number(values[index]);
            break;
          case 'Total':
            row.total = values[index] === '' ? null : Number(values[index]);
            break;
        }
      });
      
      processedData.push(row);
    }
    
    return processedData;
  };

  const importWaterData = async (rawData: string) => {
    try {
      setImporting(true);
      setProgress(0);
      
      // Clear existing data
      await supabase.from('water_distribution_master').delete().neq('id', 0);
      
      // Process data
      const data = processRawData(rawData);
      setTotalRows(data.length);
      
      // Insert data in batches to avoid timeouts
      const batchSize = 50;
      let imported = 0;
      
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        const { error } = await supabase.from('water_distribution_master').insert(batch);
        
        if (error) {
          console.error('Error inserting batch:', error);
          toast({
            title: "Import Error",
            description: `Error importing data: ${error.message}`,
            variant: "destructive"
          });
          setImporting(false);
          return;
        }
        
        imported += batch.length;
        setImportedRows(imported);
        setProgress(Math.round((imported / data.length) * 100));
      }
      
      // Update the water_consumption_by_type view through a direct query
      const { error: viewError } = await supabase.rpc('refresh_water_consumption_views');
      
      if (viewError) {
        console.error('Error refreshing views:', viewError);
        toast({
          title: "View Refresh Error",
          description: `Data imported but error refreshing views: ${viewError.message}`,
          variant: "warning"
        });
      }
      
      toast({
        title: "Import Successful",
        description: `Successfully imported ${imported} water data records.`,
        variant: "default"
      });
      
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import Failed",
        description: "An unexpected error occurred during import.",
        variant: "destructive"
      });
    } finally {
      setImporting(false);
    }
  };

  const handlePasteData = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) {
        toast({
          title: "No Data",
          description: "No data found in clipboard. Please copy the data first.",
          variant: "destructive"
        });
        return;
      }
      
      // Confirm with the user
      if (confirm("Are you sure you want to import water distribution data? This will replace all existing data.")) {
        importWaterData(text);
      }
    } catch (error) {
      console.error('Clipboard error:', error);
      toast({
        title: "Clipboard Error",
        description: "Could not access clipboard data. Please check permissions.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileUp className="mr-2 h-5 w-5" />
          Import Water Distribution Data
        </CardTitle>
      </CardHeader>
      <CardContent>
        {importing ? (
          <div className="space-y-4">
            <Progress value={progress} />
            <p className="text-sm text-gray-500">
              Importing {importedRows} of {totalRows} rows ({progress}%)
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Import water distribution data from clipboard. Copy the data from your spreadsheet first.
            </p>
            <Button onClick={handlePasteData} className="w-full">
              <FileUp className="mr-2 h-4 w-4" />
              Paste Data from Clipboard
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ImportWaterData;
