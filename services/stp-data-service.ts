import { loadCsvFile, processSTPData } from "@/utils/csv-loader"

// Define types for STP data
export interface STPData {
  Date: string
  "Number of Tankers Trips:": number
  "Expected Tanker Volume (m³) (20 m3)": number
  "Direct In line Sewage (MB)": number
  "Total Inlet Sewage Received from (MB+Tnk) -m³": number
  "Total Treated Water Produced - m³": number
  "Total TSE Water Production": number
  "Raw Sewage Inlet Flow (31.25 m3/hr)": string
  "Aeration DO (2 -3 ppm)": string
  "Raw Sewage pH (6.5 - 8.0)": string
  [key: string]: any
}

// Cache for STP data
let stpDataCache: STPData[] | null = null

/**
 * Loads STP data from the CSV file
 * @returns Promise with the processed STP data
 */
export async function loadSTPData(): Promise<STPData[]> {
  // Return cached data if available
  if (stpDataCache) {
    return stpDataCache
  }

  try {
    const rawData = await loadCsvFile("/database/stp/stp-master-database.csv")
    const processedData = processSTPData(rawData as any[]) as STPData[]

    // Cache the data
    stpDataCache = processedData

    return processedData
  } catch (error) {
    console.error("Error loading STP data:", error)
    throw error
  }
}

/**
 * Gets STP data for a specific date range
 * @param startDate Start date (optional)
 * @param endDate End date (optional)
 * @returns Filtered STP data
 */
export async function getSTPDataByDateRange(startDate?: string, endDate?: string): Promise<STPData[]> {
  const data = await loadSTPData()

  if (!startDate && !endDate) {
    return data
  }

  return data.filter((row) => {
    const rowDate = new Date(row.Date)

    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      return rowDate >= start && rowDate <= end
    } else if (startDate) {
      const start = new Date(startDate)
      return rowDate >= start
    } else if (endDate) {
      const end = new Date(endDate)
      return rowDate <= end
    }

    return true
  })
}

/**
 * Gets the latest STP data
 * @param count Number of records to return (default: 1)
 * @returns Latest STP data
 */
export async function getLatestSTPData(count = 1): Promise<STPData[]> {
  const data = await loadSTPData()

  // Sort by date (most recent first)
  const sortedData = [...data].sort((a, b) => {
    const dateA = new Date(a.Date)
    const dateB = new Date(b.Date)
    return dateB.getTime() - dateA.getTime()
  })

  return sortedData.slice(0, count)
}

/**
 * Calculates STP performance metrics
 * @returns STP performance metrics
 */
export async function getSTPPerformanceMetrics() {
  const data = await loadSTPData()

  // Calculate average values
  const avgTankerTrips = data.reduce((sum, row) => sum + (row["Number of Tankers Trips:"] || 0), 0) / data.length
  const avgInletSewage =
    data.reduce((sum, row) => sum + (row["Total Inlet Sewage Received from (MB+Tnk) -m³"] || 0), 0) / data.length
  const avgTreatedWater =
    data.reduce((sum, row) => sum + (row["Total Treated Water Produced - m³"] || 0), 0) / data.length
  const avgTSEProduction = data.reduce((sum, row) => sum + (row["Total TSE Water Production"] || 0), 0) / data.length

  // Calculate treatment efficiency
  const treatmentEfficiency = (avgTreatedWater / avgInletSewage) * 100

  return {
    avgTankerTrips,
    avgInletSewage,
    avgTreatedWater,
    avgTSEProduction,
    treatmentEfficiency,
  }
}
