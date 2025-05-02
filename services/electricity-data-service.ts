
import { processElectricityData } from "@/utils/csv-loader"

// Define types for electricity data
export interface ElectricityData {
  Name: string
  Type: string
  "Meter Account No.": string
  [key: string]: any // For month fields (Apr-24, May-24, etc.)
}

// Define the Airtable record type
interface AirtableRecord {
  id: string
  fields: Record<string, any>
  createdTime: string
}

// Define the Airtable response type
interface AirtableResponse {
  records: AirtableRecord[]
  offset?: string
}

// Mock data for fallback
const mockElectricityData: ElectricityData[] = [
  {
    Name: "Main Supply",
    Type: "Main",
    "Meter Account No.": "MS001",
    "Jan-25": 168000,
    "Feb-25": 162000,
    "Mar-25": 175000,
  },
  {
    Name: "Zone A",
    Type: "Residential",
    "Meter Account No.": "ZA001",
    "Jan-25": 46000,
    "Feb-25": 44000,
    "Mar-25": 48000,
  },
  {
    Name: "Zone B",
    Type: "Commercial",
    "Meter Account No.": "ZB001",
    "Jan-25": 39000,
    "Feb-25": 37000,
    "Mar-25": 41000,
  },
]

// Cache for electricity data
let electricityDataCache: ElectricityData[] | null = null

/**
 * Loads electricity data from Airtable via our API route
 * @returns Promise with the processed electricity data
 */
export async function loadElectricityData(): Promise<ElectricityData[]> {
  // Return cached data if available
  if (electricityDataCache) {
    return electricityDataCache
  }

  try {
    // First try the main API endpoint
    console.log("Attempting to fetch electricity data from main API...")
    const response = await fetch("/api/electricity/mock", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = (await response.json()) as AirtableResponse

    // Check if the data has the expected structure
    if (!data || !data.records || !Array.isArray(data.records)) {
      console.error("Invalid data structure received from API:", data)
      throw new Error("Invalid data structure")
    }

    const airtableRecords = data.records

    // Transform Airtable records to our ElectricityData format
    const transformedData = airtableRecords.map((record) => {
      const { fields } = record

      // Create a base object with required properties
      const dataItem: ElectricityData = {
        Name: fields.Name || "",
        Type: fields.Type || "",
        "Meter Account No.": fields["Meter Account No."] || "",
      }

      // Add all month fields (Jan-24, Feb-24, etc.)
      Object.keys(fields).forEach((key) => {
        if (/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-\d{2}$/.test(key)) {
          dataItem[key] = typeof fields[key] === "number" ? fields[key] : Number.parseFloat(fields[key]) || 0
        }
      })

      return dataItem
    })

    // Process the data (similar to what we did with CSV data)
    // We need to cast the result to ElectricityData[] since processElectricityData returns ParsedCsvRow[]
    const processedData = processElectricityData(transformedData) as unknown as ElectricityData[]

    // Cache the data
    electricityDataCache = processedData

    return processedData
  } catch (error) {
    console.error("Error loading electricity data from API:", error)

    // If API fetch fails, return fallback mock data
    return mockElectricityData
  }
}

/**
 * Gets electricity data for a specific month
 * @param month Month in format 'MMM-YY' (e.g., 'Jan-25')
 * @returns Electricity data for the specified month
 */
export async function getElectricityDataByMonth(month: string): Promise<ElectricityData[]> {
  const data = await loadElectricityData()

  // Check if the month exists in the data
  const monthExists = data.length > 0 && month in data[0]

  if (!monthExists) {
    console.warn(`Month ${month} not found in electricity data`)
    return []
  }

  return data
}

/**
 * Gets electricity consumption by type for a specific month
 * @param month Month in format 'MMM-YY' (e.g., 'Jan-25')
 * @returns Consumption by type for the specified month
 */
export async function getElectricityConsumptionByType(month: string): Promise<{ type: string; consumption: number }[]> {
  const data = await loadElectricityData()

  // Group by type and sum consumption
  const consumptionByType: Record<string, number> = {}

  data.forEach((row) => {
    const type = row.Type || "Unknown"
    const consumption = row[month] || 0

    if (!consumptionByType[type]) {
      consumptionByType[type] = 0
    }

    consumptionByType[type] += consumption
  })

  // Convert to array format
  return Object.entries(consumptionByType).map(([type, consumption]) => ({
    type,
    consumption,
  }))
}

/**
 * Gets total electricity consumption for each month
 * @returns Total consumption by month
 */
export async function getTotalElectricityConsumptionByMonth(): Promise<{ month: string; consumption: number }[]> {
  const data = await loadElectricityData()

  if (data.length === 0) {
    return []
  }

  // Get all month fields
  const monthFields = Object.keys(data[0]).filter((key) =>
    /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-\d{2}$/.test(key),
  )

  // Calculate total consumption for each month
  const totalByMonth = monthFields.map((month) => {
    const total = data.reduce((sum, row) => sum + (row[month] || 0), 0)
    return {
      month,
      consumption: total,
    }
  })

  // Sort by month chronologically
  return totalByMonth.sort((a, b) => {
    const [monthA, yearA] = a.month.split("-")
    const [monthB, yearB] = b.month.split("-")

    if (yearA !== yearB) {
      return Number(yearA) - Number(yearB)
    }

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    return months.indexOf(monthA) - months.indexOf(monthB)
  })
}

// Function to refresh the cache
export function clearElectricityDataCache(): void {
  electricityDataCache = null
}
