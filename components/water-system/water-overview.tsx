
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useWaterData } from "@/context/water-data-context"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FeaturesSectionWithHoverEffects } from "./feature-section-with-hover-effects"
import { WaterHierarchyVisualization } from "./water-hierarchy-visualization"

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
        <p className="text-gray-500 dark:text-gray-400">Loading overview data...</p>
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
      <h2 className="text-2xl font-bold">Water System Overview</h2>
      <p className="text-muted-foreground">
        Showing: {month} {year} | System Performance Summary
      </p>

      {/* Feature Section with Hover Effects */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
        <FeaturesSectionWithHoverEffects summaryData={data.summary} />
      </div>

      {/* Water Distribution Hierarchy */}
      <Card>
        <CardHeader>
          <CardTitle>Water Distribution Hierarchy</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <WaterHierarchyVisualization 
            data={data.hierarchy}
            summaryData={data.summary}
          />
        </CardContent>
      </Card>

      {/* Financial Impact Section */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Impact Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
              <h3 className="text-sm font-medium text-blue-600 dark:text-blue-300 mb-2">Total Loss Value</h3>
              <p className="text-2xl font-bold">{data.financialImpact.totalLossValue.toLocaleString()} OMR</p>
              <p className="text-sm text-gray-500 mt-1">Monthly financial impact</p>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 p-6 rounded-lg">
              <h3 className="text-sm font-medium text-amber-600 dark:text-amber-300 mb-2">Distribution Loss Value</h3>
              <p className="text-2xl font-bold">
                {data.financialImpact.zoneDistributionLossValue.toLocaleString()} OMR
              </p>
              <p className="text-sm text-gray-500 mt-1">Zone distribution losses</p>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg">
              <h3 className="text-sm font-medium text-green-600 dark:text-green-300 mb-2">Potential Annual Savings</h3>
              <p className="text-2xl font-bold">
                {data.financialImpact.potentialAnnualSavings.toLocaleString()} OMR
              </p>
              <p className="text-sm text-gray-500 mt-1">With 5% loss reduction</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-sm text-gray-500 dark:text-gray-400 flex justify-between items-center">
        <span>Data source: Muscat Bay Water Management System | Rate: {data.financialImpact.waterRate} OMR/m³</span>
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
