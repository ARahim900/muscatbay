"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Zap,
  Calendar,
  PieChartIcon,
  BatteryCharging,
  Layers,
  RefreshCw,
  ArrowLeft,
  Info,
  Lightbulb,
  BarChart3,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PieChart, BarChart, LineChart } from "@/components/ui/chart"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CircularGauge } from "@/components/ui/circular-gauge"
import { TabButton } from "@/components/ui/tab-button"
import { Dropdown } from "@/components/ui/dropdown"
import { useElectricityData } from "@/context/electricity-data-context"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorAlert } from "@/components/ui/error-alert"

interface ElectricityDataType {
  months: string[];
  mainSupply: Record<string, number>;
  solarGeneration: Record<string, number>;
  gridConsumption: Record<string, number>;
}

const mockElectricityData: ElectricityDataType = {
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
  ],
  mainSupply: {
    "Jan-24": 15000,
    "Feb-24": 16500,
    "Mar-24": 17000,
    "Apr-24": 16000,
    "May-24": 18000,
    "Jun-24": 19000,
    "Jul-24": 20000,
    "Aug-24": 21000,
    "Sep-24": 19500,
    "Oct-24": 18500,
    "Nov-24": 17500,
    "Dec-24": 19000,
  },
  solarGeneration: {
    "Jan-24": 3000,
    "Feb-24": 3300,
    "Mar-24": 3400,
    "Apr-24": 3200,
    "May-24": 3600,
    "Jun-24": 3800,
    "Jul-24": 4000,
    "Aug-24": 4200,
    "Sep-24": 3900,
    "Oct-24": 3700,
    "Nov-24": 3500,
    "Dec-24": 3800,
  },
  gridConsumption: {
    "Jan-24": 12000,
    "Feb-24": 13200,
    "Mar-24": 13600,
    "Apr-24": 12800,
    "May-24": 14400,
    "Jun-24": 15200,
    "Jul-24": 16000,
    "Aug-24": 16800,
    "Sep-24": 15600,
    "Oct-24": 14800,
    "Nov-24": 14000,
    "Dec-24": 15200,
  },
}

