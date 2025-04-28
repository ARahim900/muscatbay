
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useWaterData } from "@/context/water-data-context"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { AlertTriangle, RefreshCw, TrendingDown, BarChart as BarChartIcon, LineChart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BarChart } from "@/components/ui/chart"

interface WaterLossAnalysisProps {
  year: string
  month: string
}

export default function WaterLossAnalysis({ year, month }: WaterLossAnalysisProps) {
  const { data, loading, error, refreshData } = useWaterData()
  
  // Sample loss data by zone for the chart
  const lossByZoneData = [
    { name: "Zone 01", loss: 325, percentage: 12.5 },
    { name: "Zone 03A", loss: 612, percentage: 18.7 },
    { name: "Zone 03B", loss: 478, percentage: 20.2 },
    { name: "Zone 05", loss: 834, percentage: 16.8 },
    { name: "Other Zones", loss: 287, percentage: 22.3 },
  ]

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

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Loss Analysis</h2>
      <p className="text-muted-foreground">
        Showing: {month} {year} | Water Loss Detail
      </p>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-r from-red-50 to-white dark:from-red-950/30 dark:to-gray-900 border-red-100 dark:border-red-900/50">
          <CardContent className="pt-6">
            <div className="flex items-center mb-4">
              <TrendingDown className="h-8 w-8 text-red-500 mr-3" />
              <h3 className="text-lg font-medium text-red-600 dark:text-red-400">Total System Loss</h3>
            </div>
            <p className="text-3xl font-bold">2,536 m³</p>
            <p className="text-sm text-gray-500 mt-1">17.8% of total input</p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full mt-4">
              <div className="bg-red-500 h-full rounded-full" style={{ width: '17.8%' }}></div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center mb-4">
              <BarChartIcon className="h-5 w-5 text-blue-500 mr-2" />
              <h3 className="text-sm font-medium text-blue-600 dark:text-blue-400">Stage 1 Loss</h3>
            </div>
            <p className="text-2xl font-bold">1,230 m³</p>
            <p className="text-sm text-gray-500 mt-1">8.6% of main supply</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center mb-4">
              <LineChart className="h-5 w-5 text-purple-500 mr-2" />
              <h3 className="text-sm font-medium text-purple-600 dark:text-purple-400">Stage 2 Loss</h3>
            </div>
            <p className="text-2xl font-bold">1,306 m³</p>
            <p className="text-sm text-gray-500 mt-1">10.1% of zone supply</p>
          </CardContent>
        </Card>
      </div>

      {/* Loss By Zone Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Loss By Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full">
            <BarChart 
              data={lossByZoneData}
              index="name"
              categories={["loss"]}
              colors={["red"]}
              valueFormatter={(value: number) => `${value.toLocaleString()} m³`}
              yAxisWidth={60}
            />
          </div>
        </CardContent>
      </Card>

      {/* Zone Loss Table */}
      <Card>
        <CardHeader>
          <CardTitle>Zone Loss Detail</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Zone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Supply (m³)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Consumption (m³)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Loss (m³)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Loss %</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                {lossByZoneData.map(zone => {
                  const supply = zone.loss / (zone.percentage / 100);
                  const consumption = supply - zone.loss;
                  
                  return (
                    <tr key={zone.name}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-200">{zone.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{Math.round(supply).toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{Math.round(consumption).toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{zone.loss.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span 
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            zone.percentage > 20 
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' 
                              : zone.percentage > 15 
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                              : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          }`}
                        >
                          {zone.percentage.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
