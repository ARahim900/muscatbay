import { loadCsvFile, processWaterData } from "@/utils/csv-loader"

// Define types for water data
export interface WaterData {
  "Meter Label": string
  "Acct #": string
  Zone: string
  Type: string
  "Parent Meter": string
  Label: string
  [key: string]: any // For month fields (Jan-24, Feb-24, etc.)
}

// Cache for water data
let waterDataCache: WaterData[] | null = null

/**
 * Loads water data from the CSV file
 * @returns Promise with the processed water data
 */
export async function loadWaterData(): Promise<WaterData[]> {
  // Return cached data if available
  if (waterDataCache) {
    return waterDataCache
  }

  try {
    const rawData = await loadCsvFile("/database/water/master-wa-db-table.csv")
    const processedData = processWaterData(rawData as any[]) as WaterData[]

    // Cache the data
    waterDataCache = processedData

    return processedData
  } catch (error) {
    console.error("Error loading water data:", error)
    throw error
  }
}

/**
 * Gets water data for a specific month
 * @param month Month in format 'MMM-YY' (e.g., 'Jan-25')
 * @returns Water data for the specified month
 */
export async function getWaterDataByMonth(month: string): Promise<WaterData[]> {
  const data = await loadWaterData()

  // Check if the month exists in the data
  const monthExists = data.length > 0 && month in data[0]

  if (!monthExists) {
    console.warn(`Month ${month} not found in water data`)
    return []
  }

  return data
}

/**
 * Gets water consumption by zone for a specific month
 * @param month Month in format 'MMM-YY' (e.g., 'Jan-25')
 * @returns Consumption by zone for the specified month
 */
export async function getWaterConsumptionByZone(month: string): Promise<{ zone: string; consumption: number }[]> {
  const data = await loadWaterData()

  // Group by zone and sum consumption
  const consumptionByZone: Record<string, number> = {}

  data.forEach((row) => {
    const zone = row.Zone || "Unknown"
    const consumption = row[month] || 0

    if (!consumptionByZone[zone]) {
      consumptionByZone[zone] = 0
    }

    consumptionByZone[zone] += consumption
  })

  // Convert to array format
  return Object.entries(consumptionByZone).map(([zone, consumption]) => ({
    zone,
    consumption,
  }))
}

/**
 * Gets water consumption by type for a specific month
 * @param month Month in format 'MMM-YY' (e.g., 'Jan-25')
 * @returns Consumption by type for the specified month
 */
export async function getWaterConsumptionByType(month: string): Promise<{ type: string; consumption: number }[]> {
  const data = await loadWaterData()

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
 * Gets total water consumption for each month
 * @returns Total consumption by month
 */
export async function getTotalWaterConsumptionByMonth(): Promise<{ month: string; consumption: number }[]> {
  const data = await loadWaterData()

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
