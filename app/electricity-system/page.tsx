"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Zap, 
  PieChartIcon,
  BatteryCharging,
  Layers,
  RefreshCw,
  Info,
  Lightbulb,
  BarChart3,
  AlertTriangle,
} from "lucide-react"
import { 
  PieChart,
  BarChart, 
  LineChart 
} from "@/components/ui/chart"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CircularGauge } from "@/components/ui/circular-gauge"
import { TabButton } from "@/components/ui/tab-button"
import { useElectricityData } from "@/context/electricity-data-context"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorAlert } from "@/components/ui/error-alert"

export default function ElectricitySystemPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")
  const [isRefreshing, setIsRefreshing] = useState(false)

  const {
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
  } = useElectricityData()

  const currentData = getCurrentData()
  const monthOptions = getMonthOptions()
  const yearOptions = getYearOptions()

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refreshData()
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000)
    }
  }

  useEffect(() => {
    if (monthOptions.length > 0 && !monthOptions.some((opt) => opt.value === selectedMonth.toLowerCase())) {
      setSelectedMonth(monthOptions[0].value)
    }
  }, [monthOptions, selectedMonth, setSelectedMonth])

  if (isLoading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading electricity system data...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorAlert
          title="Data Loading Error"
          message={`Failed to load electricity system data: ${error.message}`}
          onRetry={handleRefresh}
        />
      </div>
    )
  }

  const hasCurrentData = currentData.mainSupply > 0
  const hasConsumptionByType = currentData.consumptionByType && currentData.consumptionByType.length > 0
  const hasConsumptionByZone = currentData.consumptionByZone && currentData.consumptionByZone.length > 0

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Electricity System</h1>
        <Button onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh Data
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-950/40 border border-amber-200 dark:border-amber-800/50">
          <CardHeader className="pb-2">
            <CardDescription className="text-gray-600 dark:text-gray-400 flex items-center">
              <Zap className="h-4 w-4 mr-1 text-amber-500" />
              Total Consumption
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-amber-600 dark:text-amber-400 flex items-center justify-between">
              {currentData.mainSupply.toLocaleString()} kWh
              <span className="text-xs font-normal text-amber-500 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50 px-2 py-1 rounded-full">
                Monthly
              </span>
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-950/40 border border-green-200 dark:border-green-800/50">
          <CardHeader className="pb-2">
            <CardDescription className="text-gray-600 dark:text-gray-400 flex items-center">
              <BatteryCharging className="h-4 w-4 mr-1 text-green-500" />
              Solar Generation
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-green-600 dark:text-green-400 flex items-center justify-between">
              {currentData.solarGeneration.toLocaleString()} kWh
              <span className="text-xs font-normal text-green-500 dark:text-green-400 bg-green-100 dark:bg-green-900/50 px-2 py-1 rounded-full">
                {((currentData.solarGeneration / currentData.mainSupply) * 100).toFixed(1)}% of Total
              </span>
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-950/40 border border-blue-200 dark:border-blue-800/50">
          <CardHeader className="pb-2">
            <CardDescription className="text-gray-600 dark:text-gray-400 flex items-center">
              <Lightbulb className="h-4 w-4 mr-1 text-blue-500" />
              Peak Load
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-blue-600 dark:text-blue-400 flex items-center justify-between">
              {currentData.peakLoad.toLocaleString()} kW
              <span className="text-xs font-normal text-blue-500 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 px-2 py-1 rounded-full">
                Maximum Demand
              </span>
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center">
              <PieChartIcon className="h-5 w-5 mr-2 text-blue-500" />
              Consumption by Type
            </CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {currentData.consumptionByType && currentData.consumptionByType.length > 0 ? (
              <PieChart
                data={currentData.consumptionByType}
                valueKey="value"
                categoryKey="name"
                index="name"
                categories={["value"]}
                colors={["blue", "purple", "cyan"]}
                valueFormatter={(value: number) => `${value.toLocaleString()} kWh`}
                className="h-full"
              />
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-gray-500">No data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-amber-500" />
              Monthly Consumption
            </CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <LineChart
              data={[
                { month: "Jan", consumption: 165000, solar: 33000, grid: 132000 },
                { month: "Feb", consumption: 158000, solar: 31600, grid: 126400 },
                { month: "Mar", consumption: 172000, solar: 34400, grid: 137600 },
              ]}
              index="month"
              categories={["consumption", "solar", "grid"]}
              colors={["amber", "green", "blue"]}
              valueFormatter={(value: number) => `${value.toLocaleString()} kWh`}
              className="h-full"
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-yellow-500" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-md text-yellow-800 dark:text-yellow-300 flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Warning: High load detected at Substation Gamma</p>
              <p className="text-sm mt-1">Current load: 380 kW (95% of capacity)</p>
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">Detected: 25 minutes ago</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
