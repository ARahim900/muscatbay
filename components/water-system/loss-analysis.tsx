"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LineChart, BarChart } from "@/components/ui/chart"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dropdown } from "@/components/ui/dropdown"
import { ArrowDownRight, AlertTriangle, TrendingUp, Calendar, ArrowLeft } from "lucide-react"
import { useWaterData } from "@/context/water-data-context"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface LossAnalysisProps {
  setActiveTab?: (tab: string) => void
}

export function LossAnalysis({ setActiveTab }: LossAnalysisProps) {
  const { isLoading, selectedMonth, selectedYear, setSelectedMonth, getCurrentData, getMonthOptions } = useWaterData()

  const currentData = getCurrentData()
  const monthOptions = getMonthOptions()

  // Create trend data for loss percentages
  const trendData = monthOptions.slice(-3).map((option) => {
    const monthKey = option.value.charAt(0).toUpperCase() + option.value.slice(1)
    return {
      month: monthKey,
      stage1: currentData.stage1LossPercent,
      stage2: currentData.stage2LossPercent,
      total: currentData.totalLossPercent,
    }
  })

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Month Selection */}
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
          <ArrowDownRight className="h-5 w-5 text-red-500" />
          <span className="font-medium text-gray-700 dark:text-gray-300">Loss Analysis:</span>
          <Dropdown
            value={selectedMonth.toLowerCase()}
            options={monthOptions}
            onChange={setSelectedMonth}
            className="w-40"
          />
        </div>
        <Button variant="outline" size="sm" className="flex items-center gap-1">
          <Calendar className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Loss Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-950/40 shadow-lg rounded-lg border border-amber-200 dark:border-amber-800/50 transition-all duration-300 hover:shadow-xl group">
          <CardHeader className="pb-2">
            <CardDescription className="text-gray-600 dark:text-gray-400 flex items-center">
              <ArrowDownRight className="h-4 w-4 mr-1 text-amber-500" />
              Stage 1 Loss (Trunk Main)
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-amber-600 dark:text-amber-400 flex items-center justify-between">
              {currentData.stage1Loss.toLocaleString()} m³
              <span className="text-xs font-normal text-amber-500 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50 px-2 py-1 rounded-full">
                {currentData.stage1LossPercent.toFixed(1)}% of L1
              </span>
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-950/40 shadow-lg rounded-lg border border-red-200 dark:border-red-800/50 transition-all duration-300 hover:shadow-xl group">
          <CardHeader className="pb-2">
            <CardDescription className="text-gray-600 dark:text-gray-400 flex items-center">
              <ArrowDownRight className="h-4 w-4 mr-1 text-red-500" />
              Stage 2 Loss (Distribution)
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-red-600 dark:text-red-400 flex items-center justify-between">
              {currentData.stage2Loss.toLocaleString()} m³
              <span className="text-xs font-normal text-red-500 dark:text-red-400 bg-red-100 dark:bg-red-900/50 px-2 py-1 rounded-full">
                {currentData.stage2LossPercent.toFixed(1)}% of L2
              </span>
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-950/40 shadow-lg rounded-lg border border-purple-200 dark:border-purple-800/50 transition-all duration-300 hover:shadow-xl group">
          <CardHeader className="pb-2">
            <CardDescription className="text-gray-600 dark:text-gray-400 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-1 text-purple-500" />
              Total Loss (NRW)
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-purple-600 dark:text-purple-400 flex items-center justify-between">
              {currentData.totalLoss.toLocaleString()} m³
              <span className="text-xs font-normal text-purple-500 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/50 px-2 py-1 rounded-full">
                {currentData.totalLossPercent.toFixed(1)}% of L1
              </span>
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Loss Trend Chart */}
      <Card className="bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-700 dark:text-gray-300 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-blue-500" />
            Water Loss Trends
          </CardTitle>
          <CardDescription className="text-gray-500 dark:text-gray-400">
            Percentage of water loss at different stages
          </CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          {trendData.length > 0 ? (
            <LineChart
              data={trendData}
              index="month"
              categories={["stage1", "stage2", "total"]}
              colors={["amber", "red", "purple"]}
              valueFormatter={(value) => `${value.toFixed(1)}%`}
              yAxisWidth={60}
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">No trend data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Zone Loss Analysis */}
      <Card className="bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-700 dark:text-gray-300 flex items-center">
            <ArrowDownRight className="h-5 w-5 mr-2 text-red-500" />
            Zone Loss Analysis
          </CardTitle>
          <CardDescription className="text-gray-500 dark:text-gray-400">
            Internal losses within each distribution zone
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Zone</TableHead>
                    <TableHead>L2 Bulk (m³)</TableHead>
                    <TableHead>L3 Sum (m³)</TableHead>
                    <TableHead>Loss (m³)</TableHead>
                    <TableHead>Loss (%)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(currentData.zoneData).length > 0 ? (
                    Object.entries(currentData.zoneData).map(([zoneName, zone]) => (
                      <TableRow key={zoneName}>
                        <TableCell className="font-medium">{zoneName}</TableCell>
                        <TableCell>{zone.l2Reading.toLocaleString()}</TableCell>
                        <TableCell>{zone.l3Sum.toLocaleString()}</TableCell>
                        <TableCell className="text-red-600 dark:text-red-400 font-medium">
                          {zone.loss.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              zone.lossPercent <= 10
                                ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800/50"
                                : zone.lossPercent <= 15
                                  ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800/50"
                                  : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800/50"
                            }
                          >
                            {zone.lossPercent.toFixed(1)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4 text-gray-500 dark:text-gray-400">
                        No zone data available for this period
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Zone Loss Comparison</h4>
              <div className="h-64">
                {Object.entries(currentData.zoneData).length > 0 ? (
                  <BarChart
                    data={Object.entries(currentData.zoneData).map(([zoneName, zone]) => ({
                      zone: zoneName,
                      lossPercent: zone.lossPercent,
                    }))}
                    index="zone"
                    categories={["lossPercent"]}
                    colors={["red"]}
                    valueFormatter={(value) => `${value.toFixed(1)}%`}
                    yAxisWidth={60}
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

      {/* Loss Analysis Details */}
      <Card className="bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Loss Analysis Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-lg">
              <h4 className="font-medium text-amber-800 dark:text-amber-300 flex items-center">
                <span className="inline-block w-3 h-3 bg-amber-500 rounded-full mr-2"></span>
                Stage 1 Loss Analysis
              </h4>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-amber-600 dark:text-amber-400">L1 Supply:</p>
                  <p className="font-medium text-amber-800 dark:text-amber-300">
                    {currentData.l1Supply.toLocaleString()} m³
                  </p>
                </div>
                <div>
                  <p className="text-sm text-amber-600 dark:text-amber-400">L2 Volume:</p>
                  <p className="font-medium text-amber-800 dark:text-amber-300">
                    {currentData.l2Volume.toLocaleString()} m³
                  </p>
                </div>
                <div>
                  <p className="text-sm text-amber-600 dark:text-amber-400">Stage 1 Loss:</p>
                  <p className="font-medium text-amber-800 dark:text-amber-300">
                    {currentData.stage1Loss.toLocaleString()} m³ ({currentData.stage1LossPercent.toFixed(1)}%)
                  </p>
                </div>
              </div>
              <div className="mt-3 text-sm text-amber-700 dark:text-amber-400">
                <p>Potential causes:</p>
                <ul className="list-disc pl-5 mt-1 text-xs">
                  <li>Leakage in main trunk pipeline</li>
                  <li>Main bulk meter calibration issues</li>
                  <li>Unauthorized connections before zone meters</li>
                </ul>
              </div>
            </div>

            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg">
              <h4 className="font-medium text-red-800 dark:text-red-300 flex items-center">
                <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                Stage 2 Loss Analysis
              </h4>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-red-600 dark:text-red-400">L2 Volume:</p>
                  <p className="font-medium text-red-800 dark:text-red-300">
                    {currentData.l2Volume.toLocaleString()} m³
                  </p>
                </div>
                <div>
                  <p className="text-sm text-red-600 dark:text-red-400">L3 Volume:</p>
                  <p className="font-medium text-red-800 dark:text-red-300">
                    {currentData.l3Volume.toLocaleString()} m³
                  </p>
                </div>
                <div>
                  <p className="text-sm text-red-600 dark:text-red-400">Stage 2 Loss:</p>
                  <p className="font-medium text-red-800 dark:text-red-300">
                    {currentData.stage2Loss.toLocaleString()} m³ ({currentData.stage2LossPercent.toFixed(1)}%)
                  </p>
                </div>
              </div>
              <div className="mt-3 text-sm text-red-700 dark:text-red-400">
                <p>Potential causes:</p>
                <ul className="list-disc pl-5 mt-1 text-xs">
                  <li>Distribution network leaks within zones</li>
                  <li>Meter inaccuracies at L3 level</li>
                  <li>Unmetered consumption or unauthorized connections</li>
                  {Object.entries(currentData.zoneData)
                    .filter(([_, zone]) => zone.lossPercent > 12)
                    .map(([zoneName, zone]) => (
                      <li key={zoneName}>
                        {zoneName} shows high internal loss ({zone.lossPercent.toFixed(1)}%)
                      </li>
                    ))}
                </ul>
              </div>
            </div>

            {currentData.totalLossPercent > 10 && (
              <div className="p-4 bg-purple-100 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-700 rounded-md text-purple-800 dark:text-purple-300 flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Elevated Water Loss</p>
                  <p className="text-sm mt-1">
                    Total water loss of {currentData.totalLossPercent.toFixed(1)}% exceeds the target threshold of 10%.
                    {Object.entries(currentData.zoneData).filter(([_, zone]) => zone.lossPercent > 12).length > 0 ? (
                      <span>
                        {" "}
                        Recommend investigation of{" "}
                        {Object.entries(currentData.zoneData)
                          .filter(([_, zone]) => zone.lossPercent > 12)
                          .map(([zoneName]) => zoneName)
                          .join(", ")}{" "}
                        where losses are highest.
                      </span>
                    ) : (
                      " Recommend system-wide investigation."
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
