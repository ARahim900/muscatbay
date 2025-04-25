"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useWaterData } from "@/context/water-data-context"
import { BarChart } from "@/components/ui/chart"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface WaterZoneAnalysisProps {
  year: string
  month: string
}

export default function WaterZoneAnalysis({ year, month }: WaterZoneAnalysisProps) {
  const { data, loading, error, refreshData } = useWaterData()

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-gray-500 dark:text-gray-400">Loading zone analysis data...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-800 dark:text-red-300">Error Loading Data</h3>
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error.message}</p>
            <Button
              size="sm"
              variant="outline"
              className="mt-3 text-red-600 border-red-300 hover:bg-red-50"
              onClick={refreshData}
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Format number with commas
  const formatNumber = (num: number) => {
    return num.toLocaleString()
  }

  // Prepare data for the chart
  const chartData = data.zoneData.map((zone) => ({
    name: zone.name,
    consumption: zone.consumption,
  }))

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Zone Analysis</h2>

      {/* Zone Analysis Table */}
      <Card>
        <CardHeader>
          <CardTitle>Zone Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    METER
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    JAN (M³)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    FEB (M³)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    MAR (M³)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    TOTAL (M³)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    LOSS (M³)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    LOSS %
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {data.zoneData.map((zone, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {zone.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatNumber(zone.jan)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatNumber(zone.feb)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatNumber(zone.mar)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatNumber(zone.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatNumber(zone.loss)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {zone.lossPercentage.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Zone Consumption Comparison Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Zone Consumption Comparison</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <BarChart
            data={chartData}
            index="name"
            categories={["consumption"]}
            colors={["blue"]}
            valueFormatter={(value) => `${value.toLocaleString()} m³`}
            yAxisWidth={60}
            layout="horizontal"
          />
        </CardContent>
      </Card>

      <div className="text-sm text-gray-500 dark:text-gray-400 flex justify-between items-center">
        <span>Data source: Muscat Bay Water Management System | Rate: 1.32 OMR/m³</span>
        <div className="flex gap-2">
          <button className="text-blue-500 hover:text-blue-700" onClick={refreshData}>
            Refresh Data
          </button>
          <button className="text-blue-500 hover:text-blue-700">Advanced Search</button>
        </div>
      </div>
    </div>
  )
}
