"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Droplet, ArrowDown, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useWaterData } from "@/context/water-data-context"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface WaterHierarchyVisualizationProps {
  setActiveTab?: (tab: string) => void
}

export function WaterHierarchyVisualization({ setActiveTab }: WaterHierarchyVisualizationProps) {
  const { getCurrentData, isLoading } = useWaterData()
  const currentData = getCurrentData()

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-4">
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1"
          onClick={() => setActiveTab && setActiveTab("overview")}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      <Card className="bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Water Distribution Hierarchy
          </CardTitle>
          <CardDescription className="text-gray-500 dark:text-gray-400">
            Visual representation of the water flow through the system
            <span className="ml-2 text-xs text-green-600 dark:text-green-400">
              (Source: 2024-2025 Water Consumption Database)
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center space-y-6">
            {/* Level 1 - Source */}
            <div className="w-full max-w-md">
              <div className="bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800/50 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center">
                  <Droplet className="h-8 w-8 text-blue-600 dark:text-blue-400 mr-3" />
                  <div>
                    <h3 className="font-semibold text-blue-800 dark:text-blue-300">L1 - Main Bulk (NAMA)</h3>
                    <p className="text-sm text-blue-600 dark:text-blue-400">Primary Water Source</p>
                  </div>
                </div>
                <Badge className="bg-blue-500 text-white">{currentData.l1Supply.toLocaleString()} m³</Badge>
              </div>
            </div>

            {/* Arrow */}
            <ArrowDown className="h-8 w-8 text-gray-400 dark:text-gray-600" />

            {/* Level 2 - Primary Distribution */}
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-1 md:col-span-2">
                <h3 className="text-center font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  L2 - Primary Distribution
                </h3>
              </div>
              <div className="bg-teal-100 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-800/50 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center">
                  <Droplet className="h-6 w-6 text-teal-600 dark:text-teal-400 mr-2" />
                  <div>
                    <h4 className="font-medium text-teal-800 dark:text-teal-300">Zone Bulk Meters</h4>
                    <p className="text-xs text-teal-600 dark:text-teal-400">Zone Distribution</p>
                  </div>
                </div>
                <Badge className="bg-teal-500 text-white">
                  {Math.round(currentData.l2Volume * 0.85).toLocaleString()} m³
                </Badge>
              </div>
              <div className="bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800/50 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center">
                  <Droplet className="h-6 w-6 text-purple-600 dark:text-purple-400 mr-2" />
                  <div>
                    <h4 className="font-medium text-purple-800 dark:text-purple-300">Direct Connection (DC) Meters</h4>
                    <p className="text-xs text-purple-600 dark:text-purple-400">Direct from Main Line</p>
                  </div>
                </div>
                <Badge className="bg-purple-500 text-white">
                  {Math.round(currentData.l2Volume * 0.15).toLocaleString()} m³
                </Badge>
              </div>
            </div>

            {/* Arrow */}
            <ArrowDown className="h-8 w-8 text-gray-400 dark:text-gray-600" />

            {/* Level 3 - Final Consumption */}
            <div className="w-full">
              <div className="bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800/50 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center">
                  <Droplet className="h-8 w-8 text-green-600 dark:text-green-400 mr-3" />
                  <div>
                    <h3 className="font-semibold text-green-800 dark:text-green-300">L3 - Final Consumption</h3>
                    <p className="text-sm text-green-600 dark:text-green-400">End User Meters + DC Meters</p>
                  </div>
                </div>
                <Badge className="bg-green-500 text-white">{currentData.l3Volume.toLocaleString()} m³</Badge>
              </div>
            </div>
          </div>

          {/* Loss Indicators */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-lg p-3">
              <h4 className="font-medium text-amber-800 dark:text-amber-300 flex items-center">
                <span className="inline-block w-3 h-3 bg-amber-500 rounded-full mr-2"></span>
                Stage 1 Loss (Trunk Main)
              </h4>
              <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                L1 - L2 = {currentData.stage1Loss.toLocaleString()} m³ ({currentData.stage1LossPercent.toFixed(1)}% of
                L1 Supply)
              </p>
              <p className="text-xs text-amber-500 dark:text-amber-500 mt-1">
                Loss between main source and primary distribution
              </p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg p-3">
              <h4 className="font-medium text-red-800 dark:text-red-300 flex items-center">
                <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                Stage 2 Loss (Distribution)
              </h4>
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                L2 - L3 = {currentData.stage2Loss.toLocaleString()} m³ ({currentData.stage2LossPercent.toFixed(1)}% of
                L2 Volume)
              </p>
              <p className="text-xs text-red-500 dark:text-red-500 mt-1">
                Loss within zones and along DC lines after L2 measurement
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Hierarchy Definitions & Calculation Logic
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4 py-1">
              <h4 className="font-medium text-gray-800 dark:text-gray-200">L1 (Source)</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Water enters the entire system from a single main source, measured by the main bulk meter.
              </p>
            </div>
            <div className="border-l-4 border-teal-500 pl-4 py-1">
              <h4 className="font-medium text-gray-800 dark:text-gray-200">L2 (Primary Distribution)</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                From the L1 source, water is distributed to primary branches. These are measured by Zone Bulk Meters and
                Direct Connection (DC) Meters.
              </p>
            </div>
            <div className="border-l-4 border-green-500 pl-4 py-1">
              <h4 className="font-medium text-gray-800 dark:text-gray-200">L3 (Final Consumption)</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Water from L2 points flows to end-user meters within zones. Direct Connection (DC) meters are also
                considered final consumption points.
              </p>
            </div>
            <div className="border-l-4 border-amber-500 pl-4 py-1">
              <h4 className="font-medium text-gray-800 dark:text-gray-200">Stage 1 Loss</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                L1 Supply - Total L2 Volume = Loss between the main source and primary distribution points
              </p>
            </div>
            <div className="border-l-4 border-red-500 pl-4 py-1">
              <h4 className="font-medium text-gray-800 dark:text-gray-200">Stage 2 Loss</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total L2 Volume - Total L3 Volume = Combined loss within all zones and along DC lines
              </p>
            </div>
            <div className="border-l-4 border-purple-500 pl-4 py-1">
              <h4 className="font-medium text-gray-800 dark:text-gray-200">Total Loss (NRW)</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                L1 Supply - Total L3 Volume = Overall system loss (equals Stage 1 + Stage 2)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
