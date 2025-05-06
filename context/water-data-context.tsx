"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { ProcessedData, ZoneData, TypeData } from "@/lib/water-data-utils"
import { getWaterDataForPeriod } from "@/services/water-service"

// Define the context type
interface WaterDataContextType {
  isLoading: boolean
  error: Error | null
  data: ProcessedData | null
  selectedYear: string
  selectedMonth: string
  availableMonths: string[]
  availableYears: string[]
  setSelectedYear: (year: string) => void
  setSelectedMonth: (month: string) => void
  getCurrentData: () => {
    l1Supply: number
    l2Volume: number
    l3Volume: number
    stage1Loss: number
    stage2Loss: number
    totalLoss: number
    stage1LossPercent: number
    stage2LossPercent: number
    totalLossPercent: number
    consumptionByType: { name: string; value: number }[]
    zoneData: Record<string, ZoneData>
    typeData: Record<string, TypeData>
  }
  getZoneData: (zone: string) => ZoneData | null
  getTypeData: (type: string) => TypeData | null
  getZoneOptions: () => { value: string; label: string }[]
  getTypeOptions: () => { value: string; label: string }[]
  getMonthOptions: () => { value: string; label: string }[]
  getYearOptions: () => { value: string; label: string }[]
  refreshData: () => Promise<void>
}

const WaterDataContext = createContext<WaterDataContextType | undefined>(undefined)

