"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

// Define types for electricity meter data
export interface ElectricityMeter {
  meterLabel: string
  acctNum: string
  zone: string
  type: string
  parentMeter: string
  label: string
  readings: Record<string, number>
}

export interface ProcessedElectricityData {
  meters: ElectricityMeter[]
  mainSupply: Record<string, number>
  zoneConsumption: Record<string, Record<string, number>>
  typeConsumption: Record<string, Record<string, number>>
  solarGeneration: Record<string, number>
  gridConsumption: Record<string, number>
  peakLoad: Record<string, number>
  consumptionByType: Record<string, { name: string; value: number }[]>
  consumptionByZone: Record<string, { name: string; value: number }[]>
  months: string[]
  years: string[]
}

export interface ZoneElectricityData {
  name: string
  consumption: number
  meters: {
    label: string
    acctNum: string
    type: string
    reading: number
  }[]
}

export interface TypeElectricityData {
  name: string
  totalConsumption: number
  trendData: { month: string; consumption: number }[]
  zoneBreakdown: { zone: string; consumption: number }[]
}

interface ElectricityDataContextType {
  isLoading: boolean
  error: Error | null
  data: ProcessedElectricityData | null
  selectedYear: string
  selectedMonth: string
  availableMonths: string[]
  availableYears: string[]
  setSelectedYear: (year: string) => void
  setSelectedMonth: (month: string) => void
  getCurrentData: () => {
    mainSupply: number
    zoneConsumption: Record<string, number>
    typeConsumption: Record<string, number>
    solarGeneration: number
    gridConsumption: number
    peakLoad: number
    consumptionByType: { name: string; value: number }[]
    consumptionByZone: { name: string; value: number }[]
  }
  getZoneData: (zone: string) => ZoneElectricityData | null
  getTypeData: (type: string) => TypeElectricityData | null
  getZoneOptions: () => { value: string; label: string }[]
  getTypeOptions: () => { value: string; label: string }[]
  getMonthOptions: () => { value: string; label: string }[]
  getYearOptions: () => { value: string; label: string }[]
  refreshData: () => Promise<void>
}

