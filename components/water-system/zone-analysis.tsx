"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PieChart } from "@/components/ui/chart"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CircularGauge } from "@/components/ui/circular-gauge"
import { Dropdown } from "@/components/ui/dropdown"
import { Input } from "@/components/ui/input"
import { Layers, Search, Filter, RefreshCw, ArrowLeft } from "lucide-react"
import { useWaterData } from "@/context/water-data-context"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface ZoneAnalysisProps {
  setActiveTab?: (tab: string) => void
}

export function ZoneAnalysis({ setActiveTab }: ZoneAnalysisProps) {
  const [selectedZone, setSelectedZone] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [isRefreshing, setIsRefreshing] = useState(false)

  const { isLoading, getCurrentData, getZoneData, getZoneOptions, refreshData } = useWaterData()

  const zoneOptions = getZoneOptions()
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

  // Set default selected zone when options are loaded
  useEffect(() => {
    if (zoneOptions.length > 0 && !selectedZone) {
      setSelectedZone(zoneOptions[0].value)
    }
  }, [zoneOptions, selectedZone])

  // Get zone data for selected zone
  const zoneData = selectedZone ? getZoneData(selectedZone) : null

  // Filter meters based on search query
  const filteredMeters =
    zoneData?.meters.filter(
      (meter) =>
        meter.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        meter.acctNum.includes(searchQuery) ||
        meter.type.toLowerCase().includes(searchQuery.toLowerCase()),
    ) || []

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (zoneOptions.length === 0) {
    return (
      <div className="p-6">
        <Card className="bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-gray-500 dark:text-gray-400 mb-4">No zone data available for the selected period.</p>
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
      {/* Zone Selection and Search */}
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
          <Layers className="h-5 w-5 text-purple-500" />
          <span className="font-medium text-gray-700 dark:text-gray-300">Zone Analysis:</span>
          <Dropdown value={selectedZone} options={zoneOptions} onChange={setSelectedZone} className="w-40" />
          <Button size="sm" variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
          <Input
            type="text"
            placeholder="Search meters..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Zone Overview */}
      {zoneData ? (
        <>
          <Card className="bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                {zoneData.name} Overview
              </CardTitle>
              <CardDescription className="text-gray-500 dark:text-gray-400">
                Water consumption and loss analysis for {zoneData.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="col-span-1 flex flex-col items-center justify-center">
                  <CircularGauge
                    value={zoneData.loss}
                    total={zoneData.l2Reading}
                    color="#EF4444" // Red color for losses
                    label={`${zoneData.name} Loss`}
                    unit="m³"
                    overrideValue={zoneData.lossPercent}
                    isPercentage={true}
                  />
                  <div className="mt-4 text-center">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      L2 Bulk Reading:{" "}
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        {zoneData.l2Reading.toLocaleString()} m³
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      L3 Sum:{" "}
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        {zoneData.l3Sum.toLocaleString()} m³
                      </span>
                    </div>
                    <div className="text-sm text-red-600 dark:text-red-400 font-medium">
                      Loss:{" "}
                      <span className="font-bold">
                        {zoneData.loss.toLocaleString()} m³ ({zoneData.lossPercent.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                </div>
                <div className="col-span-2">
                  <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Consumption by Type</h4>
                  <div className="h-64">
                    {zoneData.consumptionByType && zoneData.consumptionByType.length > 0 ? (
                      <PieChart
                        data={zoneData.consumptionByType}
                        category="value"
                        index="name"
                        colors={["blue", "purple", "cyan", "emerald"]}
                        valueFormatter={(value) => `${value.toLocaleString()} m³`}
                        className="h-full"
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <p className="text-gray-500 dark:text-gray-400">
                          No consumption data available for this zone.
                          <Button variant="link" className="ml-2 text-blue-500" onClick={handleRefresh}>
                            Refresh
                          </Button>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Zone Meters */}
          <Card className="bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                  {zoneData.name} Meters
                </CardTitle>
                <CardDescription className="text-gray-500 dark:text-gray-400">
                  {filteredMeters.length} meters found
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <Filter className="h-4 w-4" />
                  Filter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Meter Label</TableHead>
                      <TableHead>Account #</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Reading (m³)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMeters.length > 0 ? (
                      filteredMeters.map((meter) => (
                        <TableRow key={meter.acctNum}>
                          <TableCell className="font-medium">{meter.label}</TableCell>
                          <TableCell>{meter.acctNum}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                meter.type.includes("Residential")
                                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800/50"
                                  : meter.type.includes("Retail")
                                    ? "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800/50"
                                    : meter.type.includes("Irrigation")
                                      ? "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800/50"
                                      : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50"
                              }
                            >
                              {meter.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">{meter.reading.toLocaleString()}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4 text-gray-500 dark:text-gray-400">
                          No meters found matching your search criteria
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className="bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <p className="text-center text-gray-500 dark:text-gray-400">Please select a zone to view its details.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
