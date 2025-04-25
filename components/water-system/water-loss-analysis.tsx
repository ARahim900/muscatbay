"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useWaterData } from "@/context/water-data-context"
import { AreaChart, PieChart } from "@/components/ui/chart"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface WaterLossAnalysisProps {
  year: string
  month: string
}

export default function WaterLossAnalysis({ year, month }: WaterLossAnalysisProps) {
  const { data, loading, error, refreshData } = useWaterData()

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-gray-500 dark:text-gray-400">Loading loss analysis data...</p>
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

  // Prepare data for the loss trend chart
  const trendChartData = data.monthlyData.map((item) => ({
    month: item.month,
    l1Supply: item.l1,
    systemLoss: item.totalLoss,
  }))

  // Prepare data for the zone distribution pie chart
  const zoneDistributionData = data.zoneData
    .filter((zone) => zone.loss > 0)
    .map((zone) => ({
      name: zone.name,
      value: zone.loss,
    }))

  // Calculate total zone distribution loss
  const totalZoneDistributionLoss = zoneDistributionData.reduce((sum, item) => sum + item.value, 0)

  // Calculate percentages for pie chart
  const zoneDistributionPercentages = zoneDistributionData.map((item) => ({
    name: item.name,
    value: (item.value / totalZoneDistributionLoss) * 100,
  }))

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Loss Analysis</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-bold mb-2">Total Loss Value</h3>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {data.financialImpact.totalLossValue.toFixed(2)} OMR
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Based on {formatNumber(data.summary.totalLoss)} m³ at {data.financialImpact.waterRate} OMR/m³
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-bold mb-2">Zone Distribution Loss Value</h3>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {data.financialImpact.zoneDistributionLossValue.toFixed(2)} OMR
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {formatNumber(totalZoneDistributionLoss)} m³ at {data.financialImpact.waterRate} OMR/m³
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-bold mb-2">Potential Annual Savings</h3>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              {data.financialImpact.potentialAnnualSavings.toFixed(2)} OMR
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">If annual losses are reduced by 50%</p>
          </CardContent>
        </Card>
      </div>

      {/* System Loss KPI */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-blue-800 dark:text-blue-300 mb-1">TOTAL SYSTEM LOSS</h3>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {formatNumber(data.summary.totalLoss)}m³
              </p>
              <div className="flex items-center mt-1 text-sm">
                <span className="text-red-500">▼ {Math.abs(data.summary.totalLossChange).toLocaleString()} m³</span>
                <span className="text-gray-500 dark:text-gray-400 ml-1">vs previous month</span>
              </div>
            </div>
            <div className="mt-4 md:mt-0">
              <h3 className="text-lg font-bold text-blue-800 dark:text-blue-300 mb-1">ZONE DISTRIBUTION LOSS</h3>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {formatNumber(totalZoneDistributionLoss)}m³
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <h3 className="text-lg font-bold text-blue-800 dark:text-blue-300 mb-1">HIGHEST LOSS ZONE</h3>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {zoneDistributionData.length > 0 ? formatNumber(zoneDistributionData[0].value) : 0}m³
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Monthly Loss Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Loss Trend vs L1 Supply</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <AreaChart
              data={trendChartData}
              index="month"
              categories={["l1Supply", "systemLoss"]}
              colors={["blue", "red"]}
              valueFormatter={(value) => `${value.toLocaleString()} m³`}
              yAxisWidth={60}
            />
          </CardContent>
        </Card>

        {/* Positive Loss Distribution by Zone */}
        <Card>
          <CardHeader>
            <CardTitle>Positive Loss Distribution by Zone</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <PieChart
              data={zoneDistributionPercentages}
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
