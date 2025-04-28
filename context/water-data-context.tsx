
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
  // For now, we'll use a placeholder
  levels: string[]
}

interface WaterData {
  summary: WaterDataSummary
  financialImpact: WaterFinancialImpact
  hierarchy: WaterHierarchyData
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
