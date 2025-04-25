"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { loadWaterData } from "@/services/water-data-service"

// Define types for our context data
interface WaterData {
  zoneData: Array<{
    name: string
    consumption: number
    loss: number
    lossPercentage: number
    jan: number
    feb: number
    mar: number
    total: number
  }>
  typeData: Array<{
    name: string
    consumption: number
    percentage: number
    jan: number
    feb: number
    mar: number
    total: number
    percentOfL1: number
  }>
  lossData: Array<{
    name: string
    supply: number
    consumption: number
    loss: number
    lossPercentage: number
  }>
  monthlyData: Array<{
    month: string
    l1: number
    l2: number
    l3: number
    l1ToL2Loss: number
    l2ToL3Loss: number
    totalLoss: number
  }>
  hierarchy: {
    mainSupply: number
    zoneA: number
    zoneB: number
  }
  summary: {
    l1Total: number
    l2Total: number
    l3Total: number
    l1ToL2Loss: number
    l2ToL3Loss: number
    totalLoss: number
    l1Change: number
    l2Change: number
    l3Change: number
    l1ToL2LossChange: number
    l2ToL3LossChange: number
    totalLossChange: number
  }
  financialImpact: {
    totalLossValue: number
    zoneDistributionLossValue: number
    potentialAnnualSavings: number
    waterRate: number
  }
}

interface WaterDataContextType {
  data: WaterData
  loading: boolean
  error: Error | null
  refreshData: () => Promise<void>
}

// Default data structure
const defaultData: WaterData = {
  zoneData: [],
  typeData: [],
  lossData: [],
  monthlyData: [],
  hierarchy: {
    mainSupply: 0,
    zoneA: 0,
    zoneB: 0,
  },
  summary: {
    l1Total: 0,
    l2Total: 0,
    l3Total: 0,
    l1ToL2Loss: 0,
    l2ToL3Loss: 0,
    totalLoss: 0,
    l1Change: 0,
    l2Change: 0,
    l3Change: 0,
    l1ToL2LossChange: 0,
    l2ToL3LossChange: 0,
    totalLossChange: 0,
  },
  financialImpact: {
    totalLossValue: 0,
    zoneDistributionLossValue: 0,
    potentialAnnualSavings: 0,
    waterRate: 1.32,
  },
}

const WaterDataContext = createContext<WaterDataContextType | undefined>(undefined)

export function WaterDataProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [data, setData] = useState<WaterData>(defaultData)

  // Function to process raw water data into the format we need
  const processWaterData = async (rawData: any[]) => {
    try {
      // This would normally process the raw data from the CSV
      // For now, we'll use mock data based on the PDFs

      // In a real implementation, this would transform the raw data
      // into the structure needed for the UI components

      return {
        zoneData: [
          {
            name: "ZONE FM",
            consumption: 5628,
            loss: -91,
            lossPercentage: -1.6,
            jan: 2008,
            feb: 1740,
            mar: 1880,
            total: 5628,
          },
          {
            name: "ZONE 3A",
            consumption: 12099,
            loss: 6160,
            lossPercentage: 50.9,
            jan: 4235,
            feb: 4273,
            mar: 3591,
            total: 12099,
          },
          {
            name: "ZONE 3B",
            consumption: 9549,
            loss: 3999,
            lossPercentage: 41.9,
            jan: 3256,
            feb: 2962,
            mar: 3331,
            total: 9549,
          },
          {
            name: "ZONE 5",
            consumption: 12360,
            loss: 5854,
            lossPercentage: 47.4,
            jan: 4267,
            feb: 4231,
            mar: 3862,
            total: 12360,
          },
        ],
        typeData: [
          {
            name: "Commercial",
            consumption: 62711,
            percentage: 69.6,
            jan: 19590,
            feb: 20970,
            mar: 22151,
            total: 62711,
            percentOfL1: 56.2,
          },
          {
            name: "Residential",
            consumption: 19909,
            percentage: 22.1,
            jan: 7277,
            feb: 6849,
            mar: 5783,
            total: 19909,
            percentOfL1: 17.9,
          },
          {
            name: "Irrigation",
            consumption: 5214,
            percentage: 5.8,
            jan: 2159,
            feb: 2729,
            mar: 326,
            total: 5214,
            percentOfL1: 4.7,
          },
          {
            name: "Common",
            consumption: 2331,
            percentage: 2.6,
            jan: 800,
            feb: 780,
            mar: 751,
            total: 2331,
            percentOfL1: 2.1,
          },
        ],
        lossData: [
          {
            name: "Jan 2025",
            supply: 32580,
            consumption: 29006,
            loss: 3574,
            lossPercentage: 11.0,
          },
          {
            name: "Feb 2025",
            supply: 44043,
            consumption: 29880,
            loss: 14163,
            lossPercentage: 32.2,
          },
          {
            name: "Mar 2025",
            supply: 34915,
            consumption: 29150,
            loss: 5765,
            lossPercentage: 16.5,
          },
        ],
        monthlyData: [
          {
            month: "Jan",
            l1: 32580,
            l2: 15327,
            l3: 9109,
            l1ToL2Loss: 17253,
            l2ToL3Loss: 6218,
            totalLoss: 3574,
          },
          {
            month: "Feb",
            l1: 44043,
            l2: 14716,
            l3: 8542,
            l1ToL2Loss: 29327,
            l2ToL3Loss: 6174,
            totalLoss: 14163,
          },
          {
            month: "Mar",
            l1: 34915,
            l2: 15239,
            l3: 8150,
            l1ToL2Loss: 19676,
            l2ToL3Loss: 7089,
            totalLoss: 5765,
          },
        ],
        hierarchy: {
          mainSupply: 34915,
          zoneA: 12500,
          zoneB: 10200,
        },
        summary: {
          l1Total: 34915,
          l2Total: 15239,
          l3Total: 8150,
          l1ToL2Loss: 19676,
          l2ToL3Loss: 7089,
          totalLoss: 5765,
          l1Change: -9128,
          l2Change: 523,
          l3Change: -392,
          l1ToL2LossChange: -9651,
          l2ToL3LossChange: 915,
          totalLossChange: -8398,
        },
        financialImpact: {
          totalLossValue: 7609.8,
          zoneDistributionLossValue: 21137.16,
          potentialAnnualSavings: 3804.9,
          waterRate: 1.32,
        },
      } as WaterData
    } catch (err) {
      console.error("Error processing water data:", err)
      throw new Error("Failed to process water data")
    }
  }

  const loadData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Attempt to load the raw water data
      const rawData = await loadWaterData()

      // Process the raw data into the format we need
      const processedData = await processWaterData(rawData)

      // Update the state with the processed data
      setData(processedData)
    } catch (err) {
      console.error("Error loading water data:", err)
      setError(err instanceof Error ? err : new Error("Failed to load water data"))

      // Set mock data in case of error
      const mockData = await processWaterData([])
      setData(mockData)
    } finally {
      setLoading(false)
    }
  }

  // Refresh data function that can be called from components
  const refreshData = async () => {
    await loadData()
  }

  // Initial data load
  useEffect(() => {
    loadData()
  }, [])

  return <WaterDataContext.Provider value={{ data, loading, error, refreshData }}>{children}</WaterDataContext.Provider>
}

export function useWaterData() {
  const context = useContext(WaterDataContext)
  if (context === undefined) {
    throw new Error("useWaterData must be used within a WaterDataProvider")
  }
  return context
}