// Mock data for electricity consumption
const mockElectricityData: ProcessedElectricityData = {
  meters: [],
  mainSupply: {
    "Jan-24": 165000,
    "Feb-24": 158000,
    "Mar-24": 172000,
    "Apr-24": 180000,
    "May-24": 195000,
    "Jun-24": 210000,
    "Jul-24": 225000,
    "Aug-24": 220000,
    "Sep-24": 200000,
    "Oct-24": 185000,
    "Nov-24": 170000,
    "Dec-24": 160000,
    "Jan-25": 168000,
    "Feb-25": 162000,
    "Mar-25": 175000,
  },
  zoneConsumption: {
    "Jan-24": {
      "Zone A": 45000,
      "Zone B": 38000,
      "Zone C": 42000,
      "Zone D": 40000,
    },
    "Feb-24": {
      "Zone A": 43000,
      "Zone B": 36000,
      "Zone C": 40000,
      "Zone D": 39000,
    },
    "Mar-24": {
      "Zone A": 47000,
      "Zone B": 40000,
      "Zone C": 44000,
      "Zone D": 41000,
    },
    "Apr-24": {
      "Zone A": 49000,
      "Zone B": 42000,
      "Zone C": 46000,
      "Zone D": 43000,
    },
    "May-24": {
      "Zone A": 53000,
      "Zone B": 45000,
      "Zone C": 50000,
      "Zone D": 47000,
    },
    "Jun-24": {
      "Zone A": 57000,
      "Zone B": 49000,
      "Zone C": 54000,
      "Zone D": 50000,
    },
    "Jul-24": {
      "Zone A": 61000,
      "Zone B": 52000,
      "Zone C": 58000,
      "Zone D": 54000,
    },
    "Aug-24": {
      "Zone A": 60000,
      "Zone B": 51000,
      "Zone C": 56000,
      "Zone D": 53000,
    },
    "Sep-24": {
      "Zone A": 54000,
      "Zone B": 46000,
      "Zone C": 52000,
      "Zone D": 48000,
    },
    "Oct-24": {
      "Zone A": 50000,
      "Zone B": 43000,
      "Zone C": 48000,
      "Zone D": 44000,
    },
    "Nov-24": {
      "Zone A": 46000,
      "Zone B": 39000,
      "Zone C": 44000,
      "Zone D": 41000,
    },
    "Dec-24": {
      "Zone A": 43000,
      "Zone B": 37000,
      "Zone C": 41000,
      "Zone D": 39000,
    },
    "Jan-25": {
      "Zone A": 46000,
      "Zone B": 39000,
      "Zone C": 43000,
      "Zone D": 40000,
    },
    "Feb-25": {
      "Zone A": 44000,
      "Zone B": 37000,
      "Zone C": 41000,
      "Zone D": 40000,
    },
    "Mar-25": {
      "Zone A": 48000,
      "Zone B": 41000,
      "Zone C": 45000,
      "Zone D": 41000,
    },
  },
  typeConsumption: {
    "Jan-24": {
      Residential: 82500,
      Commercial: 49500,
      Public: 33000,
    },
    "Feb-24": {
      Residential: 79000,
      Commercial: 47400,
      Public: 31600,
    },
    "Mar-24": {
      Residential: 86000,
      Commercial: 51600,
      Public: 34400,
    },
    "Apr-24": {
      Residential: 90000,
      Commercial: 54000,
      Public: 36000,
    },
    "May-24": {
      Residential: 97500,
      Commercial: 58500,
      Public: 39000,
    },
    "Jun-24": {
      Residential: 105000,
      Commercial: 63000,
      Public: 42000,
    },
    "Jul-24": {
      Residential: 112500,
      Commercial: 67500,
      Public: 45000,
    },
    "Aug-24": {
      Residential: 110000,
      Commercial: 66000,
      Public: 44000,
    },
    "Sep-24": {
      Residential: 100000,
      Commercial: 60000,
      Public: 40000,
    },
    "Oct-24": {
      Residential: 92500,
      Commercial: 55500,
      Public: 37000,
    },
    "Nov-24": {
      Residential: 85000,
      Commercial: 51000,
      Public: 34000,
    },
    "Dec-24": {
      Residential: 80000,
      Commercial: 48000,
      Public: 32000,
    },
    "Jan-25": {
      Residential: 84000,
      Commercial: 50400,
      Public: 33600,
    },
    "Feb-25": {
      Residential: 81000,
      Commercial: 48600,
      Public: 32400,
    },
    "Mar-25": {
      Residential: 87500,
      Commercial: 52500,
      Public: 35000,
    },
  },
  solarGeneration: {
    "Jan-24": 33000,
    "Feb-24": 31600,
    "Mar-24": 34400,
    "Apr-24": 36000,
    "May-24": 39000,
    "Jun-24": 42000,
    "Jul-24": 45000,
    "Aug-24": 44000,
    "Sep-24": 40000,
    "Oct-24": 37000,
    "Nov-24": 34000,
    "Dec-24": 32000,
    "Jan-25": 33600,
    "Feb-25": 32400,
    "Mar-25": 35000,
  },
  gridConsumption: {
    "Jan-24": 132000,
    "Feb-24": 126400,
    "Mar-24": 137600,
    "Apr-24": 144000,
    "May-24": 156000,
    "Jun-24": 168000,
    "Jul-24": 180000,
    "Aug-24": 176000,
    "Sep-24": 160000,
    "Oct-24": 148000,
    "Nov-24": 136000,
    "Dec-24": 128000,
    "Jan-25": 134400,
    "Feb-25": 129600,
    "Mar-25": 140000,
  },
  peakLoad: {
    "Jan-24": 850,
    "Feb-24": 820,
    "Mar-24": 880,
    "Apr-24": 900,
    "May-24": 950,
    "Jun-24": 1000,
    "Jul-24": 1050,
    "Aug-24": 1030,
    "Sep-24": 980,
    "Oct-24": 920,
    "Nov-24": 870,
    "Dec-24": 830,
    "Jan-25": 860,
    "Feb-25": 840,
    "Mar-25": 890,
  },
  consumptionByType: {
    "Jan-24": [
      { name: "Residential", value: 82500 },
      { name: "Commercial", value: 49500 },
      { name: "Public", value: 33000 },
    ],
    "Feb-24": [
      { name: "Residential", value: 79000 },
      { name: "Commercial", value: 47400 },
      { name: "Public", value: 31600 },
    ],
    "Mar-24": [
      { name: "Residential", value: 86000 },
      { name: "Commercial", value: 51600 },
      { name: "Public", value: 34400 },
    ],
    "Apr-24": [
      { name: "Residential", value: 90000 },
      { name: "Commercial", value: 54000 },
      { name: "Public", value: 36000 },
    ],
    "May-24": [
      { name: "Residential", value: 97500 },
      { name: "Commercial", value: 58500 },
      { name: "Public", value: 39000 },
    ],
    "Jun-24": [
      { name: "Residential", value: 105000 },
      { name: "Commercial", value: 63000 },
      { name: "Public", value: 42000 },
    ],
    "Jul-24": [
      { name: "Residential", value: 112500 },
      { name: "Commercial", value: 67500 },
      { name: "Public", value: 45000 },
    ],
    "Aug-24": [
      { name: "Residential", value: 110000 },
      { name: "Commercial", value: 66000 },
      { name: "Public", value: 44000 },
    ],
    "Sep-24": [
      { name: "Residential", value: 100000 },
      { name: "Commercial", value: 60000 },
      { name: "Public", value: 40000 },
    ],
    "Oct-24": [
      { name: "Residential", value: 92500 },
      { name: "Commercial", value: 55500 },
      { name: "Public", value: 37000 },
    ],
    "Nov-24": [
      { name: "Residential", value: 85000 },
      { name: "Commercial", value: 51000 },
      { name: "Public", value: 34000 },
    ],
    "Dec-24": [
      { name: "Residential", value: 80000 },
      { name: "Commercial", value: 48000 },
      { name: "Public", value: 32000 },
    ],
    "Jan-25": [
      { name: "Residential", value: 84000 },
      { name: "Commercial", value: 50400 },
      { name: "Public", value: 33600 },
    ],
    "Feb-25": [
      { name: "Residential", value: 81000 },
      { name: "Commercial", value: 48600 },
      { name: "Public", value: 32400 },
    ],
    "Mar-25": [
      { name: "Residential", value: 87500 },
      { name: "Commercial", value: 52500 },
      { name: "Public", value: 35000 },
    ],
  },
  consumptionByZone: {
    "Jan-24": [
      { name: "Zone A", value: 45000 },
      { name: "Zone B", value: 38000 },
      { name: "Zone C", value: 42000 },
      { name: "Zone D", value: 40000 },
    ],
    "Feb-24": [
      { name: "Zone A", value: 43000 },
      { name: "Zone B", value: 36000 },
      { name: "Zone C", value: 40000 },
      { name: "Zone D", value: 39000 },
    ],
    "Mar-24": [
      { name: "Zone A", value: 47000 },
      { name: "Zone B", value: 40000 },
      { name: "Zone C", value: 44000 },
      { name: "Zone D", value: 41000 },
    ],
    "Apr-24": [
      { name: "Zone A", value: 49000 },
      { name: "Zone B", value: 42000 },
      { name: "Zone C", value: 46000 },
      { name: "Zone D", value: 43000 },
    ],
    "May-24": [
      { name: "Zone A", value: 53000 },
      { name: "Zone B", value: 45000 },
      { name: "Zone C", value: 50000 },
      { name: "Zone D", value: 47000 },
    ],
    "Jun-24": [
      { name: "Zone A", value: 57000 },
      { name: "Zone B", value: 49000 },
      { name: "Zone C", value: 54000 },
      { name: "Zone D", value: 50000 },
    ],
    "Jul-24": [
      { name: "Zone A", value: 61000 },
      { name: "Zone B", value: 52000 },
      { name: "Zone C", value: 58000 },
      { name: "Zone D", value: 54000 },
    ],
    "Aug-24": [
      { name: "Zone A", value: 60000 },
      { name: "Zone B", value: 51000 },
      { name: "Zone C", value: 56000 },
      { name: "Zone D", value: 53000 },
    ],
    "Sep-24": [
      { name: "Zone A", value: 54000 },
      { name: "Zone B", value: 46000 },
      { name: "Zone C", value: 52000 },
      { name: "Zone D", value: 48000 },
    ],
    "Oct-24": [
      { name: "Zone A", value: 50000 },
      { name: "Zone B", value: 43000 },
      { name: "Zone C", value: 48000 },
      { name: "Zone D", value: 44000 },
    ],
    "Nov-24": [
      { name: "Zone A", value: 46000 },
      { name: "Zone B", value: 39000 },
      { name: "Zone C", value: 44000 },
      { name: "Zone D", value: 41000 },
    ],
    "Dec-24": [
      { name: "Zone A", value: 43000 },
      { name: "Zone B", value: 37000 },
      { name: "Zone C", value: 41000 },
      { name: "Zone D", value: 39000 },
    ],
    "Jan-25": [
      { name: "Zone A", value: 46000 },
      { name: "Zone B", value: 39000 },
      { name: "Zone C", value: 43000 },
      { name: "Zone D", value: 40000 },
    ],
    "Feb-25": [
      { name: "Zone A", value: 44000 },
      { name: "Zone B", value: 37000 },
      { name: "Zone C", value: 41000 },
      { name: "Zone D", value: 40000 },
    ],
    "Mar-25": [
      { name: "Zone A", value: 48000 },
      { name: "Zone B", value: 41000 },
      { name: "Zone C", value: 45000 },
      { name: "Zone D", value: 41000 },
    ],
  },
  months: [
    "Jan-24",
    "Feb-24",
    "Mar-24",
    "Apr-24",
    "May-24",
    "Jun-24",
    "Jul-24",
    "Aug-24",
    "Sep-24",
    "Oct-24",
    "Nov-24",
    "Dec-24",
    "Jan-25",
    "Feb-25",
    "Mar-25",
  ],
  years: ["2024", "2025"],
}

