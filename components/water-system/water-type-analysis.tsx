"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useWaterData } from "@/context/water-data-context"
import { BarChart, PieChart } from "@/components/ui/chart"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface WaterTypeAnalysisProps {
  year: string
  month: string
}

export default function WaterTypeAnalysis({ year, month }: WaterTypeAnalysisProps) {
  const { data, loading, error, refreshData } = useWaterData()

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-gray-500 dark:text-gray-400">Loading type analysis data...</p>
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

  // Prepare data for the bar chart
  const barChartData = data.typeData.map((type) => ({
    name: type.name,
    consumption: type.consumption,
  }))

  // Prepare data for the pie chart
  const pieChartData = data.typeData.map((type) => ({
    name: type.name,
    value: type.percentage,
  }))

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Consumption by Type</h2>

      {/* Type Analysis Table */}
      <Card>
        <CardHeader>
          <CardTitle>Consumption by Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    TYPE
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
                    % OF L1
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {data.typeData.map((type, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {type.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatNumber(type.jan)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatNumber(type.feb)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatNumber(type.mar)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatNumber(type.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {type.percentOfL1.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Monthly Consumption by Type Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Consumption by Type</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <BarChart
              data={barChartData}
              index="name"
              categories={["consumption"]}
              colors={["blue"]}
              valueFormatter={(value) => `${value.toLocaleString()} m³`}
              yAxisWidth={60}
            />
          </CardContent>
        </Card>

        {/* Consumption Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Consumption Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <PieChart
              data={pieChartData}
              category="value"
              index="name"
              colors={["blue", "green", "amber", "purple"]}
              valueFormatter={(value) => `${value.toFixed(1)}%`}
              className="h-full"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
