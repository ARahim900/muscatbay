
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { parseCSVFromClipboard, saveWaterData } from '@/utils/waterDataUtils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { WaterMeterReading } from '@/types/water';

const ImportWaterData: React.FC = () => {
  const [csvText, setCsvText] = useState<string>('');
  const [parsedData, setParsedData] = useState<WaterMeterReading[]>([]);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    const reader = new FileReader();

    reader.onload = async (e: any) => {
      const text = e.target.result;
      setCsvText(text);
      await handleParseText(text);
    };

    reader.readAsText(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCsvText(e.target.value);
  };

  const handleParseText = async (text: string = csvText) => {
    setIsParsing(true);
    try {
      const data = await parseCSVFromClipboard(text);
      setParsedData(data);
      toast.success(`Successfully parsed ${data.length} records`);
    } catch (error: any) {
      toast.error(error.message || "Failed to parse CSV data");
    } finally {
      setIsParsing(false);
    }
  };

  const handleParse = () => {
    handleParseText(csvText);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveWaterData(parsedData);
      toast.success("Water data saved successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to save water data");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-semibold mb-4">Import Water Meter Readings</h2>

      {/* Dropzone */}
      <div {...getRootProps()} className="border-2 border-dashed rounded-md p-4 mb-4 cursor-pointer">
        <input {...getInputProps()} />
        {isDragActive ? (
          <p className="text-center text-gray-600">Drop the files here ...</p>
        ) : (
          <p className="text-center text-gray-600">
            Drag 'n' drop some files here, or click to select files
          </p>
        )}
      </div>

      {/* Textarea for manual input */}
      <div className="mb-4">
        <Label htmlFor="csvText">Or enter CSV text here:</Label>
        <Textarea
          id="csvText"
          value={csvText}
          onChange={handleTextChange}
          className="mt-1 w-full"
          rows={5}
        />
      </div>

      {/* Parse Button */}
      <Button onClick={handleParse} disabled={isParsing} className="mb-4">
        {isParsing ? "Parsing..." : "Parse CSV Data"}
      </Button>

      {/* Display Parsed Data */}
      {parsedData.length > 0 && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Parsed Data:</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300">
              <thead>
                <tr>
                  {Object.keys(parsedData[0]).map((key) => (
                    <th key={key} className="border border-gray-300 p-2">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parsedData.map((row, index) => (
                  <tr key={index}>
                    {Object.values(row).map((value, i) => (
                      <td key={i} className="border border-gray-300 p-2">
                        {String(value)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Save Button */}
      {parsedData.length > 0 && (
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Water Data"}
        </Button>
      )}
    </div>
  );
};

export default ImportWaterData;
