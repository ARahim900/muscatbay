
"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

interface ElectricityData {
  mainSupply: number
  solarGeneration: number
  gridConsumption: number
  peakLoad: number
  consumptionByType: Array<{ name: string; value: number }>
  consumptionByZone: Array<{ name: string; value: number }>
}

interface DropdownOption {
  label: string
  value: string
}

interface ElectricityDataContextType {
  isLoading: boolean
  error: Error | null
  selectedYear: string
  selectedMonth: string
  setSelectedYear: (year: string) => void
  setSelectedMonth: (month: string) => void
  getCurrentData: () => ElectricityData
  getMonthOptions: () => DropdownOption[]
  getYearOptions: () => DropdownOption[]
  refreshData: () => Promise<void>
}

// Create context
const ElectricityDataContext = createContext<ElectricityDataContextType>({
  isLoading: false,
  error: null,
  selectedYear: "2025",
  selectedMonth: "apr",
  setSelectedYear: () => {},
  setSelectedMonth: () => {},
  getCurrentData: () => ({
    mainSupply: 0,
    solarGeneration: 0,
    gridConsumption: 0,
    peakLoad: 0,
    consumptionByType: [],
    consumptionByZone: [],
  }),
  getMonthOptions: () => [],
  getYearOptions: () => [],
  refreshData: async () => {},
})

// Provider component
export function ElectricityDataProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [selectedYear, setSelectedYear] = useState("2025")
  const [selectedMonth, setSelectedMonth] = useState("apr")
  const [data, setData] = useState<ElectricityData>({
    mainSupply: 18500,
    solarGeneration: 3700,
    gridConsumption: 14800,
    peakLoad: 78.2,
    consumptionByType: [
      { name: "Residential", value: 9250 },
      { name: "Commercial", value: 5300 },
      { name: "Landscape", value: 2450 },
      { name: "Common Areas", value: 1500 },
    ],
    consumptionByZone: [
      { name: "Zone 1", value: 4200 },
      { name: "Zone 3A", value: 3800 },
      { name: "Zone 3B", value: 3450 },
      { name: "Zone 5", value: 4800 },
      { name: "Zone 8", value: 2250 },
    ],
  })

  // Mock month and year options
  const monthOptions: DropdownOption[] = [
    { label: "January", value: "jan" },
    { label: "February", value: "feb" },
    { label: "March", value: "mar" },
    { label: "April", value: "apr" },
  ]

  const yearOptions: DropdownOption[] = [
    { label: "2024", value: "2024" },
    { label: "2025", value: "2025" },
  ]

  // Get current data based on selections
  const getCurrentData = (): ElectricityData => {
    // In a real app, this would filter data based on year/month
    return data
  }

  const getMonthOptions = (): DropdownOption[] => {
    return monthOptions
  }

  const getYearOptions = (): DropdownOption[] => {
    return yearOptions
  }

  // Function to refresh electricity data
  const refreshData = async (): Promise<void> => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Simulate data fetching
      await new Promise(resolve => setTimeout(resolve, 1000))
      // In a real app, you would update data here
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch electricity data"))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    refreshData()
  }, [selectedYear, selectedMonth])

  return (
    <ElectricityDataContext.Provider
      value={{
        isLoading,
        error,
        selectedYear,
        selectedMonth,
        setSelectedYear,
        setSelectedMonth,
        getCurrentData,
        getMonthOptions,
        getYearOptions,
        refreshData,
      }}
    >
      {children}
    </ElectricityDataContext.Provider>
  )
}

// Custom hook to use the context
export function useElectricityData() {
  const context = useContext(ElectricityDataContext)
  if (!context) {
    throw new Error("useElectricityData must be used within an ElectricityDataProvider")
  }
  return context
}
