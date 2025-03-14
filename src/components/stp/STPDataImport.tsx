
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertTriangle, CheckCircle2, Upload } from "lucide-react";
import { toast } from "sonner";
import { importSTPData } from "@/utils/stpDataImport";

interface STPDataImportProps {
  onImportSuccess?: () => void;
}

const STPDataImport: React.FC<STPDataImportProps> = ({ onImportSuccess }) => {
  const [rawData, setRawData] = useState<string>('');
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importResult, setImportResult] = useState<{ success?: boolean; message?: string; }>({});
  
  const handleImport = async () => {
    if (!rawData.trim()) {
      toast.error("Please paste data before importing");
      return;
    }
    
    setIsImporting(true);
    setImportResult({});
    
    try {
      const result = await importSTPData(rawData);
      setImportResult(result);
      
      if (result.success) {
        toast.success(result.message);
        if (onImportSuccess) {
          onImportSuccess();
        }
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error importing data:", error);
      setImportResult({
        success: false,
        message: error instanceof Error ? error.message : "An unknown error occurred"
      });
      toast.error("Failed to import data");
    } finally {
      setIsImporting(false);
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Import STP Data</CardTitle>
        <CardDescription>
          Paste tab-separated STP operational data to import into the system
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea 
          placeholder="Paste tab-separated STP data here..."
          className="min-h-[200px] font-mono text-sm"
          value={rawData}
          onChange={(e) => setRawData(e.target.value)}
          disabled={isImporting}
        />
        
        {importResult.message && (
          <Alert variant={importResult.success ? "default" : "destructive"}>
            {importResult.success ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <AlertTitle>
              {importResult.success ? "Import Successful" : "Import Failed"}
            </AlertTitle>
            <AlertDescription>
              {importResult.message}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleImport} 
          disabled={isImporting || !rawData.trim()}
          className="w-full"
        >
          {isImporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Importing...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Import Data
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default STPDataImport;