export function WaterDataProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [data, setData] = useState<any>(null)
  const [selectedYear, setSelectedYear] = useState("2025")
  const [selectedMonth, setSelectedMonth] = useState("Mar")
  const [availableMonths, setAvailableMonths] = useState<string[]>([])
  const [availableYears, setAvailableYears] = useState<string[]>(["2024", "2025"])
  const [dataLoadAttempt, setDataLoadAttempt] = useState(0)

  // Function to refresh data
  const refreshData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Use the water service to fetch data
      const data = await getWaterDataForPeriod(selectedYear, selectedMonth)

      // Update state with the fetched data
      setData(data)

      // Update available months if needed
      if (data.availableMonths && data.availableMonths.length > 0) {
        setAvailableMonths(data.availableMonths)
      }

      setDataLoadAttempt((prev) => prev + 1)
    } catch (err) {
      console.error("Error refreshing water data:", err)
      setError(err instanceof Error ? err : new Error("Unknown error refreshing data"))
    } finally {
      setIsLoading(false)
    }

    return Promise.resolve()
  }

  // Handle year selection change
  const handleYearChange = (year: string) => {
    console.log(`Year changed to: ${year}`)
    setSelectedYear(year)
    fetchAvailableMonths(year)
  }

  // Handle month selection change
  const handleMonthChange = (month: string) => {
    console.log(`Month changed to: ${month}`)
    setSelectedMonth(month)
  }

  // Fetch available months for a year
  const fetchAvailableMonths = async (year: string) => {
    try {
      const response = await fetch(`/api/water/periods`)
      if (!response.ok) {
        throw new Error(`Failed to fetch periods: ${response.status}`)
      }

      const result = await response.json()
      if (result.success && result.data.months[year]) {
        setAvailableMonths(result.data.months[year])

        // If current month is not available, select the first available month
        if (!result.data.months[year].includes(selectedMonth)) {
          setSelectedMonth(result.data.months[year][0])
        }
      }
    } catch (error) {
      console.error("Error fetching available months:", error)
      // Fallback to default months
      setAvailableMonths(["Jan", "Feb", "Mar"])
    }
  }

  // Fetch data for the selected period
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      setError(null)

      try {
        // Fetch available periods first
        const periodsResponse = await fetch(`/api/water/periods`)
        if (!periodsResponse.ok) {
          throw new Error(`Failed to fetch periods: ${periodsResponse.status}`)
        }

        const periodsResult = await periodsResponse.json()
        if (periodsResult.success) {
          setAvailableYears(periodsResult.data.years)
          setAvailableMonths(periodsResult.data.months[selectedYear] || [])
        }

        // Fetch data for the selected period
        const dataResponse = await fetch(`/api/water/data?year=${selectedYear}&month=${selectedMonth}`)
        if (!dataResponse.ok) {
          throw new Error(`Failed to fetch data: ${dataResponse.status}`)
        }

        const dataResult = await dataResponse.json()
        if (dataResult.success) {
          setData(dataResult.data)
        } else {
          throw new Error(dataResult.error || "Unknown error")
        }
      } catch (error) {
        console.error("Error fetching water data:", error)
        setError(error instanceof Error ? error : new Error("Unknown error"))
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [selectedYear, selectedMonth, dataLoadAttempt])

  // Get current data based on selected month and year
  const getCurrentData = () => {
    if (!data) {
      return {
        l1Supply: 0,
        l2Volume: 0,
        l3Volume: 0,
        stage1Loss: 0,
        stage2Loss: 0,
        totalLoss: 0,
        stage1LossPercent: 0,
        stage2LossPercent: 0,
        totalLossPercent: 0,
        consumptionByType: [],
        zoneData: {},
        typeData: {},
      }
    }

    return {
      l1Supply: data.l1Supply || 0,
      l2Volume: data.l2Volume || 0,
      l3Volume: data.l3Volume || 0,
      stage1Loss: data.stage1Loss || 0,
      stage2Loss: data.stage2Loss || 0,
      totalLoss: data.totalLoss || 0,
      stage1LossPercent: data.stage1LossPercent || 0,
      stage2LossPercent: data.stage2LossPercent || 0,
      totalLossPercent: data.totalLossPercent || 0,
      consumptionByType: data.consumptionByType || [],
      zoneData: data.zoneData || {},
      typeData: data.typeData || {},
    }
  }

  // Get zone data for a specific zone
  const getZoneData = (zone: string): ZoneData | null => {
    if (!data || !data.zoneData) return null
    return data.zoneData[zone] || null
  }

  // Get type data for a specific type
  const getTypeData = (type: string): TypeData | null => {
    if (!data || !data.typeData) return null
    return data.typeData[type] || null
  }

  // Get zone options for dropdown
  const getZoneOptions = () => {
    if (!data || !data.zoneData) return []
    return Object.keys(data.zoneData).map((zone) => ({
      value: zone,
      label: zone,
    }))
  }

  // Get type options for dropdown
  const getTypeOptions = () => {
    if (!data || !data.typeData) return [{ value: "all", label: "All Types" }]

    const options = [{ value: "all", label: "All Types" }]
    Object.keys(data.typeData).forEach((type) => {
      options.push({
        value: type.toLowerCase().replace(/\s+/g, "-"),
        label: type,
      })
    })

    return options
  }

  // Get month options for dropdown
  const getMonthOptions = () => {
    return availableMonths.map((month) => ({
      value: month.toLowerCase(),
      label: `${month} ${selectedYear}`,
    }))
  }

  // Get year options for dropdown
  const getYearOptions = () => {
    return availableYears.map((year) => ({
      value: year,
      label: year,
    }))
  }

  const contextValue: WaterDataContextType = {
    isLoading,
    error,
    data,
    selectedYear,
    selectedMonth,
    availableMonths,
    availableYears,
    setSelectedYear: handleYearChange,
    setSelectedMonth: handleMonthChange,
    getCurrentData,
    getZoneData,
    getTypeData,
    getZoneOptions,
    getTypeOptions,
    getMonthOptions,
    getYearOptions,
    refreshData,
  }

  return <WaterDataContext.Provider value={contextValue}>{children}</WaterDataContext.Provider>
}

export function useWaterData() {
  const context = useContext(WaterDataContext)
  if (context === undefined) {
    throw new Error("useWaterData must be used within a WaterDataProvider")
  }
  return context
}
