// Client-side service to fetch water data from the API

// Cache for API responses
const apiCache: {
  [key: string]: {
    timestamp: number
    data: any
  }
} = {}

// Cache expiration time (1 minute)
const CACHE_EXPIRATION = 60 * 1000

export async function getWaterDataForPeriod(year: string, month: string) {
  const cacheKey = `water-${year}-${month}`
  const now = Date.now()

  // Check if we have cached data that's still valid
  if (apiCache[cacheKey] && now - apiCache[cacheKey].timestamp < CACHE_EXPIRATION) {
    console.log("Using cached API response")
    return apiCache[cacheKey].data
  }

  // Otherwise fetch from the API
  console.log("Fetching from API")
  try {
    const response = await fetch(`/api/water/data?year=${year}&month=${month}`)

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    // Cache the response
    apiCache[cacheKey] = {
      timestamp: now,
      data,
    }

    return data
  } catch (error) {
    console.error("Error fetching water data:", error)
    throw error
  }
}

export async function getZoneDataForPeriod(year: string, month: string, zone: string) {
  const data = await getWaterDataForPeriod(year, month)
  return {
    period: data.period,
    zone,
    data: data.zoneData[zone] || null,
  }
}

export async function getTypeDataForPeriod(year: string, month: string, type: string) {
  const data = await getWaterDataForPeriod(year, month)
  return {
    period: data.period,
    type,
    data: data.typeData[type] || null,
  }
}

export async function getAvailablePeriods() {
  // Fetch data for both years to get available months
  try {
    const data2024 = await getWaterDataForPeriod("2024", "Jan")
    const data2025 = await getWaterDataForPeriod("2025", "Jan")

    return {
      years: ["2024", "2025"],
      months: {
        "2024": data2024.availableMonths || [],
        "2025": data2025.availableMonths || [],
      },
    }
  } catch (error) {
    console.error("Error getting available periods:", error)
    return {
      years: ["2024", "2025"],
      months: {
        "2024": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        "2025": ["Jan", "Feb", "Mar"],
      },
    }
  }
}
