
"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

// Define the shape of the water data
interface WaterDataSummary {
  l1Total: number
  l2Total: number
  l3Total: number
  l1ToL2Loss: number
  l2ToL3Loss: number
  totalLoss: number
}

interface WaterFinancialImpact {
  totalLossValue: number
  zoneDistributionLossValue: number
  potentialAnnualSavings: number
  waterRate: number
}

interface WaterHierarchyData {
  // This would be a more complex structure for the hierarchy visualization
  levels: string[]
}

// Add missing data types for the components
interface WaterLossData {
  name: string
  supply: number
  consumption: number
  loss: number
  lossPercentage: number
}

interface WaterZoneData {
  name: string
  consumption: number
  loss: number
}

interface WaterTypeData {
  name: string
  consumption: number
  percentage: number
}

interface WaterData {
  summary: WaterDataSummary
  financialImpact: WaterFinancialImpact
  hierarchy: WaterHierarchyData
  // Add the missing data arrays
  lossData: WaterLossData[]
  zoneData: WaterZoneData[]
  typeData: WaterTypeData[]
}

// Define context shape
interface WaterDataContextType {
  data: WaterData
  loading: boolean
  error: Error | null
  refreshData: () => Promise<void>
}

// Create context with default values
const WaterDataContext = createContext<WaterDataContextType>({
  data: {
    summary: {
      l1Total: 0,
      l2Total: 0,
      l3Total: 0,
      l1ToL2Loss: 0,
      l2ToL3Loss: 0,
      totalLoss: 0,
    },
    financialImpact: {
      totalLossValue: 0,
      zoneDistributionLossValue: 0,
      potentialAnnualSavings: 0,
      waterRate: 0,
    },
    hierarchy: {
      levels: [],
    },
    // Add the missing data defaults
    lossData: [],
    zoneData: [],
    typeData: [],
  },
  loading: false,
  error: null,
  refreshData: async () => {},
})

// Provider component
export function WaterDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<WaterData>({
    summary: {
      l1Total: 14250,
      l2Total: 13020,
      l3Total: 11714,
      l1ToL2Loss: 1230,
      l2ToL3Loss: 1306,
      totalLoss: 2536,
    },
    financialImpact: {
      totalLossValue: 3347.52,
      zoneDistributionLossValue: 1723.92,
      potentialAnnualSavings: 40170.24,
      waterRate: 1.32,
    },
    hierarchy: {
      levels: ["L1", "L2", "L3"],
    },
    // Add sample data for the new properties
    lossData: [
      { name: "January", supply: 14250, consumption: 11714, loss: 2536, lossPercentage: 17.8 },
      { name: "February", supply: 13800, consumption: 11320, loss: 2480, lossPercentage: 18.0 },
      { name: "March", supply: 14500, consumption: 12100, loss: 2400, lossPercentage: 16.6 },
    ],
    zoneData: [
      { name: "Zone 01", consumption: 3250, loss: 12.5 },
      { name: "Zone 03A", consumption: 4120, loss: 18.7 },
      { name: "Zone 03B", consumption: 2980, loss: 15.2 },
      { name: "Zone 05", consumption: 5340, loss: 21.3 },
    ],
    typeData: [
      { name: "Residential (Villa)", consumption: 8250, percentage: 47 },
      { name: "Residential (Apartment)", consumption: 5120, percentage: 29 },
      { name: "Commercial", consumption: 2100, percentage: 12 },
      { name: "Landscape", consumption: 1870, percentage: 11 },
      { name: "Other", consumption: 220, percentage: 1 },
    ],
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Function to fetch water data
  const fetchWaterData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // In a real app, you would fetch data from an API
      // For this demo, we'll simulate a delay and use the default data
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock data is already set as the default state
      // In a real app, you would update the state with fetched data
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch water data"))
    } finally {
      setLoading(false)
    }
  }

  // Load data on initial mount
  useEffect(() => {
    fetchWaterData()
  }, [])

  return (
    <WaterDataContext.Provider
      value={{
        data,
        loading,
        error,
        refreshData: fetchWaterData,
      }}
    >
      {children}
    </WaterDataContext.Provider>
  )
}

// Custom hook to use the context
export function useWaterData() {
  const context = useContext(WaterDataContext)
  if (!context) {
    throw new Error("useWaterData must be used within a WaterDataProvider")
  }
  return context
}

// Export the interfaces
export type { WaterData, WaterDataSummary, WaterFinancialImpact, WaterHierarchyData, WaterLossData, WaterZoneData, WaterTypeData }
