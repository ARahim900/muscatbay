
import { WaterMeterRow } from "@/types/water-system";

/**
 * Processes water meter raw data
 * @param rawDataArray Array of raw water meter data
 * @returns Processed water meter data
 */
export function processWaterMeterData(rawDataArray: any[]): WaterMeterRow[] {
  const allMonths = [
    "Jan-24", "Feb-24", "Mar-24", "Apr-24", "May-24", "Jun-24", 
    "Jul-24", "Aug-24", "Sep-24", "Oct-24", "Nov-24", "Dec-24",
    "Jan-25", "Feb-25", "Mar-25"
  ];
  
  return rawDataArray
    .map((row) => {
      const processedRow: WaterMeterRow = {
        meterLabel: String(row["Meter Label"] || "").trim(),
        acctNum: String(row["Acct #"] || "").trim(),
        zone: String(row.Zone || "Unknown").trim(),
        type: String(row.Type || "Unknown").trim(),
        parentMeterLabel: String(row["Parent Meter"] || "").trim() || null,
        label: String(row.Label || row["Level "] || "Unknown").trim()
      };

      // Normalize common variations
      if (processedRow.zone === "Direct Connection") processedRow.zone = "Direct Connection ";
      if (processedRow.zone === "Zone_03_(A)") processedRow.zone = "Zone_03_(A)";
      if (processedRow.zone === "Zone_03_(B)") processedRow.zone = "Zone_03_(B)";

      // Ensure all potential month columns are numbers
      allMonths.forEach((key) => {
        processedRow[key] = key in row ? Number(row[key]) || 0 : 0;
      });
      
      return processedRow;
    })
    .filter((row) => row.meterLabel && row.meterLabel !== "Unknown" && row.label && row.label !== "Unknown");
}

/**
 * Format numbers with commas
 * @param num Number to format
 * @returns Formatted number string
 */
export function formatNumber(num: number | undefined): string {
  return isNaN(Number(num)) || num === null || num === undefined ? "0" : Math.round(Number(num)).toLocaleString();
}

/**
 * Format percentage values
 * @param value Percentage value
 * @param decimals Number of decimal places
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number, decimals = 1): string {
  if (isNaN(value) || value === null || value === undefined || !isFinite(value)) return "0.0%";
  const factor = Math.pow(10, decimals);
  const roundedValue = Math.round(value * factor) / factor;
  return `${roundedValue.toFixed(decimals)}%`;
}

/**
 * Get color based on loss percentage
 * @param lossPercentage Loss percentage value
 * @param theme Color theme object
 * @returns Color from theme
 */
export function getLossStatusColor(lossPercentage: number, theme: any): string {
  if (isNaN(lossPercentage) || lossPercentage === null || lossPercentage === undefined || !isFinite(lossPercentage))
    return theme.secondary;
  if (lossPercentage > 20) return theme.error;
  if (lossPercentage > 10) return theme.warning;
  if (lossPercentage >= 0) return theme.success;
  return theme.accent;
}

/**
 * Get status text based on loss percentage
 * @param lossPercentage Loss percentage value
 * @returns Status text
 */
export function getLossStatusText(lossPercentage: number): string {
  if (isNaN(lossPercentage) || lossPercentage === null || lossPercentage === undefined || !isFinite(lossPercentage))
    return "Unknown";
  if (lossPercentage > 20) return "High Loss";
  if (lossPercentage > 10) return "Medium Loss";
  if (lossPercentage >= 0) return "Good";
  return "Gain";
}