export default function ElectricitySystemPage() {
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

  const getDataForPeriod = (
    data: Record<string, number>,
    period: string,
    fallback: number = 0
  ): number => {
    if (period in data) {
      return data[period];
    }
    return fallback;
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="flex items-center gap-1" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h2 className="text-3xl font-bold tracking-tight text-gray-800 dark:text-gray-200">
            Electricity System Management
          </h2>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <Dropdown value={selectedYear} options={yearOptions} onChange={setSelectedYear} />
            <Dropdown value={selectedMonth.toLowerCase()} options={monthOptions} onChange={setSelectedMonth} />
            <Button size="sm" variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Badge
              variant="outline"
              className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800/50"
            >
              Connected to Electricity Database
            </Badge>
          </div>
          <Button size="sm" variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {!hasCurrentData && (
        <div className="p-4 bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 rounded-md text-amber-800 dark:text-amber-300 flex items-start space-x-3">
          <Info className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">
              No data available for {selectedMonth} {selectedYear}
            </p>
            <p className="text-sm mt-1">Please select a different month or year, or refresh the data.</p>
            <div className="mt-2 flex space-x-2">
              <Button size="sm" variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
                <RefreshCw className={`h-3 w-3 mr-1 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh Data
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="border-b border-gray-200 dark:border-gray-800">
        <div className="flex overflow-x-auto">
          <TabButton active={activeTab === "overview"} onClick={() => setActiveTab("overview")}>
            Overview
          </TabButton>
          <TabButton active={activeTab === "zones"} onClick={() => setActiveTab("zones")}>
            Zone Analysis
          </TabButton>
          <TabButton active={activeTab === "types"} onClick={() => setActiveTab("types")}>
            Type Analysis
          </TabButton>
          <TabButton active={activeTab === "solar"} onClick={() => setActiveTab("solar")}>
            Solar Generation
          </TabButton>
          <TabButton active={activeTab === "load"} onClick={() => setActiveTab("load")}>
            Load Profile
          </TabButton>
        </div>
      </div>

      {activeTab === "overview" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-950/40 shadow-lg rounded-lg border border-amber-200 dark:border-amber-800/50 transition-all duration-300 hover:shadow-xl group">
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
            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-950/40 shadow-lg rounded-lg border border-green-200 dark:border-green-800/50 transition-all duration-300 hover:shadow-xl group">
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
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-950/40 shadow-lg rounded-lg border border-blue-200 dark:border-blue-800/50 transition-all duration-300 hover:shadow-xl group">
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
            <Card className="bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-700 dark:text-gray-300 flex items-center">
                  <BatteryCharging className="h-5 w-5 mr-2 text-green-500" />
                  Energy Source Breakdown
                </CardTitle>
                <CardDescription className="text-gray-500 dark:text-gray-400">
                  Distribution of energy sources
                </CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                <div className="flex flex-col md:flex-row items-center justify-center gap-6 h-full">
                  <CircularGauge
                    value={currentData.solarGeneration}
                    total={currentData.mainSupply}
                    color="#22c55e"
                    label="Solar Generation"
                    unit="kWh"
                    overrideValue={(currentData.solarGeneration / currentData.mainSupply) * 100}
                    isPercentage={true}
                  />
                  <CircularGauge
                    value={currentData.gridConsumption}
                    total={currentData.mainSupply}
                    color="#3b82f6"
                    label="Grid Consumption"
                    unit="kWh"
                    overrideValue={(currentData.gridConsumption / currentData.mainSupply) * 100}
                    isPercentage={true}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-700 dark:text-gray-300 flex items-center">
                  <PieChartIcon className="h-5 w-5 mr-2 text-blue-500" />
                  Consumption by Type
                </CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                {hasConsumptionByType ? (
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
                    <p className="text-gray-500 dark:text-gray-400">
                      No consumption data available for this period.
                      <Button variant="link" className="ml-2 text-blue-500" onClick={handleRefresh}>
                        Refresh Data
                      </Button>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-700 dark:text-gray-300 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-amber-500" />
                Monthly Consumption Trend
              </CardTitle>
              <CardDescription className="text-gray-500 dark:text-gray-400">
                Electricity consumption over the past months
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              {hasCurrentData ? (
                <AreaChart
                  data={
                    yearOptions
                      .filter((year) => year.value === selectedYear)
                      .flatMap(() => {
                        return monthOptions
                          .filter((month) => {
                            const monthYearKey = `${month.label.split(" ")[0]}-${selectedYear.slice(-2)}`
                            return mockElectricityData.months.includes(monthYearKey)
                          })
                          .map((month) => {
                            const monthYearKey = `${month.label.split(" ")[0]}-${selectedYear.slice(-2)}`
                            return {
                              month: month.label.split(" ")[0],
                              consumption: mockElectricityData.mainSupply[monthYearKey] || 0,
                              solar: mockElectricityData.solarGeneration[monthYearKey] || 0,
                              grid: mockElectricityData.gridConsumption[monthYearKey] || 0,
                            }
                          })
                      })
                  }
                  index="month"
                  categories={["consumption", "solar", "grid"]}
                  colors={["amber", "green", "blue"]}
                  valueFormatter={(value) => `${value.toLocaleString()} kWh`}
                  yAxisWidth={80}
                />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-gray-500 dark:text-gray-400">
                    No trend data available for this period.
                    <Button variant="link" className="ml-2 text-blue-500" onClick={handleRefresh}>
                      Refresh Data
                    </Button>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-700 dark:text-gray-300 flex items-center">
                <Layers className="h-5 w-5 mr-2 text-purple-500" />
                Zone Consumption Analysis
              </CardTitle>
              <CardDescription className="text-gray-500 dark:text-gray-400">
                Electricity consumption by zone
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Zone</TableHead>
                        <TableHead>Consumption (kWh)</TableHead>
                        <TableHead>% of Total</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {hasConsumptionByZone ? (
                        currentData.consumptionByZone.map((zone) => (
                          <TableRow key={zone.name}>
                            <TableCell className="font-medium">{zone.name}</TableCell>
                            <TableCell>{zone.value.toLocaleString()}</TableCell>
                            <TableCell>{((zone.value / currentData.mainSupply) * 100).toFixed(1)}%</TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  zone.value > currentData.mainSupply * 0.3
                                    ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800/50"
                                    : zone.value > currentData.mainSupply * 0.2
                                      ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800/50"
                                      : "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800/50"
                                }
                              >
                                {zone.value > currentData.mainSupply * 0.3
                                  ? "High"
                                  : zone.value > currentData.mainSupply * 0.2
                                    ? "Medium"
                                    : "Normal"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4 text-gray-500 dark:text-gray-400">
                            No zone data available for this period
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Zone Consumption Comparison</h4>
                  <div className="h-64">
                    {hasConsumptionByZone ? (
                      <BarChart
                        data={currentData.consumptionByZone}
                        index="name"
                        categories={["value"]}
                        colors={["purple"]}
                        valueFormatter={(value) => `${value.toLocaleString()} kWh`}
                        yAxisWidth={80}
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <p className="text-gray-500 dark:text-gray-400">No zone data available</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {activeTab !== "overview" && (
        <Card className="bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
          <CardContent className="p-12 text-center">
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Analysis
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              This section is currently under development and will be available soon.
            </p>
            <Button variant="outline" onClick={() => setActiveTab("overview")}>
              Return to Overview
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
