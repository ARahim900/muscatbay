
import React, { useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import ImportInstructions from './ImportInstructions';
import ImportButton from './ImportButton';
import { parseCSVFromClipboard, saveWaterData } from '@/utils/waterDataUtils';
import { WaterData } from '@/types/water';

const ImportWaterData: React.FC = () => {
  const [importing, setImporting] = useState(false);
  
  const handleImportSuccess = async (transformedData: WaterData[]) => {
    try {
      const result = await saveWaterData(transformedData);
      
      if (result.success) {
        toast({
          title: "Data imported successfully",
          description: result.message
        });
      } else {
        toast({
          title: "Error importing data",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error saving data:", error);
      toast({
        title: "Error saving data",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setImporting(false);
    }
  };
  
  const handleImportError = (errorMessage: string) => {
    toast({
      title: "Error parsing data",
      description: errorMessage,
      variant: "destructive"
    });
    setImporting(false);
  };
  
  const handlePasteData = async () => {
    try {
      setImporting(true);
      await parseCSVFromClipboard(undefined, handleImportSuccess, handleImportError);
    } catch (error) {
      console.error("Error during import:", error);
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
      setImporting(false);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <ImportInstructions />
      <ImportButton 
        onClick={handlePasteData}
        isLoading={importing}
      />
    </div>
  );
};

export default ImportWaterData;
