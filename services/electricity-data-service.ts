import { loadCsvFile, processElectricityData } from "@/utils/csv-loader"

// Define types for electricity data
export interface ElectricityData {
  Name: string
  Type: string
  "Meter Account No.": string
  [key: string]: any // For month fields (Apr-24, May-24, etc.)
}

// Cache for electricity data
let electricityDataCache: ElectricityData[] | null = null

/**
 * Loads electricity data from the CSV file
 * @returns Promise with the processed electricity data
 */
export async function loadElectricityData(): Promise<ElectricityData[]> {
  // Return cached data if available
  if (electricityDataCache) {
    return electricityDataCache
  }

  try {
    const rawData = await loadCsvFile("/database/electricity/electrical-consumptions-2024.csv")
    const processedData = processElectricityData(rawData as any[]) as ElectricityData[]

    // Cache the data
    electricityDataCache = processedData

    return processedData
  } catch (error) {
    console.error("Error loading electricity data:", error)
    throw error
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
    /^(Jan|Feb|Mar|Apr|May|Jun|June|Jul|July|Aug|August|Sep|September|Oct|October|Nov|November|Dec|December)-\d{2}$/.test(
      key,
    ),
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

    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "June",
      "Jul",
      "July",
      "Aug",
      "August",
      "Sep",
      "September",
      "Oct",
      "October",
      "Nov",
      "November",
      "Dec",
      "December",
    ]
    return months.indexOf(monthA) - months.indexOf(monthB)
  })
}
