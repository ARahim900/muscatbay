"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useWaterData } from "@/context/water-data-context"
import { BarChart } from "@/components/ui/chart"
import { TrendingDown, TrendingUp, AlertTriangle, RefreshCw } from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Button } from "@/components/ui/button"

interface WaterOverviewProps {
  year: string
  month: string
}

export default function WaterOverview({ year, month }: WaterOverviewProps) {
  const { data, loading, error, refreshData } = useWaterData()

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-gray-500 dark:text-gray-400">Loading water system data...</p>
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
  const chartData = data.monthlyData.map((item) => ({
    month: item.month,
    l1: item.l1,
    l2: item.l2,
    l3: item.l3,
    totalLoss: item.totalLoss,
  }))

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard
          title="L1 TOTAL"
          value={`${formatNumber(data.summary.l1Total)}m³`}
          change={data.summary.l1Change}
          description="vs previous month"
        />
        <KpiCard
          title="L2 TOTAL"
          value={`${formatNumber(data.summary.l2Total)}m³`}
          change={data.summary.l2Change}
          description="vs previous month"
        />
        <KpiCard
          title="L3 TOTAL"
          value={`${formatNumber(data.summary.l3Total)}m³`}
          change={data.summary.l3Change}
          description="vs previous month"
        />
        <KpiCard
          title="LOSS (L1→L2)"
          value={`${formatNumber(data.summary.l1ToL2Loss)}m³`}
          change={data.summary.l1ToL2LossChange}
          description="vs previous month"
        />
        <KpiCard
          title="LOSS (L2→L3)"
          value={`${formatNumber(data.summary.l2ToL3Loss)}m³`}
          change={data.summary.l2ToL3LossChange}
          description="vs previous month"
        />
        <KpiCard
          title="TOTAL LOSS"
          value={`${formatNumber(data.summary.totalLoss)}m³`}
          change={data.summary.totalLossChange}
          description="vs previous month"
        />
      </div>

      {/* Water Flow Over Time Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Water Flow Over Time</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <BarChart
            data={chartData}
            index="month"
            categories={["l1", "l2", "l3", "totalLoss"]}
            colors={["blue", "cyan", "teal", "red"]}
            valueFormatter={(value) => `${value.toLocaleString()} m³`}
            yAxisWidth={60}
          />
        </CardContent>
      </Card>

      {/* Monthly Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    MONTH
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    L1 (M³)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    L2 (M³)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    L3 (M³)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    L1→L2 LOSS (M³)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    L2→L3 LOSS (M³)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    TOTAL LOSS (M³)
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {data.monthlyData.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {item.month}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatNumber(item.l1)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatNumber(item.l2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatNumber(item.l3)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatNumber(item.l1ToL2Loss)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatNumber(item.l2ToL3Loss)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatNumber(item.totalLoss)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// KPI Card Component
function KpiCard({
  title,
  value,
  change,
  description,
}: { title: string; value: string; change: number; description: string }) {
  const isPositive = change >= 0

  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
        <div className="flex items-center mt-1 text-sm">
          {isPositive ? (
            <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
          ) : (
            <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
          )}
          <span className={isPositive ? "text-green-500" : "text-red-500"}>
            {isPositive ? "▲" : "▼"} {Math.abs(change).toLocaleString()} m³
          </span>
          <span className="text-gray-500 dark:text-gray-400 ml-1">{description}</span>
        </div>
      </CardContent>
    </Card>
  )
}