// Helper function to get month-year key from separate month and year
function getMonthYearKey(month: string, year: string): string {
  // Extract last two digits of year
  const yearSuffix = year.slice(-2)
  return `${month}-${yearSuffix}`
}

// Helper function to get available months for a specific year
function getMonthsForYear(months: string[], year: string): string[] {
  const yearSuffix = year.slice(-2)
  return months.filter((month) => month.endsWith(`-${yearSuffix}`))
}

const ElectricityDataContext = createContext<ElectricityDataContextType | undefined>(undefined)

export function ElectricityDataProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [data, setData] = useState<ProcessedElectricityData | null>(null)
  const [selectedYear, setSelectedYear] = useState("2025")
  const [selectedMonth, setSelectedMonth] = useState("Mar")
  const [availableMonths, setAvailableMonths] = useState<string[]>([])
  const [availableYears, setAvailableYears] = useState<string[]>(["2024", "2025"])
  const [dataLoadAttempt, setDataLoadAttempt] = useState(0)

  // Function to refresh data
  const refreshData = async () => {
    setDataLoadAttempt((prev) => prev + 1)
    return Promise.resolve()
  }

  // Handle year selection change
  const handleYearChange = (year: string) => {
    console.log(`Electricity: Year changed to: ${year}`)
    setSelectedYear(year)

    // Update available months for the selected year
    if (data) {
      const monthsForYear = getMonthsForYear(data.months, year)
      console.log(`Electricity: Available months for ${year}: ${monthsForYear.join(", ")}`)

      setAvailableMonths(monthsForYear)

      // If current month is not available in the new year, select the most recent month
      if (monthsForYear.length > 0 && !monthsForYear.some((m) => m.startsWith(selectedMonth))) {
        const mostRecentMonth = monthsForYear[monthsForYear.length - 1].split("-")[0]
        console.log(
          `Electricity: Selected month ${selectedMonth} not available in ${year}, switching to ${mostRecentMonth}`,
        )
        setSelectedMonth(mostRecentMonth)
      }
    }
  }

  // Handle month selection change
  const handleMonthChange = (month: string) => {
    console.log(`Electricity: Month changed to: ${month}`)
    setSelectedMonth(month)
  }

  // Load mock data
  useEffect(() => {
    setIsLoading(true)

    // Simulate API call delay
    setTimeout(() => {
      setData(mockElectricityData)

      // Set available months based on selected year
      const monthsForYear = getMonthsForYear(mockElectricityData.months, selectedYear)
      setAvailableMonths(monthsForYear)

      setIsLoading(false)
    }, 1000)
  }, [dataLoadAttempt, selectedYear])

  // Get current data based on selected month and year
  const getCurrentData = () => {
    if (!data) {
      return {
        mainSupply: 0,
        zoneConsumption: {},
        typeConsumption: {},
        solarGeneration: 0,
        gridConsumption: 0,
        peakLoad: 0,
        consumptionByType: [],
        consumptionByZone: [],
      }
    }

    const monthYearKey = getMonthYearKey(selectedMonth, selectedYear)

    // Check if the key exists in the data
    if (!data.months.includes(monthYearKey)) {
      console.warn(`Electricity: No data found for ${monthYearKey}`)
      return {
        mainSupply: 0,
        zoneConsumption: {},
        typeConsumption: {},
        solarGeneration: 0,
        gridConsumption: 0,
        peakLoad: 0,
        consumptionByType: [],
        consumptionByZone: [],
      }
    }

    // Return the data for the selected month and year
    return {
      mainSupply: data.mainSupply[monthYearKey] || 0,
      zoneConsumption: data.zoneConsumption[monthYearKey] || {},
      typeConsumption: data.typeConsumption[monthYearKey] || {},
      solarGeneration: data.solarGeneration[monthYearKey] || 0,
      gridConsumption: data.gridConsumption[monthYearKey] || 0,
      peakLoad: data.peakLoad[monthYearKey] || 0,
      consumptionByType: data.consumptionByType[monthYearKey] || [],
      consumptionByZone: data.consumptionByZone[monthYearKey] || [],
    }
  }

  // Get zone data for a specific zone
  const getZoneData = (zone: string): ZoneElectricityData | null => {
    const currentData = getCurrentData()
    const consumption = currentData.zoneConsumption[zone] || 0

    if (consumption === 0) return null

    return {
      name: zone,
      consumption,
      meters: [], // In a real implementation, this would be populated with actual meter data
    }
  }

  // Get type data for a specific type
  const getTypeData = (type: string): TypeElectricityData | null => {
    const currentData = getCurrentData()
    const consumption = currentData.typeConsumption[type] || 0

    if (consumption === 0) return null

    // Create mock trend data
    const trendData =
      data?.months
        .filter((month) => month.endsWith(selectedYear.slice(-2)))
        .map((month) => ({
          month: month.split("-")[0],
          consumption: data.typeConsumption[month]?.[type] || 0,
        })) || []

    // Create mock zone breakdown
    const zoneBreakdown = Object.keys(currentData.zoneConsumption).map((zone) => ({
      zone,
      consumption:
        currentData.zoneConsumption[zone] * (type === "Residential" ? 0.5 : type === "Commercial" ? 0.3 : 0.2),
    }))

    return {
      name: type,
      totalConsumption: consumption,
      trendData,
      zoneBreakdown,
    }
  }

  // Get zone options for dropdown
  const getZoneOptions = () => {
    const currentData = getCurrentData()
    return Object.keys(currentData.zoneConsumption).map((zone) => ({
      value: zone,
      label: zone,
    }))
  }

  // Get type options for dropdown
  const getTypeOptions = () => {
    const currentData = getCurrentData()

    // Add "All Types" option
    const options = [{ value: "all", label: "All Types" }]

    // Add options for each type
    Object.keys(currentData.typeConsumption).forEach((type) => {
      options.push({
        value: type.toLowerCase().replace(/\s+/g, "-"),
        label: type,
      })
    })

    return options
  }

  // Get month options for dropdown
  const getMonthOptions = () => {
    if (!data) return []

    return availableMonths.map((monthYear) => {
      const [month, year] = monthYear.split("-")
      return {
        value: month.toLowerCase(),
        label: `${month} 20${year}`,
      }
    })
  }

  // Get year options for dropdown
  const getYearOptions = () => {
    return availableYears.map((year) => ({
      value: year,
      label: year,
    }))
  }

  const contextValue: ElectricityDataContextType = {
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

  return <ElectricityDataContext.Provider value={contextValue}>{children}</ElectricityDataContext.Provider>
}

export function useElectricityData() {
  const context = useContext(ElectricityDataContext)
  if (context === undefined) {
    throw new Error("useElectricityData must be used within an ElectricityDataProvider")
  }
  return context
}
