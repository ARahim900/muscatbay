/**
 * Transforms CSV data into a format usable by the application
 * @param csvData Raw CSV data as a string
 * @returns Processed data array
 */
export function transformCsvData(csvData: string) {
  if (!csvData || typeof csvData !== "string") {
    console.error("Invalid CSV data provided to transformCsvData")
    return []
  }

  try {
    // Split the CSV into lines
    const lines = csvData.trim().split("\n")

    // Extract headers from the first line
    const headers = lines[0].split(",").map((header) => header.trim())

    // Process each data row
    const result = lines.slice(1).map((line) => {
      const values = line.split(",")
      const row: Record<string, any> = {}

      // Map each value to its corresponding header
      headers.forEach((header, index) => {
        // Try to convert numeric values
        const value = values[index]?.trim() || ""
        const numValue = Number.parseFloat(value)
        row[header] = !isNaN(numValue) ? numValue : value
      })

      return row
    })

    return result
  } catch (error) {
    console.error("Error transforming CSV data:", error)
    return []
  }
}

/**
 * Formats a number for display
 * @param num Number to format
 * @returns Formatted number string
 */
export function formatNumber(num: number): string {
  if (isNaN(num) || num === null || num === undefined) return "0"
  return Math.round(num).toLocaleString()
}

/**
 * Formats a percentage for display
 * @param value Percentage value
 * @param decimals Number of decimal places
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number, decimals = 1): string {
  if (isNaN(value) || value === null || value === undefined || !isFinite(value)) return "N/A"
  const factor = Math.pow(10, decimals)
  const roundedValue = Math.round(value * factor) / factor
  return `${roundedValue.toFixed(decimals)}%`
}
