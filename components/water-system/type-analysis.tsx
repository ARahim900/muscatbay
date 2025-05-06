"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LineChart, BarChart } from "@/components/ui/chart"
import { Dropdown } from "@/components/ui/dropdown"
import { Filter, Calendar, TrendingUp, RefreshCw, ArrowLeft } from "lucide-react"
import { useWaterData } from "@/context/water-data-context"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface TypeAnalysisProps {
  setActiveTab?: (tab: string) => void
}

export function TypeAnalysis({ setActiveTab }: TypeAnalysisProps) {
  const [selectedType, setSelectedType] = useState("all")
  const [isRefreshing, setIsRefreshing] = useState(false)

  const { isLoading, getCurrentData, getTypeData, getTypeOptions, refreshData } = useWaterData()

  const typeOptions = getTypeOptions()
  const currentData = getCurrentData()

  // Handle refresh button click
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refreshData()
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000)
    }
  }

  // Set default selected type when options are loaded
  useEffect(() => {
    if (typeOptions.length > 0 && !selectedType) {
      setSelectedType(typeOptions[0].value)
    }
  }, [typeOptions, selectedType])

  // Get type data for selected type
  let typeData = null

  if (selectedType === "all") {
    // Create aggregate data for all types
    const allTypes = {
      name: "All Types",
      totalConsumption: currentData.l3Volume,
      trendData: [],
      zoneBreakdown: [],
    }

    // Get zone breakdown for all types
    const zoneBreakdown = {}
    Object.entries(currentData.zoneData).forEach(([zoneName, zone]) => {
      if (zone.l3Sum > 0) {
        zoneBreakdown[zoneName] = zone.l3Sum
      }
    })

    allTypes.zoneBreakdown = Object.entries(zoneBreakdown)
      .filter(([_, consumption]) => consumption > 0)
      .map(([zone, consumption]) => ({
        zone,
        consumption: consumption as number,
      }))

    typeData = allTypes
  } else {
    // Find the type data by name
    const typeName = typeOptions.find((opt) => opt.value === selectedType)?.label
    if (typeName) {
      typeData = getTypeData(typeName)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (typeOptions.length <= 1) {
    return (
      <div className="p-6">
        <Card className="bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-gray-500 dark:text-gray-400 mb-4">No type data available for the selected period.</p>
              <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing} className="mx-auto">
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Type Selection */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
            onClick={() => setActiveTab && setActiveTab("overview")}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Filter className="h-5 w-5 text-purple-500" />
          <span className="font-medium text-gray-700 dark:text-gray-300">Type Analysis:</span>
          <Dropdown value={selectedType} options={typeOptions} onChange={setSelectedType} className="w-40" />
          <Button size="sm" variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
        <Button variant="outline" size="sm" className="flex items-center gap-1">
          <Calendar className="h-4 w-4" />
          Export Data
        </Button>
      </div>

      {/* Type Overview */}
      {typeData ? (
        <>
          <Card className="bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                {typeData.name} Consumption Overview
              </CardTitle>
              <CardDescription className="text-gray-500 dark:text-gray-400">
                Total consumption: {typeData.totalConsumption.toLocaleString()} m³
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {typeData.trendData && typeData.trendData.length > 0 ? (
                  <div>
                    <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                      <TrendingUp className="h-4 w-4 mr-2 text-blue-500" />
                      Consumption Trend
                    </h4>
                    <div className="h-64">
                      <LineChart
                        data={typeData.trendData}
                        index="month"
                        categories={["consumption"]}
                        colors={["blue"]}
                        valueFormatter={(value) => `${value.toLocaleString()} m³`}
                        yAxisWidth={60}
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                      <TrendingUp className="h-4 w-4 mr-2 text-blue-500" />
                      Consumption Trend
                    </h4>
                    <div className="h-64 flex items-center justify-center">
                      <p className="text-gray-500 dark:text-gray-400">No trend data available</p>
                    </div>
                  </div>
                )}

                {typeData.zoneBreakdown && typeData.zoneBreakdown.length > 0 ? (
                  <div>
                    <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                      <Filter className="h-4 w-4 mr-2 text-purple-500" />
                      Consumption by Zone
                    </h4>
                    <div className="h-64">
                      <BarChart
                        data={typeData.zoneBreakdown}
                        index="zone"
                        categories={["consumption"]}
                        colors={["purple"]}
                        valueFormatter={(value) => `${value.toLocaleString()} m³`}
                        yAxisWidth={60}
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                      <Filter className="h-4 w-4 mr-2 text-purple-500" />
                      Consumption by Zone
                    </h4>
                    <div className="h-64 flex items-center justify-center">
                      <p className="text-gray-500 dark:text-gray-400">No zone breakdown available</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Type Details */}
          <Card className="bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                {typeData.name} Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300">Total Consumption</h4>
                  <div className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {typeData.totalConsumption.toLocaleString()} m³
                  </div>
                  <div className="mt-1 text-xs text-blue-500 dark:text-blue-500">
                    {currentData.l3Volume > 0
                      ? ((typeData.totalConsumption / currentData.l3Volume) * 100).toFixed(1)
                      : "0"}
                    % of total water consumption
                  </div>
                </div>

                {typeData.trendData && typeData.trendData.length >= 2 && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-green-800 dark:text-green-300">Month-over-Month</h4>
                    <div className="mt-2 text-2xl font-bold text-green-600 dark:text-green-400">
                      {typeData.trendData[typeData.trendData.length - 2].consumption > 0
                        ? (
                            ((typeData.trendData[typeData.trendData.length - 1].consumption -
                              typeData.trendData[typeData.trendData.length - 2].consumption) /
                              typeData.trendData[typeData.trendData.length - 2].consumption) *
                            100
                          ).toFixed(1)
                        : "0"}
                      %
                    </div>
                    <div className="mt-1 text-xs text-green-500 dark:text-green-500">Change from previous month</div>
                  </div>
                )}

                {typeData.zoneBreakdown && typeData.zoneBreakdown.length > 0 && (
                  <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/30 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-purple-800 dark:text-purple-300">Highest Zone</h4>
                    <div className="mt-2 text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {
                        typeData.zoneBreakdown.reduce(
                          (max, zone) => (zone.consumption > max.consumption ? zone : max),
                          { consumption: 0, zone: "None" },
                        ).zone
                      }
                    </div>
                    <div className="mt-1 text-xs text-purple-500 dark:text-purple-500">
                      {typeData.zoneBreakdown
                        .reduce((max, zone) => (zone.consumption > max.consumption ? zone : max), { consumption: 0 })
                        .consumption.toLocaleString()}{" "}
                      m³
                    </div>
                  </div>
                )}

                {typeData.zoneBreakdown && typeData.zoneBreakdown.length > 0 && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-amber-800 dark:text-amber-300">Average per Zone</h4>
                    <div className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">
                      {Math.round(
                        typeData.zoneBreakdown.reduce((sum, zone) => sum + zone.consumption, 0) /
                          typeData.zoneBreakdown.filter((zone) => zone.consumption > 0).length || 1,
                      ).toLocaleString()}{" "}
                      m³
                    </div>
                    <div className="mt-1 text-xs text-amber-500 dark:text-amber-500">
                      Excluding zones with zero consumption
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className="bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <p className="text-center text-gray-500 dark:text-gray-400">No data available for the selected type.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
