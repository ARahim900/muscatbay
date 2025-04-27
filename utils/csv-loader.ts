import Papa from "papaparse"

/**
 * Loads a CSV file and returns the parsed data
 * @param filePath Path to the CSV file
 * @returns Promise with the parsed data
 */
export async function loadCsvFile(filePath: string) {
  try {
    const response = await fetch(filePath)
    if (!response.ok) {
      throw new Error(`Failed to load CSV file: ${response.statusText}`)
    }

    const csvText = await response.text()
    return parseCsvData(csvText)
  } catch (error: any) {
    console.error("Error loading CSV file:", error)
    throw error
  }
}

/**
 * Parses CSV text data into an array of objects
 * @param csvText CSV text content
 * @returns Parsed data as an array of objects
 */
export function parseCsvData(csvText: string) {
  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        if (results.errors && results.errors.length > 0) {
          console.warn("CSV parsing had errors:", results.errors)
        }
        resolve(results.data)
      },
      error: (error) => {
        reject(error)
      },
    })
  })
}

/**
 * Processes STP data to convert string values to numbers where appropriate
 * @param data Raw STP data
 * @returns Processed STP data
 */
export function processSTPData(data: any[]) {
  return data.map((row) => {
    const processed = { ...row }

    // Convert numeric string values to numbers
    const numericFields = [
      "Number of Tankers Trips:",
      "Expected Tanker Volume (m³) (20 m3)",
      "Direct In line Sewage (MB)",
      "Total Inlet Sewage Received from (MB+Tnk) -m³",
      "Total Treated Water Produced - m³",
      "Total TSE Water Production",
    ]

    numericFields.forEach((field) => {
      if (field in processed && processed[field] !== null && processed[field] !== undefined) {
        const value = processed[field].toString().replace(/,/g, "")
        processed[field] = isNaN(Number(value)) ? processed[field] : Number(value)
      }
    })

    return processed
  })
}

/**
 * Processes electricity consumption data to convert string values to numbers
 * @param data Raw electricity data
 * @returns Processed electricity data
 */
export function processElectricityData(data: any[]) {
  return data.map((row) => {
    const processed = { ...row }

    // Get all month fields (Apr-24, May-24, etc.)
    const monthFields = Object.keys(row).filter((key) =>
      /^(Jan|Feb|Mar|Apr|May|Jun|June|Jul|July|Aug|August|Sep|September|Oct|October|Nov|November|Dec|December)-\d{2}$/.test(
        key,
      ),
    )

    // Convert month values to numbers
    monthFields.forEach((field) => {
      if (field in processed && processed[field] !== null && processed[field] !== undefined) {
        const value = processed[field].toString().replace(/,/g, "").replace(/"/g, "")
        processed[field] = isNaN(Number(value)) ? processed[field] : Number(value)
      }
    })

    return processed
  })
}

/**
 * Processes water consumption data to convert string values to numbers
 * @param data Raw water data
 * @returns Processed water data
 */
export function processWaterData(data: any[]) {
  return data.map((row) => {
    const processed = { ...row }

    // Get all month fields (Jan-24, Feb-24, etc.)
    const monthFields = Object.keys(row).filter((key) =>
      /^(Jan|Feb|Mar|Apr|May|Jun|June|Jul|July|Aug|August|Sep|September|Oct|October|Nov|November|Dec|December)-\d{2}$/.test(
        key,
      ),
    )

    // Convert month values to numbers
    monthFields.forEach((field) => {
      if (field in processed && processed[field] !== null && processed[field] !== undefined) {
        const value = processed[field].toString().replace(/,/g, "")
        processed[field] = isNaN(Number(value)) ? processed[field] : Number(value)
      }
    })

    return processed
  })
}
