
import { toast } from "sonner";
import { WaterMeterReading } from "@/types/water";

// Function to handle errors in a consistent way
export const handleError = (error: any) => {
  const errorMessage = error?.message || "Unknown error occurred";
  toast.error(errorMessage);
  console.error("Error:", error);
};

// Parse CSV data from clipboard
export const parseCSVFromClipboard = async (text: string): Promise<WaterMeterReading[]> => {
  try {
    // Basic CSV parsing implementation
    const rows = text.trim().split("\n");
    const headers = rows[0].split(",");
    
    // Map each row to a WaterMeterReading object
    const data: WaterMeterReading[] = [];
    
    for (let i = 1; i < rows.length; i++) {
      const values = rows[i].split(",");
      const reading: any = {};
      
      headers.forEach((header, index) => {
        const key = header.trim();
        const value = values[index]?.trim() || "";
        reading[key] = key === "reading" ? Number(value) : value;
      });
      
      data.push(reading as WaterMeterReading);
    }
    
    return data;
  } catch (error) {
    handleError(error);
    throw new Error("Failed to parse CSV data");
  }
};

// Save water data to database
export const saveWaterData = async (data: WaterMeterReading[]): Promise<void> => {
  try {
    // This would normally contain the logic to save to a database
    // For now, let's just simulate a successful save
    console.log("Saving water data:", data);
    toast.success(`Successfully imported ${data.length} water meter readings`);
  } catch (error) {
    handleError(error);
    throw new Error("Failed to save water data");
  }
};
