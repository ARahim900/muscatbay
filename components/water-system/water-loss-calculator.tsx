"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertTriangle, Calculator } from "lucide-react"
import { useWaterData } from "@/context/water-data-context"

export function WaterLossCalculator() {
  const { getCurrentData, isLoading } = useWaterData()
  const currentData = getCurrentData()

  const [l1Supply, setL1Supply] = useState(currentData.l1Supply)
  const [l2Volume, setL2Volume] = useState(currentData.l2Volume)
  const [l3Volume, setL3Volume] = useState(currentData.l3Volume)

  // Update values when data changes
  useEffect(() => {
    setL1Supply(currentData.l1Supply)
    setL2Volume(currentData.l2Volume)
    setL3Volume(currentData.l3Volume)
  }, [currentData])

  // Calculate losses
  const stage1Loss = l1Supply - l2Volume
  const stage2Loss = l2Volume - l3Volume
  const totalLoss = l1Supply - l3Volume

  const stage1LossPercent = ((stage1Loss / l1Supply) * 100).toFixed(1)
  const stage2LossPercent = ((stage2Loss / l2Volume) * 100).toFixed(1)
  const totalLossPercent = ((totalLoss / l1Supply) * 100).toFixed(1)

  return (
    <Card className="bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-700 dark:text-gray-300 flex items-center">
          <Calculator className="h-5 w-5 mr-2 text-blue-500" />
          Water Loss Calculator
        </CardTitle>
        <CardDescription className="text-gray-500 dark:text-gray-400">
          Calculate water losses based on meter readings
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="l1-supply">L1 Supply (m³)</Label>
                <Input
                  id="l1-supply"
                  type="number"
                  value={l1Supply}
                  onChange={(e) => setL1Supply(Number(e.target.value))}
                  className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">Main bulk meter reading</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="l2-volume">L2 Volume (m³)</Label>
                <Input
                  id="l2-volume"
                  type="number"
                  value={l2Volume}
                  onChange={(e) => setL2Volume(Number(e.target.value))}
                  className="bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800/50"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">Sum of zone bulk and DC meters</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="l3-volume">L3 Volume (m³)</Label>
                <Input
                  id="l3-volume"
                  type="number"
                  value={l3Volume}
                  onChange={(e) => setL3Volume(Number(e.target.value))}
                  className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/50"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">Sum of end user and DC meters</p>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-lg p-4">
                <h4 className="font-medium text-amber-800 dark:text-amber-300">Stage 1 Loss (Trunk Main)</h4>
                <div className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {stage1Loss.toLocaleString()} m³
                </div>
                <div className="mt-1 text-sm text-amber-500 dark:text-amber-500">{stage1LossPercent}% of L1 Supply</div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg p-4">
                <h4 className="font-medium text-red-800 dark:text-red-300">Stage 2 Loss (Distribution)</h4>
                <div className="mt-2 text-2xl font-bold text-red-600 dark:text-red-400">
                  {stage2Loss.toLocaleString()} m³
                </div>
                <div className="mt-1 text-sm text-red-500 dark:text-red-500">{stage2LossPercent}% of L2 Volume</div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/30 rounded-lg p-4">
                <h4 className="font-medium text-purple-800 dark:text-purple-300">Total Loss (NRW)</h4>
                <div className="mt-2 text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {totalLoss.toLocaleString()} m³
                </div>
                <div className="mt-1 text-sm text-purple-500 dark:text-purple-500">
                  {totalLossPercent}% of L1 Supply
                </div>
              </div>
            </div>

            {Number(totalLossPercent) > 20 && (
              <div className="mt-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-md text-red-800 dark:text-red-300 flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">High Water Loss Detected</p>
                  <p className="text-sm mt-1">
                    Total water loss exceeds 20% threshold. Consider investigating potential leaks or meter
                    inaccuracies.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
