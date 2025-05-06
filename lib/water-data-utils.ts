/**
 * Utility functions for processing water consumption data
 */

import Papa from "papaparse"

// Define types for water meter data
export interface WaterMeter {
  meterLabel: string
  acctNum: string
  zone: string
  type: string
  parentMeter: string
  label: string
  readings: Record<string, number>
}

export interface ProcessedData {
  meters: WaterMeter[]
  l1Supply: Record<string, number>
  l2Volume: Record<string, number>
  l3Volume: Record<string, number>
  stage1Loss: Record<string, number>
  stage2Loss: Record<string, number>
  totalLoss: Record<string, number>
  stage1LossPercent: Record<string, number>
  stage2LossPercent: Record<string, number>
  totalLossPercent: Record<string, number>
  zoneData: Record<string, Record<string, ZoneData>>
  typeData: Record<string, Record<string, TypeData>>
  consumptionByType: Record<string, { name: string; value: number }[]>
  months: string[]
  years: string[]
}

export interface ZoneData {
  name: string
  l2Reading: number
  l3Sum: number
  loss: number
  lossPercent: number
  consumptionByType: { name: string; value: number }[]
  meters: {
    label: string
    acctNum: string
    type: string
    reading: number
  }[]
}

export interface TypeData {
  name: string
  totalConsumption: number
  trendData: { month: string; consumption: number }[]
  zoneBreakdown: { zone: string; consumption: number }[]
}

// Replace the readCsvFile function with this updated version
/**
 * Reads a CSV file - this should only be called from server components or API routes
 */
