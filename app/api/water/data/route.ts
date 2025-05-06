import { NextResponse } from "next/server"
import { fetchWaterData, transformCsvData, processWaterData } from "@/lib/water-data-utils"

// Cache for processed data to avoid repeated processing
const dataCache: {
  [key: string]: {
    timestamp: number
    data: any
  }
} = {}

// Cache expiration time (5 minutes)
const CACHE_EXPIRATION = 5 * 60 * 1000

export async function GET(request: Request) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const year = searchParams.get("year") || "2025"
    const month = searchParams.get("month") || "Mar"

    // Create a cache key
    const cacheKey = `water-${year}-${month}`
    const now = Date.now()

    // Check if we have cached data that's still valid
    if (dataCache[cacheKey] && now - dataCache[cacheKey].timestamp < CACHE_EXPIRATION) {
      console.log(`Using cached data for ${year}-${month}`)
      return NextResponse.json({
        success: true,
        data: dataCache[cacheKey].data,
        timestamp: new Date().toISOString(),
        cached: true,
      })
    }

    // Otherwise fetch and process the data
    console.log(`Fetching fresh data for ${year}-${month}`)
    const filePath = `/${year} Water Consumptions-Master View Water ${year} 12.csv`

    // Fetch and process the data
    const csvData = await fetchWaterData(filePath)
    const transformedData = transformCsvData(csvData)
    const processedData = processWaterData(transformedData)

    // Extract data for the requested month
    const monthKey = `${month}-${year.slice(-2)}`
    const availableMonths = processedData.months.filter((m) => m.endsWith(year.slice(-2))).map((m) => m.split("-")[0])

    const result = {
      period: monthKey,
      availableMonths,
      l1Supply: processedData.l1Supply[monthKey] || 0,
      l2Volume: processedData.l2Volume[monthKey] || 0,
      l3Volume: processedData.l3Volume[monthKey] || 0,
      stage1Loss: processedData.stage1Loss[monthKey] || 0,
      stage2Loss: processedData.stage2Loss[monthKey] || 0,
      totalLoss: processedData.totalLoss[monthKey] || 0,
      stage1LossPercent: processedData.stage1LossPercent[monthKey] || 0,
      stage2LossPercent: processedData.stage2LossPercent[monthKey] || 0,
      totalLossPercent: processedData.totalLossPercent[monthKey] || 0,
      zoneData: processedData.zoneData[monthKey] || {},
      typeData: processedData.typeData[monthKey] || {},
      consumptionByType: processedData.consumptionByType[monthKey] || [],
    }

    // Cache the result
    dataCache[cacheKey] = {
      timestamp: now,
      data: result,
    }

    // Return the result
    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
      cached: false,
    })
  } catch (error) {
    console.error("Error in water data API:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
