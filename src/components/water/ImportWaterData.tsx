
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import ImportInstructions from './ImportInstructions';
import { parseCSVFromClipboard, saveWaterData } from '@/utils/waterDataUtils';
import { WaterData } from '@/types/water';

const ImportWaterData: React.FC = () => {
  const [importing, setImporting] = useState(false);
  
  const handlePasteData = async () => {
    try {
      setImporting(true);
      
      parseCSVFromClipboard(
        // Success callback
        async (transformedData: WaterData[]) => {
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
          
          setImporting(false);
        },
        // Error callback
        (errorMessage: string) => {
          toast({
            title: "Error parsing data",
            description: errorMessage,
            variant: "destructive"
          });
          setImporting(false);
        }
      );
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