export async function readCsvFile(filePath: string): Promise<string> {
  // This function should only be called in a server context
  if (typeof window !== "undefined") {
    throw new Error("readCsvFile can only be used in server components or API routes")
  }

  try {
    // Use dynamic import for fs and path modules
    const fs = await import("fs/promises")
    const path = await import("path")

    // Construct the full path to the file in the public directory
    const fullPath = path.join(process.cwd(), "public", filePath)

    // Read the file
    const data = await fs.readFile(fullPath, "utf8")
    return data
  } catch (error) {
    console.error(`Error reading CSV file ${filePath}:`, error)
    throw new Error(`Failed to read CSV file: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

// Update the fetchWaterData function to handle both client and server contexts
export async function fetchWaterData(url: string): Promise<any[]> {
  try {
    let csvText

    // Check if the URL is a local file path or a remote URL
    if (url.startsWith("/")) {
      // For local files, we need to use fetch in client context
      if (typeof window !== "undefined") {
        // Client-side: Use fetch to get the file from the public directory
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`)
        }
        csvText = await response.text()
      } else {
        // Server-side: Use fs to read the file
        csvText = await readCsvFile(url)
      }
    } else {
      // Remote URL - use fetch in both contexts
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`)
      }
      csvText = await response.text()
    }

    console.log(`CSV data fetched, length: ${csvText.length} characters`)

    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        dynamicTyping: false,
        skipEmptyLines: true,
        complete: (results) => {
          console.log(`Parsed ${results.data.length} rows of data`)
          resolve(results.data)
        },
        error: (error) => {
          console.error("CSV parsing error:", error)
          reject(error)
        },
      })
    })
  } catch (error) {
    console.error("Error fetching water data:", error)
    throw error
  }
}

// Improved function to transform CSV data with better handling of string values
export function transformCsvData(csvData: any[]): WaterMeter[] {
  console.log(`Transforming ${csvData.length} rows of CSV data`)

  // Log the first row to understand the structure
  if (csvData.length > 0) {
    console.log("First row structure:", JSON.stringify(csvData[0], null, 2))
  }

  return csvData.map((row, index) => {
    const readings: Record<string, number> = {}

    // Determine if this is 2024 or 2025 data based on headers
    const is2024Data = Object.keys(row).some((key) => key.includes("Jan-24") || key.includes("Jan_24"))
    const is2025Data = Object.keys(row).some((key) => key.includes("Jan-25") || key.includes("Jan_25"))

    console.log(`Row ${index} appears to be from: ${is2024Data ? "2024" : is2025Data ? "2025" : "unknown"} data`)

    // Extract readings for each month based on the data format
    Object.keys(row).forEach((key) => {
      let monthKey = ""
      let value = null

      // Handle 2024 format
      if (is2024Data) {
        // 2024 format might have keys like "Jan-24", "Feb-24", etc.
        if (key.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[-_]?24$/i)) {
          monthKey = key.replace(/[-_]?24$/i, "-24")
          value = row[key]
        }
      }
      // Handle 2025 format
      else if (is2025Data) {
        // 2025 format might have keys like "Jan-25", "Feb-25", etc.
        if (key.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[-_]?25$/i)) {
          monthKey = key.replace(/[-_]?25$/i, "-25")
          value = row[key]
        }
      }

      // Process the value if a month key was found
      if (monthKey) {
        // Standardize month key format (e.g., "Jan-24")
        monthKey = monthKey.charAt(0).toUpperCase() + monthKey.slice(1).toLowerCase()

        // Convert string values to numbers and handle empty values
        readings[monthKey] =
          typeof value === "number"
            ? value
            : typeof value === "string" && value.trim() !== ""
              ? Number.parseFloat(value.replace(/,/g, "")) // Remove commas before parsing
              : 0

        if (isNaN(readings[monthKey])) {
          console.log(`Warning: NaN value for ${monthKey} in row ${index}, original value: "${value}"`)
          readings[monthKey] = 0
        }
      }
    })

    // Log any rows with no readings to help debug
    const hasReadings = Object.values(readings).some((value) => value > 0)
    if (!hasReadings) {
      console.log(
        `Warning: Row with no readings found: ${row["Meter Label"] || row["Meter_Label"]} (${row["Acct #"] || row["Acct_#"]})`,
      )
    }

    // For debugging, log a few sample readings
    if (index < 3) {
      console.log(`Sample readings for row ${index}:`, readings)
    }

    // Handle different column naming conventions between 2024 and 2025 data
    const meterLabel = row["Meter Label"] || row["Meter_Label"] || ""
    const acctNum = row["Acct #"] || row["Acct_#"] || ""
    const zone = row["Zone"] || ""
    const type = row["Type"] || ""
    const parentMeter = row["Parent Meter"] || row["Parent_Meter"] || ""
    const label = row["Label"] || row["Level"] || "" // Handle both 'Label' and 'Level' fields

    return {
      meterLabel,
      acctNum,
      zone,
      type,
      parentMeter,
      label,
      readings,
    }
  })
}

// Improved function to process water data with better error handling and data validation
export function processWaterData(meters: WaterMeter[]): ProcessedData {
  console.log(`Processing ${meters.length} meters`)

  // Extract available months and years from the data
  const months: string[] = []
  const years: Set<string> = new Set()

  // Get all unique month-year combinations from the readings
  meters.forEach((meter) => {
    Object.keys(meter.readings).forEach((key) => {
      if (!months.includes(key)) {
        months.push(key)
        const year = key.split("-")[1]
        years.add(`20${year}`)
      }
    })
  })

  console.log(`Found ${months.length} months and ${years.size} years in the data`)
  console.log(`Months: ${months.join(", ")}`)
  console.log(`Years: ${Array.from(years).join(", ")}`)

  // Sort months chronologically
  months.sort((a, b) => {
    const [aMonth, aYear] = a.split("-")
    const [bMonth, bYear] = b.split("-")

    if (aYear !== bYear) {
      return Number.parseInt(aYear) - Number.parseInt(bYear)
    }

    const monthOrder = {
      Jan: 1,
      Feb: 2,
      Mar: 3,
      Apr: 4,
      May: 5,
      Jun: 6,
      Jul: 7,
      Aug: 8,
      Sep: 9,
      Oct: 10,
      Nov: 11,
      Dec: 12,
    }

    return monthOrder[aMonth as keyof typeof monthOrder] - monthOrder[bMonth as keyof typeof monthOrder]
  })

  // Initialize result objects
  const l1Supply: Record<string, number> = {}
  const l2Volume: Record<string, number> = {}
  const l3Volume: Record<string, number> = {}
  const stage1Loss: Record<string, number> = {}
  const stage2Loss: Record<string, number> = {}
  const totalLoss: Record<string, number> = {}
  const stage1LossPercent: Record<string, number> = {}
  const stage2LossPercent: Record<string, number> = {}
  const totalLossPercent: Record<string, number> = {}
  const zoneData: Record<string, Record<string, ZoneData>> = {}
  const typeData: Record<string, Record<string, TypeData>> = {}
  const consumptionByType: Record<string, { name: string; value: number }[]> = {}

  // Process data for each month
  months.forEach((month) => {
    console.log(`Processing data for month: ${month}`)

    // Find L1 meter (main bulk)
    const l1Meter = meters.find(
      (meter) => meter.label === "L1" || meter.meterLabel === "Main Bulk (NAMA)" || meter.acctNum === "C43659",
    )

    l1Supply[month] = l1Meter ? l1Meter.readings[month] || 0 : 0

    if (l1Supply[month] === 0) {
      console.log(`Warning: No L1 supply data for ${month}`)
      // Try to find alternative L1 meter
      const altL1Meters = meters.filter(
        (m) => m.meterLabel?.includes("Main Bulk") || m.parentMeter?.includes("NAMA") || m.acctNum === "C43659",
      )
      if (altL1Meters.length > 0) {
        console.log(`Found ${altL1Meters.length} alternative L1 meters`)
        altL1Meters.forEach((m) => {
          console.log(`Alt L1 meter: ${m.meterLabel}, reading: ${m.readings[month]}`)
          if (m.readings[month] > 0) {
            l1Supply[month] = m.readings[month]
            console.log(`Using alternative L1 meter: ${m.meterLabel} with reading: ${l1Supply[month]}`)
          }
        })
      }
    } else {
      console.log(`L1 supply for ${month}: ${l1Supply[month]}`)
    }

    // Calculate L2 volume (sum of L2 meters + DC meters connected to L1)
    const l2Meters = meters.filter((meter) => meter.label === "L2")
    const dcMetersFromL1 = meters.filter(
      (meter) =>
        meter.label === "DC" && (meter.parentMeter === l1Meter?.meterLabel || meter.parentMeter?.includes("Main Bulk")),
    )

    l2Volume[month] = [...l2Meters, ...dcMetersFromL1].reduce((sum, meter) => sum + (meter.readings[month] || 0), 0)
    console.log(
      `L2 volume for ${month}: ${l2Volume[month]} (from ${l2Meters.length} L2 meters and ${dcMetersFromL1.length} DC meters)`,
    )

    // Calculate L3 volume (sum of L3 meters + all DC meters)
    // Exclude the anomalous meter with Acct # 4300322
    const l3Meters = meters.filter((meter) => meter.label === "L3" && meter.acctNum !== "4300322")
    const dcMeters = meters.filter((meter) => meter.label === "DC")

    l3Volume[month] = [...l3Meters, ...dcMeters].reduce((sum, meter) => sum + (meter.readings[month] || 0), 0)
    console.log(
      `L3 volume for ${month}: ${l3Volume[month]} (from ${l3Meters.length} L3 meters and ${dcMeters.length} DC meters)`,
    )

    // Calculate losses
    stage1Loss[month] = l1Supply[month] - l2Volume[month]
    stage2Loss[month] = l2Volume[month] - l3Volume[month]
    totalLoss[month] = l1Supply[month] - l3Volume[month]

    // Calculate loss percentages with safety checks
    stage1LossPercent[month] = l1Supply[month] > 0 ? (stage1Loss[month] / l1Supply[month]) * 100 : 0
    stage2LossPercent[month] = l2Volume[month] > 0 ? (stage2Loss[month] / l2Volume[month]) * 100 : 0
    totalLossPercent[month] = l1Supply[month] > 0 ? (totalLoss[month] / l1Supply[month]) * 100 : 0

    console.log(
      `Losses for ${month}: Stage 1: ${stage1Loss[month]} (${stage1LossPercent[month].toFixed(1)}%), Stage 2: ${stage2Loss[month]} (${stage2LossPercent[month].toFixed(1)}%), Total: ${totalLoss[month]} (${totalLossPercent[month].toFixed(1)}%)`,
    )

    // Process zone data
    const zones = [...new Set(meters.filter((m) => m.zone).map((m) => m.zone))]
    zoneData[month] = {}

    console.log(`Processing ${zones.length} zones for ${month}`)

    zones.forEach((zoneName) => {
      // Skip empty zone names
      if (!zoneName) return

      // Find L2 bulk meter for this zone
      const zoneL2Meter = meters.find((meter) => meter.label === "L2" && meter.zone === zoneName)

      // Get L3 meters for this zone (excluding anomalous meter)
      const zoneL3Meters = meters.filter(
        (meter) => meter.label === "L3" && meter.zone === zoneName && meter.acctNum !== "4300322",
      )

      const l2Reading = zoneL2Meter ? zoneL2Meter.readings[month] || 0 : 0
      const l3Sum = zoneL3Meters.reduce((sum, meter) => sum + (meter.readings[month] || 0), 0)
      const loss = l2Reading - l3Sum
      const lossPercent = l2Reading > 0 ? (loss / l2Reading) * 100 : 0

      // Get consumption by type within this zone
      const typeConsumption: Record<string, number> = {}
      zoneL3Meters.forEach((meter) => {
        const type = meter.type || "Unknown"
        if (type && type.trim() !== "" && meter.readings[month]) {
          typeConsumption[type] = (typeConsumption[type] || 0) + (meter.readings[month] || 0)
        }
      })

      const zoneConsumptionByType = Object.entries(typeConsumption)
        .filter(([name, value]) => name && name.trim() !== "" && value > 0) // Filter out empty names and zero values
        .map(([name, value]) => ({
          name,
          value,
        }))

      zoneData[month][zoneName] = {
        name: zoneName,
        l2Reading,
        l3Sum,
        loss,
        lossPercent,
        consumptionByType: zoneConsumptionByType,
        meters: zoneL3Meters.map((meter) => ({
          label: meter.meterLabel,
          acctNum: meter.acctNum,
          type: meter.type,
          reading: meter.readings[month] || 0,
        })),
      }

      console.log(
        `Zone ${zoneName} for ${month}: L2: ${l2Reading}, L3 Sum: ${l3Sum}, Loss: ${loss} (${lossPercent.toFixed(1)}%)`,
      )
    })

    // Process type data
    const types = [...new Set(meters.filter((m) => m.type && m.type.trim() !== "").map((m) => m.type))]
    typeData[month] = {}

    console.log(`Processing ${types.length} types for ${month}`)

    // Calculate consumption by type for pie chart
    const typeConsumption: Record<string, number> = {}
    meters.forEach((meter) => {
      if ((meter.label === "L3" && meter.acctNum !== "4300322") || meter.label === "DC") {
        const type = meter.type || "Unknown"
        if (type && type.trim() !== "" && meter.readings[month]) {
          typeConsumption[type] = (typeConsumption[type] || 0) + (meter.readings[month] || 0)
        }
      }
    })

    consumptionByType[month] = Object.entries(typeConsumption)
      .filter(([name, value]) => name && name.trim() !== "" && value > 0) // Filter out empty names and zero values
      .map(([name, value]) => ({
        name,
        value,
      }))

    console.log(`Consumption by type for ${month}: ${consumptionByType[month].length} types found`)
    if (consumptionByType[month].length === 0) {
      console.log(`Warning: No consumption by type data for ${month}`)
    } else {
      consumptionByType[month].forEach((item) => {
        console.log(`  ${item.name}: ${item.value}`)
      })
    }

    types.forEach((typeName) => {
      // Skip empty type names
      if (!typeName || typeName.trim() === "") return

      // Get all meters of this type (L3 and DC, excluding anomalous meter)
      const typeMeters = meters.filter(
        (meter) =>
          (meter.label === "L3" || meter.label === "DC") && meter.type === typeName && meter.acctNum !== "4300322",
      )

      const totalConsumption = typeMeters.reduce((sum, meter) => sum + (meter.readings[month] || 0), 0)

      // Calculate consumption by zone for this type
      const zoneConsumption: Record<string, number> = {}
      typeMeters.forEach((meter) => {
        const zone = meter.zone || "Unknown"
        if (zone && zone.trim() !== "" && meter.readings[month]) {
          zoneConsumption[zone] = (zoneConsumption[zone] || 0) + (meter.readings[month] || 0)
        }
      })
      const zoneBreakdown = Object.entries(zoneConsumption)
        .filter(([zone, consumption]) => zone && zone.trim() !== "" && consumption > 0)
        .map(([zone, consumption]) => ({
          zone,
          consumption,
        }))

      // Get trend data (last 3 months if available)
      const trendData = months
        .filter((m) => months.indexOf(m) <= months.indexOf(month))
        .slice(-3)
        .map((m) => {
          const consumption = typeMeters.reduce((sum, meter) => sum + (meter.readings[m] || 0), 0)
          return {
            month: m.split("-")[0], // Just use month name without year
            consumption,
          }
        })

      typeData[month][typeName] = {
        name: typeName,
        totalConsumption,
        trendData,
        zoneBreakdown,
      }

      console.log(
        `Type ${typeName} for ${month}: Total consumption: ${totalConsumption}, Zones: ${zoneBreakdown.length}`,
      )
    })
  })

  return {
    meters,
    l1Supply,
    l2Volume,
    l3Volume,
    stage1Loss,
    stage2Loss,
    totalLoss,
    stage1LossPercent,
    stage2LossPercent,
    totalLossPercent,
    zoneData: Object.fromEntries(months.map((month) => [month, zoneData[month] || {}])),
    typeData: Object.fromEntries(months.map((month) => [month, typeData[month] || {}])),
    consumptionByType,
    months,
    years: Array.from(years),
  }
}

// Helper function to get month name from month-year format
export function getMonthName(monthYear: string): string {
  const [month, year] = monthYear.split("-")
  return `${month} 20${year}`
}

// Helper function to format month-year for display
export function formatMonthYear(monthYear: string): string {
  const [month, year] = monthYear.split("-")
  return `${month} 20${year}`
}

// Helper function to get month-year key from separate month and year
export function getMonthYearKey(month: string, year: string): string {
  // Extract last two digits of year
  const yearSuffix = year.slice(-2)
  return `${month}-${yearSuffix}`
}

// Helper function to get available months for a specific year
export function getMonthsForYear(months: string[], year: string): string[] {
  const yearSuffix = year.slice(-2)
  return months.filter((month) => month.endsWith(`-${yearSuffix}`))
}

// Helper function to debug data availability
export function debugDataAvailability(data: ProcessedData, month: string, year: string): void {
  const monthYearKey = getMonthYearKey(month, year)
  console.log(`Debugging data for ${monthYearKey}:`)
  console.log(`Available months: ${data.months.join(", ")}`)
  console.log(`L1 Supply: ${data.l1Supply[monthYearKey] || "Not available"}`)
  console.log(`L2 Volume: ${data.l2Volume[monthYearKey] || "Not available"}`)
  console.log(`L3 Volume: ${data.l3Volume[monthYearKey] || "Not available"}`)
  console.log(`Consumption by Type: ${data.consumptionByType[monthYearKey]?.length || 0} items`)
  console.log(`Zone Data: ${Object.keys(data.zoneData[monthYearKey] || {}).length} zones`)
  console.log(`Type Data: ${Object.keys(data.typeData[monthYearKey] || {}).length} types`)
}
