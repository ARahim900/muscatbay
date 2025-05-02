
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useWaterData } from "@/context/water-data-context"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { AlertTriangle, RefreshCw, PieChart as PieChartIcon, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PieChart } from "@/components/ui/chart"

interface WaterTypeAnalysisProps {
  year: string
  month: string
}

export default function WaterTypeAnalysis({ year, month }: WaterTypeAnalysisProps) {
  const { data, loading, error, refreshData } = useWaterData()
  
  // Sample consumption data by type for the chart
  const consumptionByTypeData = [
    { name: "Residential (Villa)", value: 8250 },
    { name: "Residential (Apartment)", value: 5120 },
    { name: "Commercial", value: 2100 },
    { name: "Landscape", value: 1870 },
    { name: "Other", value: 220 },
  ]

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

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Type Analysis</h2>
      <p className="text-muted-foreground">
        Showing: {month} {year} | Water Consumption by Type
      </p>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <h3 className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Consumption</h3>
            <p className="text-2xl font-bold mt-1">17,560 m³</p>
            <p className="text-sm text-gray-500 mt-1">All consumer types</p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <h3 className="text-sm font-medium text-green-600 dark:text-green-400">Highest Type</h3>
            <p className="text-2xl font-bold mt-1">Residential (Villa)</p>
            <p className="text-sm text-gray-500 mt-1">8,250 m³ (47%)</p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="pt-6">
            <h3 className="text-sm font-medium text-amber-600 dark:text-amber-400">Landscape Usage</h3>
            <p className="text-2xl font-bold mt-1">1,870 m³</p>
            <p className="text-sm text-gray-500 mt-1">10.6% of total consumption</p>
          </CardContent>
        </Card>
      </div>

      {/* Consumption By Type Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5" />
            Consumption By Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 md:h-96 w-full flex justify-center">
            <PieChart 
              data={consumptionByTypeData} 
              valueKey="value" 
              categoryKey="name"
              index="name"
              categories={["value"]}
              colors={["blue", "green", "amber", "purple", "red"]}
              showLabel={true} 
              className="h-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Types Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Detail By Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Consumption (m³)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Percentage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Change from Last Month</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                {consumptionByTypeData.map(type => {
                  const percentage = ((type.value / 17560) * 100).toFixed(1);
                  return (
                    <tr key={type.name}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-200">{type.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{type.value.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{percentage}%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          +3.2%
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
